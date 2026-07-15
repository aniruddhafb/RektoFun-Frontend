use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{
    constants::*,
    error::RektoError,
    state::{ChallengeAccount, ChallengeStatus, ChallengeType, Config, WinningSide},
};

#[derive(Accounts)]
#[instruction(creator_wins: bool)]
pub struct SettleChallenge<'info> {
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    /// The admin/oracle wallet that is authorised to settle challenges.
    /// In production this should be a multisig or a Switchboard/Pyth oracle CPI.
    #[account(mut, address = config.admin @ RektoError::UnauthorizedSettle)]
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
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// PVP only: winner's USDC token account — must actually belong to whichever
    /// side `creator_wins` declares as the winner (creator or challenger).
    /// For TEAM challenges pass any valid USDC token account — it won't be written to.
    #[account(
        mut,
        token::mint = usdc_mint,
        token::token_program = token_program,
        constraint = challenge.challenge_type != ChallengeType::Pvp
            || winner_usdc_account.owner == if creator_wins { creator.key() } else { challenger.key() }
            @ RektoError::UnauthorizedSettle,
    )]
    pub winner_usdc_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Platform treasury USDC token account (receives the fee for both PVP and TEAM)
    #[account(
        mut,
        token::mint = usdc_mint,
        token::token_program = token_program,
    )]
    pub treasury_usdc_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Creator-revenue USDC token account — receives creator_fee_bps of the pot
    /// for BOTH PVP and TEAM, regardless of who wins. Required in both cases
    /// (unlike winner_usdc_account's "dummy for TEAM" pattern), since this cut
    /// is paid unconditionally on every settlement.
    #[account(
        mut,
        token::mint = usdc_mint,
        token::token_program = token_program,
        constraint = creator_usdc_account.owner == challenge.creator @ RektoError::UnauthorizedSettle,
    )]
    pub creator_usdc_account: Box<InterfaceAccount<'info, TokenAccount>>,

    /// USDC mint — validated by token account constraints above
    pub usdc_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub(crate) fn handler(ctx: Context<SettleChallenge>, creator_wins: bool) -> Result<()> {
    let challenge = &ctx.accounts.challenge;
    let decimals = ctx.accounts.usdc_mint.decimals;
    let platform_fee_bps = ctx.accounts.config.platform_fee_bps;
    let creator_fee_bps = ctx.accounts.config.creator_fee_bps;

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

            // Both sides may have deposited different amounts; the winner takes
            // the full combined pot.
            let total_pot = challenge
                .bet_amount
                .checked_add(challenge.challenger_bet_amount)
                .ok_or(RektoError::Overflow)?;

            let fee = total_pot
                .checked_mul(platform_fee_bps)
                .ok_or(RektoError::Overflow)?
                .checked_div(10_000)
                .ok_or(RektoError::Overflow)?;

            let creator_fee = total_pot
                .checked_mul(creator_fee_bps)
                .ok_or(RektoError::Overflow)?
                .checked_div(10_000)
                .ok_or(RektoError::Overflow)?;

            let winner_payout = total_pot
                .checked_sub(fee)
                .ok_or(RektoError::Overflow)?
                .checked_sub(creator_fee)
                .ok_or(RektoError::Overflow)?;

            // Validate the challenger account matches the stored challenger pubkey.
            // winner_usdc_account ownership is enforced off-chain / by the admin oracle;
            // the admin is trusted to pass the correct account.
            require!(
                ctx.accounts.challenger.key() == challenge.challenger,
                RektoError::UnauthorizedSettle
            );

            // Pay winner USDC
            token_interface::transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.key(),
                    TransferChecked {
                        from: ctx.accounts.vault.to_account_info(),
                        mint: ctx.accounts.usdc_mint.to_account_info(),
                        to: ctx.accounts.winner_usdc_account.to_account_info(),
                        authority: ctx.accounts.challenge.to_account_info(),
                    },
                    signer_seeds,
                ),
                winner_payout,
                decimals,
            )?;

            // Pay platform fee to treasury
            token_interface::transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.key(),
                    TransferChecked {
                        from: ctx.accounts.vault.to_account_info(),
                        mint: ctx.accounts.usdc_mint.to_account_info(),
                        to: ctx.accounts.treasury_usdc_account.to_account_info(),
                        authority: ctx.accounts.challenge.to_account_info(),
                    },
                    signer_seeds,
                ),
                fee,
                decimals,
            )?;

            // Pay creator-revenue fee (paid regardless of who wins)
            token_interface::transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.key(),
                    TransferChecked {
                        from: ctx.accounts.vault.to_account_info(),
                        mint: ctx.accounts.usdc_mint.to_account_info(),
                        to: ctx.accounts.creator_usdc_account.to_account_info(),
                        authority: ctx.accounts.challenge.to_account_info(),
                    },
                    signer_seeds,
                ),
                creator_fee,
                decimals,
            )?;

            let challenge = &mut ctx.accounts.challenge;
            challenge.status = ChallengeStatus::Settled;
            challenge.winning_side = if creator_wins {
                WinningSide::CreatorTeam
            } else {
                WinningSide::OpponentTeam
            };

            msg!(
                "PVP Challenge #{} settled — {} wins {} USDC micro-units (platform fee: {}, creator fee: {})",
                challenge.challenge_id,
                if creator_wins { "creator" } else { "challenger" },
                winner_payout,
                fee,
                creator_fee,
            );

            // Vault is fully drained by the three transfers above (winner_payout + fee +
            // creator_fee == total_pot exactly); reclaim its rent to the admin wallet
            // that originally paid it at creation.
            token_interface::close_account(CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                CloseAccount {
                    account: ctx.accounts.vault.to_account_info(),
                    destination: ctx.accounts.admin.to_account_info(),
                    authority: ctx.accounts.challenge.to_account_info(),
                },
                signer_seeds,
            ))?;

            // PVP has no further claims after settlement (payout is atomic above) —
            // reclaim the challenge PDA's rent too.
            ctx.accounts.challenge.close(ctx.accounts.admin.to_account_info())?;
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

            // Participants may have deposited different amounts; sum each side's
            // actual stake instead of assuming a uniform bet_amount.
            let creator_team_sum: u64 = challenge
                .creator_team_amounts
                .iter()
                .try_fold(0u64, |acc, &amt| acc.checked_add(amt))
                .ok_or(RektoError::Overflow)?;
            let opponent_team_sum: u64 = challenge
                .opponent_team_amounts
                .iter()
                .try_fold(0u64, |acc, &amt| acc.checked_add(amt))
                .ok_or(RektoError::Overflow)?;

            let total_pot = challenge
                .bet_amount
                .checked_add(creator_team_sum)
                .ok_or(RektoError::Overflow)?
                .checked_add(opponent_team_sum)
                .ok_or(RektoError::Overflow)?;

            // Deduct platform fee and creator-revenue fee from the total pot
            let fee = total_pot
                .checked_mul(platform_fee_bps)
                .ok_or(RektoError::Overflow)?
                .checked_div(10_000)
                .ok_or(RektoError::Overflow)?;

            let creator_fee = total_pot
                .checked_mul(creator_fee_bps)
                .ok_or(RektoError::Overflow)?
                .checked_div(10_000)
                .ok_or(RektoError::Overflow)?;

            // Pay platform fee to treasury now
            token_interface::transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.key(),
                    TransferChecked {
                        from: ctx.accounts.vault.to_account_info(),
                        mint: ctx.accounts.usdc_mint.to_account_info(),
                        to: ctx.accounts.treasury_usdc_account.to_account_info(),
                        authority: ctx.accounts.challenge.to_account_info(),
                    },
                    signer_seeds,
                ),
                fee,
                decimals,
            )?;

            // Pay creator-revenue fee now (paid regardless of who wins)
            token_interface::transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.key(),
                    TransferChecked {
                        from: ctx.accounts.vault.to_account_info(),
                        mint: ctx.accounts.usdc_mint.to_account_info(),
                        to: ctx.accounts.creator_usdc_account.to_account_info(),
                        authority: ctx.accounts.challenge.to_account_info(),
                    },
                    signer_seeds,
                ),
                creator_fee,
                decimals,
            )?;

            let net_pot = total_pot
                .checked_sub(fee)
                .ok_or(RektoError::Overflow)?
                .checked_sub(creator_fee)
                .ok_or(RektoError::Overflow)?;

            // Winning side's combined stake — each winner's claim_winnings payout is
            // their own stake's proportional share of net_pot (participants staked
            // different amounts, so this can no longer be split evenly by headcount).
            let winning_side_total_amount = if creator_wins {
                challenge
                    .bet_amount
                    .checked_add(creator_team_sum)
                    .ok_or(RektoError::Overflow)?
            } else {
                opponent_team_sum
            };

            // Number of winning-side participants who still need to claim; the vault
            // and challenge PDA are closed to admin once this hits zero.
            let winners_remaining: u16 = if creator_wins {
                1u16 + challenge.creator_team.len() as u16
            } else {
                challenge.opponent_team.len() as u16
            };

            // Record the winning side — individual winners claim via claim_winnings
            let challenge = &mut ctx.accounts.challenge;
            challenge.status = ChallengeStatus::Settled;
            challenge.winning_side = if creator_wins {
                WinningSide::CreatorTeam
            } else {
                WinningSide::OpponentTeam
            };
            challenge.winning_side_total_amount = winning_side_total_amount;
            challenge.settled_net_pot = net_pot;
            challenge.winners_remaining = winners_remaining;

            msg!(
                "TEAM Challenge #{} settled — {} team wins — net pot {} USDC micro-units split proportionally across {} USDC micro-units of winning stake (platform fee: {}, creator fee: {})",
                challenge.challenge_id,
                if creator_wins { "creator's" } else { "opponent's" },
                net_pot,
                winning_side_total_amount,
                fee,
                creator_fee,
            );
        }
    }

    Ok(())
}