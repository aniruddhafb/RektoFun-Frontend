"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Mock data for leaderboard
const topTraders = [
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
        earnings: "128.4",
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
        earnings: "116.2",
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
        earnings: "105.6",
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
        earnings: "94.3",
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
        earnings: "83.1",
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
        earnings: "72.5",
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
        earnings: "68.3",
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
        earnings: "61.7",
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
        earnings: "55.4",
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
        earnings: "49.8",
        isTop: false,
    },
    {
        rank: 11,
        username: "AlphaWolf",
        avatar: "/scribbles/shiba.png",
        flag: "🇺🇸",
        badge: null,
        wins: 92,
        winsChange: "+5",
        winsUp: true,
        rekts: 42,
        rektsChange: "-2",
        rektsUp: false,
        challenges: 195,
        winRate: "69%",
        earnings: "45.2",
        isTop: false,
    },
    {
        rank: 12,
        username: "BullRunner",
        avatar: "/scribbles/btc.png",
        flag: "🇨🇦",
        badge: null,
        wins: 88,
        winsChange: null,
        winsUp: null,
        rekts: 38,
        rektsChange: "-4",
        rektsUp: false,
        challenges: 188,
        winRate: "70%",
        earnings: "42.8",
        isTop: false,
    },
    {
        rank: 13,
        username: "CryptoQueen",
        avatar: "/scribbles/pepe.png",
        flag: "🇬🇧",
        badge: null,
        wins: 85,
        winsChange: "+7",
        winsUp: true,
        rekts: 35,
        rektsChange: null,
        rektsUp: null,
        challenges: 175,
        winRate: "71%",
        earnings: "40.5",
        isTop: false,
    },
    {
        rank: 14,
        username: "SolSurfer",
        avatar: "/scribbles/sol.png",
        flag: "🇰🇷",
        badge: null,
        wins: 82,
        winsChange: null,
        winsUp: null,
        rekts: 40,
        rektsChange: "-3",
        rektsUp: false,
        challenges: 168,
        winRate: "67%",
        earnings: "38.2",
        isTop: false,
    },
    {
        rank: 15,
        username: "MoonShot",
        avatar: "/scribbles/coins.png",
        flag: "🇪🇺",
        badge: null,
        wins: 78,
        winsChange: "+4",
        winsUp: true,
        rekts: 36,
        rektsChange: "-2",
        rektsUp: false,
        challenges: 162,
        winRate: "68%",
        earnings: "36.1",
        isTop: false,
    },
    {
        rank: 16,
        username: "DegenPrince",
        avatar: "/scribbles/doge.png",
        flag: "🇺🇸",
        badge: null,
        wins: 75,
        winsChange: null,
        winsUp: null,
        rekts: 33,
        rektsChange: "-5",
        rektsUp: false,
        challenges: 155,
        winRate: "69%",
        earnings: "34.5",
        isTop: false,
    },
    {
        rank: 17,
        username: "WhaleWatcher",
        avatar: "/scribbles/bags.png",
        flag: "🇨🇦",
        badge: null,
        wins: 72,
        winsChange: "+6",
        winsUp: true,
        rekts: 30,
        rektsChange: null,
        rektsUp: null,
        challenges: 148,
        winRate: "71%",
        earnings: "32.8",
        isTop: false,
    },
    {
        rank: 18,
        username: "TokenMaster",
        avatar: "/scribbles/stars.png",
        flag: "🇬🇧",
        badge: null,
        wins: 68,
        winsChange: null,
        winsUp: null,
        rekts: 28,
        rektsChange: "-3",
        rektsUp: false,
        challenges: 142,
        winRate: "71%",
        earnings: "30.4",
        isTop: false,
    },
    {
        rank: 19,
        username: "YieldFarmer",
        avatar: "/scribbles/dollars.png",
        flag: "🇰🇷",
        badge: null,
        wins: 65,
        winsChange: "+3",
        winsUp: true,
        rekts: 25,
        rektsChange: "-2",
        rektsUp: false,
        challenges: 135,
        winRate: "72%",
        earnings: "28.9",
        isTop: false,
    },
    {
        rank: 20,
        username: "BlockBuilder",
        avatar: "/scribbles/btc.png",
        flag: "🇪🇺",
        badge: null,
        wins: 62,
        winsChange: null,
        winsUp: null,
        rekts: 22,
        rektsChange: "-4",
        rektsUp: false,
        challenges: 128,
        winRate: "74%",
        earnings: "27.2",
        isTop: false,
    },
    {
        rank: 21,
        username: "StakeKing",
        avatar: "/scribbles/sol.png",
        flag: "🇺🇸",
        badge: null,
        wins: 58,
        winsChange: "+5",
        winsUp: true,
        rekts: 20,
        rektsChange: null,
        rektsUp: null,
        challenges: 122,
        winRate: "74%",
        earnings: "25.6",
        isTop: false,
    },
    {
        rank: 22,
        username: "ApeIn",
        avatar: "/scribbles/pepe.png",
        flag: "🇨🇦",
        badge: null,
        wins: 55,
        winsChange: null,
        winsUp: null,
        rekts: 18,
        rektsChange: "-3",
        rektsUp: false,
        challenges: 115,
        winRate: "75%",
        earnings: "24.1",
        isTop: false,
    },
    {
        rank: 23,
        username: "HodlGang",
        avatar: "/scribbles/shiba.png",
        flag: "🇬🇧",
        badge: null,
        wins: 52,
        winsChange: "+4",
        winsUp: true,
        rekts: 16,
        rektsChange: "-2",
        rektsUp: false,
        challenges: 108,
        winRate: "76%",
        earnings: "22.8",
        isTop: false,
    },
    {
        rank: 24,
        username: "PumpChaser",
        avatar: "/scribbles/coins.png",
        flag: "🇰🇷",
        badge: null,
        wins: 48,
        winsChange: null,
        winsUp: null,
        rekts: 15,
        rektsChange: "-1",
        rektsUp: false,
        challenges: 102,
        winRate: "76%",
        earnings: "21.5",
        isTop: false,
    },
    {
        rank: 25,
        username: "DumpSurvivor",
        avatar: "/scribbles/doge.png",
        flag: "🇪🇺",
        badge: null,
        wins: 45,
        winsChange: "+3",
        winsUp: true,
        rekts: 14,
        rektsChange: null,
        rektsUp: null,
        challenges: 95,
        winRate: "76%",
        earnings: "20.2",
        isTop: false,
    },
    {
        rank: 26,
        username: "FOMOTrader",
        avatar: "/scribbles/btc.png",
        flag: "🇺🇸",
        badge: null,
        wins: 42,
        winsChange: null,
        winsUp: null,
        rekts: 12,
        rektsChange: "-2",
        rektsUp: false,
        challenges: 88,
        winRate: "78%",
        earnings: "18.9",
        isTop: false,
    },
    {
        rank: 27,
        username: "DiamondPaws",
        avatar: "/scribbles/pepe.png",
        flag: "🇨🇦",
        badge: null,
        wins: 38,
        winsChange: "+2",
        winsUp: true,
        rekts: 10,
        rektsChange: "-1",
        rektsUp: false,
        challenges: 82,
        winRate: "79%",
        earnings: "17.5",
        isTop: false,
    },
    {
        rank: 28,
        username: "RugPullSafe",
        avatar: "/scribbles/sol.png",
        flag: "🇬🇧",
        badge: null,
        wins: 35,
        winsChange: null,
        winsUp: null,
        rekts: 9,
        rektsChange: null,
        rektsUp: null,
        challenges: 75,
        winRate: "80%",
        earnings: "16.2",
        isTop: false,
    },
    {
        rank: 29,
        username: "GasOptimizer",
        avatar: "/scribbles/stars.png",
        flag: "🇰🇷",
        badge: null,
        wins: 32,
        winsChange: "+4",
        winsUp: true,
        rekts: 8,
        rektsChange: "-2",
        rektsUp: false,
        challenges: 70,
        winRate: "80%",
        earnings: "15.1",
        isTop: false,
    },
    {
        rank: 30,
        username: "LiquidityKing",
        avatar: "/scribbles/dollars.png",
        flag: "🇪🇺",
        badge: null,
        wins: 28,
        winsChange: null,
        winsUp: null,
        rekts: 7,
        rektsChange: "-1",
        rektsUp: false,
        challenges: 65,
        winRate: "80%",
        earnings: "14.0",
        isTop: false,
    },
    {
        rank: 31,
        username: "MEVHunter",
        avatar: "/scribbles/bags.png",
        flag: "🇺🇸",
        badge: null,
        wins: 25,
        winsChange: "+3",
        winsUp: true,
        rekts: 6,
        rektsChange: null,
        rektsUp: null,
        challenges: 58,
        winRate: "81%",
        earnings: "12.8",
        isTop: false,
    },
    {
        rank: 32,
        username: "OracleReader",
        avatar: "/scribbles/shiba.png",
        flag: "🇨🇦",
        badge: null,
        wins: 22,
        winsChange: null,
        winsUp: null,
        rekts: 5,
        rektsChange: "-1",
        rektsUp: false,
        challenges: 52,
        winRate: "81%",
        earnings: "11.5",
        isTop: false,
    },
];

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

