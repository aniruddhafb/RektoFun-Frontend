use anchor_lang::{prelude::*, system_program};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, ChallengeStatus},
};

#[derive(Accounts)]
pub struct SettleChallenge<'info> {
    /// The admin/oracle wallet that is authorised to settle challenges.
    /// In production this should be a multisig or a Switchboard/Pyth oracle CPI.
    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: creator receives funds if they win; validated via challenge.creator
    #[account(
        mut,
        constraint = creator.key() == challenge.creator @ RektoError::UnauthorizedSettle,
    )]
    pub creator: UncheckedAccount<'info>,

    /// CHECK: challenger receives funds if they win; validated via challenge.challenger
    #[account(
        mut,
        constraint = challenger.key() == challenge.challenger @ RektoError::UnauthorizedSettle,
    )]
    pub challenger: UncheckedAccount<'info>,

    /// CHECK: platform treasury receives the fee
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            CHALLENGE_SEED,
            challenge.creator.as_ref(),
            &challenge.challenge_id.to_le_bytes(),
        ],
        bump = challenge.bump,
        constraint = challenge.status == ChallengeStatus::Active @ RektoError::NotActive,
    )]
    pub challenge: Account<'info, ChallengeAccount>,

    #[account(
        mut,
        seeds = [VAULT_SEED, challenge.key().as_ref()],
        bump = challenge.vault_bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SettleChallenge>, creator_wins: bool) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    let challenge = &ctx.accounts.challenge;

    // Must be past the resolve time
    require!(now >= challenge.resolves_at, RektoError::NotExpired);

    let total_pot = challenge
        .bet_amount
        .checked_mul(2)
        .ok_or(RektoError::Overflow)?;

    // Calculate platform fee (2%)
    let fee = total_pot
        .checked_mul(PLATFORM_FEE_BPS)
        .ok_or(RektoError::Overflow)?
        .checked_div(10_000)
        .ok_or(RektoError::Overflow)?;

    let winner_payout = total_pot.checked_sub(fee).ok_or(RektoError::Overflow)?;

    // PDA signer seeds for the vault
    let challenge_key = ctx.accounts.challenge.key();
    let vault_bump = challenge.vault_bump;
    let vault_seeds: &[&[u8]] = &[VAULT_SEED, challenge_key.as_ref(), &[vault_bump]];
    let signer_seeds = &[vault_seeds];

    // Pay winner
    let winner_account = if creator_wins {
        ctx.accounts.creator.to_account_info()
    } else {
        ctx.accounts.challenger.to_account_info()
    };

    system_program::transfer(
        CpiContext::new_with_signer(
            system_program::ID,
            system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: winner_account,
            },
            signer_seeds,
        ),
        winner_payout,
    )?;

    // Pay platform fee to treasury
    system_program::transfer(
        CpiContext::new_with_signer(
            system_program::ID,
            system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
            signer_seeds,
        ),
        fee,
    )?;

    // Mark settled
    let challenge = &mut ctx.accounts.challenge;
    challenge.status = ChallengeStatus::Settled;

    msg!(
        "Challenge #{} settled — {} wins {} lamports (fee: {})",
        challenge.challenge_id,
        if creator_wins { "creator" } else { "challenger" },
        winner_payout,
        fee,
    );

    Ok(())
}
