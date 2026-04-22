use anchor_lang::{prelude::*, system_program};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, ChallengeStatus, CreatorCounter, PredictionDirection},
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateChallengeParams {
    /// Asset symbol, e.g. "BTC"
    pub asset: String,
    /// Bet amount in lamports
    pub bet_amount: u64,
    /// Target price in USD cents (e.g. $66,500 → 6_650_000)
    pub target_price_usd_cents: u64,
    /// true = creator predicts price will be ABOVE target; false = BELOW
    pub direction_above: bool,
    /// Unix timestamp: last moment another user can accept this challenge
    pub expires_at: i64,
    /// Unix timestamp: when the price outcome is evaluated
    pub resolves_at: i64,
}

#[derive(Accounts)]
#[instruction(params: CreateChallengeParams)]
pub struct CreateChallenge<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    /// Per-creator counter — init on first challenge, increment thereafter
    #[account(
        init_if_needed,
        payer = creator,
        space = 8 + CreatorCounter::INIT_SPACE,
        seeds = [COUNTER_SEED, creator.key().as_ref()],
        bump,
    )]
    pub creator_counter: Account<'info, CreatorCounter>,

    /// The challenge account itself
    #[account(
        init,
        payer = creator,
        space = 8 + ChallengeAccount::INIT_SPACE,
        seeds = [
            CHALLENGE_SEED,
            creator.key().as_ref(),
            &creator_counter.count.to_le_bytes(),
        ],
        bump,
    )]
    pub challenge: Account<'info, ChallengeAccount>,

    /// SOL vault that holds both bets — a plain system-owned PDA
    #[account(
        mut,
        seeds = [VAULT_SEED, challenge.key().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateChallenge>, params: CreateChallengeParams) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // --- Validations ---
    require!(params.asset.len() <= 10, RektoError::AssetTooLong);
    require!(params.bet_amount >= MIN_BET_LAMPORTS, RektoError::BetTooSmall);

    let duration = params.expires_at.saturating_sub(now);
    require!(duration >= MIN_DURATION_SECS, RektoError::DurationTooShort);
    require!(duration <= MAX_DURATION_SECS, RektoError::DurationTooLong);
    require!(
        params.resolves_at >= params.expires_at,
        RektoError::InvalidResolvesAt
    );

    // --- Transfer bet from creator to vault ---
    system_program::transfer(
        CpiContext::new(
            system_program::ID,
            system_program::Transfer {
                from: ctx.accounts.creator.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        params.bet_amount,
    )?;

    // --- Initialise / update counter ---
    let counter = &mut ctx.accounts.creator_counter;
    if counter.creator == Pubkey::default() {
        counter.creator = ctx.accounts.creator.key();
        counter.bump = ctx.bumps.creator_counter;
    }
    let challenge_id = counter.count;
    counter.count = counter.count.checked_add(1).ok_or(RektoError::Overflow)?;

    // --- Populate challenge account ---
    let challenge = &mut ctx.accounts.challenge;
    challenge.creator = ctx.accounts.creator.key();
    challenge.challenger = Pubkey::default();
    challenge.challenge_id = challenge_id;
    challenge.asset = params.asset.clone();
    challenge.bet_amount = params.bet_amount;
    challenge.target_price_usd_cents = params.target_price_usd_cents;
    challenge.direction = if params.direction_above {
        PredictionDirection::Above
    } else {
        PredictionDirection::Below
    };
    challenge.expires_at = params.expires_at;
    challenge.resolves_at = params.resolves_at;
    challenge.status = ChallengeStatus::Open;
    challenge.vault_bump = ctx.bumps.vault;
    challenge.bump = ctx.bumps.challenge;

    msg!(
        "Challenge #{} created by {} — {} {} ${} — expires {}",
        challenge_id,
        ctx.accounts.creator.key(),
        params.asset,
        if params.direction_above { "ABOVE" } else { "BELOW" },
        params.target_price_usd_cents / 100,
        params.expires_at,
    );

    Ok(())
}
