"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChallengeListItem } from "@/app/lib/challenges-service/challenges";

interface ProfileChallengeCardProps {
    challenge: ChallengeListItem;
    onClick?: (challenge: ChallengeListItem) => void;
}

function parseDateValue(value: string | number | null | undefined): number {
    if (typeof value === "number") return value;
    if (!value) return Date.now();

    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? Date.now() : parsed;
}

function formatTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}hr ago`;
    if (minutes > 0) return `${minutes}m ago`;

    return "just now";
}

function formatTimeLeft(expiresAt: number): string {
    const diff = expiresAt - Date.now();

    if (diff <= 0) return "Expired";

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} days left`;
    if (hours > 0) return `${hours}h left`;

    return `${minutes}m left`;
}

function getStatusLabel(status: ChallengeListItem["status"]): { label: string; color: string; bg: string } {
    switch (status) {
        case "open":
            return { label: "Open", color: "text-emerald-700", bg: "bg-emerald-100" };
        case "locked":
            return { label: "Locked", color: "text-blue-700", bg: "bg-blue-100" };
        case "resolved":
            return { label: "Resolved", color: "text-amber-700", bg: "bg-amber-100" };
        case "cancelled":
            return { label: "Cancelled", color: "text-gray-600", bg: "bg-gray-100" };
        default:
            return { label: "Unknown", color: "text-[#8b5e3c]", bg: "bg-[#f3e1d7]" };
    }
}

function getChallengeTypeLabel(challenge: ChallengeListItem): string {
    switch (challenge.mode) {
        case "pvp":
            return "Head to Head";
        case "pool":
            return "Pool Challenge";
        default:
            return challenge.market.name || "Challenge";
    }
}

function getConviction(challenge: ChallengeListItem): number {
    if (challenge.total_pool <= 0) return 0;

    const ratio = Math.min((challenge.initial_bet / Math.max(challenge.total_pool, 1)) * 100, 100);
    return Math.round(ratio) || 72;
}

function getImageSrc(src: string | null | undefined, fallback: string): string {
    return src && src.trim().length > 0 ? src : fallback;
}

export function ProfileChallengeCard({ challenge, onClick }: ProfileChallengeCardProps) {
    const [bookmarked, setBookmarked] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const statusInfo = getStatusLabel(challenge.status);
    const conviction = getConviction(challenge);
    const timeAgo = formatTimeAgo(parseDateValue(challenge.created_at));
    const timeLeft = formatTimeLeft(parseDateValue(challenge.expire_time));
    const creatorImage = getImageSrc(challenge.creator.profile_image, "/profiles/4.svg");
    const marketImage = getImageSrc(challenge.market.icon || challenge.market.image, "/scribbles/btc.png");
    const participantCount = (challenge.total_challengers ?? 0) + (challenge.total_opponents ?? 0);

    const handleClick = () => {
        if (onClick) onClick(challenge);
    };

    return (
        <div
            onClick={handleClick}
            className="bg-white rounded-2xl border border-[#e8d5c8] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
        >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#e8d5c8] flex-shrink-0">
                        <Image
                            src={creatorImage}
                            alt={challenge.creator.username}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-sm font-semibold text-[#2d1f1a]">
                        {challenge.creator.username}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{timeAgo}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setBookmarked((b) => !b);
                        }}
                        className="w-7 h-7 rounded-lg border border-[#e8d5c8] flex items-center justify-center hover:bg-[#f3e1d7] transition-colors"
                    >
                        <svg
                            className={`w-3.5 h-3.5 transition-colors ${bookmarked ? "text-[#c17a3a] fill-[#c17a3a]" : "text-gray-400"}`}
                            fill={bookmarked ? "currentColor" : "none"}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="px-4 pb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.color} border border-current/20`}>
                    {statusInfo.label}
                </span>
            </div>

            <div className="flex items-start gap-3 px-4 pb-3">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#f3e1d7] to-[#e8d5c8] border border-[#e8d5c8] flex items-center justify-center">
                    <Image
                        src={marketImage}
                        alt={challenge.market.name}
                        width={48}
                        height={48}
                        className="w-10 h-10 object-contain"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[#2d1f1a] text-sm leading-snug line-clamp-2">
                        {challenge.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5 text-[#c17a3a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="font-medium">${challenge.total_pool}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5 text-[#c17a3a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span className="font-medium">{timeLeft}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5 text-[#c17a3a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span className="font-medium">{challenge.mode.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 pb-3">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#2d1f1a]">Conviction</span>
                    <span className="text-xs font-bold text-[#2d1f1a]">{conviction}%</span>
                </div>
                <div className="w-full h-2 bg-[#f3e1d7] rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[#c17a3a] to-[#e8a84a] transition-all duration-500"
                        style={{ width: `${conviction}%` }}
                    />
                </div>
            </div>

            <div className="px-4 pb-4">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded((v) => !v);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#fdf5ec] border border-[#e8d5c8] hover:bg-[#f3e1d7] transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#2d1f1a]">
                            {getChallengeTypeLabel(challenge)}
                        </span>
                        <span className="text-xs text-gray-500">&middot;</span>
                        <span className="text-xs text-gray-500">{challenge.market.name}</span>
                    </div>
                    <svg
                        className={`w-4 h-4 text-[#8b5e3c] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {expanded && (
                    <div className="mt-2 px-4 py-3 rounded-xl bg-[#fdf5ec] border border-[#e8d5c8] space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Bet Amount</span>
                            <span className="font-semibold text-[#2d1f1a]">${challenge.initial_bet}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Mode</span>
                            <span className="font-semibold text-[#2d1f1a]">{challenge.mode === "pvp" ? "1v1 PVP" : "Pool"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Participants</span>
                            <span className="font-semibold text-[#2d1f1a]">
                                {participantCount}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
