"use client";

import React from "react";
import Image from "next/image";

interface ProfileHeaderProps {
    username: string;
    avatar: string;
    walletAddress: string;
    bio: string;
    joinedDate: string;
    balance: {
        sol: number;
        solUsd: number;
    };
    stats: {
        wins: number;
        rekts: number;
        totalChallenges: number;
        winRatio: number;
    };
}

export function ProfileHeader({
    username,
    avatar,
    walletAddress,
    bio,
    joinedDate,
    balance,
    stats,
}: ProfileHeaderProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-6">
            {/* Left: Avatar and Info */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 flex-1">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#d4a574] overflow-hidden bg-[#e8d5c4] shadow-lg">
                        <Image
                            src={avatar}
                            alt={username}
                            width={112}
                            height={112}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* User Info */}
                <div className="flex flex-col gap-2 justify-center">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {username}
                    </h1>

                    {/* Wallet Address */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">🌙</span>
                        <span className="text-sm text-gray-600 font-mono">{walletAddress}</span>
                        <button
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => navigator.clipboard.writeText(walletAddress)}
                            title="Copy address"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-gray-600 max-w-md">
                        {bio}{" "}
                        <span className="inline-flex items-center gap-1">
                            <span className="text-gray-500">Joined {joinedDate}</span>
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
                            <span className="text-2xl font-bold text-gray-900">{balance.sol}</span>
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
                            <p className="text-lg font-bold text-emerald-700 leading-none">{stats.wins}</p>
                            <p className="text-xs text-gray-600">Wins</p>
                        </div>
                    </div>

                    {/* Rekts */}
                    <div className="flex items-center gap-2">
                        <span className="text-lg">💀</span>
                        <div>
                            <p className="text-lg font-bold text-red-700 leading-none">{stats.rekts}</p>
                            <p className="text-xs text-gray-600">Rekts</p>
                        </div>
                    </div>

                    {/* Win Rate */}
                    <div className="flex items-center gap-2">
                        <span className="text-lg">📊</span>
                        <div>
                            <p className="text-lg font-bold text-amber-700 leading-none">{stats.winRatio}%</p>
                            <p className="text-xs text-gray-600">Win Rate</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}