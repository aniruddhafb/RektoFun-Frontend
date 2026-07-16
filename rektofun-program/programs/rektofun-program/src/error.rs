use anchor_lang::prelude::*;

#[error_code]
pub enum RektoError {
    #[msg("Bet amount is below the minimum allowed")]
    BetTooSmall,

    #[msg("Challenge duration is too short (minimum 5 minutes)")]
    DurationTooShort,

    #[msg("Challenge duration is too long (maximum 7 days)")]
    DurationTooLong,

    #[msg("Challenge has already been accepted")]
    AlreadyAccepted,

    #[msg("Challenge is not in Open status")]
    NotOpen,

    #[msg("Challenge is not in Active status")]
    NotActive,

    #[msg("Challenge has not yet expired")]
    NotExpired,

    #[msg("Challenge has already expired; cannot accept")]
    ChallengeExpired,

    #[msg("Creator cannot accept their own challenge")]
    CannotAcceptOwnChallenge,

    #[msg("Only the challenge creator can cancel")]
    UnauthorizedCancel,

    #[msg("Only the admin/oracle can settle challenges")]
    UnauthorizedSettle,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Asset symbol too long (max 10 chars)")]
    AssetTooLong,

    #[msg("Resolve time must be after expiry time")]
    InvalidResolvesAt,

    // ── TEAM-specific errors ─────────────────────────────────────────────────

    #[msg("Team is full; max_team_size has been reached")]
    TeamFull,

    #[msg("You have already joined this challenge")]
    AlreadyJoined,

    #[msg("This operation is not valid for the challenge type (PVP vs TEAM mismatch)")]
    WrongChallengeType,

    #[msg("Winnings have already been claimed for this challenge")]
    AlreadyClaimed,

    #[msg("You are not on the winning team")]
    NotAWinner,

    #[msg("Challenge has not been settled yet")]
    NotSettled,

    #[msg("The winning side has not been determined (no participants on one side)")]
    NoWinningSide,

    #[msg("Cannot cancel: one or more opponents have already joined this challenge")]
    OpponentsJoined,

    #[msg("Challenge has not been cancelled")]
    NotCancelled,

    #[msg("You are not eligible for a refund (you are not on the creator's team)")]
    NotEligibleForRefund,

    // ── Config / admin errors ────────────────────────────────────────────────

    #[msg("Only the platform admin can perform this action")]
    Unauthorized,

    #[msg("Invalid parameter value")]
    InvalidParam,

    #[msg("Challenge is already settled or cancelled; nothing to cancel")]
    NotOpenOrActive,

    #[msg("Withdrawal amount must be greater than zero")]
    InvalidWithdrawAmount,

    #[msg("Withdrawal amount exceeds the vault's balance")]
    InsufficientVaultBalance,
}