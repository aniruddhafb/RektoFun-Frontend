"use client";

import { ChallengeCard } from "../challenge-components/ChallengeCard";
import { Challenge } from "@/app/lib/challenges-service/challenges";

interface MarketChallengesGridProps {
    challenges: Challenge[];
    onChallengeClick?: (challenge: Challenge) => void;
    onToggleBookmark?: (challengeId: string) => void;
    isBookmarked?: (challengeId: string) => boolean;
}

export function MarketChallengesGrid({
    challenges,
    onChallengeClick,
    onToggleBookmark,
    isBookmarked,
}: MarketChallengesGridProps) {
    return (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {challenges.map((challenge) => (
                <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClick={onChallengeClick}
                    onToggleBookmark={onToggleBookmark}
                    isBookmarked={isBookmarked?.(challenge.id)}
                />
            ))}
        </div>
    );
}
