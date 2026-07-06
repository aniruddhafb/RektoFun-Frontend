"use client";

import React from "react";
import { ChallengeCard } from "@/app/components/challenge-components/ChallengeCard";
import { Challenge } from "@/app/lib/challenges-service/challenges";

interface ProfileChallengesProps {
    challenges: Challenge[];
    loading?: boolean;
    onChallengeClick: (challenge: Challenge) => void;
    onToggleBookmark?: (challengeId: string) => void;
    isBookmarked?: (challengeId: string) => boolean;
}

export function ProfileChallenges({
    challenges,
    loading,
    onChallengeClick,
    onToggleBookmark,
    isBookmarked,
}: ProfileChallengesProps) {
    if (loading) {
        return (
            <div className="mt-6 p-4 bg-white/70 rounded-xl border border-[#d4a574]/30 text-center text-[#8b7355]">
                Loading challenges...
            </div>
        );
    }

    if (!challenges.length) {
        return (
            <div className="bg-[#f8ede7] rounded-2xl p-6 border border-[#e8d5c8] text-[#5c4a42] mt-4">
                No challenges found for this user yet.
            </div>
        );
    }

    return (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
