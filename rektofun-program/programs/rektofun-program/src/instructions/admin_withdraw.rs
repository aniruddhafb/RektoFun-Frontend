use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, Config},
};

/// Admin-only emergency backstop: withdraw USDC out of any challenge's vault
/// to any recipient token account, in any amount up to the vault balance,
/// regardless of the challenge's status. Not tied into `ClaimRecord` or
/// `winners_remaining` bookkeeping — intended for cases where a participant
/// is unable to complete the normal settle/claim flow themselves and the
/// admin needs to send their funds to them (or wherever verified off-chain).
#[derive(Accounts)]
pub struct AdminWithdraw<'info> {
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    /// The admin wallet — only `Config::admin` may withdraw from a vault.
    pub admin: Signer<'info>,

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
