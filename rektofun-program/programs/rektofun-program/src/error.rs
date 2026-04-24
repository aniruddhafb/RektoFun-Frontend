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
}
