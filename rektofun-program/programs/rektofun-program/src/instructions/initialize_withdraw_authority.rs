use anchor_lang::prelude::*;

use crate::{constants::*, error::RektoError, state::{Config, WithdrawAuthority}};

/// One-time bootstrap: creates the `WithdrawAuthority` PDA and sets it to
/// whatever wallet should be the sole signer for `admin_withdraw` going
/// forward. Callable only by the current `Config::admin` — this is a
/// necessary bootstrap step (admin is already today's root of trust), but it
/// only narrows future capability: after this call, `admin_withdraw` no
/// longer accepts `Config::admin` as a signer at all.
#[derive(Accounts)]
pub struct InitializeWithdrawAuthority<'info> {
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(mut, address = config.admin @ RektoError::Unauthorized)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + WithdrawAuthority::INIT_SPACE,
        seeds = [WITHDRAW_AUTHORITY_SEED],
        bump,
    )]
    pub withdraw_authority: Account<'info, WithdrawAuthority>,

    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<InitializeWithdrawAuthority>, authority: Pubkey) -> Result<()> {
    require!(authority != Pubkey::default(), RektoError::InvalidParam);

    let withdraw_authority = &mut ctx.accounts.withdraw_authority;
    withdraw_authority.authority = authority;
    withdraw_authority.bump = ctx.bumps.withdraw_authority;

    msg!("Withdraw authority initialized: {}", authority);

    Ok(())
}
