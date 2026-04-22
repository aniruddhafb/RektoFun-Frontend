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
    status: "active" | "expired" | "won" | "lost" | "created" | "accepted";
}

// Activity item interface
interface ActivityItem {
    id: string;
    type: "bet" | "win" | "follow" | "buy";
    user: {
        name: string;
        avatar: string;
    };
    action: string;
    target?: string;
    amount?: string;
    details: string;
    subAction?: {
        user: string;
        action: string;
        icon?: string;
        highlight?: string;
    };
    timestamp: string;
}

// Dummy data for the profile
const profileData = {
    username: "DegenLord",
    avatar: "/scribbles/pepe.png",
    walletAddress: "0x7a89...3f4a",
    bio: "King of the Degens, betting big and laughing at tears of REKTed noobs",
    joinedDate: "Feb",
    balance: {
        sol: 7.02,
        solUsd: 1160,
    },
    stats: {
        wins: 528,
        rekts: 145,
        totalChallenges: 673,
        winRatio: 78.5,
    },
};

// Dummy challenges data matching the challenges page format
const userChallenges: Challenge[] = [
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
        creator: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        betAmount: 250,
        prediction: "BTC > $95,000",
        currentPrice: 94300,
        priceChange: 2.3,
        targetPrice: 95000,
        startPrice: 92000,
        timeRemaining: "1h 45m",
        likes: 12,
        status: "won",
    },
    {
        id: "3",
        asset: "ETH",
        assetLogo: "/scribbles/coins.png",
        title: "ETH Below $3,200 in 30 mins?",
        creator: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        betAmount: 500,
        prediction: "ETH < $3,200",
        currentPrice: 3250,
        priceChange: -0.5,
        targetPrice: 3200,
        startPrice: 3300,
        timeRemaining: "28m 45s",
        likes: 8,
        status: "lost",
    },
    {
        id: "4",
        asset: "DOGE",
        assetLogo: "/scribbles/doge.png",
        title: "DOGE Above $0.18 in 1 Hour?",
        creator: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        betAmount: 50,
        prediction: "DOGE > $0.18",
        currentPrice: 0.175,
        priceChange: 3.2,
        targetPrice: 0.18,
        startPrice: 0.165,
        timeRemaining: "52m 30s",
        likes: 3,
        status: "created",
    },
    {
        id: "5",
        asset: "PEPE",
        assetLogo: "/scribbles/pepe.png",
        title: "PEPE Above $0.000015 in 3 Hours?",
        creator: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        betAmount: 150,
        prediction: "PEPE > $0.000015",
        currentPrice: 0.0000142,
        priceChange: -2.1,
        targetPrice: 0.000015,
        startPrice: 0.0000145,
        timeRemaining: "2h 15m",
        likes: 7,
        status: "accepted",
    },
    {
        id: "6",
        asset: "SHIB",
        assetLogo: "/scribbles/shiba.png",
        title: "SHIB Above $0.000025 in 1 Hour?",
        creator: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        betAmount: 75,
        prediction: "SHIB > $0.000025",
        currentPrice: 0.0000245,
        priceChange: 1.5,
        targetPrice: 0.000025,
        startPrice: 0.000024,
        timeRemaining: "48m 20s",
        likes: 4,
        status: "expired",
    },
];

// Activity data matching the activity page style
const activityData: ActivityItem[] = [
    {
        id: "1",
        type: "win",
        user: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        action: "won",
        amount: "+2.5 SOL",
        target: "Bitcoin Above $95K",
        details: "vs CryptoKing",
        subAction: {
            user: "BTC",
            action: "bought",
            highlight: "🎫",
        },
        timestamp: "2hr ago",
    },
    {
        id: "2",
        type: "bet",
        user: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        action: "got REKT",
        amount: "-1.2 SOL",
        target: "Ethereum Below $3,200",
        details: "by BearWhale",
        subAction: {
            user: "ETH",
            action: "bought",
            highlight: "Down",
        },
        timestamp: "5hr ago",
    },
    {
        id: "3",
        type: "bet",
        user: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        action: "created challenge",
        amount: "1.0 SOL",
        target: "SOL Above $160",
        details: "",
        subAction: {
            user: "SOL",
            action: "bought",
            highlight: "🎫",
        },
        timestamp: "1 day ago",
    },
    {
        id: "4",
        type: "follow",
        user: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        action: "joined",
        target: "MoonBoy's challenge",
        details: "x0.5 SOL bet",
        subAction: {
            user: "DOGE",
            action: "bought",
            highlight: "🥞",
        },
        timestamp: "2 days ago",
    },
    {
        id: "5",
        type: "win",
        user: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        action: "hit jackpot!",
        amount: "+5.0 SOL",
        target: "PEPE Above $0.000015",
        details: "",
        subAction: {
            user: "PEPE",
            action: "bought",
            highlight: "Up x5",
        },
        timestamp: "3 days ago",
    },
];

