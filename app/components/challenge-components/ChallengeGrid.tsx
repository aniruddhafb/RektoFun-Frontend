'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { ChallengeCard } from "./ChallengeCard";
import { getChallenges, Challenge } from "../../lib/challenges-service/challenges";
import { getPositions } from "../../lib/positions-service/positions";
import { useUserStore } from "@/app/store/useUserStore";
import { CHALLENGE_CREATED_EVENT, CHALLENGE_UPDATED_EVENT } from "@/app/lib/realtime-events";

interface ChallengeGridProps {
    onRekt: (challenge: Challenge) => void;
    onClick: (challenge: Challenge) => void;
    onToggleBookmark: (challengeId: string) => void;
    isBookmarked: (challengeId: string) => boolean;
    onOpenModal: () => void;
    onChallengesLoaded?: (challenges: Challenge[]) => void;
    refreshKey?: number;
    onRefreshComplete?: () => void;
    activeFilter: string;
    searchQuery: string;
    resolutionSource?: string;
}

const INITIAL_PAGE_SIZE = 6;
const NEXT_PAGE_SIZE = 9;
const STATUS_PRIORITY: Record<string, number> = {
    OPEN: 0,
    PENDING_RESOLUTION: 1,
    RESOLVED: 2,
    EXPIRED: 3,
    CANCELLED: 4,
};

const compareChallengeStatus = (a: Challenge, b: Challenge) =>
    (STATUS_PRIORITY[a.status.trim().toUpperCase()] ?? 5)
    - (STATUS_PRIORITY[b.status.trim().toUpperCase()] ?? 5);

