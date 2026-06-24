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

    // ── TEAM fields ─────────────────────────────────────────────────────────
    /// TEAM only: participants who joined the creator's side (creator is implicitly included)
    #[max_len(50)]
    pub creator_team: Vec<Pubkey>,

    /// TEAM only: participants who joined the opponent's side
    #[max_len(50)]
    pub opponent_team: Vec<Pubkey>,

    /// TEAM only: maximum participants per side (0 = no limit up to 50)
    pub max_team_size: u8,

    /// TEAM only: which side won (set during settle_challenge)
    pub winning_side: WinningSide,

    // ── Common fields ────────────────────────────────────────────────────────
    /// Whether this is a PVP or TEAM challenge
    pub challenge_type: ChallengeType,

    /// Unique numeric ID for this challenge (per creator)
    pub challenge_id: u64,

    /// Asset symbol, e.g. "BTC", "SOL", "ETH"
    #[max_len(10)]
    pub asset: String,

    /// Bet amount in USDC micro-units per participant (both sides must match per person)
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
