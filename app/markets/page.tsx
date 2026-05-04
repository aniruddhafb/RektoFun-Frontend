"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
    Search,
    ChevronDown,
    ArrowRight,
    TrendingUp,
    Clock,
    DollarSign,
    Eye,
    Bookmark,
} from "lucide-react";
import { getMarkets, type Market as ApiMarket } from "@/app/lib/markets-service/market";
import {
    getChallenges,
    type ChallengeListItem,
} from "@/app/lib/challenges-service/challenges";

interface MarketCardData {
    id: string;
    name: string;
    icon: string;
    available: number;
    challenges: {
        id: string;
        title: string;
    }[];
    totalTraders: number;
    totalVolume: string;
}

type SortOption = "Recently Added" | "Trending" | "Price Markets" | "My Watchlists";

const sortOptions: { label: SortOption; icon: ReactNode }[] = [
    { label: "Recently Added", icon: <Clock className="w-4 h-4" /> },
    { label: "Trending", icon: <TrendingUp className="w-4 h-4" /> },
    { label: "Price Markets", icon: <DollarSign className="w-4 h-4" /> },
    { label: "My Watchlists", icon: <Eye className="w-4 h-4" /> },
];

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
    const totalTraders = challenges.reduce((sum, challenge) => {
        return sum + challenge.total_challengers + challenge.total_opponents;
    }, 0);

    return {
        id: market.id,
        name: market.name,
        icon: market.icon || market.image || "/scribbles/coins.png",
        available: challenges.length,
        challenges: challenges.map((challenge) => ({
            id: challenge.id,
            title: challenge.title,
        })),
        totalTraders,
        totalVolume: formatCurrency(market.total_volume ?? 0),
    };
}

export default function MarketsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>("Recently Added");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [bookmarkedMarkets, setBookmarkedMarkets] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [parentId, setParentId] = useState<string | null>(null);
    const [markets, setMarkets] = useState<MarketCardData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        setParentId(params.get("id"));
    }, []);

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
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function loadMarkets() {
            if (!parentId) {
                if (isMounted) {
                    setMarkets([]);
                    setError("Missing market id in the URL.");
                    setIsLoading(false);
                }
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const marketsResponse = await getMarkets({ parent_id: parentId });
                const marketCards = await Promise.all(
                    marketsResponse.markets.map(async (market) => {
                        const challengesResponse = await getChallenges({ category: market.id });
                        console.log({challengesResponse});
                        return mapMarketToCardData(market, challengesResponse.challenges);
                    })
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
    }, [parentId]);

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

    return (
        <div className="min-h-screen bg-[#f3e1d7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                            Markets Challenges
                        </h1>
                        <p className="text-gray-600 text-base sm:text-lg">
                            Predict trends and earn big on top challenge markets
                        </p>
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
                                className="pl-10 pr-4 py-2.5 bg-white/50 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 w-full sm:w-48 lg:w-88"
                            />
                        </div>

                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="cursor-pointer flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white/50 rounded-full text-sm text-gray-700 hover:bg-white/70 transition-colors whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">{sortBy}</span>
                                <span className="sm:hidden">
                                    {sortOptions.find((option) => option.label === sortBy)?.icon}
                                </span>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${
                                        isDropdownOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10">
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.label}
                                            onClick={() => {
                                                setSortBy(option.label);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                                                sortBy === option.label
                                                    ? "text-black font-semibold"
                                                    : "text-gray-700 hover:bg-gray-50"
                                            }`}
                                        >
                                            {option.icon}
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="rounded-2xl bg-white/40 border border-white/50 p-8 text-center text-gray-700">
                        Loading markets...
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
                                className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/50 hover:shadow-lg transition-shadow duration-300 flex flex-col"
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
                                            {market.name}
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
                                            className={`w-5 h-5 transition-colors ${
                                                bookmarkedMarkets.has(market.id)
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
                                        <div className="pace-y-2">
                                            {market.challenges.length > 0 ? (
                                                market.challenges.map((challenge) => (
                                                    <div
                                                        key={challenge.id}
                                                        className="flex items-center justify-between p-2.5 bg-white/30 rounded-lg"
                                                    >
                                                        <span className="text-sm text-gray-800 font-medium truncate pr-2">
                                                            {challenge.title}
                                                        </span>
                                                        <button className="px-3 py-1.5 bg-[#246044] hover:bg-[#2b7351] text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap">
                                                            Accept
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-2.5 bg-white/30 rounded-lg text-sm text-gray-600">
                                                    No challenges available.
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

                                <button className="w-full py-2.5 sm:py-3 bg-[#2b7351] hover:bg-[#246044] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 group text-sm sm:text-base">
                                    View Challenges
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1">
                        {[1, 2, 3].map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                    currentPage === page
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
                </div>
            </div>
        </div>
    );
}