export function ChallengeGrid({
    onRekt,
    onClick,
    onToggleBookmark,
    isBookmarked,
    onOpenModal,
    onChallengesLoaded,
    refreshKey = 0,
    onRefreshComplete,
    activeFilter,
    searchQuery,
    resolutionSource,
}: ChallengeGridProps) {
    const { address } = useAppKitAccount();
    const { user } = useUserStore();
    const userId = user?.id;
    const ownerAddress = address || '';

    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retryNonce, setRetryNonce] = useState(0);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const requestIdRef = useRef(0);

    const fetchChallenges = useCallback(async (currentOffset: number, append: boolean) => {
        if (append && isLoadingMore) return;
        const requestId = ++requestIdRef.current;

        if (!append) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }
        setLoadError(null);

        try {
            const isPinnedFilter = activeFilter === "Pinned";
            const isMyBetsFilter = activeFilter === "My Bets";
            const isCreatedByMeFilter = activeFilter === "Created By Me";
            const isExpiringSoonFilter = activeFilter === "Expiring Soon";
            const isOpenFilter = activeFilter === "Open";
            const statusFilter = activeFilter === "Completed"
                ? "RESOLVED"
                : activeFilter === "Cancelled"
                    ? "CANCELLED"
                    : undefined;
            const needsCompleteList = isPinnedFilter || isMyBetsFilter || isCreatedByMeFilter;

            if ((isMyBetsFilter || isCreatedByMeFilter) && userId == null) {
                setChallenges([]);
                setHasMore(false);
                setOffset(0);
                return;
            }

            const requestLimit = needsCompleteList ? 100 : append ? NEXT_PAGE_SIZE : INITIAL_PAGE_SIZE;
            const requestOffset = needsCompleteList ? 0 : currentOffset;

            const [response, positionsResponse] = await Promise.all([
                getChallenges({
                    limit: requestLimit,
                    offset: requestOffset,
                    search: searchQuery.trim() || undefined,
                    resolution_source: resolutionSource,
                    open_first: activeFilter !== "Latest",
                    status: statusFilter,
                    expiring_soon: isExpiringSoonFilter || undefined,
                    joinable: isOpenFilter || undefined,
                }),
                isMyBetsFilter ? getPositions({ limit: 100, offset: 0 }) : Promise.resolve(null),
            ]);

            let nextChunk = response.challenges ?? [];

            if (resolutionSource) {
                const normalizedSource = resolutionSource.trim().toUpperCase().replace(/[\s-]+/g, "_");
                nextChunk = nextChunk.filter((challenge) =>
                    String(challenge.resolution_source ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_") === normalizedSource
                );
            }

            if (isPinnedFilter) {
                nextChunk = nextChunk.filter((challenge) => isBookmarked(challenge.id.toString()));
            } else {
                nextChunk = [...nextChunk].sort((a, b) => {
                    const statusOrder = compareChallengeStatus(a, b);
                    if (statusOrder !== 0) return statusOrder;
                    const aBookmarked = isBookmarked(a.id.toString());
                    const bBookmarked = isBookmarked(b.id.toString());
                    if (aBookmarked === bBookmarked) return 0;
                    return aBookmarked ? -1 : 1;
                });
            }

            if (isMyBetsFilter) {
                const joinedChallengeIds = new Set(
                    (positionsResponse?.positions ?? [])
                        .filter((position) => position.creator === userId)
                        .map((position) => position.challenge_id),
                );
                nextChunk = nextChunk.filter((challenge) => joinedChallengeIds.has(challenge.id));
            }

            if (isCreatedByMeFilter) {
                nextChunk = nextChunk.filter((challenge) => challenge.creator === userId);
            }

            // Keep a client-side search pass for APIs that do not support search yet.
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                nextChunk = nextChunk.filter((challenge) =>
                    [
                        challenge.statement,
                        challenge.title,
                        challenge.ticker,
                        challenge.trading_pair,
                        challenge.category,
                    ].some((value) => String(value ?? "").toLowerCase().includes(query))
                );
            }

            // Apply sort filter client-side
            if (activeFilter === "Expiring Soon") {
                nextChunk = [...nextChunk].sort((a, b) => {
                    return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
                });
            } else if (activeFilter === "Latest") {
                nextChunk = [...nextChunk].sort((a, b) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
            }

            if (requestId !== requestIdRef.current) return;
            setChallenges((prev) => (append ? [...prev, ...nextChunk] : nextChunk));
            setHasMore(!needsCompleteList && response.challenges.length === requestLimit);
            setOffset(needsCompleteList ? nextChunk.length : currentOffset + response.challenges.length);
        } catch (error) {
            if (requestId !== requestIdRef.current) return;
            console.error('Failed to fetch challenges:', error);
            if (!append) {
                setChallenges([]);
            }
            setLoadError('Could not load challenges. Please try again.');
        } finally {
            if (requestId !== requestIdRef.current) return;
            if (!append) {
                setIsLoading(false);
                onRefreshComplete?.();
            } else {
                setIsLoadingMore(false);
            }
        }
    }, [activeFilter, isBookmarked, onRefreshComplete, searchQuery, isLoadingMore, resolutionSource, userId]);

    /* eslint-disable react-hooks/set-state-in-effect -- reset pagination before fetching a newly selected challenge view */
    useEffect(() => {
        setIsLoadingMore(false);
        setChallenges([]);
        setOffset(0);
        setHasMore(true);
        fetchChallenges(0, false);
    }, [refreshKey, retryNonce, activeFilter, searchQuery, resolutionSource, userId]);
    /* eslint-enable react-hooks/set-state-in-effect */

    useEffect(() => {
        const refreshChallenges = () => setRetryNonce((nonce) => nonce + 1);
        window.addEventListener(CHALLENGE_CREATED_EVENT, refreshChallenges);
        window.addEventListener(CHALLENGE_UPDATED_EVENT, refreshChallenges);
        return () => {
            window.removeEventListener(CHALLENGE_CREATED_EVENT, refreshChallenges);
            window.removeEventListener(CHALLENGE_UPDATED_EVENT, refreshChallenges);
        };
    }, []);

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
        const isFilteredView = activeFilter !== "Latest" || searchQuery.trim().length > 0;

        return (
            <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <div className="px-6 py-10 sm:px-12 sm:py-12">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-black/15 bg-[#f5d547] shadow-[3px_3px_0_#111]">
                            <svg className="h-7 w-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-xl font-black text-gray-950 sm:text-2xl">
                            No challenges found
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 sm:text-base">
                            {isFilteredView
                                ? "Try another filter or search term, or start a new challenge of your own."
                                : "The arena is quiet for now. Start a challenge and be the first one on the board."}
                        </p>
                        <button
                            onClick={onOpenModal}
                            className="mt-7 inline-flex cursor-pointer items-center justify-center rounded-xl border border-black bg-black px-6 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[4px_4px_0_#e85a2d] transition-colors hover:bg-gray-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#e85a2d]/25"
                        >
                            <span className="mr-2 text-lg leading-none">+</span>
                            Create a challenge
                        </button>
                    </div>
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
                    Array.from({ length: NEXT_PAGE_SIZE }).map((_, index) => (
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
