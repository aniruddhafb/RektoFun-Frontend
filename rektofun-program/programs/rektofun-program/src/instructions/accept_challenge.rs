use anchor_lang::{prelude::*, system_program};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, ChallengeStatus},
};

#[derive(Accounts)]
pub struct AcceptChallenge<'info> {
    #[account(mut)]
    pub challenger: Signer<'info>,

    /// CHECK: we only need the creator's pubkey to derive the challenge PDA
    pub creator: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            CHALLENGE_SEED,
            creator.key().as_ref(),
            &challenge.challenge_id.to_le_bytes(),
        ],
        bump = challenge.bump,
        constraint = challenge.status == ChallengeStatus::Open @ RektoError::NotOpen,
        constraint = challenge.creator != challenger.key() @ RektoError::CannotAcceptOwnChallenge,
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

pub fn handler(ctx: Context<AcceptChallenge>) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    let challenge = &mut ctx.accounts.challenge;

    // Challenge must not have expired yet
    require!(now < challenge.expires_at, RektoError::ChallengeExpired);

    let bet_amount = challenge.bet_amount;

    // Transfer matching bet from challenger to vault
    system_program::transfer(
        CpiContext::new(
            system_program::ID,
            system_program::Transfer {
                from: ctx.accounts.challenger.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        bet_amount,
    )?;

    challenge.challenger = ctx.accounts.challenger.key();
    challenge.status = ChallengeStatus::Active;

    msg!(
        "Challenge #{} accepted by {} — vault holds {} lamports",
        challenge.challenge_id,
        ctx.accounts.challenger.key(),
        bet_amount * 2,
    );

    Ok(())
}
