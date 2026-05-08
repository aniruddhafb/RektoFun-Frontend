"use client";

import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { topTradersData } from "./types";
import { SparkleIcon, ArrowUpIcon, StarBadge, DiamondIcon, ChevronIcon } from "./icons";

interface TopTradersSectionProps {
    showTopTraders: boolean;
    onToggleTopTraders: () => void;
}

export function TopTradersSection({ showTopTraders, onToggleTopTraders }: TopTradersSectionProps) {
    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg">Top Traders in the Bitcoin Challenge Markets</h3>
                <button
                    onClick={onToggleTopTraders}
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
                                                    sizes="40px"
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
    );
}