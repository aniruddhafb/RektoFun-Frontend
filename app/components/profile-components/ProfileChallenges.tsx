"use client";

import React from "react";
import { ChallengeCard } from "@/app/components/challenge-components/ChallengeCard";
import { ChallengeListItem } from "@/app/lib/challenges-service/challenges";

interface ProfileChallengesProps {
    challenges: ChallengeListItem[];
    loading?: boolean;
    onChallengeClick: (challenge: ChallengeListItem) => void;
}

export function ProfileChallenges({ challenges, loading, onChallengeClick }: ProfileChallengesProps) {
    if (loading) {
        return (
            <div className="mt-6 p-4 bg-white/70 rounded-xl border border-[#d4a574]/30 text-center text-[#8b7355]">
                Loading challenges...
            </div>
        );
    }

    if (!challenges.length) {
        return (
            <div className="mt-6 p-4 bg-white/70 rounded-xl border border-[#d4a574]/30 text-center text-[#8b7355]">
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
                />
            ))}
        </div>
    );
}
