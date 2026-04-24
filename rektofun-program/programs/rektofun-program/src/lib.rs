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
    pub fn create_challenge(
        ctx: Context<CreateChallenge>,
        params: CreateChallengeParams,
    ) -> Result<()> {
        instructions::create_challenge::handler(ctx, params)
    }

    /// Challenger accepts the challenge by matching the bet amount (REKT HIM).
    pub fn accept_challenge(ctx: Context<AcceptChallenge>) -> Result<()> {
        instructions::accept_challenge::handler(ctx)
    }

    /// Admin/oracle settles the challenge after expiry, sending funds to winner.
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
}
