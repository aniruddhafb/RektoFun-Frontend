"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Dummy data for the profile
const profileData = {
    username: "DegenLord",
    avatar: "/scribbles/pepe.png",
    refCode: "4KP098",
    bio: "King of the Degens, betting big and laughing at tears of REKTed noobs",
    joinedDate: "Feb",
    balance: {
        sol: 7.02,
        solUsd: 1160,
        dgenBalance: true,
        dgenRank: true,
    },
    stats: {
        wins: 528,
        rekt: 145,
        prizePool: 21,
        challengesCreated: 312,
        goTokens: "1.6K",
        olTokens: 26,
        shares: 9,
    },
};

// Dummy data for current challenges
const currentChallenges = [
    {
        id: 1,
        icon: "/scribbles/btc.png",
        name: "Bitcoin Below $64,250",
        prize: "+$308",
        prizeToken: "SOL",
        amount: "26 SOL",
        prizes: "9 Prizes",
        timeLeft: "1h25m",
    },
    {
        id: 2,
        icon: "/scribbles/pepe.png",
        name: "PEPE Below 0.000010",
        prize: "+$100",
        prizeToken: "SOL",
        amount: "28 SOL",
        shares: "9 Shares",
    },
];

// Dummy data for previous challenges
const previousChallenges = [
    {
        id: 1,
        icon: "/scribbles/sol.png",
        name: "Solana Above $162 in 2 Hours",
        result: "+27200",
        resultToken: "+2.20",
        amount: "270M - $ 2 SOL",
        status: "won",
    },
    {
        id: 2,
        icon: "/scribbles/doge.png",
        name: "Ethereum Below $3,100",
        result: "-$ 2 SOL",
        amount: "2 SOL",
        status: "lost",
    },
];

// Tab types
type TabType = "challenges" | "wins" | "stats" | "badges";

