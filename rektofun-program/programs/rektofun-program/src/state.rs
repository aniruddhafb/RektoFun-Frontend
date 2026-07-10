use anchor_lang::prelude::*;

/// On-chain status of a challenge
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ChallengeStatus {
    /// Waiting for a challenger to accept (PVP) or participants to join (TEAM)
    Open,
    /// PVP: a challenger has accepted; both bets are locked.
    /// TEAM: challenge has been locked by the creator; no more joins allowed.
    Active,
    /// Challenge has been settled; winning side determined
    Settled,
    /// Creator cancelled before anyone accepted / joined
    Cancelled,
}

impl Space for ChallengeStatus {
    const INIT_SPACE: usize = 1;
}

/// Direction of the price prediction
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PredictionDirection {
    Above,
    Below,
}

impl Space for PredictionDirection {
    const INIT_SPACE: usize = 1;
}

/// Whether the challenge is 1-vs-1 or team-based
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ChallengeType {
    /// Only one opponent can join; challenge goes Active immediately on accept
    Pvp,
    /// Any number of users can join either the creator's side or the opponent's side
    Team,
}

impl Space for ChallengeType {
    const INIT_SPACE: usize = 1;
}

/// Which side won a TEAM challenge (stored after settlement so claim_winnings can verify)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum WinningSide {
    /// Not yet settled
    None,
    /// Creator's team won
    CreatorTeam,
    /// Opponent's team won
    OpponentTeam,
}

impl Space for WinningSide {
    const INIT_SPACE: usize = 1;
}

/// The main challenge account stored on-chain.
///
/// PVP seeds:  [b"challenge", creator.key(), challenge_id.to_le_bytes()]
/// TEAM seeds: same — challenge_type differentiates behaviour at runtime.
#[account]
#[derive(InitSpace)]
pub struct ChallengeAccount {
    /// The wallet that created the challenge
    pub creator: Pubkey,

    // ── PVP fields ──────────────────────────────────────────────────────────
    /// PVP only: the single wallet that accepted the challenge (zero if not yet accepted)
    pub challenger: Pubkey,

    /// PVP only: the amount the challenger actually deposited (may differ from
    /// the creator's `bet_amount`; zero until accepted).
    pub challenger_bet_amount: u64,

    // ── TEAM fields ─────────────────────────────────────────────────────────
    /// TEAM only: participants who joined the creator's side (creator is implicitly included)
    #[max_len(50)]
    pub creator_team: Vec<Pubkey>,

    /// TEAM only: amount each `creator_team` participant deposited, parallel to `creator_team`
    #[max_len(50)]
    pub creator_team_amounts: Vec<u64>,

    /// TEAM only: participants who joined the opponent's side
    #[max_len(50)]
    pub opponent_team: Vec<Pubkey>,

    /// TEAM only: amount each `opponent_team` participant deposited, parallel to `opponent_team`
    #[max_len(50)]
    pub opponent_team_amounts: Vec<u64>,

    /// TEAM only: maximum participants per side (0 = no limit up to 50)
    pub max_team_size: u8,

    /// TEAM only: which side won (set during settle_challenge)
    pub winning_side: WinningSide,

    /// TEAM only: combined stake of the winning side, snapshotted at settle time
    /// (creator's bet_amount + creator_team_amounts if creator won, else opponent_team_amounts).
    /// Used by claim_winnings to compute each winner's proportional share.
    pub winning_side_total_amount: u64,

    /// TEAM only: net pot (total stake across both sides, minus platform fee),
    /// snapshotted at settle time and split proportionally in claim_winnings.
    pub settled_net_pot: u64,

    // ── Common fields ────────────────────────────────────────────────────────
    /// Whether this is a PVP or TEAM challenge
    pub challenge_type: ChallengeType,

    /// Unique numeric ID for this challenge (per creator)
    pub challenge_id: u64,

    /// Asset symbol, e.g. "BTC", "SOL", "ETH"
    #[max_len(10)]
    pub asset: String,

    /// The creator's own stake, in USDC micro-units. Other participants may deposit a
    /// different amount when they accept/join (see `challenger_bet_amount`,
    /// `creator_team_amounts`, `opponent_team_amounts`); MIN_BET_AMOUNT still applies to all.
    pub bet_amount: u64,

    /// Target price in USD cents (e.g. $66,500 → 6_650_000)
    pub target_price_usd_cents: u64,

    /// Direction of the creator's prediction
    pub direction: PredictionDirection,

    /// Unix timestamp when the challenge expires (no more accepts/joins after this)
    pub expires_at: i64,

    /// Unix timestamp when the price is evaluated (end of prediction window)
    pub resolves_at: i64,

    /// Current status
    pub status: ChallengeStatus,

    /// PDA bump for the vault
    pub vault_bump: u8,

    /// PDA bump for this account
    pub bump: u8,
}

/// A per-creator counter so each creator can have multiple challenges.
/// Seeds: [b"creator_counter", creator.key()]
#[account]
#[derive(InitSpace)]
pub struct CreatorCounter {
    pub creator: Pubkey,
    pub count: u64,
    pub bump: u8,
}

/// Tracks whether a TEAM participant has already claimed their winnings.
/// Seeds: [b"claim", challenge.key(), participant.key()]
///
/// Created (init) when the participant calls claim_winnings for the first time.
/// Its existence is the double-claim guard.
#[account]
#[derive(InitSpace)]
pub struct ClaimRecord {
    pub challenge: Pubkey,
    pub participant: Pubkey,
    pub amount_claimed: u64,
    pub bump: u8,
}

/// Global platform configuration — a single singleton PDA.
/// Seeds: [b"config"]
///
/// `admin` is the live source of truth for who sponsors SOL rent/fees and is
/// authorised to settle challenges and update these parameters — set once at
/// `initialize_config`, changeable afterwards via `update_admin`. The other
/// fields mirror the compile-time defaults in `constants.rs` but can be
/// tuned at runtime via `update_platform_params` without a program redeploy.
/// `platform_fee_bps` and `creator_fee_bps` are both deducted from the pot
/// at settlement — the former to the platform treasury, the latter to
/// `challenge.creator` regardless of who wins.
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub platform_fee_bps: u64,
    pub creator_fee_bps: u64,
    pub min_bet_amount: u64,
    pub max_duration_secs: i64,
    pub min_duration_secs: i64,
    pub max_team_size: u8,
    pub bump: u8,
}
