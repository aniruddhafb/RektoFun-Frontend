import { Challenge, getChallenges } from "@/app/lib/challenges-service/challenges";
import { getPositions, Position } from "@/app/lib/positions-service/positions";
import { getUsers, User } from "@/app/lib/users-service/users";

export type ChallengeActivityType = "created" | "joined" | "cancelled" | "expired";

export interface ChallengeActivity {
  id: string;
  type: ChallengeActivityType;
  occurredAt: string;
  challenge: Challenge;
  actor: User | null;
  position?: Position;
}

type TimestampedChallenge = Challenge & { updated_at?: string; cancelled_at?: string };

export function getActivityVerb(type: ChallengeActivityType): string {
  if (type === "joined") return "joined this challenge";
  if (type === "cancelled") return "cancelled this challenge";
  if (type === "expired") return "had this challenge expire";
  return "created this challenge";
}

export function getActivityLabel(type: ChallengeActivityType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function buildChallengeActivities(
  challenges: Challenge[],
  positions: Position[],
  users: User[],
  now = Date.now(),
): ChallengeActivity[] {
  const challengeById = new Map(challenges.map((challenge) => [challenge.id, challenge]));
  const userById = new Map(users.map((user) => [Number(user.id), user]));
  const joinedChallengeIds = new Set<number>();
  const events: ChallengeActivity[] = [];

  for (const challenge of challenges) {
    const creatorId = Number(challenge.creator_id ?? challenge.creator);
    events.push({
      id: `created-${challenge.id}`,
      type: "created",
      occurredAt: challenge.created_at,
      challenge,
      actor: userById.get(creatorId) ?? challenge.creator_details ?? null,
    });
  }

  for (const position of positions) {
    const challenge = challengeById.get(position.challenge_id);
    if (!challenge) continue;
    const creatorId = Number(challenge.creator_id ?? challenge.creator);
    if (Number(position.creator) === creatorId) continue; // initial creator stake
    joinedChallengeIds.add(challenge.id);
    events.push({
      id: `joined-${position.id}`,
      type: "joined",
      occurredAt: position.created_at,
      challenge,
      actor: userById.get(Number(position.creator)) ?? null,
      position,
    });
  }

  for (const challenge of challenges) {
    const status = challenge.status?.toLowerCase();
    const creatorId = Number(challenge.creator_id ?? challenge.creator);
    const actor = userById.get(creatorId) ?? challenge.creator_details ?? null;
    const timestamped = challenge as TimestampedChallenge;
    if (status === "cancelled") {
      events.push({
        id: `cancelled-${challenge.id}`,
        type: "cancelled",
        occurredAt: timestamped.cancelled_at || timestamped.updated_at || challenge.created_at,
        challenge,
        actor,
      });
    } else {
      const expiry = challenge.expire_time || challenge.expiry;
      const expiryMs = new Date(expiry).getTime();
      const isExpired = status === "expired" || (
        Number.isFinite(expiryMs) && expiryMs <= now && !joinedChallengeIds.has(challenge.id)
      );
      if (isExpired) {
        events.push({
          id: `expired-${challenge.id}`,
          type: "expired",
          occurredAt: expiry || challenge.created_at,
          challenge,
          actor,
        });
      }
    }
  }

  return events.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

export async function getChallengeActivities(): Promise<ChallengeActivity[]> {
  const [challengeResponse, positionResponse, userResponse] = await Promise.all([
    getChallenges({ limit: 1000 }, { bypassCache: true }),
    getPositions({ limit: 1000 }),
    getUsers({ limit: 1000 }),
  ]);
  return buildChallengeActivities(challengeResponse.challenges, positionResponse.positions, userResponse.users);
}
