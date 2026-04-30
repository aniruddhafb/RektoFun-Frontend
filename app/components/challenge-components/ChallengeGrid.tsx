'use client';

import { useState, useEffect } from 'react';
import { ChallengeCard } from "./ChallengeCard";
import { Challenge, mapApiChallenge } from "./challengesData";
import { getChallenges } from "../../lib/challenges-service/challenges";

interface ChallengeGridProps {
    onRekt: (challenge: Challenge) => void;
    onClick: (challenge: Challenge) => void;
    onOpenModal: () => void;
    isLoading?: boolean;
}

export function ChallengeGrid({
    onRekt,
    onClick,
    onOpenModal,
}: ChallengeGridProps) {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchChallenges() {
            try {
                const response = await getChallenges();
                // Map API response to unified Challenge type
                const mappedChallenges = response.challenges.map(mapApiChallenge);
                setChallenges(mappedChallenges);
            } catch (error) {
                console.error('Failed to fetch challenges:', error);
                setChallenges([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchChallenges();
    }, []);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
                <div className="text-center py-16 text-gray-500">Loading challenges…</div>
            </div>
        );
    }

    if (challenges.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
                <div className="text-center py-16">
                    <p className="text-gray-500 text-lg mb-4">No challenges found yet.</p>
                    <button
                        onClick={onOpenModal}
                        className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-white/50 border border-gray-400 hover:bg-white/80 text-black text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
                    >
                        Be the first to create one!
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {challenges.map((challenge) => (
                    <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onRekt={onRekt}
                        onClick={onClick}
                    />
                ))}
            </div>
        </div>
    );
}
