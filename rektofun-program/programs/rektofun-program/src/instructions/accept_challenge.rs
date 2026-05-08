use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

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

    /// USDC vault token account — owned by the challenge PDA
    #[account(
        mut,
        seeds = [VAULT_SEED, challenge.key().as_ref()],
        bump = challenge.vault_bump,
        token::mint = usdc_mint,
        token::authority = challenge,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// Challenger's USDC token account (source of the matching bet)
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = challenger,
    )]
    pub challenger_usdc_account: Account<'info, TokenAccount>,

    /// CHECK: USDC mint — validated by token account constraints above
    pub usdc_mint: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AcceptChallenge>) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    let challenge = &mut ctx.accounts.challenge;

    // Challenge must not have expired yet
    require!(now < challenge.expires_at, RektoError::ChallengeExpired);

    let bet_amount = challenge.bet_amount;

    // Transfer matching USDC bet from challenger to vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            Transfer {
                from: ctx.accounts.challenger_usdc_account.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.challenger.to_account_info(),
            },
        ),
        bet_amount,
    )?;

    challenge.challenger = ctx.accounts.challenger.key();
    challenge.status = ChallengeStatus::Active;

    msg!(
        "Challenge #{} accepted by {} — vault holds {} USDC micro-units",
        challenge.challenge_id,
        ctx.accounts.challenger.key(),
        bet_amount * 2,
    );

    Ok(())
}
