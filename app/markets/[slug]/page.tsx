"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ChevronDown, ChevronRight, Crown, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CreateChallengeModal } from "../../components/challenge-components/CreateChallengeModal";
import { ChallengeCard } from "../../components/challenge-components/ChallengeCard";
import { Challenge, DUMMY_CHALLENGES } from "../../components/challenge-components/challengesData";
function TradingViewChart() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear any existing content
        containerRef.current.innerHTML = '';

        // Create the TradingView widget script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            "autosize": true,
            "symbol": "BITSTAMP:BTCUSD",
            "interval": "15",
            "timezone": "exchange",
            "theme": "light",
            "style": "1",
            "locale": "en",
            "enable_publishing": false,
            "backgroundColor": "rgba(255, 255, 255, 0)",
            "gridColor": "rgba(0, 0, 0, 0.05)",
            "withdateranges": true,
            "hide_side_toolbar": false,
            "allow_symbol_change": false,
            "save_image": false,
            "calendar": false,
            "hide_volume": false,
            "support_host": "https://www.tradingview.com"
        });

        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, []);

    return (
        <div
            className="tradingview-widget-container"
            style={{ height: '400px', width: '100%' }}
        >
            <div
                ref={containerRef}
                className="tradingview-widget-container__widget"
                style={{ height: '100%', width: '100%' }}
            />
        </div>
    );
}

// Sparkle icon component
const SparkleIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 0L7 5L12 6L7 7L6 12L5 7L0 6L5 5L6 0Z" fill="currentColor" />
    </svg>
);

// Arrow up icon
const ArrowUpIcon = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-emerald-600">
        <path d="M5 2L8 6H2L5 2Z" fill="currentColor" />
    </svg>
);

// Star badge for rank 1
const StarBadge = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L9.5 5.5L14 6L10.5 9L11.5 13.5L8 11L4.5 13.5L5.5 9L2 6L6.5 5.5L8 1Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
    </svg>
);

// Diamond icon for other ranks
const DiamondIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 2L10 6L6 10L2 6L6 2Z" fill="#9ca3af" />
    </svg>
);

// Chevron icon for sorting
const ChevronIcon = ({ direction }: { direction: "up" | "down" }) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400">
        {direction === "up" ? (
            <path d="M6 4L3 7H9L6 4Z" fill="currentColor" />
        ) : (
            <path d="M6 8L9 5H3L6 8Z" fill="currentColor" />
        )}
    </svg>
);

// Uses DUMMY_CHALLENGES from challengesData

