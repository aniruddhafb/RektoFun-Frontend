use anchor_lang::prelude::*;

/// Genesis platform wallet — used ONLY to authorise the one-time
/// `initialize_config` call that creates the on-chain `Config` PDA. After
/// that, `Config::admin` (mutable via `update_admin`) is the live source of
/// truth for admin authority everywhere else in the program.
/// Must match the pubkey derived from the `ADMIN_PRIVATE_KEY` used server-side
/// in `app/lib/admin-signer.ts`.
pub const ADMIN_PUBKEY: Pubkey = pubkey!("mo3uv8Ai9FJEB4TEfFmj8H5SAh2SArr4tgcqNz9K41n");

/// USDC mint on Solana devnet
pub const USDC_MINT: &str = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
// pub const USDC_MINT: &str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/// Initial platform fee in basis points (e.g. 200 = 2%), seeded into `Config`
/// at `initialize_config` time. Live value lives in `Config::platform_fee_bps`.
pub const PLATFORM_FEE_BPS: u64 = 200;

/// Initial creator-revenue fee in basis points (e.g. 200 = 2%) — paid to
/// `challenge.creator` on every settlement, regardless of who wins, as a flat
/// cut for having created the challenge. Seeded into `Config` at
/// `initialize_config` time. Live value lives in `Config::creator_fee_bps`.
pub const CREATOR_FEE_BPS: u64 = 200;

/// Initial minimum bet amount: 1 USDC (1_000_000 micro-USDC, 6 decimals),
/// seeded into `Config` at `initialize_config` time. Live value lives in
/// `Config::min_bet_amount`.
pub const MIN_BET_AMOUNT: u64 = 1_000_000;

/// Initial maximum challenge duration: 7 days in seconds, seeded into
/// `Config` at `initialize_config` time. Live value lives in
/// `Config::max_duration_secs`.
pub const MAX_DURATION_SECS: i64 = 7 * 24 * 60 * 60;

/// Initial minimum challenge duration: 5 minutes in seconds, seeded into
/// `Config` at `initialize_config` time. Live value lives in
/// `Config::min_duration_secs`.
pub const MIN_DURATION_SECS: i64 = 5 * 60;

/// Initial maximum participants per side in a TEAM challenge, seeded into
/// `Config` at `initialize_config` time. Live value lives in
/// `Config::max_team_size`. Absolute ceiling regardless of `Config` value.
///
/// Each TEAM challenge's on-chain account is sized to fit exactly the
/// roster capacity it was created with (see `ChallengeAccount::space_for`
/// and `instructions::create_challenge::effective_team_size`), so this
/// isn't a storage limit — it bounds the worst-case rent `fee_payer` pays
/// per challenge, and the worst-case compute cost of the roster-scanning
/// loops in `accept_challenge` / `claim_winnings`.
pub const MAX_TEAM_SIZE: u8 = 50;

/// Seed prefixes
pub const CHALLENGE_SEED: &[u8] = b"challenge";
pub const VAULT_SEED: &[u8] = b"vault";
pub const COUNTER_SEED: &[u8] = b"creator_counter";
pub const CLAIM_SEED: &[u8] = b"claim";
pub const CONFIG_SEED: &[u8] = b"config";