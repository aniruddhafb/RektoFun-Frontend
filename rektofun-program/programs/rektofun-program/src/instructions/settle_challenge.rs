use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, ChallengeStatus, ChallengeType, WinningSide},
};

#[derive(Accounts)]
pub struct SettleChallenge<'info> {
    /// The admin/oracle wallet that is authorised to settle challenges.
    /// In production this should be a multisig or a Switchboard/Pyth oracle CPI.
    #[account(mut)]
    pub admin: Signer<'info>,

    // ── PVP-only accounts (still required in the struct; for TEAM they are unused
    //    but must be present — pass the creator's pubkey for both when settling TEAM) ──

    /// CHECK: PVP — creator receives USDC if they win; validated via challenge.creator
    #[account(
        constraint = creator.key() == challenge.creator @ RektoError::UnauthorizedSettle,
    )]
    pub creator: UncheckedAccount<'info>,

    /// CHECK: PVP — challenger receives USDC if they win; validated via challenge.challenger.
    /// For TEAM challenges pass any pubkey (e.g. creator again) — it won't be paid out here.
    pub challenger: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            CHALLENGE_SEED,
            challenge.creator.as_ref(),
            &challenge.challenge_id.to_le_bytes(),
        ],
        bump = challenge.bump,
    )]
    pub challenge: Account<'info, ChallengeAccount>,

    /// USDC vault token account — owned by the challenge PDA
    #[account(
        mut,
        seeds = [VAULT_SEED, challenge.key().as_ref()],
        bump = challenge.vault_bump,
        token::mint = usdc_mint,
        token::authority = challenge,
    )]
    pub vault: Account<'info, TokenAccount>,

    /// PVP only: winner's USDC token account (creator or challenger depending on outcome).
    /// For TEAM challenges pass any valid USDC token account — it won't be written to.
    #[account(
        mut,
        token::mint = usdc_mint,
    )]
    pub winner_usdc_account: Account<'info, TokenAccount>,

    /// Platform treasury USDC token account (receives the fee for both PVP and TEAM)
    #[account(
        mut,
        token::mint = usdc_mint,
    )]
    pub treasury_usdc_account: Account<'info, TokenAccount>,

    /// USDC mint — validated by token account constraints above
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<SettleChallenge>, creator_wins: bool) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // Must be past the resolve time
    require!(
        now >= ctx.accounts.challenge.resolves_at,
        RektoError::NotExpired
    );

    let challenge = &ctx.accounts.challenge;

    // PDA signer seeds for the challenge PDA (vault authority)
    let challenge_bump = challenge.bump;
    let challenge_id_bytes = challenge.challenge_id.to_le_bytes();
    let creator_key = challenge.creator;
    let vault_signer_seeds: &[&[u8]] = &[
        CHALLENGE_SEED,
        creator_key.as_ref(),
        &challenge_id_bytes,
        &[challenge_bump],
    ];
    let signer_seeds = &[vault_signer_seeds];

    match challenge.challenge_type {
        // ── PVP ─────────────────────────────────────────────────────────────
        ChallengeType::Pvp => {
            require!(
                challenge.status == ChallengeStatus::Active,
                RektoError::NotActive
            );

            let total_pot = challenge
                .bet_amount
                .checked_mul(2)
                .ok_or(RektoError::Overflow)?;

            let fee = total_pot
                .checked_mul(PLATFORM_FEE_BPS)
                .ok_or(RektoError::Overflow)?
                .checked_div(10_000)
                .ok_or(RektoError::Overflow)?;

            let winner_payout = total_pot.checked_sub(fee).ok_or(RektoError::Overflow)?;

            // Validate the challenger account matches the stored challenger pubkey.
            // winner_usdc_account ownership is enforced off-chain / by the admin oracle;
            // the admin is trusted to pass the correct account.
            require!(
                ctx.accounts.challenger.key() == challenge.challenger,
                RektoError::UnauthorizedSettle
            );

            // Pay winner USDC
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.key(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.winner_usdc_account.to_account_info(),
                        authority: ctx.accounts.challenge.to_account_info(),
                    },
                    signer_seeds,
                ),
                winner_payout,
            )?;

            // Pay platform fee to treasury
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.key(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.treasury_usdc_account.to_account_info(),
                        authority: ctx.accounts.challenge.to_account_info(),
                    },
                    signer_seeds,
                ),
                fee,
            )?;

            let challenge = &mut ctx.accounts.challenge;
            challenge.status = ChallengeStatus::Settled;
            challenge.winning_side = if creator_wins {
                WinningSide::CreatorTeam
            } else {
                WinningSide::OpponentTeam
            };

            msg!(
                "PVP Challenge #{} settled — {} wins {} USDC micro-units (fee: {})",
                challenge.challenge_id,
                if creator_wins { "creator" } else { "challenger" },
                winner_payout,
                fee,
            );
        }

        // ── TEAM ─────────────────────────────────────────────────────────────
        ChallengeType::Team => {
            // TEAM challenges can be settled from Open (if no one joined the losing side)
            // or Active (creator locked it). We allow both Open and Active.
            require!(
                challenge.status == ChallengeStatus::Open
                    || challenge.status == ChallengeStatus::Active,
                RektoError::NotActive
            );

            // Both sides must have at least one participant for a valid contest.
            // creator_team may be empty (creator is implicit); opponent_team must be non-empty.
            require!(
                !challenge.opponent_team.is_empty(),
                RektoError::NoWinningSide
            );

            // Total participants: 1 (creator) + creator_team.len() + opponent_team.len()
            let total_participants = (1u64)
                .checked_add(challenge.creator_team.len() as u64)
                .ok_or(RektoError::Overflow)?
                .checked_add(challenge.opponent_team.len() as u64)
                .ok_or(RektoError::Overflow)?;

            let total_pot = challenge
                .bet_amount
                .checked_mul(total_participants)
                .ok_or(RektoError::Overflow)?;

            // Deduct platform fee from the total pot
            let fee = total_pot
                .checked_mul(PLATFORM_FEE_BPS)
                .ok_or(RektoError::Overflow)?
                .checked_div(10_000)
                .ok_or(RektoError::Overflow)?;

            // Pay platform fee to treasury now
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.key(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.treasury_usdc_account.to_account_info(),
                        authority: ctx.accounts.challenge.to_account_info(),
                    },
                    signer_seeds,
                ),
                fee,
            )?;

            // Record the winning side — individual winners claim via claim_winnings
            let challenge = &mut ctx.accounts.challenge;
            challenge.status = ChallengeStatus::Settled;
            challenge.winning_side = if creator_wins {
                WinningSide::CreatorTeam
            } else {
                WinningSide::OpponentTeam
            };

            let winning_team_size = if creator_wins {
                // creator (1) + creator_team members
                1u64.checked_add(challenge.creator_team.len() as u64)
                    .ok_or(RektoError::Overflow)?
            } else {
                challenge.opponent_team.len() as u64
            };

            let payout_per_winner = total_pot
                .checked_sub(fee)
                .ok_or(RektoError::Overflow)?
                .checked_div(winning_team_size)
                .ok_or(RektoError::Overflow)?;

            msg!(
                "TEAM Challenge #{} settled — {} team wins — {} winners each claim {} USDC micro-units (fee: {})",
                challenge.challenge_id,
                if creator_wins { "creator's" } else { "opponent's" },
                winning_team_size,
                payout_per_winner,
                fee,
            );
        }
    }

    Ok(())
}
