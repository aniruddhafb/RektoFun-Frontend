use anchor_lang::prelude::*;

/// On-chain status of a challenge
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ChallengeStatus {
    /// Waiting for a challenger to accept
    Open,
    /// A challenger has accepted; both bets are locked
    Active,
    /// Challenge has been settled; winner paid out
    Settled,
    /// Creator cancelled before anyone accepted
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

/// The main challenge account stored on-chain.
/// Seeds: [b"challenge", creator.key(), challenge_id.to_le_bytes()]
#[account]
#[derive(InitSpace)]
pub struct ChallengeAccount {
    /// The wallet that created the challenge
    pub creator: Pubkey,
    /// The wallet that accepted the challenge (zero if not yet accepted)
    pub challenger: Pubkey,
    /// Unique numeric ID for this challenge (per creator)
    pub challenge_id: u64,
    /// Asset symbol, e.g. "BTC", "SOL", "ETH"
    #[max_len(10)]
    pub asset: String,
    /// Bet amount in lamports (both sides must match)
    pub bet_amount: u64,
    /// Target price in USD cents (e.g. $66,500 → 6_650_000)
    pub target_price_usd_cents: u64,
    /// Direction of the creator's prediction
    pub direction: PredictionDirection,
    /// Unix timestamp when the challenge expires (no more accepts after this)
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
