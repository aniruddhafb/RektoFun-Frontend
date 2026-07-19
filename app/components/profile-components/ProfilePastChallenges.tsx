"use client";

import { ChallengeCard } from "@/app/components/challenge-components/ChallengeCard";
import type { Challenge } from "@/app/lib/challenges-service/challenges";

export type ProfileChallengeResult = {
    challenge: Challenge;
    outcome: "WON" | "LOST";
};

export function ProfilePastChallenges({
    entries,
    loading,
    onChallengeClick,
}: {
    entries: ProfileChallengeResult[];
    loading?: boolean;
    onChallengeClick: (challenge: Challenge) => void;
}) {
    if (loading) {
        return <div className="mt-8 text-center font-bold text-gray-500">Loading past challenges…</div>;
    }
    if (!entries.length) {
        return <div className="mt-8 text-center font-bold text-gray-500">No completed challenges yet.</div>;
    }
    return (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {entries.map(({ challenge, outcome }) => (
                <div key={challenge.id} className="relative">
                    <span className="absolute right-3 top-3 z-20 text-3xl leading-none">
                        <span aria-label={outcome === "WON" ? "Won" : "Lost"} title={outcome === "WON" ? "Won" : "Lost"}>
                            {outcome === "WON" ? "🏆" : "😔"}
                        </span>
                    </span>
                    <ChallengeCard challenge={challenge} onClick={onChallengeClick} showPin={false} />
                </div>
            ))}
        </div>
    );
}