// Filter options
const filterOptions = ["All", "Created", "Ongoing", "Expired", "Accepted", "Won", "Rekt", "Latest"];

// Tab types
type TabType = "challenges" | "activity";

export default function ProfilePage({ params }: { params: { slug: string } }) {
    const [activeTab, setActiveTab] = useState<TabType>("challenges");
    const [activeFilter, setActiveFilter] = useState("All");

    const tabs: { id: TabType; label: string }[] = [
        { id: "challenges", label: "Challenges" },
        { id: "activity", label: "Activity" },
    ];

    // Filter challenges based on selected filter
    const filteredChallenges = userChallenges.filter((challenge) => {
        if (activeFilter === "All") return true;
        if (activeFilter === "Created") return challenge.status === "created";
        if (activeFilter === "Ongoing") return challenge.status === "active";
        if (activeFilter === "Expired") return challenge.status === "expired";
        if (activeFilter === "Accepted") return challenge.status === "accepted";
        if (activeFilter === "Won") return challenge.status === "won";
        if (activeFilter === "Rekt") return challenge.status === "lost";
        if (activeFilter === "Latest") return true;
        return true;
    });

    // Sort by latest if that filter is selected
    const displayedChallenges = activeFilter === "Latest"
        ? [...filteredChallenges].reverse()
        : filteredChallenges;

    // Get highlight color based on text
    const getHighlightColor = (text?: string) => {
        if (!text) return "text-gray-500";
        if (text.includes("Up")) return "text-green-600";
        if (text.includes("Down")) return "text-red-600";
        return "text-amber-600";
    };

    return (
        <div className="min-h-screen bg-[#f3e1d7] pb-8">
            {/* Profile Header Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="flex flex-col lg:flex-row lg:items-stretch gap-6">
                    {/* Left: Avatar and Info */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#d4a574] overflow-hidden bg-[#e8d5c4] shadow-lg">
                                <Image
                                    src={profileData.avatar}
                                    alt={profileData.username}
                                    width={112}
                                    height={112}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex flex-col gap-2 justify-center">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {profileData.username}
                            </h1>

                            {/* Wallet Address */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">🌙</span>
                                <span className="text-sm text-gray-600 font-mono">{profileData.walletAddress}</span>
                                <button
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    onClick={() => navigator.clipboard.writeText(profileData.walletAddress)}
                                    title="Copy address"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Bio */}
                            <p className="text-sm text-gray-600 max-w-md">
                                {profileData.bio}{" "}
                                <span className="inline-flex items-center gap-1">
                                    <span className="text-gray-500">Joined {profileData.joinedDate}</span>
                                </span>
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <button className="px-4 py-1.5 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 border border-gray-200 hover:bg-white transition-all flex items-center gap-1">
                                    Joined <span className="text-xs">24 july</span>
                                </button>
                                <button className="px-4 py-1.5 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 border border-gray-200 hover:bg-white transition-all flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    Share Profile
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Enhanced Balance Card - Horizontal Rectangle */}
                    <div className="flex flex-col bg-white/30 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-lg flex items-center gap-6 lg:min-w-[480px]">
                        {/* Balance Section */}
                        <div className="flex flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
                                <Image
                                    src="/scribbles/sol.png"
                                    alt="SOL"
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 object-contain"
                                />
                            </div>
                            <div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-gray-900">{profileData.balance.sol}</span>
                                    <span className="text-sm font-semibold text-gray-700">SOL</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 flex-1">
                            {/* Wins */}
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🏆</span>
                                <div>
                                    <p className="text-lg font-bold text-emerald-700 leading-none">{profileData.stats.wins}</p>
                                    <p className="text-xs text-gray-600">Wins</p>
                                </div>
                            </div>

                            {/* Rekts */}
                            <div className="flex items-center gap-2">
                                <span className="text-lg">💀</span>
                                <div>
                                    <p className="text-lg font-bold text-red-700 leading-none">{profileData.stats.rekts}</p>
                                    <p className="text-xs text-gray-600">Rekts</p>
                                </div>
                            </div>

                            {/* Win Rate */}
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📊</span>
                                <div>
                                    <p className="text-lg font-bold text-amber-700 leading-none">{profileData.stats.winRatio}%</p>
                                    <p className="text-xs text-gray-600">Win Rate</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mt-8 border-b border-gray-300/50">
                    <div className="flex gap-1 bg-white/30 rounded-t-lg p-1 inline-flex">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Challenges Tab Content */}
                {activeTab === "challenges" && (
                    <>
                        {/* Filters Section */}
                        <div className="mt-6">
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
                        </div>

                        {/* Challenges Grid */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {displayedChallenges.map((challenge) => {
                                // Calculate price position for the progress bar (0-100%)
                                const priceRange = Math.abs(challenge.targetPrice - challenge.startPrice);

                                // Calculate progress: 50% is target, <50% is below, >50% is above
                                let priceProgress = 50;
                                if (priceRange > 0) {
                                    const targetDiff = challenge.targetPrice - challenge.startPrice;
                                    const normalizedProgress = (challenge.currentPrice - challenge.startPrice) / targetDiff;
                                    priceProgress = 50 + (normalizedProgress * 50);
                                }
                                const clampedProgress = Math.min(Math.max(priceProgress, 0), 100);

                                // Status badge colors
                                const getStatusBadge = () => {
                                    switch (challenge.status) {
                                        case "won":
                                            return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Won</span>;
                                        case "lost":
                                            return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Rekt</span>;
                                        case "expired":
                                            return <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Expired</span>;
                                        case "created":
                                            return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Created</span>;
                                        case "accepted":
                                            return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Accepted</span>;
                                        default:
                                            return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Active</span>;
                                    }
                                };

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
                                            {/* Status Badge */}
                                            {getStatusBadge()}
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
                    </>
                )}

                {/* Activity Tab Content - Matching Activity Page Style */}
                {activeTab === "activity" && (
                    <div className="mt-6 max-w-3xl">
                        <div className="space-y-3">
                            {activityData.map((item) => (
                                <div
                                    key={item.id}
                                    className="group bg-[#f8ede7] hover:bg-white/50 rounded-2xl p-4 transition-all duration-200 border border-[#e8d5c8] hover:border-[#d4b8a8] hover:shadow-lg"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Avatar with status */}
                                        <div className="relative flex-shrink-0">
                                            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-[#d4b8a8] shadow-md bg-white`}>
                                                <Image
                                                    src={item.user.avatar}
                                                    alt={item.user.name}
                                                    width={48}
                                                    height={48}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Main Activity Line */}
                                            <div className="flex flex-wrap items-center gap-x-1.5 text-sm sm:text-base leading-relaxed">
                                                <span className="font-bold text-[#2d1f1a]">
                                                    {item.user.name}
                                                </span>
                                                <span className="text-[#5c4a42]">{item.action}</span>
                                                {item.amount && (
                                                    <span className={`font-bold ${item.amount.includes("+") ? "text-green-700" : item.amount.includes("-") ? "text-red-700" : "text-[#2d1f1a]"}`}>
                                                        {item.amount}
                                                    </span>
                                                )}
                                                {item.target && (
                                                    <>
                                                        <span className="text-[#5c4a42]">on</span>
                                                        <span className="font-semibold text-[#2d1f1a]">{item.target}</span>
                                                    </>
                                                )}
                                                {item.details && (
                                                    <span className="text-[#8b7355]">{item.details}</span>
                                                )}
                                            </div>

                                            {/* Sub Action Line */}
                                            {item.subAction && (
                                                <div className="flex items-center gap-2 mt-2 text-sm flex-wrap">
                                                    <div className="flex items-center gap-1.5 bg-[#f3e1d7]/50 rounded-full px-2.5 py-1">
                                                        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden border border-[#d4b8a8]">
                                                            <Image
                                                                src={item.user.avatar}
                                                                alt=""
                                                                width={14}
                                                                height={14}
                                                                className="w-3.5 h-3.5 object-cover"
                                                            />
                                                        </div>
                                                        <span className="text-[#5c4a42] font-medium">{item.subAction.user}</span>
                                                        <span className="text-[#8b7355]">
                                                            {item.subAction.action}
                                                        </span>
                                                        {item.subAction.highlight && (
                                                            <span
                                                                className={`font-semibold ${getHighlightColor(
                                                                    item.subAction.highlight
                                                                )}`}
                                                            >
                                                                {item.subAction.highlight}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[#a08070] text-xs">• {item.timestamp}</span>
                                                </div>
                                            )}

                                            {/* Timestamp for items without subAction */}
                                            {!item.subAction && (
                                                <div className="mt-1.5">
                                                    <span className="text-[#a08070] text-xs">{item.timestamp}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f3e1d7]/50 hover:bg-[#2d1f1a] text-[#5c4a42] hover:text-[#f3e1d7] transition-all duration-200 flex items-center justify-center group-hover:shadow-md"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2.5}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Load More Button */}
                        <div className="mt-8 text-center">
                            <button className="px-8 py-3.5 bg-[#2d1f1a] hover:bg-[#3d2f2a] text-[#f3e1d7] rounded-full text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
                                Load More Activity
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
