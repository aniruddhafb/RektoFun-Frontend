use anchor_lang::prelude::*;

use crate::{constants::*, error::RektoError, state::Config};

/// All fields optional — only the ones provided are updated.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdatePlatformParamsArgs {
    pub platform_fee_bps: Option<u64>,
    pub creator_fee_bps: Option<u64>,
    pub min_bet_amount: Option<u64>,
    pub max_duration_secs: Option<i64>,
    pub min_duration_secs: Option<i64>,
    pub max_team_size: Option<u8>,
}

/// Admin-only: tune platform parameters at runtime without a program redeploy.
#[derive(Accounts)]
pub struct UpdatePlatformParams<'info> {
    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(address = config.admin @ RektoError::Unauthorized)]
    pub admin: Signer<'info>,
}

pub(crate) fn handler(
    ctx: Context<UpdatePlatformParams>,
    args: UpdatePlatformParamsArgs,
) -> Result<()> {
    let config = &mut ctx.accounts.config;

    if let Some(v) = args.platform_fee_bps {
        // Sanity cap: fee can never exceed 100% of the pot.
        require!(v <= 10_000, RektoError::InvalidParam);
        config.platform_fee_bps = v;
    }
    if let Some(v) = args.creator_fee_bps {
        // Sanity cap: fee can never exceed 100% of the pot.
        require!(v <= 10_000, RektoError::InvalidParam);
        config.creator_fee_bps = v;
    }
    if let Some(v) = args.min_bet_amount {
        require!(v > 0, RektoError::InvalidParam);
        config.min_bet_amount = v;
    }
    if let Some(v) = args.max_duration_secs {
        require!(v > 0, RektoError::InvalidParam);
        config.max_duration_secs = v;
    }
    if let Some(v) = args.min_duration_secs {
        require!(v > 0, RektoError::InvalidParam);
        config.min_duration_secs = v;
    }
    if let Some(v) = args.max_team_size {
        // Hard ceiling: ChallengeAccount.creator_team/opponent_team are fixed
        // max_len(50) vecs — a configured value above that would never fit.
        require!(v > 0 && v <= MAX_TEAM_SIZE, RektoError::InvalidParam);
        config.max_team_size = v;
    }

    require!(
        config.min_duration_secs <= config.max_duration_secs,
        RektoError::InvalidParam
    );

    // Combined take can never exceed 100% of the pot — check unconditionally
    // so it catches the combined value regardless of which field just changed.
    require!(
        config
            .platform_fee_bps
            .checked_add(config.creator_fee_bps)
            .ok_or(RektoError::Overflow)?
            <= 10_000,
        RektoError::InvalidParam
    );

    msg!(
        "Platform params updated — platform_fee_bps: {}, creator_fee_bps: {}, min_bet: {}, duration: [{}, {}], max_team_size: {}",
        config.platform_fee_bps,
        config.creator_fee_bps,
        config.min_bet_amount,
        config.min_duration_secs,
        config.max_duration_secs,
        config.max_team_size,
    );

    Ok(())
}
