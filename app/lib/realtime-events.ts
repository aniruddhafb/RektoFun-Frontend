export const CHALLENGE_CREATED_EVENT = "rektofun:challenge-created";
export const CHALLENGE_UPDATED_EVENT = "rektofun:challenge-updated";

export type ChallengeUpdateAction = "joined" | "cancelled" | "refunded" | "redeemed";

export interface ChallengeUpdatedDetail {
    challengeId: number;
    action: ChallengeUpdateAction;
}

export function announceChallengeCreated() {
    window.dispatchEvent(new CustomEvent(CHALLENGE_CREATED_EVENT));
}

export function announceChallengeUpdated(detail: ChallengeUpdatedDetail) {
    window.dispatchEvent(new CustomEvent<ChallengeUpdatedDetail>(CHALLENGE_UPDATED_EVENT, { detail }));
}
