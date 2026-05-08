"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ChallengeDetailModal from "@/app/components/challenge-components/ChallengeDetailModal";
import {
    ChallengeListItem,
    getChallenges,
} from "@/app/lib/challenges-service/challenges";

type ActivityType = "all";

const filterTabs: { label: string; value: ActivityType; count?: number }[] = [
    { label: "All Activity", value: "all" }
];
const SKELETON_CARDS_COUNT = 5;

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

export default function ActivityPage() {
    const PAGE_SIZE = 5;
    const [activeFilter, setActiveFilter] = useState<ActivityType>("all");
    const [activities, setActivities] = useState<ChallengeListItem[]>([]);
    const [totalActivities, setTotalActivities] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedChallenge, setSelectedChallenge] = useState<ChallengeListItem | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadActivities = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setActivities([]);
                const offset = (currentPage - 1) * PAGE_SIZE;
                const response = await getChallenges({ limit: PAGE_SIZE, offset });
                if (!isMounted) return;

                const sorted = [...response.challenges].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setActivities(sorted);
                setTotalActivities(response.count ?? 0);
            } catch (fetchError) {
                if (!isMounted) return;
                setError(fetchError instanceof Error ? fetchError.message : "Failed to load activity.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadActivities();
        return () => {
            isMounted = false;
        };
    }, [currentPage]);

    const filteredActivities = useMemo(() => {
        if (activeFilter === "all") return activities;
        return activities;
    }, [activeFilter, activities]);
    const totalPages = Math.max(1, Math.ceil(totalActivities / PAGE_SIZE));
    const visiblePages = useMemo(
        () => Array.from({ length: totalPages }, (_, index) => index + 1),
        [totalPages]
    );

    const handleActivityClick = (challenge: ChallengeListItem) => {
        setSelectedChallenge(challenge);
        setIsDetailModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#f3e1d7]">
            {/* Header Section */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl sm:text-4xl font-bold text-[#2d1f1a]">
                        Activity
                    </h1>
                </div>
                <p className="text-[#5c4a42] text-sm sm:text-base">
                    View the latest challenges and bets made across Rekto.fun.
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveFilter(tab.value)}
                            className={`px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-sm ${activeFilter === tab.value
                                ? "bg-[#2d1f1a] text-[#f3e1d7] shadow-md"
                                : "bg-white/80 text-[#5c4a42] hover:bg-white hover:text-[#2d1f1a] border border-[#d4b8a8]"
                                }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeFilter === tab.value ? "bg-[#f3e1d7]/20" : "bg-[#f3e1d7]"}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Activity Feed */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                <div className="space-y-3">
                    {isLoading && (
                        Array.from({ length: SKELETON_CARDS_COUNT }).map((_, index) => (
                            <div
                                key={`activity-skeleton-${index}`}
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

                    {!isLoading && !error && filteredActivities.length === 0 && (
                        <div className="bg-[#f8ede7] rounded-2xl p-6 border border-[#e8d5c8] text-[#5c4a42]">
                            No activity yet.
                        </div>
                    )}

                    {!isLoading && filteredActivities.map((item) => {
                        const creatorName = item.creator.username || "Unknown user";
                        const creatorWallet = item.creator.wallet_address || "";
                        const profileSlug = creatorWallet || creatorName;
                        const avatar = item.creator.profile_image || item.market.icon || "/scribbles/btc.png";
                        const betAmount = item.initial_bet ?? 0;
                        const betUnit = item.market.name || "SOL";
                        const timeAgo = formatTimeAgo(item.created_at);
                        const resolveCountdown = formatResolveCountdown(item.resolve_time);

                        return (
                            <div
                                key={item.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleActivityClick(item)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        handleActivityClick(item);
                                    }
                                }}
                                className="cursor-pointer group bg-[#f8ede7] hover:bg-white/50 rounded-2xl p-4 transition-all duration-200 border border-[#e8d5c8] hover:border-[#d4b8a8] hover:shadow-lg"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Avatar with status */}
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-[#d4b8a8] shadow-md bg-white`}>
                                            <Image
                                                src={avatar}
                                                alt={creatorName}
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
                                            <Link
                                                href={`/profile/${profileSlug}`}
                                                onClick={(event) => event.stopPropagation()}
                                                className="font-bold text-[#2d1f1a] hover:text-[#5c4a42] transition-colors"
                                            >
                                                {creatorName}
                                            </Link>
                                            <span className="text-[#5c4a42]">bet</span>
                                            <span className="font-bold text-[#2d1f1a]">${betAmount}</span>
                                            <span className="text-[#5c4a42]">on</span>
                                            <span className="font-semibold text-[#2d1f1a]">{item.title}</span>
                                            {resolveCountdown && <span className="text-[#8b7355]">{resolveCountdown}</span>}
                                        </div>

                                        <div className="mt-1.5">
                                            <span className="text-[#a08070] text-xs">{timeAgo}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f3e1d7]/50 group-hover:bg-[#2d1f1a] text-[#5c4a42] group-hover:text-[#f3e1d7] transition-all duration-200 flex items-center justify-center group-hover:shadow-md">
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
                        );
                    })}
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
            </div>

            <ChallengeDetailModal
                challenge={selectedChallenge}
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedChallenge(null);
                }}
            />

            {/* Custom scrollbar hide styles */}
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
