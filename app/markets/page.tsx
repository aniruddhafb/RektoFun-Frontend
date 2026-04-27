"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Search, ChevronDown, ArrowRight, TrendingUp, Clock, DollarSign, Eye, Bookmark } from "lucide-react";

// Challenge data type
interface Challenge {
    id: string;
    title: string;
}

// Market data type
interface Market {
    id: string;
    name: string;
    icon: string;
    available: number;
    participants: number;
    bestBet: {
        reward: string;
        prediction: string;
    };
    prizePool: string;
    endsIn: string;
    category: string;
    challenges: Challenge[];
    totalTraders: number;
    totalVolume: string;
}

// Sample market data
const marketsData: Market[] = [
    {
        id: "1",
        name: "Bitcoin Challenge Markets",
        icon: "/scribbles/btc.png",
        available: 12,
        participants: 59,
        bestBet: {
            reward: "+80¢",
            prediction: "BTC closes above $65,000 in 2 hrs",
        },
        prizePool: "$3,240",
        endsIn: "1 hr 27m",
        category: "BTC",
        challenges: [
            { id: "c1", title: "BTC to hit $66K by noon" },
            { id: "c2", title: "BTC +5% in 30 mins" },
            { id: "c3", title: "BTC above $65.5K" },
            { id: "c4", title: "BTC volatility challenge" },
            { id: "c5", title: "BTC hourly close green" },
        ],
        totalTraders: 342,
        totalVolume: "$1.2M",
    },
    {
        id: "2",
        name: "Ethereum Challenge Markets",
        icon: "/scribbles/coins.png",
        available: 14,
        participants: 43,
        bestBet: {
            reward: "+8¢",
            prediction: "ETH goes below $3,100 in 5 mins",
        },
        prizePool: "$2,100",
        endsIn: "27m",
        category: "ETH",
        challenges: [
            { id: "c6", title: "ETH to $3,200" },
            { id: "c7", title: "ETH -3% in 1 hour" },
            { id: "c8", title: "ETH gas fee spike" },
            { id: "c9", title: "ETH bullish breakout" },
        ],
        totalTraders: 256,
        totalVolume: "$890K",
    },
    {
        id: "3",
        name: "Solana Challenge Markets",
        icon: "/scribbles/sol.png",
        available: 10,
        participants: 27,
        bestBet: {
            reward: "+$100",
            prediction: "SOL > $160 in 3 hrs",
        },
        prizePool: "$8,720",
        endsIn: "2h 09m",
        category: "SOL",
        challenges: [
            { id: "c10", title: "SOL to $165" },
            { id: "c11", title: "SOL +10% today" },
            { id: "c12", title: "SOL volume spike" },
        ],
        totalTraders: 189,
        totalVolume: "$650K",
    },
    {
        id: "4",
        name: "Solana Challenge Markets",
        icon: "/scribbles/sol.png",
        available: 10,
        participants: 27,
        bestBet: {
            reward: "+$100",
            prediction: "SOL > $160 in 3 hrs",
        },
        prizePool: "$3,240",
        endsIn: "1 hr 27m",
        category: "SOL",
        challenges: [
            { id: "c13", title: "SOL support test" },
            { id: "c14", title: "SOL breakout $162" },
            { id: "c15", title: "SOL vs ETH performance" },
            { id: "c16", title: "SOL daily high" },
        ],
        totalTraders: 145,
        totalVolume: "$420K",
    },
    {
        id: "5",
        name: "Pepe Coin Challenge Markets",
        icon: "/scribbles/pepe.png",
        available: 8,
        participants: 27,
        bestBet: {
            reward: "+6¢",
            prediction: "PEPE rises above 0.000010 in 15 mins",
        },
        prizePool: "$530",
        endsIn: "1 hr 27m",
        category: "PEPE",
        challenges: [
            { id: "c17", title: "PEPE to the moon" },
            { id: "c18", title: "PEPE 2x in 24h" },
            { id: "c19", title: "PEPE volume surge" },
        ],
        totalTraders: 98,
        totalVolume: "$180K",
    },
    {
        id: "6",
        name: "Bonk Coin Challenge Markets",
        icon: "/scribbles/shiba.png",
        available: 9,
        participants: 21,
        bestBet: {
            reward: "+5¢",
            prediction: "BONK drops below $0.000036 in 1 hr",
        },
        prizePool: "$430",
        endsIn: "24m",
        category: "BONK",
        challenges: [
            { id: "c20", title: "BONK reversal play" },
            { id: "c21", title: "BONK support hold" },
            { id: "c22", title: "BONK vs DOGE" },
            { id: "c23", title: "BONK meme momentum" },
        ],
        totalTraders: 76,
        totalVolume: "$95K",
    },
];

