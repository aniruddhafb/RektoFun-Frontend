use anchor_lang::{prelude::*, system_program};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, ChallengeStatus},
};

#[derive(Accounts)]
pub struct CancelChallenge<'info> {
    #[account(
        mut,
        constraint = creator.key() == challenge.creator @ RektoError::UnauthorizedCancel,
    )]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [
            CHALLENGE_SEED,
            creator.key().as_ref(),
            &challenge.challenge_id.to_le_bytes(),
        ],
        bump = challenge.bump,
        constraint = challenge.status == ChallengeStatus::Open @ RektoError::NotOpen,
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

pub fn handler(ctx: Context<CancelChallenge>) -> Result<()> {
    let challenge = &ctx.accounts.challenge;
    let bet_amount = challenge.bet_amount;
    let challenge_id = challenge.challenge_id;
    let vault_bump = challenge.vault_bump;

    // PDA signer seeds for the vault
    let challenge_key = ctx.accounts.challenge.key();
    let vault_seeds: &[&[u8]] = &[VAULT_SEED, challenge_key.as_ref(), &[vault_bump]];
    let signer_seeds = &[vault_seeds];

    // Refund creator
    system_program::transfer(
        CpiContext::new_with_signer(
            system_program::ID,
            system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.creator.to_account_info(),
            },
            signer_seeds,
        ),
        bet_amount,
    )?;

    // Mark cancelled
    let challenge = &mut ctx.accounts.challenge;
    challenge.status = ChallengeStatus::Cancelled;

    msg!(
        "Challenge #{} cancelled by creator — {} lamports refunded",
        challenge_id,
        bet_amount,
    );

    Ok(())
}
