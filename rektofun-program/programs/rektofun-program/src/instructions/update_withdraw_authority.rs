use anchor_lang::prelude::*;

use crate::{constants::*, error::RektoError, state::WithdrawAuthority};

/// Rotates the dedicated `admin_withdraw` signer. Callable only by the
/// *current* withdraw authority itself — deliberately not by `Config::admin`
/// — so a compromised admin hot wallet has no path to reassign this
/// authority to itself. If the withdraw-authority key is ever permanently
/// lost, there is no on-chain recovery path short of a program upgrade; that
/// is the intended cost of this guarantee.
#[derive(Accounts)]
pub struct UpdateWithdrawAuthority<'info> {
    #[account(
        mut,
        seeds = [WITHDRAW_AUTHORITY_SEED],
        bump = withdraw_authority.bump,
    )]
    pub withdraw_authority: Account<'info, WithdrawAuthority>,

    #[account(address = withdraw_authority.authority @ RektoError::UnauthorizedWithdrawAuthority)]
    pub authority: Signer<'info>,
}

pub(crate) fn handler(ctx: Context<UpdateWithdrawAuthority>, new_authority: Pubkey) -> Result<()> {
    require!(new_authority != Pubkey::default(), RektoError::InvalidParam);

    let withdraw_authority = &mut ctx.accounts.withdraw_authority;
    msg!(
        "Withdraw authority changed: {} -> {}",
        withdraw_authority.authority,
        new_authority
    );
    withdraw_authority.authority = new_authority;

    Ok(())
}
