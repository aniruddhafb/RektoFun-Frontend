"use client";

import Image from "next/image";
import Link from "next/link";
import { ClanData } from "./types";
import {
    ChevronLeftIcon,
    ShareIcon,
    UserPlusIcon,
    VerifiedIcon,
    TrophyIcon,
    SwordsIcon,
    TrendingUpIcon,
    StarIcon,
    ShieldIcon,
    UsersIcon
} from "./icons";

interface ClanHeaderProps {
    clanData: ClanData;
}

const ClanHeader = ({ clanData }: ClanHeaderProps) => {
    return (
        <>
            {/* ── Top Action Bar ── */}
            <div className="flex items-center justify-between mb-5">
                <Link
                    href="/clans"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                    Back to Clans
                </Link>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/70 hover:bg-white/90 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 transition-all shadow-sm">
                        <ShareIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Share Clan</span>
                    </button>
                </div>
            </div>

            {/* ── Clan Header Card ── */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm p-5 mb-5">
                <div className="flex flex-col sm:flex-row gap-5">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-white/80 shadow-md flex items-center justify-center">
                            <Image
                                src={clanData.logo}
                                alt={clanData.name}
                                width={112}
                                height={112}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{clanData.name}</h1>
                            {clanData.verified && (
                                <VerifiedIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
                            )}
                        </div>
                        <p className="text-gray-700 font-semibold text-sm">{clanData.tagline}</p>
                        <p className="text-gray-500 text-sm mt-0.5">{clanData.description}</p>

                        {/* Leader */}
                        <div className="flex items-center gap-2 mt-2.5">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                <Image
                                    src={clanData.leaderAvatar}
                                    alt={clanData.leader}
                                    width={20}
                                    height={20}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-sm font-semibold text-orange-500">{clanData.leader}</span>
                            <span className="text-xs text-gray-400">(Leader)</span>
                        </div>

                        {/* Tags */}
                        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                <ShieldIcon className="w-3 h-3" />
                                Public
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                                <UsersIcon className="w-4 h-4 text-gray-400" />
                                {clanData.members} / {clanData.maxMembers} Members
                            </span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex sm:flex-row flex-wrap gap-6 sm:gap-8 items-center justify-start sm:justify-center">
                        <div className="flex flex-col items-center gap-1">
                            <TrophyIcon className="w-5 h-5 text-gray-700" />
                            <span className="text-xl font-bold text-gray-900">{clanData.totalWins}</span>
                            <span className="text-xs text-gray-400">Total Wins</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <SwordsIcon className="w-5 h-5 text-gray-700" />
                            <span className="text-xl font-bold text-gray-900">{clanData.totalRekts.toLocaleString()}</span>
                            <span className="text-xs text-gray-400">Total Rekts</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <TrendingUpIcon className="w-5 h-5 text-gray-700" />
                            <span className="text-xl font-bold text-gray-900">{clanData.winRate}%</span>
                            <span className="text-xs text-gray-400">Win Rate</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <StarIcon className="w-5 h-5 text-orange-400" />
                            <span className="text-xl font-bold text-orange-500">{clanData.rektPoints}</span>
                            <span className="text-xs text-gray-400">REKT Points</span>
                        </div>
                    </div>

                    {/* Join / Manage */}
                    <div className="flex-shrink-0 flex flex-col items-stretch sm:items-end gap-3 sm:min-w-[160px]">
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
                            <UserPlusIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Invite Members</span>
                        </button>
                        <button className="w-full px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                            Join Clan
                        </button>
                        <button className="w-full px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                            Leave Clan
                        </button>
                        <button className="w-full px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-all shadow-sm">
                            Manage Clan
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClanHeader;
