"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, ChevronDown, ChevronRight, Crown, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// TradingView Chart Component
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

// Challenge data - using challenges page format
const challenges = [
    {
        id: "1",
        asset: "SOL",
        assetLogo: "/scribbles/sol.png",
        title: "SOL Above $160 in 1 Hour?",
        creator: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        betAmount: 100,
        prediction: "SOL > $160",
        currentPrice: 157.4,
        priceChange: -1.8,
        targetPrice: 160,
        startPrice: 168,
        timeRemaining: "59m 12s",
        likes: 5,
        status: "active" as const,
    },
    {
        id: "2",
        asset: "BTC",
        assetLogo: "/scribbles/btc.png",
        title: "BTC Above $95K in 2 Hours?",
        creator: { name: "CryptoKing", avatar: "/scribbles/doge.png" },
        betAmount: 250,
        prediction: "BTC > $95,000",
        currentPrice: 94300,
        priceChange: 2.3,
        targetPrice: 95000,
        startPrice: 92000,
        timeRemaining: "1h 45m",
        likes: 12,
        status: "active" as const,
    },
    {
        id: "3",
        asset: "ETH",
        assetLogo: "/scribbles/coins.png",
        title: "ETH Below $3,200 in 30 mins?",
        creator: { name: "BearWhale", avatar: "/scribbles/shiba.png" },
        betAmount: 500,
        prediction: "ETH < $3,200",
        currentPrice: 3250,
        priceChange: -0.5,
        targetPrice: 3200,
        startPrice: 3300,
        timeRemaining: "28m 45s",
        likes: 8,
        status: "active" as const,
    },
];

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

    const filterOptions = ["Latest", "Expired", "Expiring Soon", "Ongoing", "Completed"];

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-start gap-4 mb-6 sm:mb-8">
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
                            {challenges.map((challenge) => {
                                // Calculate price position for the progress bar (0-100%)
                                // Center (50%) is the target price
                                const isAbovePrediction = challenge.prediction.includes(">");
                                const priceRange = Math.abs(challenge.targetPrice - challenge.startPrice);
                                const currentDiff = challenge.currentPrice - challenge.startPrice;
                                const targetDiff = challenge.targetPrice - challenge.startPrice;

                                // Calculate progress: 50% is target, <50% is below, >50% is above
                                let priceProgress = 50;
                                if (priceRange > 0) {
                                    const normalizedProgress = (challenge.currentPrice - challenge.startPrice) / targetDiff;
                                    priceProgress = 50 + (normalizedProgress * 50);
                                }
                                const clampedProgress = Math.min(Math.max(priceProgress, 0), 100);

                                return (
                                    <Link
                                        key={challenge.id}
                                        href={`/challenges/${challenge.id}`}
                                        className="bg-[#f8ede7] rounded-2xl p-4 shadow-sm border border-white/50 hover:shadow-lg transition-shadow block"
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
                                                    <Image
                                                        src={challenge.assetLogo}
                                                        alt={challenge.asset}
                                                        width={32}
                                                        height={32}
                                                        className="w-8 h-8 object-contain"
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-base leading-tight">
                                                        {challenge.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <div className="w-4 h-4 rounded-full bg-gray-200 overflow-hidden">
                                                            <Image
                                                                src={challenge.creator.avatar}
                                                                alt={challenge.creator.name}
                                                                width={16}
                                                                height={16}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <span className="text-sm text-gray-600">{challenge.creator.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Watchlist Icon */}
                                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-gray-200 my-3"></div>

                                        {/* Bet Info */}
                                        <div className="text-center mb-3">
                                            <p className="text-xl font-bold text-gray-900">
                                                <span className="text-emerald-600">${challenge.betAmount}</span>{" "}
                                                <span className="text-gray-700">Bet on {challenge.prediction}</span>
                                            </p>
                                        </div>

                                        {/* Price Progress Bar */}
                                        <div className="mb-5">
                                            {/* Price labels */}
                                            <div className="flex justify-between text-sm text-gray-500 mb-2">
                                                <span>${challenge.startPrice.toLocaleString()}</span>
                                                <span className="font-semibold text-gray-700">${challenge.targetPrice.toLocaleString()}</span>
                                                <span>${challenge.startPrice.toLocaleString()}</span>
                                            </div>

                                            {/* Progress bar container */}
                                            <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                                                {/* Left side - Red (below target) */}
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-red-400"
                                                    style={{ width: '50%' }}
                                                />
                                                {/* Right side - Green (above target) */}
                                                <div
                                                    className="absolute inset-y-0 right-0 bg-gradient-to-r from-emerald-400 to-emerald-500"
                                                    style={{ width: '50%' }}
                                                />

                                                {/* Center marker for target price */}
                                                <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/50" />

                                                {/* Current price indicator */}
                                                <div
                                                    className="absolute top-0 bottom-0 flex items-center justify-center"
                                                    style={{ left: `${clampedProgress}%`, transform: 'translateX(-50%)' }}
                                                >
                                                    <div className="w-4 h-4 bg-white border-2 border-amber-600 rounded-full shadow-lg z-10" />
                                                </div>
                                            </div>

                                            {/* Moving price tag */}
                                            <div className="relative mt-2 h-7">
                                                <div
                                                    className="absolute -translate-x-1/2 bg-gradient-to-r from-amber-800 to-amber-700 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-md whitespace-nowrap"
                                                    style={{ left: `${clampedProgress}%` }}
                                                >
                                                    ${challenge.currentPrice.toLocaleString()}{" "}
                                                    <span className={challenge.priceChange >= 0 ? "text-emerald-200" : "text-red-200"}>
                                                        {challenge.priceChange >= 0 ? "+" : ""}{challenge.priceChange}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CTA Button */}
                                        <button className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 rounded-xl text-gray-900 font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all border-2 border-amber-400/50 flex items-center justify-center gap-2">
                                            REKT HIM
                                            <span className="text-xl">😈</span>
                                        </button>

                                        {/* Challenge Expiry */}
                                        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 mt-1.5">
                                            <span>Challenge expires in</span>
                                            <span className="font-medium text-gray-900">{challenge.timeRemaining}</span>
                                            <div className="group relative">
                                                <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                                    This challenge will expire in {challenge.timeRemaining}, you won't be able to join after that.
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-gray-200 my-2"></div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm">Created <span className="font-semibold text-gray-900">2h ago</span></span>
                                                <div className="group relative">
                                                    <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                                        This challenge was created 2 hours ago and will end on September 30, 2024 at 3:00 PM UTC if accepted.
                                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                    </svg>
                                                </button>
                                                {/* Eye Icon */}
                                                <div className="flex items-center gap-1">
                                                    <span className="font-semibold text-gray-900">{challenge.likes}</span>
                                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