// Top 10 traders data (from leaderboard)
const topTradersData = [
    {
        rank: 1,
        username: "DegenLord",
        avatar: "/scribbles/pepe.png",
        flag: "🇨🇦",
        badge: "C",
        wins: 178,
        winsChange: "+14",
        winsUp: true,
        rekts: 45,
        rektsChange: "-8",
        rektsUp: false,
        challenges: 325,
        winRate: "79%",
        earnings: "128.4 SOL",
        isTop: true,
    },
    {
        rank: 2,
        username: "TraderX",
        avatar: "/scribbles/btc.png",
        flag: "🇺🇸",
        badge: null,
        wins: 160,
        winsChange: null,
        winsUp: null,
        rekts: 68,
        rektsChange: "-7",
        rektsUp: false,
        challenges: 302,
        winRate: "81%",
        earnings: "116.2 SOL",
        isTop: false,
    },
    {
        rank: 3,
        username: "CryptoNinja",
        avatar: "/scribbles/shiba.png",
        flag: "🇰🇷",
        badge: null,
        wins: 150,
        winsChange: null,
        winsUp: null,
        rekts: 79,
        rektsChange: "-6",
        rektsUp: false,
        challenges: 315,
        winRate: "82%",
        earnings: "105.6 SOL",
        isTop: false,
    },
    {
        rank: 4,
        username: "MoonMaster",
        avatar: "/scribbles/doge.png",
        flag: "🇬🇧",
        badge: null,
        wins: 143,
        winsChange: "+16",
        winsUp: true,
        rekts: 67,
        rektsChange: null,
        rektsUp: null,
        challenges: 275,
        winRate: "76%",
        earnings: "94.3 SOL",
        isTop: false,
    },
    {
        rank: 5,
        username: "DiamondHands",
        avatar: "/scribbles/sol.png",
        flag: "🇪🇺",
        badge: null,
        wins: 131,
        winsChange: null,
        winsUp: null,
        rekts: 59,
        rektsChange: "-5",
        rektsUp: false,
        challenges: 265,
        winRate: "77%",
        earnings: "83.1 SOL",
        isTop: false,
    },
    {
        rank: 6,
        username: "Marinade",
        avatar: "/scribbles/coins.png",
        flag: "🇺🇸",
        badge: null,
        wins: 127,
        winsChange: null,
        winsUp: null,
        rekts: 70,
        rektsChange: "-9",
        rektsUp: false,
        challenges: 262,
        winRate: "75%",
        earnings: "72.5 SOL",
        isTop: false,
    },
    {
        rank: 7,
        username: "SolanaWhale",
        avatar: "/scribbles/sol.png",
        flag: "🇰🇷",
        badge: null,
        wins: 118,
        winsChange: "+12",
        winsUp: true,
        rekts: 52,
        rektsChange: "-4",
        rektsUp: false,
        challenges: 245,
        winRate: "74%",
        earnings: "68.3 SOL",
        isTop: false,
    },
    {
        rank: 8,
        username: "CryptoKing",
        avatar: "/scribbles/btc.png",
        flag: "🇬🇧",
        badge: null,
        wins: 112,
        winsChange: null,
        winsUp: null,
        rekts: 61,
        rektsChange: "-6",
        rektsUp: false,
        challenges: 238,
        winRate: "73%",
        earnings: "61.7 SOL",
        isTop: false,
    },
    {
        rank: 9,
        username: "PepeTrader",
        avatar: "/scribbles/pepe.png",
        flag: "🇨🇦",
        badge: null,
        wins: 105,
        winsChange: "+8",
        winsUp: true,
        rekts: 55,
        rektsChange: null,
        rektsUp: null,
        challenges: 220,
        winRate: "72%",
        earnings: "55.4 SOL",
        isTop: false,
    },
    {
        rank: 10,
        username: "DogeLover",
        avatar: "/scribbles/doge.png",
        flag: "🇪🇺",
        badge: null,
        wins: 98,
        winsChange: null,
        winsUp: null,
        rekts: 48,
        rektsChange: "-3",
        rektsUp: false,
        challenges: 205,
        winRate: "71%",
        earnings: "49.8 SOL",
        isTop: false,
    },
];


