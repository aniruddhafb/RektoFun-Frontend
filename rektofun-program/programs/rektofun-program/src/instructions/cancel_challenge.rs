use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, ChallengeStatus, Config},
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
        // Must still be Open (no PVP challenger accepted, no opponent-side member joined)
        constraint = challenge.status == ChallengeStatus::Open @ RektoError::NotOpen,
        // Block cancellation if any opponent has joined — pot is contested at that point
        constraint = challenge.opponent_team.is_empty() @ RektoError::OpponentsJoined,
    )]
    pub challenge: Box<Account<'info, ChallengeAccount>>,

    /// USDC vault token account — owned by the challenge PDA
    #[account(
        mut,
        seeds = [VAULT_SEED, challenge.key().as_ref()],
        bump = challenge.vault_bump,
        token::mint = usdc_mint,
        token::authority = challenge,
        token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    /// Creator's USDC token account (refund destination)
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = creator,
        token::token_program = token_program,
    )]
    pub creator_usdc_account: InterfaceAccount<'info, TokenAccount>,

    /// USDC mint — validated by token account constraints above
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    /// Platform wallet — receives reclaimed vault rent (it originally paid it).
    #[account(mut, address = config.admin @ RektoError::Unauthorized)]
    pub admin: SystemAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<CancelChallenge>) -> Result<()> {
    let challenge = &ctx.accounts.challenge;
    let bet_amount = challenge.bet_amount;
    let challenge_id = challenge.challenge_id;
    let challenge_bump = challenge.bump;
    let challenge_id_bytes = challenge_id.to_le_bytes();
    let creator_key = challenge.creator;
    let has_creator_side_members = !challenge.creator_team.is_empty();
    let decimals = ctx.accounts.usdc_mint.decimals;

    // PDA signer seeds for the challenge PDA (vault authority)
    let signer_seeds: &[&[u8]] = &[
        CHALLENGE_SEED,
        creator_key.as_ref(),
        &challenge_id_bytes,
        &[challenge_bump],
    ];
    let signer_seeds_nested = &[signer_seeds];

    // Refund the creator's bet
    token_interface::transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.usdc_mint.to_account_info(),
                to: ctx.accounts.creator_usdc_account.to_account_info(),
                authority: ctx.accounts.challenge.to_account_info(),
            },
            signer_seeds_nested,
        ),
        bet_amount,
        decimals,
    )?;

    // Close the vault only when no creator-side participants remain to claim refunds.
    // If creator_team is non-empty, the vault stays open so they can call claim_refund.
    if !has_creator_side_members {
        token_interface::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.admin.to_account_info(),
                authority: ctx.accounts.challenge.to_account_info(),
            },
            signer_seeds_nested,
        ))?;
    }

    // Mark cancelled
    let challenge = &mut ctx.accounts.challenge;
    challenge.status = ChallengeStatus::Cancelled;

    msg!(
        "Challenge #{} cancelled by creator — {} USDC micro-units refunded{}",
        challenge_id,
        bet_amount,
        if has_creator_side_members {
            "; creator-side participants may claim their refunds via claim_refund"
        } else {
            ""
        },
    );

    Ok(())
}