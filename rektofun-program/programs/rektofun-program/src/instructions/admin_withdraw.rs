use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, WithdrawAuthority},
};

/// Emergency backstop: withdraw USDC out of any challenge's vault to any
/// recipient token account, in any amount up to the vault balance,
/// regardless of the challenge's status. Not tied into `ClaimRecord` or
/// `winners_remaining` bookkeeping — intended for cases where a participant
/// is unable to complete the normal settle/claim flow themselves and their
/// funds need to be sent to them (or wherever verified off-chain).
///
/// Gated on the dedicated `WithdrawAuthority` PDA, not `Config::admin` — this
/// instruction has full custody of every escrowed vault, so it is signed by
/// a wallet that is deliberately kept separate from (and never loaded into
/// the same hot service as) the admin key used for `settle_challenge` /
/// `admin_cancel_challenge` / `update_admin`.
#[derive(Accounts)]
pub struct AdminWithdraw<'info> {
    #[account(seeds = [WITHDRAW_AUTHORITY_SEED], bump = withdraw_authority.bump)]
    pub withdraw_authority: Account<'info, WithdrawAuthority>,

    /// Must match `withdraw_authority.authority` — a dedicated wallet kept
    /// separate from `Config::admin`.
    #[account(address = withdraw_authority.authority @ RektoError::UnauthorizedWithdrawAuthority)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            CHALLENGE_SEED,
            challenge.creator.as_ref(),
            &challenge.challenge_id.to_le_bytes(),
        ],
        bump = challenge.bump,
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

    /// Destination for the withdrawn USDC — any token account chosen by the
    /// admin (e.g. the affected participant's own wallet, verified off-chain).
    #[account(
        mut,
        token::mint = usdc_mint,
        token::token_program = token_program,
    )]
    pub recipient_usdc_account: InterfaceAccount<'info, TokenAccount>,

    /// USDC mint — validated by token account constraints above
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub(crate) fn handler(ctx: Context<AdminWithdraw>, amount: u64) -> Result<()> {
    require!(amount > 0, RektoError::InvalidWithdrawAmount);
    require!(
        amount <= ctx.accounts.vault.amount,
        RektoError::InsufficientVaultBalance
    );

    let challenge = &ctx.accounts.challenge;
    let challenge_id = challenge.challenge_id;
    let challenge_bump = challenge.bump;
    let challenge_id_bytes = challenge_id.to_le_bytes();
    let creator_key = challenge.creator;
    let decimals = ctx.accounts.usdc_mint.decimals;

    // PDA signer seeds for the challenge PDA (vault authority)
    let signer_seeds: &[&[u8]] = &[
        CHALLENGE_SEED,
        creator_key.as_ref(),
        &challenge_id_bytes,
        &[challenge_bump],
    ];
    let signer_seeds_nested = &[signer_seeds];

    token_interface::transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.usdc_mint.to_account_info(),
                to: ctx.accounts.recipient_usdc_account.to_account_info(),
                authority: ctx.accounts.challenge.to_account_info(),
            },
            signer_seeds_nested,
        ),
        amount,
        decimals,
    )?;

    msg!(
        "Admin withdrew {} USDC micro-units from challenge #{} vault to {}",
        amount,
        challenge_id,
        ctx.accounts.recipient_usdc_account.key(),
    );

    Ok(())
}