export default function ProfilePage({ params }: { params: { slug: string } }) {
    const [activeTab, setActiveTab] = useState<TabType>("challenges");
    const [activeBottomTab, setActiveBottomTab] = useState<TabType>("challenges");

    const tabs: { id: TabType; label: string }[] = [
        { id: "challenges", label: "Challenges" },
        { id: "wins", label: "Wins" },
        { id: "stats", label: "Stats" },
        { id: "badges", label: "Badges" },
    ];

    return (
        <div className="min-h-screen bg-[#f3e1d7] pb-8">
            {/* Profile Header Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Left: Avatar and Info */}
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#d4a574] overflow-hidden bg-[#e8d5c4] shadow-lg">
                                <Image
                                    src={profileData.avatar}
                                    alt={profileData.username}
                                    width={112}
                                    height={112}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#d4a574] rounded-full flex items-center justify-center border-2 border-[#f3e1d7]">
                                <span className="text-xs">👑</span>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {profileData.username}
                            </h1>

                            {/* Ref Code */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">🌙</span>
                                <span className="text-sm text-gray-600">ref={profileData.refCode}</span>
                                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Bio */}
                            <p className="text-sm text-gray-600 max-w-md">
                                {profileData.bio}{" "}
                                <span className="inline-flex items-center gap-1">
                                    <span>🐦</span>
                                    <span className="text-gray-500">Joined {profileData.joinedDate}</span>
                                </span>
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <button className="px-4 py-1.5 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 border border-gray-200 hover:bg-white transition-all">
                                    Ref-
                                </button>
                                <button className="px-4 py-1.5 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 border border-gray-200 hover:bg-white transition-all flex items-center gap-1">
                                    Joined <span className="text-xs">🎲</span>
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

                    {/* Right: Balance Card */}
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-sm min-w-[200px]">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-[#d4a574] flex items-center justify-center">
                                <span className="text-xs">🪙</span>
                            </div>
                            <span className="font-semibold text-gray-900">
                                {profileData.balance.sol} SOL
                            </span>
                            <span className="text-sm text-gray-500">
                                (${profileData.balance.solUsd.toLocaleString()})
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Balance</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm">🛡️</span>
                                    <span className="text-sm font-medium text-gray-700">DGEN</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Rank</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm">🛡️</span>
                                    <span className="text-sm font-medium text-gray-700">DGEN</span>
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

                {/* Stats Cards */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Wins Card */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">✨</span>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {profileData.stats.wins} <span className="text-lg font-medium">Wins</span>
                                </div>
                                <div className="text-sm text-gray-500">Pending Result</div>
                            </div>
                        </div>
                    </div>

                    {/* Rekts Card */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🔥</span>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {profileData.stats.rekt} <span className="text-lg font-medium">Rekts</span>
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                    Prize Pool <span className="text-orange-500">🔥</span> {profileData.stats.prizePool}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Challenges Created Card */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">⚡</span>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {profileData.stats.challengesCreated} <span className="text-lg font-medium">Challenges Created</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-sm text-gray-500 flex items-center gap-1">
                                            <span className="text-[#d4a574]">🪙</span> {profileData.stats.olTokens}OL
                                        </span>
                                        <span className="text-sm text-gray-500">|</span>
                                        <span className="text-sm text-gray-500">{profileData.stats.shares} Shares</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-[#22c55e]">
                                <span className="text-xl">🪙</span>
                                <span className="font-semibold">{profileData.stats.goTokens}</span>
                                <span className="text-xs bg-[#22c55e]/20 text-[#22c55e] px-1.5 py-0.5 rounded">GO</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Challenges Grid */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Current Challenges */}
                    <div className="bg-white/30 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50">
                            <h3 className="font-semibold text-gray-900">Current Challenges</h3>
                            <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors">
                                View All <span>→</span>
                            </button>
                        </div>
                        <div className="divide-y divide-gray-200/50">
                            {currentChallenges.map((challenge) => (
                                <div
                                    key={challenge.id}
                                    className="px-4 py-4 hover:bg-white/40 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center border border-gray-200/50">
                                                <Image
                                                    src={challenge.icon}
                                                    alt={challenge.name}
                                                    width={28}
                                                    height={28}
                                                    className="w-7 h-7 object-contain"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                                                    {challenge.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-[#d4a574]">🪙</span> {challenge.amount}
                                                    </span>
                                                    {challenge.prizes && (
                                                        <>
                                                            <span>|</span>
                                                            <span className="flex items-center gap-1">
                                                                <span>�</span> {challenge.prizes}
                                                            </span>
                                                        </>
                                                    )}
                                                    {challenge.shares && (
                                                        <>
                                                            <span>|</span>
                                                            <span>{challenge.shares}</span>
                                                        </>
                                                    )}
                                                    {challenge.timeLeft && (
                                                        <span className="text-orange-500">{challenge.timeLeft}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="font-semibold text-gray-900">{challenge.prize}</span>
                                            <span className="text-xs bg-[#22c55e]/20 text-[#22c55e] px-2 py-0.5 rounded-full">
                                                {challenge.prizeToken}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-4 py-3 border-t border-gray-200/50">
                            <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mx-auto transition-colors">
                                View All <span>→</span>
                            </button>
                        </div>
                    </div>

                    {/* Previous Challenges */}
                    <div className="bg-white/30 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50">
                            <h3 className="font-semibold text-gray-900">Previous Challenges</h3>
                            <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors">
                                View All <span>→</span>
                            </button>
                        </div>
                        <div className="divide-y divide-gray-200/50">
                            {previousChallenges.map((challenge) => (
                                <div
                                    key={challenge.id}
                                    className="px-4 py-4 hover:bg-white/40 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center border border-gray-200/50">
                                                <Image
                                                    src={challenge.icon}
                                                    alt={challenge.name}
                                                    width={28}
                                                    height={28}
                                                    className="w-7 h-7 object-contain"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                                                    {challenge.name}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-[#d4a574]">🪙</span> {challenge.amount}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {challenge.result && (
                                                <span className={`font-semibold ${challenge.status === "won" ? "text-[#22c55e]" : "text-gray-900"}`}>
                                                    {challenge.result}
                                                </span>
                                            )}
                                            {challenge.resultToken && (
                                                <span className="text-xs bg-gray-200/50 text-gray-700 px-2 py-0.5 rounded-full">
                                                    {challenge.resultToken}
                                                </span>
                                            )}
                                            {challenge.status === "lost" && (
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <span className="text-orange-500">🔥</span> {challenge.amount.split(" ")[0]}
                                                </span>
                                            )}
                                            {challenge.status === "won" && (
                                                <button className="text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded-full px-3 py-1 transition-colors">
                                                    Follow
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-4 py-3 border-t border-gray-200/50">
                            <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mx-auto transition-colors">
                                View All <span>→</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Tab Navigation (Mobile/Alternative) */}
                <div className="mt-8 bg-white/30 backdrop-blur-sm rounded-xl border border-gray-200/50 p-1">
                    <div className="flex justify-between sm:justify-start sm:gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={`bottom-${tab.id}`}
                                onClick={() => setActiveBottomTab(tab.id)}
                                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeBottomTab === tab.id
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
