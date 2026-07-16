use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, ChallengeStatus, ChallengeType, Config},
};

/// Admin-only: force-cancel any Open or Active challenge (PVP or TEAM), regardless
/// of whether a PVP challenger has accepted or TEAM opponents have joined.
///
/// The creator's own bet is refunded here, immediately. Every other depositor —
/// a PVP challenger, or TEAM `creator_team`/`opponent_team` members — reclaims
/// their own stake afterward via `claim_refund`, since a single transaction can't
/// pay out an unbounded number of TEAM participants.
#[derive(Accounts)]
pub struct AdminCancelChallenge<'info> {
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    /// The admin wallet — only `Config::admin` may force-cancel a challenge.
    #[account(mut, address = config.admin @ RektoError::Unauthorized)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [
            CHALLENGE_SEED,
            challenge.creator.as_ref(),
            &challenge.challenge_id.to_le_bytes(),
        ],
        bump = challenge.bump,
        constraint = (challenge.status == ChallengeStatus::Open
            || challenge.status == ChallengeStatus::Active)
            @ RektoError::NotOpenOrActive,
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

    /// Creator's USDC token account (refund destination for their own bet)
    #[account(
        mut,
        token::mint = usdc_mint,
        token::token_program = token_program,
        constraint = creator_usdc_account.owner == challenge.creator @ RektoError::UnauthorizedSettle,
    )]
    pub creator_usdc_account: InterfaceAccount<'info, TokenAccount>,

    /// USDC mint — validated by token account constraints above
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<AdminCancelChallenge>) -> Result<()> {
    let challenge = &ctx.accounts.challenge;
    let bet_amount = challenge.bet_amount;
    let challenge_id = challenge.challenge_id;
    let challenge_bump = challenge.bump;
    let challenge_id_bytes = challenge_id.to_le_bytes();
    let creator_key = challenge.creator;
    let decimals = ctx.accounts.usdc_mint.decimals;

    // Whether anyone besides the creator still has funds in the vault to claim.
    let other_depositors_remain = match challenge.challenge_type {
        ChallengeType::Pvp => challenge.challenger != Pubkey::default(),
        ChallengeType::Team => {
            !challenge.creator_team.is_empty() || !challenge.opponent_team.is_empty()
        }
    };

    // PDA signer seeds for the challenge PDA (vault authority)
    let signer_seeds: &[&[u8]] = &[
        CHALLENGE_SEED,
        creator_key.as_ref(),
        &challenge_id_bytes,
        &[challenge_bump],
    ];
    let signer_seeds_nested = &[signer_seeds];

    // Refund the creator's own bet immediately
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

    // Close the vault only when no one else remains to claim a refund via claim_refund.
    if !other_depositors_remain {
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
        "Challenge #{} force-cancelled by admin — {} USDC micro-units refunded to creator{}",
        challenge_id,
        bet_amount,
        if other_depositors_remain {
            "; remaining participants may claim their refunds via claim_refund"
        } else {
            ""
        },
    );

    // Reclaim the challenge PDA's rent to admin once no other depositors remain
    // to claim refunds via claim_refund (which needs this account to still exist).
    if !other_depositors_remain {
        ctx.accounts.challenge.close(ctx.accounts.admin.to_account_info())?;
    }

    Ok(())
}
