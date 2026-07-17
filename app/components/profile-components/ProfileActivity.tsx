"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Ban, ChevronRight, Crown, LogIn, Plus, RotateCcw, TimerOff, Trophy, UsersRound, Wallet } from "lucide-react";
import {
    Challenge,
    getChallengeCategoryImage,
} from "@/app/lib/challenges-service/challenges";
import { ChallengeActivity, getActivityLabel, getActivityVerb, getUserChallengeActivities } from "@/app/lib/activity-service/activity";

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

const activityAppearance = {
    won: { Icon: Trophy, card: "bg-gradient-to-r from-amber-50/60 via-white to-white", badge: "bg-amber-100 text-amber-800" },
    redeemed: { Icon: Crown, card: "bg-gradient-to-r from-violet-50/50 via-white to-white", badge: "bg-violet-100 text-violet-700" },
    joined: { Icon: LogIn, card: "bg-gradient-to-r from-emerald-50/50 via-white to-white", badge: "bg-emerald-100 text-emerald-700" },
    created: { Icon: Plus, card: "bg-gradient-to-r from-sky-50/50 via-white to-white", badge: "bg-sky-100 text-sky-700" },
    cancelled: { Icon: Ban, card: "bg-gradient-to-r from-rose-50/50 via-white to-white", badge: "bg-rose-100 text-rose-700" },
    expired: { Icon: TimerOff, card: "bg-gradient-to-r from-slate-50/70 via-white to-white", badge: "bg-slate-100 text-slate-600" },
    refunded: { Icon: RotateCcw, card: "bg-gradient-to-r from-teal-50/50 via-white to-white", badge: "bg-teal-100 text-teal-700" },
} as const;

function ActivitySkeleton({ id }: { id: string }) {
    return (
        <div key={id} className="overflow-hidden rounded-2xl border border-[#eadfd8] bg-white p-4 sm:p-5" aria-hidden="true">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[#efe2d7]" />
                <div className="min-w-0 flex-1">
                    <div className="h-3.5 w-48 animate-pulse rounded-full bg-[#efe2d7]" />
                    <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-[#f3e9e2]" />
                </div>
                <div className="h-5 w-16 animate-pulse rounded-full bg-[#efe2d7]" />
            </div>
            <div className="my-4 h-px bg-[#f0e7e1]" />
            <div className="flex items-start gap-3.5">
                <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-[#efe2d7]" />
                <div className="min-w-0 flex-1 pt-1">
                    <div className="h-5 w-[min(32rem,90%)] animate-pulse rounded-full bg-[#efe2d7]" />
                    <div className="mt-3 h-3.5 w-60 animate-pulse rounded-full bg-[#f3e9e2]" />
                </div>
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
                const response = await getUserChallengeActivities(Number(userId));
                if (!isMounted) return;

                setActivities(response);
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
                    const appearance = activityAppearance[item.type];
                    const ActivityIcon = appearance.Icon;
                    return (
                    <article
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onActivityClick?.(challenge)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") onActivityClick?.(challenge);
                        }}
                        className={`group cursor-pointer overflow-hidden rounded-2xl border border-[#e8ddd6] p-4 shadow-[0_2px_12px_rgba(70,45,30,0.035)] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cfb5a4] hover:shadow-[0_10px_30px_rgba(70,45,30,0.08)] focus-visible:ring-2 focus-visible:ring-[#8b5e3c]/35 focus-visible:ring-offset-2 sm:p-5 ${appearance.card}`}
                    >
                        <div className="flex items-center gap-3">
                            <Image src={actorAvatar} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full border border-[#e8ddd6] object-cover" />
                            <div className="min-w-0 flex-1 text-xs text-[#826e62]">
                                <div className="flex min-w-0 items-center gap-1.5">
                                    <span className="max-w-36 truncate font-bold text-[#352720]">{actorName}</span>
                                    <span className="min-w-0 truncate">{getActivityVerb(item.type).toLowerCase()}</span>
                                    {item.amount != null && <span className="shrink-0 font-bold text-[#352720]">${Number(item.amount).toLocaleString()}</span>}
                                </div>
                                <span className="mt-0.5 block text-[11px] text-[#a08c80]">{formatTimeAgo(item.occurredAt)}</span>
                            </div>
                            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${appearance.badge}`}>
                                <ActivityIcon className="h-3 w-3" aria-hidden="true" />
                                {getActivityLabel(item.type)}
                            </span>
                        </div>

                        <div className="my-3.5 h-px bg-[#f0e7e1] sm:my-4" />

                        <div className="flex items-start gap-3.5">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e5d6cb] bg-[#f7eee8] sm:h-16 sm:w-16">
                                <Image src={getChallengeCategoryImage(challenge)} alt={challenge.ticker || "Asset"} width={64} height={64} unoptimized className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                    <span className="rounded-md bg-[#f5eee9] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#60483b]">{getModeLabel(challenge.mode)}</span>
                                    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold ${getResolutionStatusClass(resolutionStatus)}`}>
                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />{resolutionStatus}
                                    </span>
                                </div>
                                <h2 className="line-clamp-2 text-sm font-black leading-snug text-[#17110e] sm:text-base" title={challenge.statement?.trim() || challenge.title}>{challenge.statement?.trim() || challenge.title}</h2>
                                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-[#826e62]">
                                    <span className="inline-flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5 text-[#a38674]" aria-hidden="true" />{participantCount} joined</span>
                                    <span className="inline-flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-[#a38674]" aria-hidden="true" />${Number(totalPool).toLocaleString()} pool</span>
                                </div>
                            </div>
                            <ChevronRight className="mt-5 h-5 w-5 shrink-0 text-[#b29d91] transition-all group-hover:translate-x-0.5 group-hover:text-[#76513d]" />
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
