/// Platform fee in basis points (e.g. 200 = 2%)
pub const PLATFORM_FEE_BPS: u64 = 200;

/// Minimum bet amount: 0.01 SOL in lamports
pub const MIN_BET_LAMPORTS: u64 = 10_000_000;

/// Maximum challenge duration: 7 days in seconds
pub const MAX_DURATION_SECS: i64 = 7 * 24 * 60 * 60;

/// Minimum challenge duration: 5 minutes in seconds
pub const MIN_DURATION_SECS: i64 = 5 * 60;

/// Seed prefixes
pub const CHALLENGE_SEED: &[u8] = b"challenge";
pub const VAULT_SEED: &[u8] = b"vault";
pub const COUNTER_SEED: &[u8] = b"creator_counter";
