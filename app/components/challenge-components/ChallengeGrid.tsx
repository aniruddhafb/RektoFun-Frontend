'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
    activeFilter: string;
    activeAsset: string;
    searchQuery: string;
}

export function ChallengeGrid({
    onRekt,
    onClick,
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

    let ownerAddress = publicKey?.toString() || '';

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
            const response = await getChallenges(
                {
                    limit: PAGE_SIZE,
                    offset: currentOffset,
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
            if (activeFilter === "My Bets" && ownerAddress) {
                nextChunk = nextChunk.filter((challenge) => {
                    const creatorWallet = challenge.creator?.wallet_address?.toLowerCase();
                    const opponentWallet = challenge.opponent_info?.wallet_address?.toLowerCase();
                    const currentUser = ownerAddress.toLowerCase();
                    return creatorWallet === currentUser || opponentWallet === currentUser;
                });
            }
            setChallenges((prev) => (append ? [...prev, ...nextChunk] : nextChunk));
            setHasMore(nextChunk.length === PAGE_SIZE);
            setOffset(currentOffset + nextChunk.length);
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
    }, [PAGE_SIZE, activeAsset, activeFilter, onChallengesLoaded, ownerAddress, searchQuery]);

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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-[300px] rounded-2xl border border-white/60 bg-white/50 p-5 animate-pulse"
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
            {hasMore && (
                <div ref={loadMoreRef} className="flex justify-center py-8">
                    {isLoadingMore ? (
                        <span className="text-sm text-gray-600">Loading more challenges and warming local cache...</span>
                    ) : (
                        <span className="text-sm text-gray-400">Scroll to load more</span>
                    )}
                </div>
            )}
        </div>
    );
}
