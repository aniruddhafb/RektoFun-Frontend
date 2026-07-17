use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, ChallengeStatus, ChallengeType, ClaimRecord, Config, WinningSide},
};

/// TEAM mode only: a winner on the winning side calls this to pull their proportional
/// share of the pot. The `ClaimRecord` PDA is created on first call and acts as the
/// double-claim guard — a second call will fail because the account already exists.
#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    /// The participant claiming their winnings
    #[account(mut)]
    pub participant: Signer<'info>,

    /// CHECK: creator's pubkey — needed to derive the challenge PDA
    pub creator: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            CHALLENGE_SEED,
            creator.key().as_ref(),
            &challenge.challenge_id.to_le_bytes(),
        ],
        bump = challenge.bump,
        constraint = challenge.status == ChallengeStatus::Settled @ RektoError::NotSettled,
        constraint = challenge.challenge_type == ChallengeType::Team @ RektoError::WrongChallengeType,
        constraint = challenge.creator == creator.key() @ RektoError::UnauthorizedSettle,
        has_one = rent_payer @ RektoError::Unauthorized,
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

    /// Participant's USDC token account (payout destination)
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = participant,
        token::token_program = token_program,
    )]
    pub participant_usdc_account: InterfaceAccount<'info, TokenAccount>,

    /// Claim record — created here; its existence prevents double-claiming.
    /// Seeds: [b"claim", challenge.key(), participant.key()]
    #[account(
        init,
        payer = fee_payer,
        space = 8 + ClaimRecord::INIT_SPACE,
        seeds = [CLAIM_SEED, challenge.key().as_ref(), participant.key().as_ref()],
        bump,
    )]
    pub claim_record: Account<'info, ClaimRecord>,

    /// USDC mint
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    /// Pays the SOL rent for `claim_record` — either `participant` themself
    /// (self-pay, when they have enough SOL) or `config.admin` (sponsored).
    /// Chosen client-side based on the participant's SOL balance, same
    /// pattern as `fee_payer` in `create_challenge`.
    #[account(
        mut,
        constraint = fee_payer.key() == participant.key() || fee_payer.key() == config.admin
            @ RektoError::Unauthorized,
    )]
    pub fee_payer: Signer<'info>,

    /// Wallet that paid this challenge's rent at creation (`challenge.rent_payer`,
    /// enforced via `has_one` on `challenge` above) — receives the reclaimed
    /// vault + challenge PDA rent once the final winner has claimed.
    #[account(mut)]
    pub rent_payer: SystemAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<ClaimWinnings>) -> Result<()> {
    let challenge = &ctx.accounts.challenge;
    let participant_key = ctx.accounts.participant.key();
    let decimals = ctx.accounts.usdc_mint.decimals;
    let challenge_id = challenge.challenge_id;

    // ── 1. Verify the participant is on the winning side ─────────────────────
    let on_winning_side = match challenge.winning_side {
        WinningSide::CreatorTeam => {
            // Creator themselves OR a member of creator_team
            participant_key == challenge.creator
                || challenge.creator_team.contains(&participant_key)
        }
        WinningSide::OpponentTeam => challenge.opponent_team.contains(&participant_key),
        WinningSide::None => {
            return err!(RektoError::NotSettled);
        }
    };
    require!(on_winning_side, RektoError::NotAWinner);

    // ── 2. Calculate this participant's proportional payout ─────────────────
    // Participants may have staked different amounts, so payout is this
    // participant's own stake as a share of the winning side's total stake
    // (both snapshotted on-chain by settle_challenge).
    let participant_stake = match challenge.winning_side {
        WinningSide::CreatorTeam => {
            if participant_key == challenge.creator {
                challenge.bet_amount
            } else {
                let idx = challenge
                    .creator_team
                    .iter()
                    .position(|p| *p == participant_key)
                    .ok_or(RektoError::NotAWinner)?;
                challenge.creator_team_amounts[idx]
            }
        }
        WinningSide::OpponentTeam => {
            let idx = challenge
                .opponent_team
                .iter()
                .position(|p| *p == participant_key)
                .ok_or(RektoError::NotAWinner)?;
            challenge.opponent_team_amounts[idx]
        }
        WinningSide::None => return err!(RektoError::NotSettled),
    };

    let winning_side_total = challenge.winning_side_total_amount;
    let net_pot = challenge.settled_net_pot;
    let winners_remaining = challenge.winners_remaining;

    // This is the final outstanding claim on the winning side — pay out the vault's
    // exact remaining balance instead of the proportional formula, so it drains to
    // zero and can be closed. This also absorbs any rounding dust left behind by
    // earlier floor-divided claims rather than leaving it stranded.
    let is_last_claim = winners_remaining == 1;

    let payout: u64 = if is_last_claim {
        ctx.accounts.vault.amount
    } else {
        // Use u128 for the intermediate product to avoid overflow before dividing back down.
        (participant_stake as u128)
            .checked_mul(net_pot as u128)
            .ok_or(RektoError::Overflow)?
            .checked_div(winning_side_total as u128)
            .ok_or(RektoError::Overflow)?
            .try_into()
            .map_err(|_| RektoError::Overflow)?
    };

    // ── 3. PDA signer seeds for the vault ────────────────────────────────────
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

    // ── 4. Transfer payout to participant ────────────────────────────────────
    token_interface::transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.usdc_mint.to_account_info(),
                to: ctx.accounts.participant_usdc_account.to_account_info(),
                authority: ctx.accounts.challenge.to_account_info(),
            },
            signer_seeds,
        ),
        payout,
        decimals,
    )?;

    // ── 5. Record the claim ───────────────────────────────────────────────────
    let claim_record = &mut ctx.accounts.claim_record;
    claim_record.challenge = ctx.accounts.challenge.key();
    claim_record.participant = participant_key;
    claim_record.amount_claimed = payout;
    claim_record.bump = ctx.bumps.claim_record;

    // ── 6. Decrement the outstanding-claims counter ─────────────────────────
    ctx.accounts.challenge.winners_remaining = winners_remaining
        .checked_sub(1)
        .ok_or(RektoError::Overflow)?;

    msg!(
        "TEAM Challenge #{}: {} claimed {} USDC micro-units",
        challenge_id,
        participant_key,
        payout,
    );

    // ── 7. Last claimant closes out the vault + challenge PDA, returning their
    //      rent to the admin wallet that originally paid it at creation. ─────
    if is_last_claim {
        token_interface::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.rent_payer.to_account_info(),
                authority: ctx.accounts.challenge.to_account_info(),
            },
            signer_seeds,
        ))?;

        ctx.accounts.challenge.close(ctx.accounts.rent_payer.to_account_info())?;
    }

    Ok(())
}