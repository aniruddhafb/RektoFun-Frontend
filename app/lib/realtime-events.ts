export const CHALLENGE_CREATED_EVENT = "rektofun:challenge-created";

export function announceChallengeCreated() {
    window.dispatchEvent(new CustomEvent(CHALLENGE_CREATED_EVENT));
}
