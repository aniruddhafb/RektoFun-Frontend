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

const topCreators = [
    {
        rank: 1,
        username: "WhaleCreator",
        avatar: "/scribbles/bags.png",
        flag: "🇺🇸",
        badge: "W",
        wins: 245,
        winsChange: "+32",
        winsUp: true,
        rekts: 12,
        rektsChange: "-3",
        rektsUp: false,
        challenges: 890,
        winRate: "95%",
        earnings: "456.8 SOL",
        isTop: true,
    },
    {
        rank: 2,
        username: "ChallengeKing",
        avatar: "/scribbles/stars.png",
        flag: "🇬🇧",
        badge: null,
        wins: 198,
        winsChange: null,
        winsUp: null,
        rekts: 28,
        rektsChange: "-5",
        rektsUp: false,
        challenges: 756,
        winRate: "88%",
        earnings: "389.2 SOL",
        isTop: false,
    },
    {
        rank: 3,
        username: "PoolMaster",
        avatar: "/scribbles/dollars.png",
        flag: "🇨🇦",
        badge: null,
        wins: 176,
        winsChange: "+18",
        winsUp: true,
        rekts: 34,
        rektsChange: null,
        rektsUp: null,
        challenges: 678,
        winRate: "84%",
        earnings: "312.5 SOL",
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
    const [activeTab, setActiveTab] = useState<"traders" | "creators">("traders");
    const [sortBy, setSortBy] = useState<"wins" | "rekts">("wins");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const data = activeTab === "traders" ? topTraders : topCreators;
    const filteredData = data.filter((user) =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Reset to page 1 when tab or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery]);

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
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
                    Leaderboard
                </h1>

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

                {/* Tabs and Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    {/* Tabs */}
                    <div className="inline-flex bg-white/40 rounded-lg p-1 border border-white/50">
                        <button
                            onClick={() => setActiveTab("traders")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "traders"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            Top Traders
                        </button>
                        <button
                            onClick={() => setActiveTab("creators")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "creators"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            Top Creators
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        {/* Sort buttons */}
                        <div className="inline-flex bg-white/40 rounded-lg p-1 border border-white/50">
                            <button
                                onClick={() => setSortBy("wins")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 transition-all ${sortBy === "wins"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Wins
                                <ChevronIcon direction="up" />
                            </button>
                            <button
                                onClick={() => setSortBy("rekts")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 transition-all ${sortBy === "rekts"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                Rekts
                                <ChevronIcon direction="down" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="Search traders"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-1.5 bg-white/60 border border-white/50 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 w-40"
                            />
                        </div>

                        {/* Filter button */}
                        <button className="px-4 py-1.5 bg-white/60 border border-white/50 rounded-lg text-sm font-medium text-gray-700 hover:bg-white/80 transition-all">
                            Filter
                        </button>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 overflow-hidden shadow-sm">
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
                            Win Rate
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
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
                                        <Image
                                            src={user.avatar}
                                            alt={user.username}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-gray-900">
                                            {user.username}
                                        </span>
                                        <span className="text-base">{user.flag}</span>
                                        {user.badge && (
                                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded">
                                                {user.badge}
                                            </span>
                                        )}
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
                                    <span className="font-semibold text-gray-900">{user.earnings}</span>
                                </div>
                            </div>
                        ))}
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
