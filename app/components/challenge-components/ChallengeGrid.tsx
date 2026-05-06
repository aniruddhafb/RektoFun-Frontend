'use client';

import { useEffect, useState } from 'react';
import { ChallengeCard } from "./ChallengeCard";
import { getChallenges } from "../../lib/challenges-service/challenges";
import { useSolanaWallet } from '@/app/lib/useSolanaWallet';
import { ChallengeListItem } from '../../lib/challenges-service/challenges';

interface ChallengeGridProps {
    onRekt: (challenge: ChallengeListItem) => void;
    onClick: (challenge: ChallengeListItem) => void;
    onOpenModal: () => void;
    onChallengesLoaded?: (challenges: ChallengeListItem[]) => void;
    isLoading?: boolean;
    refreshKey?: number;
}

export function ChallengeGrid({
    onRekt,
    onClick,
    onOpenModal,
    onChallengesLoaded,
    refreshKey = 0,
}: ChallengeGridProps) {
    const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retryNonce, setRetryNonce] = useState(0);
    const { publicKey } = useSolanaWallet();

    let ownerAddress = publicKey?.toString() || '';

    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        async function fetchChallenges() {
            setIsLoading(true);
            setLoadError(null);
            try {
                const response = await getChallenges(
                    {},
                    {
                        signal: controller.signal,
                        timeoutMs: 10000,
                        retries: 2,
                    },
                );
                // Map API response to unified ChallengeListItem type
                if (!isMounted) return;
                setChallenges(response.challenges ?? []);
                onChallengesLoaded?.(response.challenges ?? []);
            } catch (error) {
                if (!isMounted || controller.signal.aborted) return;
                console.error('Failed to fetch challenges:', error);
                setChallenges([]);
                onChallengesLoaded?.([]);
                setLoadError('Could not load challenges. Please try again.');
            } finally {
                if (!isMounted) return;
                setIsLoading(false);
            }
        }

        fetchChallenges();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [onChallengesLoaded, refreshKey, retryNonce]);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
                <div className="text-center py-16 text-gray-700">Loading challenges…</div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
                <div className="text-center py-16">
                    <p className="text-red-600 text-base mb-4">{loadError}</p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => setRetryNonce((n) => n + 1)}
                            className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-white/50 border border-gray-400 hover:bg-white/80 text-black text-sm font-medium rounded-full transition-colors"
                        >
                            Retry
                        </button>
                        <button
                            onClick={onOpenModal}
                            className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-white/20 border border-gray-300 hover:bg-white/40 text-black text-sm font-medium rounded-full transition-colors"
                        >
                            Create a challenge
                        </button>
                    </div>
                </div>
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
                        ownerAddress={ownerAddress}
                    />
                ))}
            </div>
        </div>
    );
}
