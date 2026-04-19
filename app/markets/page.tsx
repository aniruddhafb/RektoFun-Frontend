"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, SlidersHorizontal, ChevronDown, ArrowRight, Flame, Zap } from "lucide-react";

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
    },
];

const filterTabs = ["All", "BTC", "ETH", "SOL", "PEPE", "BONK"];

export default function MarketsPage() {
    const [activeTab, setActiveTab] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 3;

    const filteredMarkets = activeTab === "All"
        ? marketsData
        : marketsData.filter(m => m.category === activeTab);

    return (
        <div className="min-h-screen bg-[#f3e1d7]">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Challenge Markets</h1>
                    <p className="text-gray-600 text-lg">Predict trends and earn big on top crypto markets</p>
                </div>

                {/* Filter Tabs and Search */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-white/50 rounded-full p-1 w-fit">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeTab === tab
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Search and Sort */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search"
                                className="pl-10 pr-4 py-2.5 bg-white/50 rounded-full text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 w-48"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white/50 rounded-full text-sm text-gray-700 hover:bg-white/70 transition-colors">
                            Latest
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        <button className="p-2.5 bg-white/50 rounded-full text-gray-700 hover:bg-white/70 transition-colors">
                            <SlidersHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-gray-700 font-medium">All Challenge Markets</span>
                    <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        {marketsData.length}
                    </span>
                </div>

                {/* Markets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                    {filteredMarkets.map((market) => (
                        <div
                            key={market.id}
                            className="bg-white/40 backdrop-blur-sm rounded-2xl p-5 border border-white/50 hover:shadow-lg transition-shadow duration-300"
                        >
                            {/* Card Header */}
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/50 flex-shrink-0">
                                    <Image
                                        src={market.icon}
                                        alt={market.name}
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1">
                                        {market.name}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <span>{market.available} Available</span>
                                        <span className="flex items-center gap-1">
                                            <ArrowRight className="w-3 h-3" />
                                            <Flame className="w-3 h-3 text-orange-500" />
                                            {market.participants}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Best Bet Badge */}
                            <div className="mb-3">
                                <span className="inline-block px-3 py-1 bg-[#e8d5c4] text-gray-700 text-xs font-medium rounded-full">
                                    Best Bet
                                </span>
                            </div>

                            {/* Prediction */}
                            <div className="mb-4">
                                <p className="text-gray-800">
                                    <span className="text-emerald-600 font-semibold">{market.bestBet.reward}</span>{" "}
                                    <span className="font-medium">{market.bestBet.prediction}</span>
                                </p>
                            </div>

                            {/* Prize Pool & Time */}
                            <div className="bg-white/40 rounded-xl px-4 py-3 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-gray-900">{market.prizePool}</span>
                                    <span className="text-gray-500">Prize Pool</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-600">Ends in {market.endsIn}</span>
                                </div>
                            </div>

                            {/* View Button */}
                            <button className="w-full py-3 bg-[#5a7c6c] hover:bg-[#4a6b5c] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 group">
                                View Challenges
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-2">
                    {/* Dots indicator */}
                    <div className="flex items-center gap-1.5 mr-4">
                        {[1, 2, 3, 4, 5, 6].map((dot) => (
                            <div
                                key={dot}
                                className={`w-2 h-2 rounded-full transition-colors ${dot <= currentPage ? "bg-gray-400" : "bg-gray-300"
                                    }`}
                            />
                        ))}
                    </div>

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
