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
    /// PVP: funds are sent directly to the winner's USDC account.
    /// TEAM: the winning side is recorded on-chain; each winner must call
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

    /// TEAM mode only: a winner on the winning side claims their proportional
    /// share of the pot after the challenge has been settled.
    /// Each participant can only call this once (enforced by the ClaimRecord PDA).
    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        instructions::claim_winnings::handler(ctx)
    }

    /// TEAM mode only: a creator-side participant reclaims their bet after the creator
    /// has cancelled a challenge where no opponents joined.
    /// The creator's own refund is issued in `cancel_challenge`; this covers everyone
    /// who joined the creator's side. Each participant can only call this once
    /// (enforced by the ClaimRecord PDA).
    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        instructions::claim_refund::handler(ctx)
    }
}