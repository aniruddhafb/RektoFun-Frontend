use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};
use crate::{
    constants::*,
    error::RektoError,
    state::{
        ChallengeAccount, ChallengeStatus, ChallengeType, CreatorCounter, PredictionDirection,
        WinningSide,
    },
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateChallengeParams {
    /// Asset symbol, e.g. "BTC"
    pub asset: String,
    /// Bet amount in USDC micro-units per participant (6 decimals, e.g. $5 = 5_000_000)
    pub bet_amount: u64,
    /// Target price in USD cents (e.g. $66,500 → 6_650_000)
    pub target_price_usd_cents: u64,
    /// true = creator predicts price will be ABOVE target; false = BELOW
    pub direction_above: bool,
    /// Unix timestamp: last moment another user can accept / join this challenge
    pub expires_at: i64,
    /// Unix timestamp: when the price outcome is evaluated
    pub resolves_at: i64,
    /// PVP = single opponent; Team = any number of participants per side
    pub challenge_type: ChallengeType,
    /// TEAM only: max participants per side (0 = no limit, capped at MAX_TEAM_SIZE = 50).
    /// Ignored for PVP challenges.
    pub max_team_size: u8,
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

    /// USDC vault token account — an ATA owned by the challenge PDA.
    /// Holds all bets (creator's + all participants').
    #[account(
        init,
        payer = creator,
        token::mint = usdc_mint,
        token::authority = challenge,
        token::token_program = token_program,
        seeds = [VAULT_SEED, challenge.key().as_ref()],
        bump,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    /// Creator's USDC token account (source of the bet)
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = creator,
        token::token_program = token_program,
    )]
    pub creator_usdc_account: InterfaceAccount<'info, TokenAccount>,

    /// USDC mint — must match the devnet USDC address
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<CreateChallenge>, params: CreateChallengeParams) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // --- Validations ---
    require!(params.asset.len() <= 10, RektoError::AssetTooLong);
    require!(params.bet_amount >= MIN_BET_AMOUNT, RektoError::BetTooSmall);

    let duration = params.expires_at.saturating_sub(now);
    require!(duration >= MIN_DURATION_SECS, RektoError::DurationTooShort);
    require!(duration <= MAX_DURATION_SECS, RektoError::DurationTooLong);
    require!(
        params.resolves_at >= params.expires_at,
        RektoError::InvalidResolvesAt
    );

    // For TEAM challenges, clamp max_team_size to the hard cap
    let effective_max_team_size = if params.challenge_type == ChallengeType::Team {
        if params.max_team_size == 0 || params.max_team_size > MAX_TEAM_SIZE {
            MAX_TEAM_SIZE
        } else {
            params.max_team_size
        }
    } else {
        0 // unused for PVP
    };

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
    challenge.challenge_type = params.challenge_type.clone();
    challenge.max_team_size = effective_max_team_size;
    challenge.winning_side = WinningSide::None;
    challenge.winning_side_total_amount = 0;
    challenge.settled_net_pot = 0;

    // PVP-specific defaults
    challenge.challenger = Pubkey::default();
    challenge.challenger_bet_amount = 0;

    // TEAM-specific defaults (empty vecs; creator is implicitly on creator_team)
    challenge.creator_team = Vec::new();
    challenge.creator_team_amounts = Vec::new();
    challenge.opponent_team = Vec::new();
    challenge.opponent_team_amounts = Vec::new();

    // --- Transfer USDC bet from creator to vault ---
    // Creator always puts in their own bet_amount regardless of challenge type.
    let decimals = ctx.accounts.usdc_mint.decimals;
    token_interface::transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.creator_usdc_account.to_account_info(),
                mint: ctx.accounts.usdc_mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.creator.to_account_info(),
            },
        ),
        params.bet_amount,
        decimals,
    )?;

    msg!(
        "Challenge #{} created by {} — type={} asset={} {} ${} — expires={} resolves={} bet={} USDC micro-units",
        challenge_id,
        ctx.accounts.creator.key(),
        if params.challenge_type == ChallengeType::Pvp { "PVP" } else { "TEAM" },
        params.asset,
        if params.direction_above { "ABOVE" } else { "BELOW" },
        params.target_price_usd_cents / 100,
        params.expires_at,
        params.resolves_at,
        params.bet_amount,
    );

    Ok(())
}