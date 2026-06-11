use anchor_lang::prelude::*;
use anchor_spl::{token::{self, Token, TokenAccount, Transfer}, token_interface::TokenInterface};

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

    /// CHECK: creator receives USDC if they win; validated via challenge.creator
    #[account(
        constraint = creator.key() == challenge.creator @ RektoError::UnauthorizedSettle,
    )]
    pub creator: UncheckedAccount<'info>,

    /// CHECK: challenger receives USDC if they win; validated via challenge.challenger
    #[account(
        constraint = challenger.key() == challenge.challenger @ RektoError::UnauthorizedSettle,
    )]
    pub challenger: UncheckedAccount<'info>,

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

    /// USDC vault token account — owned by the challenge PDA
    #[account(
        mut,
        seeds = [VAULT_SEED, challenge.key().as_ref()],
        bump = challenge.vault_bump,
        token::mint = usdc_mint,
        token::authority = challenge,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// Winner's USDC token account (creator or challenger depending on outcome)
    #[account(
        mut,
        token::mint = usdc_mint,
    )]
    pub winner_usdc_account: Account<'info, TokenAccount>,

    /// Platform treasury USDC token account (receives the fee)
    #[account(
        mut,
        token::mint = usdc_mint,
    )]
    pub treasury_usdc_account: Account<'info, TokenAccount>,

    /// CHECK: USDC mint — validated by token account constraints above
    pub usdc_mint: Interface<'info, TokenInterface>,

    pub token_program: Program<'info, Token>,
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

    // PDA signer seeds for the vault (challenge PDA is the vault authority)
    let challenge_key = ctx.accounts.challenge.key();
    let challenge_bump = challenge.bump;
    let challenge_id_bytes = challenge.challenge_id.to_le_bytes();
    let creator_key = challenge.creator;
    let vault_signer_seeds: &[&[u8]] = &[
        CHALLENGE_SEED,
        creator_key.as_ref(),
        &challenge_id_bytes,
        &[challenge_bump],
    ];
    let signer_seeds = &[vault_signer_seeds];

    // Pay winner USDC
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.winner_usdc_account.to_account_info(),
                authority: ctx.accounts.challenge.to_account_info(),
            },
            signer_seeds,
        ),
        winner_payout,
    )?;

    // Pay platform fee to treasury USDC account
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.treasury_usdc_account.to_account_info(),
                authority: ctx.accounts.challenge.to_account_info(),
            },
            signer_seeds,
        ),
        fee,
    )?;

    // Mark settled
    let challenge = &mut ctx.accounts.challenge;
    challenge.status = ChallengeStatus::Settled;

    msg!(
        "Challenge #{} settled — {} wins {} USDC micro-units (fee: {})",
        challenge.challenge_id,
        if creator_wins { "creator" } else { "challenger" },
        winner_payout,
        fee,
    );

    Ok(())
}
