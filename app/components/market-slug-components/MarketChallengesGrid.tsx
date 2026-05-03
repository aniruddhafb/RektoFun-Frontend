"use client";

import { ChallengeCard } from "../challenge-components/ChallengeCard";
import { Challenge } from "../challenge-components/challengesData";

interface MarketChallengesGridProps {
    challenges: Challenge[];
}

export function MarketChallengesGrid({ challenges }: MarketChallengesGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {challenges.map((challenge) => (
                <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                />
            ))}
        </div>
    );
}