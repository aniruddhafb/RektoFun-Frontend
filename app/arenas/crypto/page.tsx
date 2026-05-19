"use client";
import Link from "next/link";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    Search,
    ArrowRight,
    Bookmark,
} from "lucide-react";
import { getMarkets, type Market as ApiMarket } from "@/app/lib/markets-service/market";
import {
    getChallenges,
    type ChallengeListItem,
} from "@/app/lib/challenges-service/challenges";
import ChallengeDetailModal from "@/app/components/challenge-components/ChallengeDetailModal";
import AutoDismissErrorToast from "@/app/components/message-components/AutoDismissErrorToast";

interface MarketCardData {
    id: string;
    name: string;
    icon: string;
    available: number;
    challenges: ChallengeListItem[];
    totalTraders: number;
    totalVolume: string;
}

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
}

function mapMarketToCardData(
    market: ApiMarket,
    challenges: ChallengeListItem[]
): MarketCardData {
    const sortedChallenges = [...challenges].sort((a, b) => {
        const bTime = parseDateValue(b.created_at) ?? 0;
        const aTime = parseDateValue(a.created_at) ?? 0;
        return bTime - aTime;
    });
    const latestChallenges = sortedChallenges.slice(0, 4);

    const totalTraders = latestChallenges.reduce((sum, challenge) => {
        return sum + challenge.total_challengers + challenge.total_opponents;
    }, 0);

    return {
        id: market.id,
        name: market.name,
        icon: market.icon || market.image || "/scribbles/coins.png",
        available: latestChallenges.length,
        challenges: latestChallenges,
        totalTraders,
        totalVolume: formatCurrency(market.total_volume ?? 0),
    };
}

function parseDateValue(value: string | number | null | undefined): number | null {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    if (!value) return null;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
}

