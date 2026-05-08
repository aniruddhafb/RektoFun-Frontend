/// Platform fee in basis points (e.g. 200 = 2%)
pub const PLATFORM_FEE_BPS: u64 = 200;

/// Minimum bet amount: 5 USDC (5_000_000 micro-USDC, 6 decimals)
pub const MIN_BET_AMOUNT: u64 = 5_000_000;

/// Maximum challenge duration: 7 days in seconds
pub const MAX_DURATION_SECS: i64 = 7 * 24 * 60 * 60;

/// Minimum challenge duration: 5 minutes in seconds
pub const MIN_DURATION_SECS: i64 = 5 * 60;

/// Seed prefixes
pub const CHALLENGE_SEED: &[u8] = b"challenge";
pub const VAULT_SEED: &[u8] = b"vault";
pub const COUNTER_SEED: &[u8] = b"creator_counter";

/// USDC mint on Solana devnet
pub const USDC_MINT: &str = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
