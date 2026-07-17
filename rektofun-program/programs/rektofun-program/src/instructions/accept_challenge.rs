use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, ChallengeStatus, ChallengeType, Config},
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
    /// Amount this participant deposits, in USDC micro-units. PVP participants
    /// must match the creator's stake. TEAM participants must match it until the
    /// opponent side has collectively covered it, after which the platform minimum applies.
    pub amount: u64,
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
    pub challenge: Box<Account<'info, ChallengeAccount>>,

    /// USDC vault token account — owned by the challenge PDA
    #[account(
        mut,
        seeds = [VAULT_SEED, challenge.key().as_ref()],
        bump = challenge.vault_bump,
        token::mint = usdc_mint,
        token::authority = challenge,
        token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    /// Challenger's USDC token account (source of the matching bet)
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = challenger,
        token::token_program = token_program,
    )]
    pub challenger_usdc_account: InterfaceAccount<'info, TokenAccount>,

    /// USDC mint — validated by token account constraints above
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,
}

pub(crate) fn handler(ctx: Context<AcceptChallenge>, params: AcceptChallengeParams) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    let challenge = &mut ctx.accounts.challenge;

    // Challenge must not have expired yet
    require!(now < challenge.expires_at, RektoError::ChallengeExpired);

    // Each participant may deposit their own amount (no longer required to match
    // the creator's bet_amount) — but it must still clear the platform minimum.
    require!(
        params.amount >= ctx.accounts.config.min_bet_amount,
        RektoError::BetTooSmall
    );
    let deposit_amount = params.amount;
    let challenger_key = ctx.accounts.challenger.key();
    let decimals = ctx.accounts.usdc_mint.decimals;

    match challenge.challenge_type {
        // ── PVP ─────────────────────────────────────────────────────────────
        ChallengeType::Pvp => {
            // Only one opponent allowed; ensure no one has joined yet
            require!(
                challenge.challenger == Pubkey::default(),
                RektoError::AlreadyAccepted
            );
            // A head-to-head opponent must match or exceed the creator's stake.
            require!(
                deposit_amount >= challenge.bet_amount,
                RektoError::BetTooSmall
            );

            // Transfer the challenger's own bet from challenger to vault
            token_interface::transfer_checked(
                CpiContext::new(
                    ctx.accounts.token_program.key(),
                    TransferChecked {
                        from: ctx.accounts.challenger_usdc_account.to_account_info(),
                        mint: ctx.accounts.usdc_mint.to_account_info(),
                        to: ctx.accounts.vault.to_account_info(),
                        authority: ctx.accounts.challenger.to_account_info(),
                    },
                ),
                deposit_amount,
                decimals,
            )?;

            challenge.challenger = challenger_key;
            challenge.challenger_bet_amount = deposit_amount;
            // PVP goes Active immediately — no more joins possible
            challenge.status = ChallengeStatus::Active;

            msg!(
                "PVP Challenge #{} accepted by {} — vault holds {} USDC micro-units",
                challenge.challenge_id,
                challenger_key,
                challenge
                    .bet_amount
                    .checked_add(deposit_amount)
                    .ok_or(RektoError::Overflow)?,
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

            // Until the opponent side has collectively covered the creator's
            // opening stake, every new participant must match that opening
            // stake. Once covered, the platform-wide minimum applies.
            let opponent_side_total = challenge
                .opponent_team_amounts
                .iter()
                .try_fold(0u64, |total, amount| total.checked_add(*amount))
                .ok_or(RektoError::Overflow)?;
            if opponent_side_total < challenge.bet_amount {
                require!(
                    deposit_amount >= challenge.bet_amount,
                    RektoError::BetTooSmall
                );
            }

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
                challenge.creator_team_amounts.push(deposit_amount);
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
                challenge.opponent_team_amounts.push(deposit_amount);
                msg!(
                    "TEAM Challenge #{}: {} joined opponent's side (total opponent-side members: {})",
                    challenge.challenge_id,
                    challenger_key,
                    challenge.opponent_team.len(),
                );
            }

            // Transfer this participant's own bet to the vault
            token_interface::transfer_checked(
                CpiContext::new(
                    ctx.accounts.token_program.key(),
                    TransferChecked {
                        from: ctx.accounts.challenger_usdc_account.to_account_info(),
                        mint: ctx.accounts.usdc_mint.to_account_info(),
                        to: ctx.accounts.vault.to_account_info(),
                        authority: ctx.accounts.challenger.to_account_info(),
                    },
                ),
                deposit_amount,
                decimals,
            )?;

            // TEAM challenges stay Open until the creator locks them (or expiry passes).
            // Status remains Open so more participants can join.
            let creator_team_sum: u64 = challenge
                .creator_team_amounts
                .iter()
                .try_fold(0u64, |acc, &amt| acc.checked_add(amt))
                .unwrap_or(u64::MAX);
            let opponent_team_sum: u64 = challenge
                .opponent_team_amounts
                .iter()
                .try_fold(0u64, |acc, &amt| acc.checked_add(amt))
                .unwrap_or(u64::MAX);
            msg!(
                "TEAM Challenge #{} vault now holds {} USDC micro-units",
                challenge.challenge_id,
                challenge
                    .bet_amount
                    .checked_add(creator_team_sum)
                    .and_then(|v| v.checked_add(opponent_team_sum))
                    .unwrap_or(u64::MAX),
            );
        }
    }

    Ok(())
}