function formatEndsByCountdown(timestamp: number | null, nowMs: number): string {
    if (!timestamp) return "unknown";
    const diffMs = timestamp - nowMs;
    if (diffMs <= 0) return "ended";

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function getChallengeCtaConfig(challenge: ChallengeListItem, nowMs: number) {
    const expiryTimestamp = parseDateValue(challenge.expire_time);
    const isAccepted = challenge.status === "locked" || challenge.status === "resolved";
    const hasChallengeExpired = Boolean(
        expiryTimestamp && expiryTimestamp <= nowMs && !isAccepted
    );
    const isPoolMode = challenge.mode === "pool";
    const isPvpMode = !isPoolMode;

    if (hasChallengeExpired) {
        return {
            label: "EXPIRED",
            disabled: true,
            className:
                "cursor-not-allowed px-3 py-1.5 bg-red-100 border border-red-300 text-red-700 text-xs font-bold rounded-lg whitespace-nowrap",
        };
    }

    if (isPvpMode && isAccepted) {
        return {
            label: "ONGOING",
            disabled: true,
            className:
                "cursor-not-allowed px-3 py-1.5 bg-[#0c9d63] border border-gray-500 text-white text-xs font-bold rounded-lg whitespace-nowrap",
        };
    }

    if (isPoolMode) {
        return {
            label: "JOIN",
            disabled: false,
            className:
                "cursor-pointer px-3 py-1.5 bg-[#246044] hover:bg-[#2b7351] border border-gray-500 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap",
        };
    }

    return {
        label: "ACCEPT",
        disabled: false,
        className:
            "cursor-pointer px-3 py-1.5 bg-[#0c9d63] hover:bg-[#0a7d4f] border border-gray-500 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap",
    };
}

export default function MarketsPage() {
    const [bookmarkedMarkets, setBookmarkedMarkets] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [markets, setMarkets] = useState<MarketCardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDevnetErrorToast, setShowDevnetErrorToast] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => Date.now());
    const [selectedChallenge, setSelectedChallenge] = useState<ChallengeListItem | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const handleCreateClick = () => {
        setShowDevnetErrorToast(true);
    };

    const toggleBookmark = (marketId: string) => {
        setBookmarkedMarkets((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(marketId)) {
                newSet.delete(marketId);
            } else {
                newSet.add(marketId);
            }
            return newSet;
        });
    };

    useEffect(() => {
        const interval = window.setInterval(() => {
            setCurrentTime(Date.now());
        }, 60000);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function loadMarkets() {
            try {
                setIsLoading(true);
                setError(null);

                const [marketsResponse, challengesResponse] = await Promise.all([
                    getMarkets({ parent_name: "Crypto" }),
                    getChallenges({
                        status: "open",
                        limit: 100,
                    }),
                ]);

                const challengesByCategory = new Map<string, ChallengeListItem[]>();
                for (const challenge of challengesResponse.challenges) {
                    const key = (challenge.market?.name || "").toLowerCase();
                    if (!key) continue;
                    const list = challengesByCategory.get(key);
                    if (list) {
                        list.push(challenge);
                    } else {
                        challengesByCategory.set(key, [challenge]);
                    }
                }

                const marketCards = marketsResponse.markets.map((market) =>
                    mapMarketToCardData(
                        market,
                        challengesByCategory.get(market.name.toLowerCase()) ?? []
                    )
                );

                if (isMounted) {
                    setMarkets(marketCards);
                }
            } catch (fetchError) {
                if (isMounted) {
                    setError(
                        fetchError instanceof Error
                            ? fetchError.message
                            : "Something went wrong while loading markets."
                    );
                    setMarkets([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadMarkets();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredMarkets = markets.filter((market) => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        if (!normalizedSearch) {
            return true;
        }

        return (
            market.name.toLowerCase().includes(normalizedSearch) ||
            market.challenges.some((challenge) =>
                challenge.title.toLowerCase().includes(normalizedSearch)
            )
        );
    });

    const handleChallengeClick = (challenge: ChallengeListItem) => {
        setSelectedChallenge(challenge);
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
        setTimeout(() => setSelectedChallenge(null), 300);
    };

    return (
        <div className="min-h-screen bg-[#f3e1d7]">
            <AutoDismissErrorToast
                isOpen={showDevnetErrorToast}
                onClose={() => setShowDevnetErrorToast(false)}
                title="Creating markets is disabled on devnet"
                theme="yellow"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                            Challenge Markets
                        </h1>
                        <p className="text-gray-600 text-base sm:text-lg">
                            Predict trends and earn big on top challenge markets
                        </p>
                    </div>
                    <div className="relative">
                        <button
                            onClick={handleCreateClick}
                            className="inline-flex items-center justify-center px-6 py-3 bg-white/50 border border-gray-400 text-black text-sm font-medium rounded-full cursor-not-allowed"

                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Market
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search"
                                className="pl-10 pr-4 py-2.5 bg-white/50 rounded-full border border-gray-400 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 w-full sm:w-48 lg:w-88"
                            />
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div>
                        {/* <div className="rounded-2xl border border-white/50 bg-white/60 px-6 py-5 mb-6">
                            <p className="text-sm text-gray-500">Loading challenge markets</p>
                            <p className="text-base font-medium text-gray-900 mt-1">{LOADING_MESSAGES[loadingMessageIndex]}</p>
                            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                                <div className="h-full w-1/2 animate-pulse rounded-full bg-gray-700/70" />
                            </div>
                        </div> */}

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-8">
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white/40 rounded-2xl p-4 sm:p-5 border border-gray-400 animate-pulse"
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-white/70" />
                                        <div className="flex-1">
                                            <div className="h-5 w-2/3 rounded bg-white/70" />
                                            <div className="mt-2 h-4 w-1/3 rounded bg-white/60" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-10 rounded-lg bg-white/70" />
                                        <div className="h-10 rounded-lg bg-white/70" />
                                        <div className="h-10 rounded-lg bg-white/70" />
                                    </div>
                                    <div className="mt-5 h-10 rounded-xl bg-white/80" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div className="rounded-2xl bg-white/40 border border-white/50 p-8 text-center text-red-700">
                        {error}
                    </div>
                ) : filteredMarkets.length === 0 ? (
                    <div className="rounded-2xl bg-white/40 border border-white/50 p-8 text-center text-gray-700">
                        No markets found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-8">
                        {filteredMarkets.map((market) => (
                            <div
                                key={market.id}
                                className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-500 hover:shadow-lg transition-shadow duration-300 flex flex-col"
                            >
                                <div className="flex items-start gap-3 mb-3 sm:mb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white/50 flex-shrink-0">
                                        <Image
                                            src={market.icon}
                                            alt={market.name}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight mb-1">
                                            {market.name} Challenges
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => toggleBookmark(market.id)}
                                        className="p-2 rounded-full hover:bg-white/50 transition-colors flex-shrink-0"
                                        aria-label={
                                            bookmarkedMarkets.has(market.id)
                                                ? "Remove bookmark"
                                                : "Add bookmark"
                                        }
                                    >
                                        <Bookmark
                                            className={`w-5 h-5 transition-colors ${bookmarkedMarkets.has(market.id)
                                                ? "fill-[#5a7c6c] text-[#5a7c6c]"
                                                : "text-gray-400 hover:text-gray-600"
                                                }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex-1 mb-4">
                                    <div className="max-h-32 overflow-y-auto scrollbar-hide mb-4">
                                        <style jsx>{`
                                            .scrollbar-hide::-webkit-scrollbar {
                                                display: none;
                                            }
                                            .scrollbar-hide {
                                                -ms-overflow-style: none;
                                                scrollbar-width: none;
                                            }
                                        `}</style>
                                        <div className="pace-y-2 border border-gray-300 rounded-lg">
                                            {market.challenges.length > 0 ? (
                                                market.challenges.map((challenge) => {
                                                    const cta = getChallengeCtaConfig(challenge, currentTime);
                                                    return (
                                                        <div
                                                            key={challenge.id}
                                                            onClick={() => handleChallengeClick(challenge)}
                                                            className="flex items-center border-b border-gray-300 justify-between p-2.5 bg-white/30 hover:bg-white/60 cursor-pointer"
                                                        >
                                                            <span className="text-sm text-gray-800 font-medium truncate pr-2">
                                                                {challenge.title} In {formatEndsByCountdown(parseDateValue(challenge.resolve_time), currentTime)}
                                                            </span>
                                                            <button
                                                                disabled={cta.disabled}
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    if (cta.disabled) return;
                                                                    handleChallengeClick(challenge);
                                                                }}
                                                                className={cta.className}
                                                            >
                                                                {cta.label}
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-2.5 bg-white/30 border border-gray-200 rounded-lg text-sm text-gray-800">
                                                    No challenges available!!
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-gray-600 border-t border-white/30 pt-3">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900">
                                                {market.available}
                                            </span>
                                            <span>Challenges</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="font-semibold text-gray-900">
                                                {formatCompactNumber(market.totalTraders)}
                                            </span>
                                            <span>Traders</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="font-semibold text-gray-900">
                                                {market.totalVolume}
                                            </span>
                                            <span>24H Volume</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="font-semibold text-gray-900">
                                                {market.totalVolume}
                                            </span>
                                            <span>7D Volume</span>
                                        </div>
                                    </div>
                                </div>

                                <Link href={`/arenas/crypto/${market.name}`}>
                                    <button className="cursor-pointer w-full py-2.5 sm:py-3 bg-[#0d9b62] hover:bg-[#11a76b] border border-gray-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 group text-sm sm:text-base">
                                        View Challenges
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}

                {/* pagination  */}
                {/* <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1">
                        {[1, 2, 3].map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                    ? "bg-[#d4c4b5] text-gray-800"
                                    : "text-gray-600 hover:bg-white/30"
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button className="w-10 h-10 rounded-lg text-gray-600 hover:bg-white/30 transition-colors flex items-center justify-center">
                            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                        </button>
                    </div>
                </div> */}

            </div>

            <ChallengeDetailModal
                challenge={selectedChallenge}
                isOpen={isDetailModalOpen}
                onClose={closeDetailModal}
            />
        </div>
    );
}
