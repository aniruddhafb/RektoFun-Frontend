export type ChallengeLifecycle = "OPEN" | "LIVE" | "RESOLVING" | "RESOLVED" | "EXPIRED" | "CANCELLED";

type ChallengeLifecycleInput = {
  status?: string | null;
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
  hasOpponents,
  expiryTimestamp,
  resolveTimestamp,
  now,
}: ChallengeLifecycleInput): ChallengeLifecycle {
  const normalizedStatus = String(status || "").toUpperCase();

  if (normalizedStatus === "CANCELLED") return "CANCELLED";
  if (normalizedStatus === "EXPIRED") return "EXPIRED";
  // A challenge without an opposing side never became a contest. Its join
  // deadline therefore wins over an early price-target resolution.
  if (!hasOpponents && expiryTimestamp !== null && expiryTimestamp <= now) return "EXPIRED";
  if (normalizedStatus === "RESOLVED") return "RESOLVED";
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
