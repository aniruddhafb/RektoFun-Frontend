"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChallengeCard } from "@/app/components/ChallengeCard";
import { Challenge, DUMMY_CHALLENGES } from "@/app/components/challengesData";
import ChallengeDetailModal from "@/app/components/ChallengeDetailModal";

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

// Tab types
type TabType = "challenges" | "activity";

// Static params since profile page uses demo data
export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<TabType>("challenges");
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Handle challenge card click
    const handleChallengeClick = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        setIsModalOpen(true);
    };

    // Close modal handler
    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedChallenge(null), 300);
    };

    const tabs: { id: TabType; label: string }[] = [
        { id: "challenges", label: "Challenges" },
        { id: "activity", label: "Activity" },
    ];

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
                        {/* Challenges Grid */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {DUMMY_CHALLENGES.map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    onClick={handleChallengeClick}
                                />
                            ))}
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

            {/* Challenge Detail Modal */}
            <ChallengeDetailModal
                challenge={selectedChallenge}
                isOpen={isModalOpen}
                onClose={closeModal}
            />
        </div>
    );
}
