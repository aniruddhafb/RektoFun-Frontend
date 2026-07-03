'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { ChallengeCard } from "./ChallengeCard";
import { getChallenges, Challenge } from "../../lib/challenges-service/challenges";

interface ChallengeGridProps {
    onRekt: (challenge: Challenge) => void;
    onClick: (challenge: Challenge) => void;
    onToggleBookmark: (challengeId: string) => void;
    isBookmarked: (challengeId: string) => boolean;
    onOpenModal: () => void;
    onChallengesLoaded?: (challenges: Challenge[]) => void;
    refreshKey?: number;
    activeFilter: string;
    searchQuery: string;
}

const PAGE_SIZE = 6;

export function ChallengeGrid({
    onRekt,
    onClick,
    onToggleBookmark,
    isBookmarked,
    onOpenModal,
    onChallengesLoaded,
    refreshKey = 0,
    activeFilter,
    searchQuery,
}: ChallengeGridProps) {
    const { address } = useAppKitAccount();
    const ownerAddress = address || '';

    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retryNonce, setRetryNonce] = useState(0);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const fetchChallenges = useCallback(async (currentOffset: number, append: boolean) => {
        if (append && isLoadingMore) return;

        if (!append) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }
        setLoadError(null);

        try {
            const isPinnedFilter = activeFilter === "Pinned";
            const requestLimit = isPinnedFilter ? 100 : PAGE_SIZE;
            const requestOffset = isPinnedFilter ? 0 : currentOffset;

            const response = await getChallenges({
                limit: requestLimit,
                offset: requestOffset,
            });

            let nextChunk = response.challenges ?? [];

            if (isPinnedFilter) {
                nextChunk = nextChunk.filter((challenge) => isBookmarked(challenge.id.toString()));
            } else {
                nextChunk = [...nextChunk].sort((a, b) => {
                    const aBookmarked = isBookmarked(a.id.toString());
                    const bBookmarked = isBookmarked(b.id.toString());
                    if (aBookmarked === bBookmarked) return 0;
                    return aBookmarked ? -1 : 1;
                });
            }

            if (activeFilter === "My Bets" && ownerAddress) {
                nextChunk = nextChunk.filter((challenge) => {
                    const creatorWallet = challenge.creator?.toString().toLowerCase();
                    const currentUser = ownerAddress.toLowerCase();
                    return creatorWallet === currentUser;
                });
            }

            // Apply search filter client-side
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                nextChunk = nextChunk.filter((challenge) => 
                    challenge.statement.toLowerCase().includes(query) ||
                    challenge.ticker.toLowerCase().includes(query)
                );
            }

            // Apply sort filter client-side
            if (activeFilter === "Expiring Soon") {
                nextChunk = [...nextChunk].sort((a, b) => 
                    new Date(a.expiry).getTime() - new Date(b.expiry).getTime()
                );
            } else if (activeFilter === "Latest") {
                nextChunk = [...nextChunk].sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            }

            setChallenges((prev) => (append ? [...prev, ...nextChunk] : nextChunk));
            setHasMore(!isPinnedFilter && nextChunk.length === PAGE_SIZE);
            setOffset(isPinnedFilter ? nextChunk.length : currentOffset + nextChunk.length);
        } catch (error) {
            console.error('Failed to fetch challenges:', error);
            if (!append) {
                setChallenges([]);
            }
            setLoadError('Could not load challenges. Please try again.');
        } finally {
            if (!append) {
                setIsLoading(false);
            } else {
                setIsLoadingMore(false);
            }
        }
    }, [activeFilter, isBookmarked, ownerAddress, searchQuery, isLoadingMore]);

    useEffect(() => {
        setIsLoadingMore(false);
        setChallenges([]);
        setOffset(0);
        setHasMore(true);
        fetchChallenges(0, false);
    }, [refreshKey, retryNonce, activeFilter, searchQuery]);

    useEffect(() => {
        if (!hasMore || isLoading || isLoadingMore) return;

        const node = loadMoreRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (!first?.isIntersecting) return;
                fetchChallenges(offset, true);
            },
            {
                root: null,
                rootMargin: '200px',
                threshold: 0.1,
            },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [hasMore, isLoading, isLoadingMore, offset]);

    useEffect(() => {
        onChallengesLoaded?.(challenges);
    }, [challenges, onChallengesLoaded]);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-[300px] border-2 border-black bg-white/70 p-5 animate-pulse"
                        >
                            <div className="h-6 w-3/4 rounded bg-gray-200" />
                            <div className="mt-3 h-4 w-1/2 rounded bg-gray-200" />
                            <div className="mt-8 h-4 w-full rounded bg-gray-200" />
                            <div className="mt-2 h-4 w-5/6 rounded bg-gray-200" />
                            <div className="mt-10 h-10 w-full rounded-xl bg-gray-200" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
                <div className="mx-auto max-w-xl border-2 border-black bg-white p-8 text-center shadow-[5px_5px_0_#111]">
                    <p className="text-red-600 text-base font-bold mb-4">{loadError}</p>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => setRetryNonce((n) => n + 1)}
                            className="cursor-pointer inline-flex items-center justify-center border-2 border-black bg-[#f5d547] px-6 py-3 text-sm font-black text-black shadow-[2px_2px_0_#111] transition-all hover:-translate-y-0.5"
                        >
                            Retry
                        </button>
                        <button
                            onClick={onOpenModal}
                            className="cursor-pointer inline-flex items-center justify-center border-2 border-black bg-black px-6 py-3 text-sm font-black text-white shadow-[3px_3px_0_#e85a2d] transition-all hover:-translate-y-0.5"
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
                <div className="mx-auto max-w-xl border-2 border-black bg-white p-8 text-center shadow-[5px_5px_0_#111] animate-pop-in">
                    <p className="text-gray-800 text-lg font-black mb-4">No challenges found yet.</p>
                    <button
                        onClick={onOpenModal}
                        className="cursor-pointer inline-flex items-center justify-center border-2 border-black bg-black px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#e85a2d] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_#e85a2d]"
                    >
                        Be the first to create one!
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {challenges.map((challenge) => (
                    <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onRekt={onRekt}
                        onClick={onClick}
                        onToggleBookmark={onToggleBookmark}
                        isBookmarked={isBookmarked(challenge.id.toString())}
                        ownerAddress={ownerAddress}
                    />
                ))}
                {isLoadingMore &&
                    Array.from({ length: PAGE_SIZE }).map((_, index) => (
                        <div
                            key={`loading-more-skeleton-${index}`}
                            className="h-[300px] border-2 border-black bg-white/70 p-5 animate-pulse"
                        >
                            <div className="h-6 w-3/4 rounded bg-gray-200" />
                            <div className="mt-3 h-4 w-1/2 rounded bg-gray-200" />
                            <div className="mt-8 h-4 w-full rounded bg-gray-200" />
                            <div className="mt-2 h-4 w-5/6 rounded bg-gray-200" />
                            <div className="mt-10 h-10 w-full rounded-xl bg-gray-200" />
                        </div>
                    ))}
            </div>
            {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                    {!isLoadingMore ? (
                        <span className="border border-black bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-gray-700 shadow-[2px_2px_0_#111]">Scroll to load more</span>
                    ) : (
                        <span className="sr-only">Loading more challenges</span>
                    )}
                </div>
            )}
        </div>
    );
}