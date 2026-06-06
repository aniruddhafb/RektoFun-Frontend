'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChallengeCard } from "./ChallengeCard";
import { getChallenges } from "../../lib/challenges-service/challenges";
import { useSolanaWallet } from '@/app/lib/useSolanaWallet';
import { ChallengeListItem } from '../../lib/challenges-service/challenges';

interface ChallengeGridProps {
    onRekt: (challenge: ChallengeListItem) => void;
    onClick: (challenge: ChallengeListItem) => void;
    onToggleBookmark: (challengeId: string) => void;
    isBookmarked: (challengeId: string) => boolean;
    onOpenModal: () => void;
    onChallengesLoaded?: (challenges: ChallengeListItem[]) => void;
    isLoading?: boolean;
    refreshKey?: number;
    activeFilter: string;
    activeAsset: string;
    searchQuery: string;
}

export function ChallengeGrid({
    onRekt,
    onClick,
    onToggleBookmark,
    isBookmarked,
    onOpenModal,
    onChallengesLoaded,
    refreshKey = 0,
    activeFilter,
    activeAsset,
    searchQuery,
}: ChallengeGridProps) {
    const PAGE_SIZE = 6;
    const LOADING_MESSAGES = [
        "Scanning live markets...",
        "Calculating risk and odds...",
        "Finding fresh challenges for you...",
        "Almost there, sharpening the feed...",
    ];
    const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retryNonce, setRetryNonce] = useState(0);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const requestIdRef = useRef(0);
    const isLoadingRef = useRef(false);
    const isLoadingMoreRef = useRef(false);
    const { publicKey } = useSolanaWallet();

    const ownerAddress = publicKey?.toString() || '';

    const fetchChallenges = useCallback(async (currentOffset: number, append: boolean) => {
        if (append && (isLoadingRef.current || isLoadingMoreRef.current)) {
            return;
        }

        const requestId = ++requestIdRef.current;
        if (!append) {
            setIsLoading(true);
            isLoadingRef.current = true;
            if (isLoadingMoreRef.current) {
                setIsLoadingMore(false);
                isLoadingMoreRef.current = false;
            }
        } else {
            setIsLoadingMore(true);
            isLoadingMoreRef.current = true;
        }
        setLoadError(null);

        try {
            const isPinnedFilter = activeFilter === "Pinned";
            const requestLimit = isPinnedFilter ? 100 : PAGE_SIZE;
            const requestOffset = isPinnedFilter ? 0 : currentOffset;
            const response = await getChallenges(
                {
                    limit: requestLimit,
                    offset: requestOffset,
                    category: activeAsset !== "All Markets" ? activeAsset : undefined,
                    search: searchQuery.trim() || undefined,
                    sort: activeFilter === "Expiring Soon" ? "expiring_soon" : "latest",
                    created_by: activeFilter === "Created By Me" ? ownerAddress || undefined : undefined,
                },
                {
                    timeoutMs: 10000,
                    retries: 2,
                    cacheTtlMs: 20000,
                    bypassCache: currentOffset === 0 ? false : true,
                },
            );
            if (requestId !== requestIdRef.current) return;
            let nextChunk = response.challenges ?? [];
            if (isPinnedFilter) {
                nextChunk = nextChunk.filter((challenge) => isBookmarked(challenge.id));
            } else {
                nextChunk = [...nextChunk].sort((a, b) => {
                    const aBookmarked = isBookmarked(a.id);
                    const bBookmarked = isBookmarked(b.id);
                    if (aBookmarked === bBookmarked) return 0;
                    return aBookmarked ? -1 : 1;
                });
            }
            if (activeFilter === "My Bets" && ownerAddress) {
                nextChunk = nextChunk.filter((challenge) => {
                    const creatorWallet = challenge.creator?.wallet_address?.toLowerCase();
                    const opponentWallet = challenge.opponent_info?.wallet_address?.toLowerCase();
                    const currentUser = ownerAddress.toLowerCase();
                    return creatorWallet === currentUser || opponentWallet === currentUser;
                });
            }
            setChallenges((prev) => (append ? [...prev, ...nextChunk] : nextChunk));
            setHasMore(!isPinnedFilter && nextChunk.length === PAGE_SIZE);
            setOffset(isPinnedFilter ? nextChunk.length : currentOffset + nextChunk.length);
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
                isLoadingRef.current = false;
            } else {
                setIsLoadingMore(false);
                isLoadingMoreRef.current = false;
            }
        }
    }, [PAGE_SIZE, activeAsset, activeFilter, isBookmarked, onChallengesLoaded, ownerAddress, searchQuery]);

    useEffect(() => {
        requestIdRef.current += 1;
        isLoadingRef.current = false;
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
        setChallenges([]);
        setOffset(0);
        setHasMore(true);
        fetchChallenges(0, false);
    }, [fetchChallenges, refreshKey, retryNonce, activeAsset, activeFilter, searchQuery]);

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
    }, [fetchChallenges, hasMore, isLoading, isLoadingMore, offset]);

    useEffect(() => {
        if (!isLoading) return;
        const timer = window.setInterval(() => {
            setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 1400);
        return () => window.clearInterval(timer);
    }, [isLoading]);

    useEffect(() => {
        onChallengesLoaded?.(challenges);
    }, [challenges, onChallengesLoaded]);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
                {/* <div className="rounded-2xl border border-white/50 bg-white/60 px-6 py-6 mb-6">
                    <p className="text-sm text-gray-500">Loading challenges</p>
                    <p className="text-base font-medium text-gray-900 mt-1">{LOADING_MESSAGES[loadingMessageIndex]}</p>
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-gray-700/70" />
                    </div>
                </div> */}
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
                        isBookmarked={isBookmarked(challenge.id)}
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
