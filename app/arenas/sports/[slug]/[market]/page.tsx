"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { CreateChallengeModal } from "../../../../components/challenge-components/CreateChallengeModal";
import { MarketHeader } from "../../../../components/market-slug-components/MarketHeader";
import { ChartSection } from "../../../../components/market-slug-components/ChartSection";
import { FilterBar } from "../../../../components/market-slug-components/FilterBar";
import { LoadingPage } from "../../../../components/LoadingPage";
import { MarketChallengesGrid } from "../../../../components/market-slug-components/MarketChallengesGrid";
import ChallengeDetailModal from "@/app/components/challenge-components/ChallengeDetailModal";
import {
    getChallenges,
    type ChallengeListItem,
} from "@/app/lib/challenges-service/challenges";
import {
    getMarkets,
    type Market,
} from "@/app/lib/markets-service/market";

function formatMarketTitle(name: string) {
    return `${name}`;
}

function formatMarketDescription(name: string) {
    return `${name}`;
}

export default function SportsMarketDetailPage() {
    const CREATE_TOAST_DURATION_MS = 3000;
    const BOOKMARKS_STORAGE_KEY = "rektofun:challenge-bookmarks";
    const params = useParams<{ slug: string; market: string }>();
    const sportSlug = useMemo(() => decodeURIComponent(params.slug ?? ""), [params.slug]);
    const marketSlug = useMemo(
        () => decodeURIComponent(params.market ?? ""),
        [params.market]
    );

    const [showChart, setShowChart] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [modeOpen, setModeOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("Latest");
    const [selectedMode, setSelectedMode] = useState("All Modes");
    const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
    const [market, setMarket] = useState<Market | null>(null);
    const [challenges, setChallenges] = useState<ChallengeListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedChallenge, setSelectedChallenge] = useState<ChallengeListItem | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [showCreateSuccessToast, setShowCreateSuccessToast] = useState(false);
    const [createToastProgress, setCreateToastProgress] = useState(100);
    const [bookmarkedChallengeIds, setBookmarkedChallengeIds] = useState<string[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const rawBookmarks = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY);
            if (!rawBookmarks) return [];
            const parsed = JSON.parse(rawBookmarks);
            if (!Array.isArray(parsed)) return [];
            return parsed.filter((value): value is string => typeof value === "string");
        } catch (error) {
            console.error("Failed to read challenge bookmarks from localStorage:", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedChallengeIds));
        } catch (error) {
            console.error("Failed to persist challenge bookmarks to localStorage:", error);
        }
    }, [bookmarkedChallengeIds]);

    const toggleBookmark = useCallback((challengeId: string) => {
        setBookmarkedChallengeIds((prev) =>
            prev.includes(challengeId)
                ? prev.filter((id) => id !== challengeId)
                : [...prev, challengeId]
        );
    }, []);

    const isChallengeBookmarked = useCallback(
        (challengeId: string) => bookmarkedChallengeIds.includes(challengeId),
        [bookmarkedChallengeIds]
    );

    const loadMarketChallenges = async (isMountedCheck?: () => boolean) => {
        if (!sportSlug || !marketSlug) {
            if (!isMountedCheck || isMountedCheck()) {
                setMarket(null);
                setChallenges([]);
                setError("Market not found.");
                setIsLoading(false);
            }
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const [marketsResponse, challengesResponse] = await Promise.all([
                getMarkets({ parent_name: sportSlug.toUpperCase() }),
                getChallenges({ category: marketSlug }),
            ]);

            const matchedMarket =
                marketsResponse.markets.find(
                    (item) => item.name.toLowerCase() === marketSlug.toLowerCase()
                ) ?? null;

            if (!isMountedCheck || isMountedCheck()) {
                setMarket(matchedMarket);
                setChallenges(challengesResponse.challenges);
            }
        } catch (fetchError) {
            if (!isMountedCheck || isMountedCheck()) {
                setMarket(null);
                setChallenges([]);
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : "Something went wrong while loading challenges."
                );
            }
        } finally {
            if (!isMountedCheck || isMountedCheck()) {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        let isMounted = true;

        loadMarketChallenges(() => isMounted);

        return () => {
            isMounted = false;
        };
    }, [sportSlug, marketSlug]);

    useEffect(() => {
        if (!showCreateSuccessToast) return;
        const start = Date.now();
        const interval = window.setInterval(() => {
            const elapsed = Date.now() - start;
            const nextProgress = Math.max(0, 100 - (elapsed / CREATE_TOAST_DURATION_MS) * 100);
            setCreateToastProgress(nextProgress);
        }, 50);
        const timeout = window.setTimeout(() => {
            setShowCreateSuccessToast(false);
            setCreateToastProgress(100);
        }, CREATE_TOAST_DURATION_MS);

        return () => {
            window.clearInterval(interval);
            window.clearTimeout(timeout);
        };
    }, [showCreateSuccessToast]);

    const marketName = market?.name || marketSlug || "Market";
    const marketDescription = market?.description || formatMarketDescription(marketName);
    const marketLogo = market?.icon || market?.image || "/scribbles/coins.png";

    const filteredChallenges = useMemo(() => {
        let result = challenges;

        if (selectedStatus !== "Latest") {
            const statusMap: Record<string, string> = {
                Expired: "cancelled",
                "Expiring Soon": "locked",
                Ongoing: "open",
                Completed: "resolved",
            };
            const mappedStatus = statusMap[selectedStatus];
            if (mappedStatus) {
                result = result.filter((c) => c.status === mappedStatus);
            }
        }

        if (selectedMode !== "All Modes") {
            const modeValue = selectedMode === "PVP" ? "pvp" : "multi";
            result = result.filter((c) => c.mode?.toLowerCase() === modeValue);
        }

        return result;
    }, [challenges, selectedStatus, selectedMode]);

    const handleChallengeClick = (challenge: ChallengeListItem) => {
        setSelectedChallenge(challenge);
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        window.setTimeout(() => setSelectedChallenge(null), 300);
    };

    const handleChallengeCreated = async () => {
        setIsCreateChallengeOpen(false);
        setCreateToastProgress(100);
        setShowCreateSuccessToast(true);
        await loadMarketChallenges();
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            {showCreateSuccessToast && (
                <div className="fixed right-4 top-40 sm:top-40 z-[60] w-[min(92vw,24rem)] overflow-hidden rounded-xl border border-green-300 bg-green-600 text-white shadow-2xl">
                    <button
                        type="button"
                        onClick={() => setShowCreateSuccessToast(false)}
                        className="absolute right-3 top-2 text-lg leading-none text-green-100 transition hover:text-white"
                        aria-label="Close success notification"
                    >
                        ×
                    </button>
                    <div className="px-5 pb-4 pt-4 pr-10">
                        <p className="text-base font-semibold">Challenge created successfully</p>
                        <p className="mt-1 text-sm text-green-100">Your challenge is now live and visible to everyone.</p>
                    </div>
                    <div className="h-1.5 w-full bg-green-500/60">
                        <div
                            className="h-full bg-white/90 transition-[width] duration-75 ease-linear"
                            style={{ width: `${createToastProgress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                <MarketHeader
                    marketName={formatMarketTitle(marketName)}
                    marketDescription={marketDescription}
                    marketLogo={marketLogo}
                    onCreateChallenge={() => setIsCreateChallengeOpen(true)}
                />

                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    <div className="flex-1 min-w-0">

                        <FilterBar
                            selectedStatus={selectedStatus}
                            onStatusChange={setSelectedStatus}
                            selectedMode={selectedMode}
                            onModeChange={setSelectedMode}
                            statusOpen={statusOpen}
                            onStatusOpenChange={setStatusOpen}
                            modeOpen={modeOpen}
                            onModeOpenChange={setModeOpen}
                        />

                        {isLoading ? (
                            <LoadingPage variant="simple" message="Loading challenges..." />
                        ) : error ? (
                            <div className="mt-4 rounded-2xl bg-white/40 border border-white/50 p-8 text-center text-red-700">
                                {error}
                            </div>
                        ) : filteredChallenges.length === 0 ? (
                            <div className="mt-4 rounded-2xl bg-white/40 border border-white/50 p-8 text-center text-gray-700">
                                No Challenges Found.
                            </div>
                        ) : (
                            <MarketChallengesGrid
                                challenges={filteredChallenges}
                                onChallengeClick={handleChallengeClick}
                                onToggleBookmark={toggleBookmark}
                                isBookmarked={isChallengeBookmarked}
                            />
                        )}
                    </div>
                </div>
            </div>

            <CreateChallengeModal
                isOpen={isCreateChallengeOpen}
                onClose={() => setIsCreateChallengeOpen(false)}
                onCreated={handleChallengeCreated}
            />

            <ChallengeDetailModal
                challenge={selectedChallenge}
                isOpen={isDetailModalOpen}
                onClose={closeDetailModal}
            />
        </div>
    );
}
