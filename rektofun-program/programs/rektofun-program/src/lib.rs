pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("4t5KYdKFmPw49yo6Bm1TV2ZDEi6k3Ns4eJLeNhgbVSzJ");

#[program]
pub mod rektofun_program {
    use super::*;

    /// One-time bootstrap: creates the global `Config` PDA. Only the genesis
    /// `ADMIN_PUBKEY` can call this; afterwards `Config::admin` (mutable via
    /// `update_admin`) is the live source of admin authority.
    pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
        instructions::initialize_config::handler(ctx)
    }

    /// Admin-only: rotate the platform wallet that sponsors SOL fees and is
    /// authorised to settle challenges / update platform parameters.
    pub fn update_admin(ctx: Context<UpdateAdmin>, new_admin: Pubkey) -> Result<()> {
        instructions::update_admin::handler(ctx, new_admin)
    }

    /// Admin-only: tune platform_fee_bps / creator_fee_bps / min_bet_amount /
    /// max_duration_secs / min_duration_secs / max_team_size at runtime, without
    /// a redeploy. Unset fields in `args` are left unchanged.
    pub fn update_platform_params(
        ctx: Context<UpdatePlatformParams>,
        args: UpdatePlatformParamsArgs,
    ) -> Result<()> {
        instructions::update_platform_params::handler(ctx, args)
    }

    /// Creator posts a new challenge, locking their SOL bet into escrow.
    /// Specify `challenge_type = ChallengeType::Pvp` for a 1-vs-1 challenge or
    /// `ChallengeType::Team` for a multi-participant team challenge.
    pub fn create_challenge(
        ctx: Context<CreateChallenge>,
        params: CreateChallengeParams,
    ) -> Result<()> {
        instructions::create_challenge::handler(ctx, params)
    }

    /// PVP: Challenger accepts the challenge by matching the bet amount (REKT HIM).
    /// TEAM: A participant joins either the creator's side or the opponent's side.
    ///
    /// `params.join_creator_side` is only meaningful for TEAM challenges:
    ///   - true  → join the creator's side
    ///   - false → join the opponent's side
    /// For PVP challenges this field is ignored.
    pub fn accept_challenge(
        ctx: Context<AcceptChallenge>,
        params: AcceptChallengeParams,
    ) -> Result<()> {
        instructions::accept_challenge::handler(ctx, params)
    }

    /// Admin/oracle settles the challenge after expiry.
    ///
    /// PVP: winner payout, platform fee, and creator-revenue fee are all sent
    ///      directly on-chain.
    /// TEAM: platform fee and creator-revenue fee are paid immediately; the
    ///       winning side is recorded and each winner must call
    ///       `claim_winnings` separately to pull their proportional share.
    pub fn settle_challenge(
        ctx: Context<SettleChallenge>,
        creator_wins: bool,
    ) -> Result<()> {
        instructions::settle_challenge::handler(ctx, creator_wins)
    }

    /// Creator cancels an unaccepted challenge and reclaims their bet.
    pub fn cancel_challenge(ctx: Context<CancelChallenge>) -> Result<()> {
        instructions::cancel_challenge::handler(ctx)
    }

    /// Admin-only: force-cancel any Open or Active challenge, regardless of
    /// whether a PVP challenger has accepted or TEAM opponents have joined.
    /// The creator's own bet is refunded immediately; every other depositor
    /// (PVP challenger, TEAM creator_team/opponent_team members) reclaims
    /// their own stake afterward via `claim_refund`.
    pub fn admin_cancel_challenge(ctx: Context<AdminCancelChallenge>) -> Result<()> {
        instructions::admin_cancel_challenge::handler(ctx)
    }

    /// Admin-only emergency backstop: withdraw USDC from any challenge's vault
    /// to any recipient token account, in any amount up to the vault balance,
    /// regardless of challenge status. For cases where a participant cannot
    /// complete the normal settle/claim flow themselves.
    pub fn admin_withdraw(ctx: Context<AdminWithdraw>, amount: u64) -> Result<()> {
        instructions::admin_withdraw::handler(ctx, amount)
    }

    /// TEAM mode only: a winner on the winning side claims their proportional
    /// share of the pot after the challenge has been settled.
    /// Each participant can only call this once (enforced by the ClaimRecord PDA).
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        instructions::claim_winnings::handler(ctx)
    }

    /// Any non-creator depositor on a Cancelled challenge reclaims their own stake —
    /// a PVP challenger, or a TEAM creator_team/opponent_team member. Covers refunds
    /// left over after both `cancel_challenge` (creator self-cancel) and
    /// `admin_cancel_challenge` (admin force-cancel); the creator's own refund is
    /// always issued directly by whichever of those two cancelled the challenge.
    /// Each participant can only call this once (enforced by the ClaimRecord PDA).
    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        instructions::claim_refund::handler(ctx)
    }
}