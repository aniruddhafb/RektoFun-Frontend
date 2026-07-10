use anchor_lang::prelude::*;

use crate::{constants::*, state::Config};

/// One-time bootstrap: creates the global `Config` PDA, seeded with the
/// compile-time defaults from `constants.rs`. Only the genesis `ADMIN_PUBKEY`
/// can call this — after it succeeds, `Config::admin` (mutable via
/// `update_admin`) becomes the live source of admin authority everywhere else.
#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut, address = ADMIN_PUBKEY)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<InitializeConfig>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.admin = ADMIN_PUBKEY;
    config.platform_fee_bps = PLATFORM_FEE_BPS;
    config.creator_fee_bps = CREATOR_FEE_BPS;
    config.min_bet_amount = MIN_BET_AMOUNT;
    config.max_duration_secs = MAX_DURATION_SECS;
    config.min_duration_secs = MIN_DURATION_SECS;
    config.max_team_size = MAX_TEAM_SIZE;
    config.bump = ctx.bumps.config;

    msg!("Config initialized — admin: {}", config.admin);

    Ok(())
}
