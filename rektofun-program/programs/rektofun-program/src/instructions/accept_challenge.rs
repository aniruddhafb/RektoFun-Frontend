use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, ChallengeStatus, ChallengeType},
};

/// `side` is only meaningful for TEAM challenges:
///   - `true`  → join the **creator's** side
///   - `false` → join the **opponent's** side
///
/// For PVP challenges `side` is ignored; the caller becomes the single challenger.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AcceptChallengeParams {
    /// TEAM only: which side to join (true = creator's side, false = opponent's side).
    /// Ignored for PVP.
    pub join_creator_side: bool,
}

#[derive(Accounts)]
pub struct AcceptChallenge<'info> {
    #[account(mut)]
    pub challenger: Signer<'info>,

    /// CHECK: we only need the creator's pubkey to derive the challenge PDA
    pub creator: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            CHALLENGE_SEED,
            creator.key().as_ref(),
            &challenge.challenge_id.to_le_bytes(),
        ],
        bump = challenge.bump,
        constraint = challenge.status == ChallengeStatus::Open @ RektoError::NotOpen,
        constraint = challenge.creator != challenger.key() @ RektoError::CannotAcceptOwnChallenge,
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

    /// Challenger's USDC token account (source of the matching bet)
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = challenger,
    )]
    pub challenger_usdc_account: Account<'info, TokenAccount>,

    /// USDC mint — validated by token account constraints above
    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<AcceptChallenge>, params: AcceptChallengeParams) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    let challenge = &mut ctx.accounts.challenge;

    // Challenge must not have expired yet
    require!(now < challenge.expires_at, RektoError::ChallengeExpired);

    let bet_amount = challenge.bet_amount;
    let challenger_key = ctx.accounts.challenger.key();

    match challenge.challenge_type {
        // ── PVP ─────────────────────────────────────────────────────────────
        ChallengeType::Pvp => {
            // Only one opponent allowed; ensure no one has joined yet
            require!(
                challenge.challenger == Pubkey::default(),
                RektoError::AlreadyAccepted
            );

            // Transfer matching USDC bet from challenger to vault
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.key(),
                    Transfer {
                        from: ctx.accounts.challenger_usdc_account.to_account_info(),
                        to: ctx.accounts.vault.to_account_info(),
                        authority: ctx.accounts.challenger.to_account_info(),
                    },
                ),
                bet_amount,
            )?;

            challenge.challenger = challenger_key;
            // PVP goes Active immediately — no more joins possible
            challenge.status = ChallengeStatus::Active;

            msg!(
                "PVP Challenge #{} accepted by {} — vault holds {} USDC micro-units",
                challenge.challenge_id,
                challenger_key,
                bet_amount * 2,
            );
        }

        // ── TEAM ─────────────────────────────────────────────────────────────
        ChallengeType::Team => {
            // Prevent duplicate joins (check both teams)
            let already_in_creator_team = challenge.creator_team.contains(&challenger_key);
            let already_in_opponent_team = challenge.opponent_team.contains(&challenger_key);
            require!(
                !already_in_creator_team && !already_in_opponent_team,
                RektoError::AlreadyJoined
            );

            let max_size = challenge.max_team_size as usize;

            if params.join_creator_side {
                // Enforce team size cap (max_team_size is per-side; creator counts as 1 already)
                // creator_team vec holds additional joiners; creator is implicit, so cap is max_size - 1
                // But to keep it simple and consistent, we treat creator_team as "extra members"
                // and the creator is always counted separately. So the vec can hold up to max_size - 1.
                require!(
                    challenge.creator_team.len() < max_size.saturating_sub(1),
                    RektoError::TeamFull
                );
                challenge.creator_team.push(challenger_key);
                msg!(
                    "TEAM Challenge #{}: {} joined creator's side (total creator-side members: {})",
                    challenge.challenge_id,
                    challenger_key,
                    challenge.creator_team.len() + 1, // +1 for the creator themselves
                );
            } else {
                // Opponent side — no implicit member, so cap is max_size
                require!(
                    challenge.opponent_team.len() < max_size,
                    RektoError::TeamFull
                );
                challenge.opponent_team.push(challenger_key);
                msg!(
                    "TEAM Challenge #{}: {} joined opponent's side (total opponent-side members: {})",
                    challenge.challenge_id,
                    challenger_key,
                    challenge.opponent_team.len(),
                );
            }

            // Transfer this participant's bet to the vault
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.key(),
                    Transfer {
                        from: ctx.accounts.challenger_usdc_account.to_account_info(),
                        to: ctx.accounts.vault.to_account_info(),
                        authority: ctx.accounts.challenger.to_account_info(),
                    },
                ),
                bet_amount,
            )?;

            // TEAM challenges stay Open until the creator locks them (or expiry passes).
            // Status remains Open so more participants can join.
            msg!(
                "TEAM Challenge #{} vault now holds {} USDC micro-units",
                challenge.challenge_id,
                // Approximate: creator + creator_team + opponent_team
                bet_amount
                    .checked_mul(
                        (1u64) // creator
                            .checked_add(challenge.creator_team.len() as u64)
                            .unwrap_or(u64::MAX)
                            .checked_add(challenge.opponent_team.len() as u64)
                            .unwrap_or(u64::MAX)
                    )
                    .unwrap_or(u64::MAX),
            );
        }
    }

    Ok(())
}
