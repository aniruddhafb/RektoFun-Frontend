"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Clan } from "./ClanTypes";
import { BlueCheckIcon, LockIcon, ShieldIcon, TrophyIcon, UsersIcon, TrendingUpIcon, ArrowRightIcon } from "./Icons";

export function ClanCard({ clan }: { clan: Clan }) {
    const router = useRouter();
    const isInviteOnly = clan.type === "Invite Only";

    const handleClick = () => {
        router.push(`/clan/${clan.name.toLowerCase().replace(/\s+/g, '-')}`);
    };

    // Generate slug from clan name
    const slug = clan.name.toLowerCase().replace(/\s+/g, '-');

    return (
        <div
            onClick={handleClick}
            className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/70 shadow-sm hover:shadow-md transition-all hover:bg-white/70 overflow-hidden cursor-pointer"
        >
            {/* Top section */}
            <div className="p-5 pb-3">
                <div className="flex gap-4">
                    {/* Logo with rank badge */}
                    <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border border-white/80 shadow-sm ml-2">
                            <Image
                                src={clan.logo}
                                alt={clan.name}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">{clan.name}</h3>
                                {clan.verified && (
                                    <BlueCheckIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                )}
                            </div>
                        </div>

                        <p className="text-sm text-gray-500 mt-1 leading-snug line-clamp-2">{clan.description}</p>

                        {/* Leader */}
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                <Image
                                    src={clan.leaderAvatar}
                                    alt={clan.leader}
                                    width={20}
                                    height={20}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-sm text-gray-700 font-medium">{clan.leader}</span>
                            <span className="text-xs text-gray-400">(Leader)</span>
                        </div>
                    </div>
                </div>

                {/* Type & Members row - centered */}
                <div className="flex items-center justify-center gap-3 mt-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${isInviteOnly
                        ? "bg-orange-50 text-orange-600 border-orange-200"
                        : "bg-green-50 text-green-700 border-green-200"
                        }`}>
                        {isInviteOnly ? (
                            <LockIcon className="w-3 h-3" />
                        ) : (
                            <ShieldIcon className="w-3 h-3" />
                        )}
                        {clan.type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <UsersIcon className="w-4 h-4 text-gray-400" />
                        {clan.members} / {clan.maxMembers}
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100/80 mx-4" />

            {/* Stats row - centered */}
            <div className="grid grid-cols-3 divide-x divide-gray-100/80 px-1 py-3">
                <div className="flex flex-col items-center justify-center gap-0.5 px-2">
                    <div className="flex items-center gap-1">
                        <TrophyIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-sm font-bold text-gray-900">{clan.totalWins}</span>
                    </div>
                    <span className="text-xs text-gray-400">Total Wins</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-0.5 px-2">
                    <div className="flex items-center gap-1">
                        <UsersIcon className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-sm font-bold text-gray-900">{clan.totalRekts.toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-gray-400">Total Rekts</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-0.5 px-2">
                    <div className="flex items-center gap-1">
                        <TrendingUpIcon className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-sm font-bold text-gray-900">{clan.winRate}%</span>
                    </div>
                    <span className="text-xs text-gray-400">Win Rate</span>
                </div>
            </div>

            {/* View Clan Button */}
            <div className="px-4 pb-4">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/clan/${slug}`);
                    }}
                    className="cursor-pointer w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 group text-sm sm:text-base"
                >
                    View Clan <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
}