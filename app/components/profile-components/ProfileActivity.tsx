"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import {
    Challenge,
} from "@/app/lib/challenges-service/challenges";
import { ChallengeActivity, getActivityLabel, getActivityVerb, getChallengeActivities } from "@/app/lib/activity-service/activity";

interface ProfileActivityProps {
    userId: string;
    username: string;
    avatar?: string;
    isOwnProfile?: boolean;
    onActivityClick?: (challenge: Challenge) => void;
    searchQuery: string;
    sortOrder: "latest" | "oldest";
}

const INITIAL_PAGE_SIZE = 6;
const NEXT_PAGE_SIZE = 9;
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

function getModeLabel(mode?: string): string {
    const value = mode?.toLowerCase() || "";
    if (value.includes("pvp")) return "PVP";
    if (value.includes("team") || value.includes("multi")) return "Team";
    return mode || "Challenge";
}

function getResolutionStatus(challenge: Challenge): string {
    const status = (challenge.status || "").toLowerCase();
    if (status === "resolved" || challenge.resolved_at) return "Resolved";
    if (status === "cancelled") return "Cancelled";
    if (status === "locked" || status === "pending_resolution") return "Resolving";
    return "Pending";
}

function getResolutionStatusClass(status: string): string {
    if (status === "Resolved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (status === "Cancelled") return "border-red-200 bg-red-50 text-red-700";
    if (status === "Resolving") return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-sky-200 bg-sky-50 text-sky-700";
}

function ActivitySkeleton({ id }: { id: string }) {
    return (
        <div key={id} className="overflow-hidden rounded-[28px] border border-[#ead7ca] bg-white/80 p-5" aria-hidden="true">
            <div className="flex items-start gap-4">
                <div className="h-14 w-14 flex-shrink-0 rounded-2xl bg-[#efe2d7] animate-pulse" />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="h-4 w-24 rounded-full bg-[#efe2d7] animate-pulse" />
                        <div className="h-4 w-16 rounded-full bg-[#efe2d7] animate-pulse" />
                    </div>
                    <div className="mt-3 h-6 w-[min(34rem,92%)] rounded-full bg-[#efe2d7] animate-pulse" />
                    <div className="mt-2 h-4 w-[min(20rem,68%)] rounded-full bg-[#efe2d7] animate-pulse" />
                </div>
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-[#efe2d7] animate-pulse" />
            </div>
        </div>
    );
}

export function ProfileActivity({ userId, username, avatar, onActivityClick, searchQuery, sortOrder }: ProfileActivityProps) {
    const [activities, setActivities] = useState<ChallengeActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const filteredActivities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return activities
            .filter((activity) => !query || [activity.challenge.statement, activity.challenge.title, activity.challenge.ticker, activity.challenge.trading_pair, getActivityVerb(activity.type)]
                .some((value) => value?.toLowerCase().includes(query)))
            .sort((a, b) => {
                const difference = new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
                return sortOrder === "latest" ? difference : -difference;
            });
    }, [activities, searchQuery, sortOrder]);

    useEffect(() => {
        let isMounted = true;

        const loadUserActivities = async () => {
            if (!userId) {
                setActivities([]);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const response = await getChallengeActivities();
                if (!isMounted) return;

                const numericUserId = Number(userId);
                const sorted = response.filter((event) => Number(event.actor?.id) === numericUserId);
                setActivities(sorted);
                setVisibleCount(INITIAL_PAGE_SIZE);
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
    }, [userId]);

    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target || visibleCount >= activities.length) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting || isLoadingMore) return;
            setIsLoadingMore(true);
            window.setTimeout(() => {
                setVisibleCount((count) => Math.min(count + NEXT_PAGE_SIZE, activities.length));
                setIsLoadingMore(false);
            }, 250);
        }, { rootMargin: "300px" });
        observer.observe(target);
        return () => observer.disconnect();
    }, [activities.length, isLoadingMore, visibleCount]);

    return (
        <div className="mt-6 w-full">
            <div className="space-y-3">
                {isLoading && (
                    Array.from({ length: SKELETON_CARDS_COUNT }).map((_, index) => (
                        <ActivitySkeleton key={`profile-activity-skeleton-${index}`} id={`profile-activity-skeleton-${index}`} />
                    ))
                )}

                {!isLoading && error && (
                    <div className="bg-red-50 rounded-2xl p-6 border border-red-200 text-red-700">
                        Failed to load activity: {error}
                    </div>
                )}

                {!isLoading && !error && filteredActivities.length === 0 && (
                    <div className="mx-auto max-w-2xl px-6 py-10 text-center sm:py-12">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center border border-black/15 bg-[#f5d547] shadow-[3px_3px_0_#111]">
                            <svg className="h-7 w-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="mt-6 text-xl font-black text-gray-950 sm:text-2xl">No activity found</h2>
                    </div>
                )}

                {!isLoading && !error && filteredActivities.slice(0, visibleCount).map((item) => {
                    const challenge = item.challenge;
                    const resolutionStatus = getResolutionStatus(challenge);
                    const participantCount = challenge.total_challengers || challenge.participants || 0;
                    const totalPool = challenge.total_pool || challenge.pool_size || challenge.initial_bet || 0;
                    const actorName = item.actor?.username || username;
                    const actorAvatar = item.actor?.profile_image || avatar || "/scribbles/btc.png";
                    return (
                    <article
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onActivityClick?.(challenge)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") onActivityClick?.(challenge);
                        }}
                        className="group cursor-pointer overflow-hidden rounded-2xl border border-[#e7d8ce] bg-white p-3 shadow-[0_2px_10px_rgba(70,45,30,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#c9a58b] hover:shadow-[0_8px_24px_rgba(70,45,30,0.09)] sm:p-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e5d6cb] bg-[#f7eee8] shadow-sm sm:h-14 sm:w-14">
                                <Image src={challenge.market?.icon || "/scribbles/btc.png"} alt={challenge.ticker || "Asset"} width={56} height={56} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="mb-1 flex items-center gap-2">
                                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${item.type === "joined" ? "bg-emerald-50 text-emerald-700" : item.type === "cancelled" ? "bg-rose-50 text-rose-700" : item.type === "expired" ? "bg-gray-100 text-gray-600" : "bg-sky-50 text-sky-700"}`}>{getActivityLabel(item.type)}</span>
                                    <span className="text-[10px] font-semibold text-[#9a8274]">{formatTimeAgo(item.occurredAt)}</span>
                                </div>
                                <h2 className="truncate text-sm font-black leading-snug text-[#17110e] sm:text-base" title={challenge.statement?.trim() || challenge.title}>{challenge.statement?.trim() || challenge.title}</h2>
                                <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-[#8b7467]">
                                    <Image src={actorAvatar} alt="" width={20} height={20} className="h-5 w-5 shrink-0 rounded-full object-cover" />
                                    <span className="max-w-28 truncate font-bold text-[#4b382f]">{actorName}</span>
                                    <span className="min-w-0 truncate">{getActivityVerb(item.type)}</span><span className="shrink-0 text-[#c1aa9d]">·</span>
                                    <span className="shrink-0 font-bold text-emerald-700">{participantCount} joined</span><span className="hidden text-[#c1aa9d] sm:inline">·</span>
                                    <span className="hidden shrink-0 font-semibold sm:inline">${Number(totalPool).toLocaleString()} pool</span>
                                </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="rounded-full border border-[#dfd0c6] bg-[#f8f1ec] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#60483b]">{getModeLabel(challenge.mode)}</span>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${getResolutionStatusClass(resolutionStatus)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{resolutionStatus}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-[#9a8274] transition-transform group-hover:translate-x-0.5" />
                            </div>
                        </div>
                    </article>);
                })}
                {isLoadingMore && Array.from({ length: NEXT_PAGE_SIZE }).map((_, index) => (
                    <ActivitySkeleton key={`activity-more-${index}`} id={`activity-more-${index}`} />
                ))}
                <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />
            </div>
        </div>
    );
}
