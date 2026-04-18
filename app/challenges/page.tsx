"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Types
interface Challenge {
    id: string;
    asset: string;
    assetLogo: string;
    title: string;
    creator: {
        name: string;
        avatar: string;
    };
    betAmount: number;
    prediction: string;
    currentPrice: number;
    priceChange: number;
    targetPrice: number;
    startPrice: number;
    timeRemaining: string;
    likes: number;
    status: "active" | "expired" | "won" | "lost";
}

// Dummy data
const challenges: Challenge[] = [
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
        status: "active",
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
        status: "active",
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
        status: "active",
    },
    {
        id: "4",
        asset: "DOGE",
        assetLogo: "/scribbles/doge.png",
        title: "DOGE Above $0.18 in 1 Hour?",
        creator: { name: "MoonBoy", avatar: "/scribbles/pepe.png" },
        betAmount: 50,
        prediction: "DOGE > $0.18",
        currentPrice: 0.175,
        priceChange: 3.2,
        targetPrice: 0.18,
        startPrice: 0.165,
        timeRemaining: "52m 30s",
        likes: 3,
        status: "active",
    },
    {
        id: "5",
        asset: "PEPE",
        assetLogo: "/scribbles/pepe.png",
        title: "PEPE Above $0.000015 in 3 Hours?",
        creator: { name: "FrogLord", avatar: "/scribbles/pengu.png" },
        betAmount: 150,
        prediction: "PEPE > $0.000015",
        currentPrice: 0.0000142,
        priceChange: -2.1,
        targetPrice: 0.000015,
        startPrice: 0.0000145,
        timeRemaining: "2h 15m",
        likes: 7,
        status: "active",
    },
    {
        id: "6",
        asset: "SHIB",
        assetLogo: "/scribbles/shiba.png",
        title: "SHIB Above $0.000025 in 1 Hour?",
        creator: { name: "ShibArmy", avatar: "/scribbles/doge.png" },
        betAmount: 75,
        prediction: "SHIB > $0.000025",
        currentPrice: 0.0000245,
        priceChange: 1.5,
        targetPrice: 0.000025,
        startPrice: 0.000024,
        timeRemaining: "48m 20s",
        likes: 4,
        status: "active",
    },
];

// Filter types
const filterOptions = ["All", "Active", "Ending Soon", "High Stakes", "My Bets"];
const assetOptions = ["All Assets", "SOL", "BTC", "ETH", "DOGE", "PEPE", "SHIB"];

export default function ChallengesPage() {
    const [activeFilter, setActiveFilter] = useState("All");
    const [activeAsset, setActiveAsset] = useState("All Assets");

    // Calculate progress for the price bar
    const getProgress = (challenge: Challenge) => {
        const range = challenge.startPrice - challenge.targetPrice;
        const current = challenge.startPrice - challenge.currentPrice;
        return Math.min(Math.max((current / range) * 100, 0), 100);
    };

    return (
        <div className="min-h-full bg-[#f3e1d7]">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 pb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Challenges</h1>
                        <p className="text-gray-600 mt-1">Battle other traders in PvP prediction markets</p>
                    </div>
                    <Link
                        href="/challenges/create"
                        className="inline-flex items-center justify-center px-6 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Challenge
                    </Link>
                </div>
            </div>

            {/* Filters Section */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Main Filters */}
                    <div className="flex flex-wrap gap-2">
                        {filterOptions.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === filter
                                    ? "bg-black text-white"
                                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Asset Filter */}
                    <div className="flex flex-wrap gap-2 lg:ml-auto">
                        {assetOptions.map((asset) => (
                            <button
                                key={asset}
                                onClick={() => setActiveAsset(asset)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeAsset === asset
                                    ? "bg-gray-800 text-white"
                                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                                    }`}
                            >
                                {asset}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Challenges Grid */}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {challenges.map((challenge) => (
                        <Link
                            key={challenge.id}
                            href={`/challenges/${challenge.id}`}
                            className="bg-[#f8ede7] rounded-3xl p-6 shadow-sm border border-white/50 hover:shadow-lg transition-shadow block"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
                                        <Image
                                            src={challenge.assetLogo}
                                            alt={challenge.asset}
                                            width={40}
                                            height={40}
                                            className="w-10 h-10 object-contain"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                                            {challenge.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden">
                                                <Image
                                                    src={challenge.creator.avatar}
                                                    alt={challenge.creator.name}
                                                    width={20}
                                                    height={20}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <span className="text-sm text-gray-600">{challenge.creator.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200 my-4"></div>

                            {/* Bet Info */}
                            <div className="text-center mb-4">
                                <p className="text-2xl font-bold text-gray-900">
                                    <span className="text-emerald-600">${challenge.betAmount}</span>{" "}
                                    <span className="text-gray-700">Bet on {challenge.prediction}</span>
                                </p>
                            </div>

                            {/* Price Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-500 mb-2">
                                    <span>${challenge.startPrice}</span>
                                    <span>${challenge.targetPrice}</span>
                                </div>
                                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                                    {/* Background gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-400"></div>
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500"
                                        style={{
                                            left: `${getProgress(challenge)}%`,
                                            right: 0
                                        }}
                                    ></div>
                                    {/* Current price indicator */}
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-700"
                                        style={{ left: `${getProgress(challenge)}%`, transform: `translateX(-50%) translateY(2px)` }}
                                    ></div>
                                </div>
                                {/* Price tag */}
                                <div
                                    className="relative mt-2"
                                >
                                    <div
                                        className="absolute -translate-x-1/2 bg-gradient-to-r from-amber-800 to-amber-700 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md"
                                        style={{ left: `${getProgress(challenge)}%` }}
                                    >
                                        ${challenge.currentPrice.toLocaleString()} {" "}
                                        <span className={challenge.priceChange >= 0 ? "text-emerald-200" : "text-red-200"}>
                                            {challenge.priceChange >= 0 ? "+" : ""}{challenge.priceChange}%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500 mt-10">
                                    <span>${challenge.startPrice}</span>
                                    <span className="text-gray-400">${challenge.targetPrice} Target</span>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button className="w-full py-4 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 rounded-full text-gray-900 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all border-2 border-amber-400/50 flex items-center justify-center gap-2">
                                REKT HIM
                                <span className="text-2xl">😈</span>
                            </button>

                            {/* Divider */}
                            <div className="border-t border-gray-200 my-4"></div>

                            {/* Footer */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm">Expires in <span className="font-semibold text-gray-900">{challenge.timeRemaining}</span></span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold text-gray-900">{challenge.likes}</span>
                                        <span className="text-xl">🔥</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