type SortOption = "Recently Added" | "Trending" | "Price Markets" | "My Watchlists";

const sortOptions: { label: SortOption; icon: React.ReactNode }[] = [
    { label: "Recently Added", icon: <Clock className="w-4 h-4" /> },
    { label: "Trending", icon: <TrendingUp className="w-4 h-4" /> },
    { label: "Price Markets", icon: <DollarSign className="w-4 h-4" /> },
    { label: "My Watchlists", icon: <Eye className="w-4 h-4" /> },
];

export default function MarketsPage() {
    const [activeTab] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState<SortOption>("Recently Added");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [bookmarkedMarkets, setBookmarkedMarkets] = useState<Set<string>>(new Set());
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleBookmark = (marketId: string) => {
        setBookmarkedMarkets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(marketId)) {
                newSet.delete(marketId);
            } else {
                newSet.add(marketId);
            }
            return newSet;
        });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredMarkets = activeTab === "All"
        ? marketsData
        : marketsData.filter(m => m.category === activeTab);

    return (
        <div className="min-h-screen bg-[#f3e1d7]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Challenge Markets</h1>
                        <p className="text-gray-600 text-base sm:text-lg">Predict trends and earn big on top challenge markets</p>
                    </div>
                </div>

                {/* Filter Tabs and Search */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                    {/* Search and Sort */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search"
                                className="pl-10 pr-4 py-2.5 bg-white/50 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 w-full sm:w-48 lg:w-88"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="cursor-pointer flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white/50 rounded-full text-sm text-gray-700 hover:bg-white/70 transition-colors whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">{sortBy}</span>
                                <span className="sm:hidden">{sortOptions.find(o => o.label === sortBy)?.icon}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
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
                                            className={`w-full cursor-pointer flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${sortBy === option.label
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

                {/* Markets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-8">
                    {filteredMarkets.map((market) => (
                        <div
                            key={market.id}
                            className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/50 hover:shadow-lg transition-shadow duration-300 flex flex-col"
                        >
                            {/* Card Header */}
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
                                    {/* <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                                        <span>{market.available} Challenges Available</span>
                                    </div> */}
                                </div>
                                {/* Bookmark Button */}
                                <button
                                    onClick={() => toggleBookmark(market.id)}
                                    className="p-2 rounded-full hover:bg-white/50 transition-colors flex-shrink-0"
                                    aria-label={bookmarkedMarkets.has(market.id) ? "Remove bookmark" : "Add bookmark"}
                                >
                                    <Bookmark
                                        className={`w-5 h-5 transition-colors ${bookmarkedMarkets.has(market.id)
                                            ? "fill-[#5a7c6c] text-[#5a7c6c]"
                                            : "text-gray-400 hover:text-gray-600"
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Card Body - Scrollable Challenges */}
                            <div className="flex-1 mb-4">
                                {/* Scrollable Challenges Section */}
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
                                        {market.challenges.map((challenge) => (
                                            <div
                                                key={challenge.id}
                                                className="flex items-center justify-between p-2.5 bg-white/30 rounded-lg"
                                            >
                                                <span className="text-sm text-gray-800 font-medium truncate pr-2">
                                                    {challenge.title}
                                                </span>
                                                <button className="px-3 py-1.5 bg-[#246044] hover:bg-[#2b7351] text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap">
                                                    Accept ⚔️
                                                </button>
                                                {/* <button className="px-3 py-1.5 bg-[#246044] hover:bg-[#2b7351]  text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap">
                                                    Ongoing ⚔️
                                                </button>
                                                <button className="px-3 py-1.5 bg-[#C65A5A] hover:bg-[#c85656]  text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap">
                                                    Expired 😓
                                                </button>
                                                <button className="px-3 py-1.5 bg-[#E6C15A] hover:bg-[#e7c25a] text-black text-xs font-medium rounded-lg transition-colors whitespace-nowrap">
                                                    Completed 🎊
                                                </button> */}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Stats Section */}
                                <div className="flex items-center justify-between text-xs text-gray-600 border-t border-white/30 pt-3">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900">{market.available}</span>
                                        <span>Challenges</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="font-semibold text-gray-900">{market.totalTraders}</span>
                                        <span>Traders</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="font-semibold text-gray-900">{market.totalVolume}</span>
                                        <span>Volume</span>
                                    </div>
                                </div>
                            </div>

                            {/* View Button */}
                            <button className="w-full py-2.5 sm:py-3 bg-[#2b7351] hover:bg-[#246044] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 group text-sm sm:text-base">
                                View Challenges
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2">

                    {/* Page Numbers */}
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
                </div>

            </div>
        </div>
    );
}
