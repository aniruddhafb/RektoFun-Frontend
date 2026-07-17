use anchor_lang::prelude::*;

use crate::{constants::*, error::RektoError, state::Config};

/// Admin-only: rotate the platform wallet that sponsors SOL fees and is
/// authorised to settle challenges / update platform parameters.
#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(address = config.admin @ RektoError::Unauthorized)]
    pub admin: Signer<'info>,
}

pub(crate) fn handler(ctx: Context<UpdateAdmin>, new_admin: Pubkey) -> Result<()> {
    require!(new_admin != Pubkey::default(), RektoError::InvalidParam);

    let config = &mut ctx.accounts.config;
    msg!("Platform admin changed: {} -> {}", config.admin, new_admin);
    config.admin = new_admin;

    Ok(())
}