// Arrow down icon
const ArrowDownIcon = () => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-emerald-600">
        <path d="M5 8L2 4H8L5 8Z" fill="currentColor" />
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

// Challenge icon
const ChallengeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-amber-500">
        <path d="M8 1L9.5 5.5L14 6L10.5 9L11.5 13.5L8 11L4.5 13.5L5.5 9L2 6L6.5 5.5L8 1Z" fill="currentColor" />
    </svg>
);

// Handshake icon
const HandshakeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-amber-700">
        <path d="M10 2C10 2 12 4 14 4C16 4 17 6 17 8C17 10 16 12 14 13L10 17L6 13C4 12 3 10 3 8C3 6 4 4 6 4C8 4 10 2 10 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M7 8C7 8 8 9 10 9C12 9 13 8 13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// Coins icon
const CoinsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-amber-600">
        <ellipse cx="10" cy="14" rx="6" ry="3" fill="currentColor" opacity="0.6" />
        <ellipse cx="10" cy="11" rx="6" ry="3" fill="currentColor" opacity="0.8" />
        <ellipse cx="10" cy="8" rx="6" ry="3" fill="currentColor" />
        <ellipse cx="10" cy="8" rx="4" ry="2" fill="#fbbf24" />
    </svg>
);

// Search icon
const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

