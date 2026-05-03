"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clan } from "./ClanTypes";
import {
    BlueCheckIcon,
    LockIcon,
    ShieldIcon,
    TrophyIcon,
    UsersIcon,
    TrendingUpIcon,
    ArrowRightIcon,
} from "./Icons";

interface ClanCardProps {
    clan: Clan;
}

export function ClanCard({ clan }: ClanCardProps) {
    const router = useRouter();
    const isInviteOnly = clan.type === "Invite Only";

    const handleClick = () => {
        router.push(`/clan/${clan.id}`);
    };

    const handleViewClan = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/clan/${clan.id}`);
    };

    return (
        <div
            onClick={handleClick}
            className="group bg-white/80 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-xl hover:border-gray-300/80 transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1"
        >
            {/* Header Section */}
            <div className="p-5">
                {/* Logo and Basic Info */}
                <div className="flex gap-4 mb-4">
                    {/* Clan Logo */}
                    <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-sm">
                            <Image
                                src={clan.logo}
                                alt={clan.name}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                        </div>
                    </div>

                    {/* Clan Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight truncate">
                                {clan.name}
                            </h3>
                            {clan.verified && (
                                <BlueCheckIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            )}
                        </div>

                        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                            {clan.description}
                        </p>

                        {/* Leader Info */}
                        <div className="flex items-center gap-2 mt-2.5">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 ring-2 ring-gray-100">
                                <Image
                                    src={clan.leaderAvatar}
                                    alt={clan.leader}
                                    width={24}
                                    height={24}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex items-center gap-1 min-w-0">
                                <span className="text-sm font-medium text-gray-700 truncate">{clan.leader}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Type & Members Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${isInviteOnly
                            ? "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                            : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            }`}
                    >
                        {isInviteOnly ? (
                            <LockIcon className="w-3.5 h-3.5" />
                        ) : (
                            <ShieldIcon className="w-3.5 h-3.5" />
                        )}
                        {clan.type}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                        <UsersIcon className="w-3.5 h-3.5 text-gray-400" />
                        {clan.members} / {clan.maxMembers} members
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 mx-5" />

            {/* Stats Section */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 px-5 py-4 bg-gradient-to-b from-white to-gray-50/50">
                <div className="flex flex-col items-center justify-center gap-1 px-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                            <TrophyIcon className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">{clan.totalWins}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Wins</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 px-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                            <UsersIcon className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">{clan.totalRekts.toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Rekts</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 px-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                            <TrendingUpIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">{clan.winRate}%</span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Win Rate</span>
                </div>
            </div>

            {/* View Clan Button */}
            <div className="px-5 pb-5 pt-2">
                <button
                    onClick={handleViewClan}
                    className="cursor-pointer w-full py-3 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group/btn text-sm sm:text-base"
                >
                    View Clan
                    <ArrowRightIcon className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}