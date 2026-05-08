"use client";

import { ChallengeCard } from "../challenge-components/ChallengeCard";
import { ChallengeListItem } from "@/app/lib/challenges-service/challenges";

interface MarketChallengesGridProps {
    challenges: ChallengeListItem[];
    onChallengeClick?: (challenge: ChallengeListItem) => void;
}

export function MarketChallengesGrid({
    challenges,
    onChallengeClick,
}: MarketChallengesGridProps) {
    return (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {challenges.map((challenge) => (
                <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClick={onChallengeClick}
                />
            ))}
        </div>
    );
}