export default function LeaderboardPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const data = topTraders;
    const filteredData = data.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                            Leaderboard
                        </h1>
                        <p className="text-gray-600 text-base sm:text-lg">Explore the top challengers and their achievements</p>
                    </div>
                </div>


                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {/* Challenges Created */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl px-5 py-4 flex items-center justify-between border border-white/50 shadow-sm">
                        <div className="flex items-center gap-3">
                            <ChallengeIcon />
                            <div>
                                <div className="text-xl font-bold text-gray-900">6.8K</div>
                                <div className="text-sm text-gray-600">Challenges Created</div>
                            </div>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                            <path d="M8 6L12 10L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* Challenges Accepted */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl px-5 py-4 flex items-center justify-between border border-white/50 shadow-sm">
                        <div className="flex items-center gap-3">
                            <HandshakeIcon />
                            <div>
                                <div className="text-xl font-bold text-gray-900">173.2K</div>
                                <div className="text-sm text-gray-600">Challenges Accepted</div>
                            </div>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                            <path d="M8 6L12 10L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* Total Earned */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl px-5 py-4 flex items-center justify-between border border-white/50 shadow-sm">
                        <div className="flex items-center gap-3">
                            <CoinsIcon />
                            <div>
                                <div className="text-xl font-bold text-gray-900">$284.9K</div>
                                <div className="text-sm text-gray-600">Total Earned</div>
                            </div>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-400">
                            <path d="M8 6L12 10L8 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Search traders"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 pr-4 py-3 bg-white/60 border border-white/50 rounded-xl text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 w-full"
                        />
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/50 text-sm font-medium text-gray-600">
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
                                <div className="col-span-2 flex items-center gap-1">
                                    Challenges
                                    <ChevronIcon direction="up" />
                                </div>
                                <div className="col-span-1 flex items-center gap-1">
                                    Win%
                                    <ChevronIcon direction="up" />
                                </div>
                                <div className="col-span-2 flex items-center gap-1 justify-end">
                                    Earnings
                                    <ChevronIcon direction="up" />
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-white/30">
                                {paginatedData.map((user) => (
                                    <div
                                        key={user.rank}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/30 transition-colors"
                                    >
                                        {/* Rank */}
                                        <div className="col-span-1 flex items-center gap-2">
                                            <span className="text-lg font-semibold text-gray-700 w-4">
                                                {user.rank}
                                            </span>
                                            {user.rank === 1 ? (
                                                <StarBadge />
                                            ) : (
                                                <DiamondIcon />
                                            )}
                                        </div>

                                        {/* Trader */}
                                        <div className="col-span-3 flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex-shrink-0">
                                                <Image
                                                    src={user.avatar}
                                                    alt={user.username}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="font-semibold text-gray-900 truncate">
                                                    {user.username}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Wins */}
                                        <div className="col-span-2 flex items-center gap-2">
                                            {user.winsUp !== null && (
                                                <ArrowUpIcon />
                                            )}
                                            {user.winsUp === null && user.winsChange === null && (
                                                <SparkleIcon className="text-amber-500" />
                                            )}
                                            <span className="font-semibold text-gray-900">{user.wins}</span>
                                            {user.winsChange && (
                                                <span
                                                    className={`text-sm ${user.winsUp ? "text-emerald-600" : "text-gray-500"
                                                        }`}
                                                >
                                                    {user.winsChange}
                                                </span>
                                            )}
                                        </div>

                                        {/* Rekts */}
                                        <div className="col-span-1 flex items-center gap-1">
                                            <span
                                                className={`font-semibold ${user.rektsChange ? "text-red-600" : "text-gray-900"
                                                    }`}
                                            >
                                                {user.rekts}
                                            </span>
                                            {user.rektsChange && (
                                                <span className="text-sm text-emerald-600">
                                                    {user.rektsChange}
                                                </span>
                                            )}
                                        </div>

                                        {/* Challenges */}
                                        <div className="col-span-2 flex items-center gap-1">
                                            <span className="text-gray-900">{user.challenges}</span>
                                        </div>

                                        {/* Win Rate */}
                                        <div className="col-span-1">
                                            <span className="text-gray-900">{user.winRate}</span>
                                        </div>

                                        {/* Earnings */}
                                        <div className="col-span-2 text-right">
                                            <span className="font-semibold text-gray-900">${user.earnings}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/50">
                            <div className="text-sm text-gray-600">
                                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} traders
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === 1
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-white/60 text-gray-700 hover:bg-white/80 border border-white/50"
                                        }`}
                                >
                                    Previous
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${currentPage === page
                                            ? "bg-amber-500 text-white"
                                            : "bg-white/60 text-gray-700 hover:bg-white/80 border border-white/50"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === totalPages
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-white/60 text-gray-700 hover:bg-white/80 border border-white/50"
                                        }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
