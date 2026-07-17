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
///
/// Sizing note: this struct does NOT use `#[derive(InitSpace)]` /
/// `#[max_len(..)]`. The four TEAM-roster vecs below are the overwhelming
/// majority of this account's bytes (up to ~4KB at the platform-wide
/// `MAX_TEAM_SIZE` ceiling), and a PVP challenge — or a small TEAM one —
/// never needs that much room. Reserving the worst case on every challenge
/// means admin (the `fee_payer` in `create_challenge`) pays multiple times
/// more rent than necessary for the common case. Instead, `space_for` below
/// computes exactly the bytes needed for the roster capacity a given
/// challenge was actually created with — see
/// `instructions::create_challenge::effective_team_size`.
#[account]
pub struct ChallengeAccount {
    /// The wallet that created the challenge
    pub creator: Pubkey,

    /// The wallet that paid the SOL rent for this challenge account + vault at
    /// creation — either `creator` self-paying (if they had enough SOL) or
    /// `config.admin` sponsoring. Every later close instruction
    /// (`settle_challenge`, `cancel_challenge`, `admin_cancel_challenge`,
    /// `claim_winnings`, `claim_refund`) refunds reclaimed rent to this same
    /// wallet, not unconditionally to admin.
    pub rent_payer: Pubkey,

    // ── PVP fields ──────────────────────────────────────────────────────────
    /// PVP only: the single wallet that accepted the challenge (zero if not yet accepted)
    pub challenger: Pubkey,

    /// PVP only: the amount the challenger actually deposited (may differ from
    /// the creator's `bet_amount`; zero until accepted).
    pub challenger_bet_amount: u64,

    // ── TEAM fields ─────────────────────────────────────────────────────────
    /// TEAM only: participants who joined the creator's side (creator is implicitly included).
    /// Capacity is fixed at `init` time to this challenge's own `max_team_size`
    /// (see `ChallengeAccount::space_for`), not the platform-wide `MAX_TEAM_SIZE`.
    pub creator_team: Vec<Pubkey>,

    /// TEAM only: amount each `creator_team` participant deposited, parallel to `creator_team`
    pub creator_team_amounts: Vec<u64>,

    /// TEAM only: participants who joined the opponent's side. Same per-challenge
    /// capacity note as `creator_team`.
    pub opponent_team: Vec<Pubkey>,

    /// TEAM only: amount each `opponent_team` participant deposited, parallel to `opponent_team`
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

    /// TEAM only: number of winning-side participants who still need to call
    /// claim_winnings, snapshotted at settle time and decremented on each claim.
    /// When it hits zero the vault and this account are closed, returning their
    /// rent to the admin wallet that originally paid it.
    pub winners_remaining: u16,

    // ── Common fields ────────────────────────────────────────────────────────
    /// Whether this is a PVP or TEAM challenge
    pub challenge_type: ChallengeType,

    /// Unique numeric ID for this challenge (per creator)
    pub challenge_id: u64,

    /// Asset symbol, e.g. "BTC", "SOL", "ETH". Capped at 10 bytes — see
    /// `ChallengeAccount::FIXED_SPACE`, which reserves exactly 4 + 10 for it.
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

impl ChallengeAccount {
    /// Size (bytes) of every field except the four TEAM-roster vecs
    /// (`creator_team`, `creator_team_amounts`, `opponent_team`,
    /// `opponent_team_amounts`) — i.e. everything a PVP challenge needs.
    /// Kept in sync manually with the field list above since this struct no
    /// longer derives `InitSpace`.
    const FIXED_SPACE: usize = 32 // creator
        + 32 // rent_payer
        + 32 // challenger
        + 8  // challenger_bet_amount
        + 1  // max_team_size
        + 1  // winning_side (1-byte enum)
        + 8  // winning_side_total_amount
        + 8  // settled_net_pot
        + 2  // winners_remaining
        + 1  // challenge_type (1-byte enum)
        + 8  // challenge_id
        + (4 + 10) // asset: String, 4-byte Borsh length prefix + 10-byte cap
        + 8  // bet_amount
        + 8  // target_price_usd_cents
        + 1  // direction (1-byte enum)
        + 8  // expires_at
        + 8  // resolves_at
        + 1  // status (1-byte enum)
        + 1  // vault_bump
        + 1; // bump

    /// Bytes needed for the four TEAM-roster vecs when capacity is
    /// `roster_capacity` participants per side: each vec costs a 4-byte
    /// Borsh length prefix plus `roster_capacity` elements, and there are
    /// two vecs (members + amounts) per side, times two sides.
    /// `roster_capacity = 0` (PVP, or a TEAM challenge created with no
    /// roster) costs only the four empty-length prefixes (16 bytes).
    fn team_roster_space(roster_capacity: u8) -> usize {
        let n = roster_capacity as usize;
        let pubkey_vecs = 2 * (4 + n * 32); // creator_team + opponent_team
        let amount_vecs = 2 * (4 + n * 8); // creator_team_amounts + opponent_team_amounts
        pubkey_vecs + amount_vecs
    }

    /// Total on-chain account size, including the 8-byte Anchor
    /// discriminator, for a challenge whose TEAM roster is capped at
    /// `roster_capacity` participants per side. This is what
    /// `create_challenge` passes as `space` — see
    /// `instructions::create_challenge::effective_team_size` for how
    /// `roster_capacity` is derived from `CreateChallengeParams`.
    ///
    /// Rent scales directly with this value, so sizing to the challenge's
    /// own requested roster (instead of always paying for the
    /// platform-wide `MAX_TEAM_SIZE` ceiling) is what keeps PVP and
    /// small-team challenges cheap for the admin wallet that sponsors it.
    pub fn space_for(roster_capacity: u8) -> usize {
        8 + Self::FIXED_SPACE + Self::team_roster_space(roster_capacity)
    }
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

/// Dedicated authority allowed to call `admin_withdraw`, kept separate from
/// `Config::admin` so a leaked/compromised admin hot wallet (the one loaded
/// into the settlement service) cannot on its own drain escrowed vaults.
/// Seeds: [b"withdraw_authority"]
///
/// Bootstrapped once via `initialize_withdraw_authority` (admin-gated);
/// after that only this authority can rotate itself via
/// `update_withdraw_authority` — `Config::admin` has no path to reassign it.
#[account]
#[derive(InitSpace)]
pub struct WithdrawAuthority {
    pub authority: Pubkey,
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