export default function MarketPage({ params }: { params: { slug: string } }) {
    const [showChart, setShowChart] = useState(true);
    const [showTopTraders, setShowTopTraders] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState("Latest");
    const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);

    const filterOptions = ["Latest", "Expired", "Expiring Soon", "Ongoing", "Completed"];

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                            <Image
                                src="/scribbles/btc.png"
                                alt="Bitcoin"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                                Bitcoin Challenge Markets
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600">
                                Predict and earn by betting on Bitcoin market movements
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreateChallengeOpen(true)}
                        className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-white/50 border border-gray-400 hover:bg-white/80 text-black text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Challenge
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">

                        {/* Chart Section */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="font-semibold text-gray-900 text-base sm:text-lg">BTC/USD Chart</span>
                                </div>
                                <button
                                    onClick={() => setShowChart(!showChart)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors"
                                >
                                    {showChart ? (
                                        <>
                                            <EyeOff className="w-4 h-4" />
                                            <span className="hidden sm:inline">Hide Chart</span>
                                            <span className="sm:hidden">Hide</span>
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-4 h-4" />
                                            <span className="hidden sm:inline">Show Chart</span>
                                            <span className="sm:hidden">Show</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* TradingView Chart */}
                            {showChart && <TradingViewChart />}
                        </div>

                        {/* Top Traders Section */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Top Traders in the Bitcoin Challenge Markets</h3>
                                <button
                                    onClick={() => setShowTopTraders(!showTopTraders)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors"
                                >
                                    {showTopTraders ? (
                                        <>
                                            <EyeOff className="w-4 h-4" />
                                            <span className="hidden sm:inline">Hide Traders</span>
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-4 h-4" />
                                            <span className="hidden sm:inline">Show Traders</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {showTopTraders && (
                                <div className="bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 overflow-hidden">
                                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                                        <div className="min-w-[700px] px-4 sm:px-0">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 border-b border-white/50 text-xs sm:text-sm font-medium text-gray-600">
                                                <div className="col-span-1">Rank</div>
                                                <div className="col-span-3">Trader</div>
                                                <div className="col-span-2 flex items-center gap-1">
                                                    Wins
                                                    <ChevronIcon direction="up" />
                                                </div>
                                                <div className="col-span-1 flex items-center gap-1">
                                                    Rekts
                                                    <ChevronIcon direction="down" />
                                                </div>
                                                <div className="col-span-2 hidden sm:flex items-center gap-1">
                                                    Challenges
                                                    <ChevronIcon direction="up" />
                                                </div>
                                                <div className="col-span-1 flex items-center gap-1">
                                                    Win Rate
                                                </div>
                                                <div className="col-span-2 flex items-center gap-1 justify-end">
                                                    Earnings
                                                </div>
                                            </div>

                                            {/* Table Body */}
                                            <div className="divide-y divide-white/30">
                                                {topTradersData.map((user) => (
                                                    <div
                                                        key={user.rank}
                                                        className="grid grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 items-center hover:bg-white/30 transition-colors"
                                                    >
                                                        {/* Rank */}
                                                        <div className="col-span-1 flex items-center gap-1 sm:gap-2">
                                                            <span className="text-sm sm:text-base font-semibold text-gray-700 w-3 sm:w-4">
                                                                {user.rank}
                                                            </span>
                                                            {user.rank === 1 ? (
                                                                <StarBadge />
                                                            ) : (
                                                                <DiamondIcon />
                                                            )}
                                                        </div>

                                                        {/* Trader */}
                                                        <div className="col-span-3 flex items-center gap-2 sm:gap-3">
                                                            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex-shrink-0">
                                                                <Image
                                                                    src={user.avatar}
                                                                    alt={user.username}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-1 min-w-0">
                                                                <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                                                                    {user.username}
                                                                </span>
                                                                <span className="text-sm sm:text-base flex-shrink-0">{user.flag}</span>
                                                                {user.badge && (
                                                                    <span className="hidden sm:inline px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded flex-shrink-0">
                                                                        {user.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Wins */}
                                                        <div className="col-span-2 flex items-center gap-1 sm:gap-2">
                                                            {user.winsUp !== null && (
                                                                <ArrowUpIcon />
                                                            )}
                                                            {user.winsUp === null && user.winsChange === null && (
                                                                <SparkleIcon className="text-amber-500" />
                                                            )}
                                                            <span className="font-semibold text-gray-900 text-xs sm:text-sm">{user.wins}</span>
                                                            {user.winsChange && (
                                                                <span
                                                                    className={`text-xs ${user.winsUp ? "text-emerald-600" : "text-gray-500"
                                                                        }`}
                                                                >
                                                                    {user.winsChange}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Rekts */}
                                                        <div className="col-span-1 flex items-center gap-1">
                                                            <span
                                                                className={`font-semibold text-xs sm:text-sm ${user.rektsChange ? "text-red-600" : "text-gray-900"
                                                                    }`}
                                                            >
                                                                {user.rekts}
                                                            </span>
                                                            {user.rektsChange && (
                                                                <span className="text-xs text-emerald-600">
                                                                    {user.rektsChange}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Challenges - Hidden on mobile */}
                                                        <div className="col-span-2 hidden sm:flex items-center gap-1">
                                                            <span className="text-gray-900 text-sm">{user.challenges}</span>
                                                        </div>

                                                        {/* Win Rate */}
                                                        <div className="col-span-1">
                                                            <span className="text-gray-900 text-xs sm:text-sm">{user.winRate}</span>
                                                        </div>

                                                        {/* Earnings */}
                                                        <div className="col-span-2 text-right">
                                                            <span className="font-semibold text-gray-900 text-xs sm:text-sm">{user.earnings}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Filter Bar */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                                {/* Search - Bigger */}
                                <div className="relative flex-1">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search challenges..."
                                        className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
                                    />
                                </div>

                                {/* Filter Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setFilterOpen(!filterOpen)}
                                        className="flex items-center justify-between gap-3 px-5 py-3.5 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-all min-w-[180px]"
                                    >
                                        <span className="font-medium text-gray-700">{selectedFilter}</span>
                                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {filterOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setFilterOpen(false)}
                                            />
                                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                                                {filterOptions.map((option) => (
                                                    <button
                                                        key={option}
                                                        onClick={() => {
                                                            setSelectedFilter(option);
                                                            setFilterOpen(false);
                                                        }}
                                                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedFilter === option
                                                            ? "bg-amber-50 text-amber-700"
                                                            : "text-gray-700"
                                                            }`}
                                                    >
                                                        <span className="font-medium">{option}</span>
                                                        {selectedFilter === option && (
                                                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Challenge Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {DUMMY_CHALLENGES.map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <CreateChallengeModal
                isOpen={isCreateChallengeOpen}
                onClose={() => setIsCreateChallengeOpen(false)}
                onCreated={() => { }}
            />
        </div>
    );
}
