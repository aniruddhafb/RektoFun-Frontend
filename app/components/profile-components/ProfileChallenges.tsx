"use client";

import React from "react";
import { Challenge, DUMMY_CHALLENGES } from "@/app/components/challenge-components/challengesData";
import { ChallengeCard } from "@/app/components/challenge-components/ChallengeCard";

interface ProfileChallengesProps {
    onChallengeClick: (challenge: Challenge) => void;
}

export function ProfileChallenges({ onChallengeClick }: ProfileChallengesProps) {
    return (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {DUMMY_CHALLENGES.map((challenge) => (
                <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClick={onChallengeClick}
                />
            ))}
        </div>
    );
}