use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, ChallengeStatus, ChallengeType, ClaimRecord},
};

/// Any non-creator depositor on a Cancelled challenge claims their stake back — a PVP
/// challenger, or a TEAM `creator_team`/`opponent_team` member.
///
/// Two cancellation paths lead here:
///   - Self-cancel (`cancel_challenge`): creator cancels before any opponent has joined;
///     only TEAM `creator_team` members (who joined the creator's own side) can have
///     deposits to reclaim.
///   - Admin cancel (`admin_cancel_challenge`): admin force-cancels an Open or Active
///     challenge regardless of who has joined; PVP challengers and TEAM
///     `opponent_team` members may also have deposits to reclaim.
///
/// The creator's own refund is always handled directly in whichever instruction
/// cancelled the challenge (`cancel_challenge` / `admin_cancel_challenge`); this
/// instruction never pays out the creator.
///
/// A `ClaimRecord` PDA (same seeds as `claim_winnings`) is created on first call and
/// acts as the double-claim guard — a second call fails because the account already exists.
#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    /// The creator-side participant claiming their refund
    #[account(mut)]
    pub participant: Signer<'info>,

    /// CHECK: needed only to derive the challenge PDA
    pub creator: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [
            CHALLENGE_SEED,
            creator.key().as_ref(),
            &challenge.challenge_id.to_le_bytes(),
        ],
        bump = challenge.bump,
        constraint = challenge.status == ChallengeStatus::Cancelled @ RektoError::NotCancelled,
        constraint = challenge.creator == creator.key() @ RektoError::UnauthorizedSettle,
        has_one = rent_payer @ RektoError::Unauthorized,
    )]
    pub challenge: Box<Account<'info, ChallengeAccount>>,

    /// USDC vault — owned by the challenge PDA
    #[account(
        mut,
        seeds = [VAULT_SEED, challenge.key().as_ref()],
        bump = challenge.vault_bump,
        token::mint = usdc_mint,
        token::authority = challenge,
        token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    /// Participant's USDC token account (refund destination)
    #[account(
        mut,
        token::mint = usdc_mint,
        token::authority = participant,
        token::token_program = token_program,
    )]
    pub participant_usdc_account: InterfaceAccount<'info, TokenAccount>,

    /// Claim record — created here; its existence prevents double-claiming.
    /// Reuses the same seed namespace as claim_winnings; Cancelled vs Settled
    /// status guarantees there is no collision between the two instructions.
    #[account(
        init,
        payer = participant,
        space = 8 + ClaimRecord::INIT_SPACE,
        seeds = [CLAIM_SEED, challenge.key().as_ref(), participant.key().as_ref()],
        bump,
    )]
    pub claim_record: Account<'info, ClaimRecord>,

    pub usdc_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,

    /// Wallet that paid this challenge's rent at creation (`challenge.rent_payer`,
    /// enforced via `has_one` on `challenge` above) — receives the reclaimed
    /// vault + challenge PDA rent.
    #[account(mut)]
    pub rent_payer: SystemAccount<'info>,
}

pub(crate) fn handler(ctx: Context<ClaimRefund>) -> Result<()> {
    let challenge = &ctx.accounts.challenge;
    let participant_key = ctx.accounts.participant.key();
    let decimals = ctx.accounts.usdc_mint.decimals;

    // The creator's own refund is always paid out directly by whichever instruction
    // cancelled the challenge — never here. Everyone else's refund is their own
    // deposited amount, which may differ from the creator's bet_amount.
    let refund_amount = if challenge.challenge_type == ChallengeType::Pvp {
        require!(
            challenge.challenger != Pubkey::default() && participant_key == challenge.challenger,
            RektoError::NotEligibleForRefund
        );
        challenge.challenger_bet_amount
    } else if let Some(idx) = challenge
        .creator_team
        .iter()
        .position(|p| *p == participant_key)
    {
        challenge.creator_team_amounts[idx]
    } else {
        let idx = challenge
            .opponent_team
            .iter()
            .position(|p| *p == participant_key)
            .ok_or(RektoError::NotEligibleForRefund)?;
        challenge.opponent_team_amounts[idx]
    };

    // PDA signer seeds
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

    // If this is the last refund the vault balance will hit zero — close it now
    // to recover rent for the participant doing the final cleanup.
    let is_last_claim = ctx.accounts.vault.amount == refund_amount;

    // Transfer refund to participant
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
        refund_amount,
        decimals,
    )?;

    // Close the now-empty vault and return its rent to the admin wallet (it originally paid it)
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
    }

    // Record the claim to guard against double-claiming
    let claim_record = &mut ctx.accounts.claim_record;
    claim_record.challenge = ctx.accounts.challenge.key();
    claim_record.participant = participant_key;
    claim_record.amount_claimed = refund_amount;
    claim_record.bump = ctx.bumps.claim_record;

    msg!(
        "Challenge #{}: {} refunded {} USDC micro-units (cancelled challenge)",
        challenge.challenge_id,
        participant_key,
        refund_amount,
    );

    // Last claimant also reclaims the challenge PDA's rent — no further refund
    // claims can occur once the vault is drained.
    if is_last_claim {
        ctx.accounts.challenge.close(ctx.accounts.rent_payer.to_account_info())?;
    }

    Ok(())
}