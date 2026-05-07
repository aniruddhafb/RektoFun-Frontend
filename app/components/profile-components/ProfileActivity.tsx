"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ChallengeListItem,
    getChallenges,
} from "@/app/lib/challenges-service/challenges";

interface ProfileActivityProps {
    userId: string;
    username: string;
    avatar?: string;
}

const PAGE_SIZE = 10;
const SKELETON_CARDS_COUNT = 4;

function formatTimeAgo(dateString: string): string {
    const dateMs = new Date(dateString).getTime();
    if (Number.isNaN(dateMs)) return "recently";
    const diffMs = Date.now() - dateMs;
    if (diffMs < 0) return "just now";

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
}

function formatResolveCountdown(resolveTime: string): string {
    const resolveMs = new Date(resolveTime).getTime();
    if (Number.isNaN(resolveMs)) return "";

    const diffMs = resolveMs - Date.now();
    if (diffMs <= 0) return "ended";

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `in ${days}d ${hours}h`;
    if (hours > 0) return `in ${hours}h ${minutes}m`;
    return `in ${minutes}m`;
}

export function ProfileActivity({ userId, username, avatar }: ProfileActivityProps) {
    const [activities, setActivities] = useState<ChallengeListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalActivities, setTotalActivities] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const loadUserActivities = async () => {
            if (!userId) {
                setActivities([]);
                setTotalActivities(0);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const offset = (currentPage - 1) * PAGE_SIZE;
                const response = await getChallenges({
                    created_by: userId,
                    limit: PAGE_SIZE,
                    offset,
                });
                if (!isMounted) return;

                const sorted = [...response.challenges].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setActivities(sorted);
                setTotalActivities(response.count ?? 0);
            } catch (fetchError) {
                if (!isMounted) return;
                setError(fetchError instanceof Error ? fetchError.message : "Failed to load user activity.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadUserActivities();

        return () => {
            isMounted = false;
        };
    }, [userId, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [userId]);

    const totalPages = Math.max(1, Math.ceil(totalActivities / PAGE_SIZE));
    const visiblePages = useMemo(
        () => Array.from({ length: totalPages }, (_, index) => index + 1),
        [totalPages]
    );

    return (
        <div className="mt-6 max-w-3xl">
            <div className="space-y-3">
                {isLoading && (
                    Array.from({ length: SKELETON_CARDS_COUNT }).map((_, index) => (
                        <div
                            key={`profile-activity-skeleton-${index}`}
                            className="bg-[#f8ede7] rounded-2xl p-4 border border-[#e8d5c8] animate-pulse"
                            aria-hidden="true"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#e8d5c8] flex-shrink-0" />

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="h-4 w-24 rounded-full bg-[#e8d5c8]" />
                                        <div className="h-4 w-10 rounded-full bg-[#e8d5c8]" />
                                        <div className="h-4 w-14 rounded-full bg-[#e8d5c8]" />
                                        <div className="h-4 w-8 rounded-full bg-[#e8d5c8]" />
                                        <div className="h-4 w-40 rounded-full bg-[#e8d5c8]" />
                                    </div>
                                    <div className="mt-2 h-3 w-16 rounded-full bg-[#e8d5c8]" />
                                </div>

                                <div className="w-8 h-8 rounded-full bg-[#e8d5c8] flex-shrink-0" />
                            </div>
                        </div>
                    ))
                )}

                {!isLoading && error && (
                    <div className="bg-red-50 rounded-2xl p-6 border border-red-200 text-red-700">
                        Failed to load activity: {error}
                    </div>
                )}

                {!isLoading && !error && activities.length === 0 && (
                    <div className="bg-[#f8ede7] rounded-2xl p-6 border border-[#e8d5c8] text-[#5c4a42]">
                        No activity yet.
                    </div>
                )}

                {!isLoading && !error && activities.map((item) => (
                    <div
                        key={item.id}
                        className="group bg-[#f8ede7] hover:bg-white/50 rounded-2xl p-4 transition-all duration-200 border border-[#e8d5c8] hover:border-[#d4b8a8] hover:shadow-lg"
                    >
                        <div className="flex items-start gap-4">
                            {/* Avatar with status */}
                            <div className="relative flex-shrink-0">
                                <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-[#d4b8a8] shadow-md bg-white`}>
                                    <Image
                                        src={item.creator.profile_image || avatar || "/scribbles/btc.png"}
                                        alt={item.creator.username || username}
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
                                    <span className="font-bold text-[#2d1f1a] hover:text-[#5c4a42] transition-colors">You</span>
                                    <span className="text-[#5c4a42]">created</span>
                                    <span className="font-bold text-[#2d1f1a]">${item.initial_bet ?? 0}</span>
                                    <span className="text-[#5c4a42]">challenge for</span>
                                    <span className="font-semibold text-[#2d1f1a]">{item.title}</span>
                                    <span className="text-[#8b7355]">{formatResolveCountdown(item.resolve_time)}</span>
                                </div>

                                <div className="mt-1.5">
                                    <span className="text-[#a08070] text-xs">{formatTimeAgo(item.created_at)}</span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div
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
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!isLoading && !error && totalActivities > 0 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full scrollbar-hide">
                        {visiblePages.map((page) => (
                            <button
                                key={page}
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                    ? "bg-[#d4c4b5] text-gray-800"
                                    : "text-gray-600 hover:bg-white/30"
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
