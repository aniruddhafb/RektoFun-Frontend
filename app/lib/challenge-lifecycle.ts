export type ChallengeLifecycle = "OPEN" | "LIVE" | "RESOLVING" | "RESOLVED" | "EXPIRED" | "CANCELLED";

type ChallengeLifecycleInput = {
  status?: string | null;
  onchainSettled?: boolean;
  hasOpponents: boolean;
  expiryTimestamp: number | null;
  resolveTimestamp: number | null;
  now: number;
};

/**
 * Canonical, viewer-independent challenge lifecycle. User-specific actions
 * such as claiming winnings or refunds are intentionally handled separately.
 */
export function getChallengeLifecycle({
  status,
  onchainSettled = false,
  hasOpponents,
  expiryTimestamp,
  resolveTimestamp,
  now,
}: ChallengeLifecycleInput): ChallengeLifecycle {
  const normalizedStatus = String(status || "").toUpperCase();

  if (normalizedStatus === "CANCELLED") return "CANCELLED";
  if (normalizedStatus === "EXPIRED") return "EXPIRED";
  // A confirmed direct/admin settlement is terminal even when the challenge's
  // originally configured resolve time is still in the future.
  if (normalizedStatus === "RESOLVED" && onchainSettled) return "RESOLVED";
  // A challenge without an opposing side never became a contest. Its join
  // deadline therefore wins over an early price-target resolution.
  if (!hasOpponents && expiryTimestamp !== null && expiryTimestamp <= now) return "EXPIRED";
  // A price target can resolve the database result before its configured
  // resolve time. Without a confirmed on-chain marker, keep it resolving.
  if (normalizedStatus === "RESOLVED") {
    return resolveTimestamp !== null && resolveTimestamp > now
      ? "RESOLVING"
      : "RESOLVED";
  }
  if (
    normalizedStatus === "PENDING_RESOLUTION" ||
    normalizedStatus === "LOCKED" ||
    (hasOpponents && resolveTimestamp !== null && resolveTimestamp <= now)
  ) {
    return "RESOLVING";
  }
  if (hasOpponents) return "LIVE";
  return "OPEN";
}
