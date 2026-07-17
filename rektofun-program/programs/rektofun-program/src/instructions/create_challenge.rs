use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};
use crate::{
    constants::*,
    error::RektoError,
    state::{
        ChallengeAccount, ChallengeStatus, ChallengeType, Config, CreatorCounter,
        PredictionDirection, WinningSide,
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
    /// TEAM only: max participants per side (0 = platform default, capped at
    /// the live `Config::max_team_size`, itself capped at `MAX_TEAM_SIZE` = 50).
    /// Ignored for PVP challenges.
    ///
    /// This directly determines how many bytes the `challenge` account is
    /// allocated with (see `effective_team_size` / `ChallengeAccount::space_for`),
    /// and therefore how much SOL rent `fee_payer` (admin) pays to create it —
    /// a small `max_team_size` costs proportionally less than a large one.
    pub max_team_size: u8,
}

/// The actual TEAM roster capacity (participants per side) a challenge's
/// account gets sized and capped to.
///
/// PVP challenges never use a roster, so this is always `0` regardless of
/// what `params.max_team_size` was set to — keeping the challenge account
/// (and the rent `fee_payer` pays for it) minimal. For TEAM challenges,
/// `0` means "use the platform default" and any value above the live
/// `Config::max_team_size` ceiling is clamped down to it — mirroring the
/// join-cap check `accept_challenge` enforces at runtime.
///
/// Called from both the `space = ...` constraint on `CreateChallenge::challenge`
/// (account size must be decided before `init` runs, ahead of the handler body)
/// and from the handler (to store the same value into `challenge.max_team_size`)
/// — kept as one function so on-chain capacity and the stored cap can never drift apart.
fn effective_team_size(params: &CreateChallengeParams, config: &Config) -> u8 {
    if params.challenge_type != ChallengeType::Team {
        return 0;
    }
    if params.max_team_size == 0 || params.max_team_size > config.max_team_size {
        config.max_team_size
    } else {
        params.max_team_size
    }
}

#[derive(Accounts)]
#[instruction(params: CreateChallengeParams)]
pub struct CreateChallenge<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    /// Pays the SOL rent for account creation — either `creator` themself
    /// (self-pay, when they have enough SOL) or `config.admin` (sponsored).
    /// Chosen client-side by checking the creator's SOL balance before
    /// building this instruction. Stored as `challenge.rent_payer` so every
    /// later close instruction refunds rent to whichever of the two actually
    /// paid here, instead of unconditionally to admin.
    #[account(
        mut,
        constraint = fee_payer.key() == creator.key() || fee_payer.key() == config.admin
            @ RektoError::Unauthorized,
    )]
    pub fee_payer: Signer<'info>,

    /// Per-creator counter — init on first challenge, increment thereafter
    #[account(
        init_if_needed,
        payer = fee_payer,
        space = 8 + CreatorCounter::INIT_SPACE,
        seeds = [COUNTER_SEED, creator.key().as_ref()],
        bump,
    )]
    pub creator_counter: Account<'info, CreatorCounter>,

    /// The challenge account itself. Sized dynamically to this challenge's
    /// own requested TEAM roster (see `effective_team_size`) instead of
    /// always reserving room for the platform-wide `MAX_TEAM_SIZE` cap —
    /// keeps rent proportional to what the challenge actually needs.
    #[account(
        init,
        payer = fee_payer,
        space = ChallengeAccount::space_for(effective_team_size(&params, &config)),
        seeds = [
            CHALLENGE_SEED,
            creator.key().as_ref(),
            &creator_counter.count.to_le_bytes(),
        ],
        bump,
    )]
    pub challenge: Box<Account<'info, ChallengeAccount>>,

    /// USDC vault token account — an ATA owned by the challenge PDA.
    /// Holds all bets (creator's + all participants').
    #[account(
        init,
        payer = fee_payer,
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

    let config = &ctx.accounts.config;

    // --- Validations ---
    require!(params.asset.len() <= 10, RektoError::AssetTooLong);
    require!(
        params.bet_amount >= config.min_bet_amount,
        RektoError::BetTooSmall
    );

    let duration = params.expires_at.saturating_sub(now);
    require!(
        duration >= config.min_duration_secs,
        RektoError::DurationTooShort
    );
    require!(
        duration <= config.max_duration_secs,
        RektoError::DurationTooLong
    );
    require!(
        params.resolves_at >= params.expires_at,
        RektoError::InvalidResolvesAt
    );

    // Same clamp already applied when sizing `challenge` in the accounts struct —
    // reusing `effective_team_size` keeps stored capacity and allocated space in lockstep.
    let effective_max_team_size = effective_team_size(&params, config);

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
    challenge.rent_payer = ctx.accounts.fee_payer.key();
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
    challenge.winners_remaining = 0;

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