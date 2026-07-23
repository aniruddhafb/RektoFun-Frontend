"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Ban,
    ChevronDown,
    ChevronRight,
    Clock,
    Crown,
    LogIn,
    ListFilter,
    Plus,
    RotateCcw,
    Search,
    Shapes,
    TimerOff,
    Trophy,
    UsersRound,
    Wallet,
} from "lucide-react";
import ChallengeDetailModal from "@/app/components/challenge-components/ChallengeDetailModal";
import {
    Challenge,
    getChallengeCategoryImage,
    getChallengeById,
} from "@/app/lib/challenges-service/challenges";
import { ChallengeActivity, getActivityChallengeLifecycle, getActivityLabel, getActivityVerb, getChallengeActivityPage } from "@/app/lib/activity-service/activity";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { stripUsdcQuote } from "@/app/lib/format-market-label";

type ActivityType = "All Activity" | "Sports" | "Crypto" | "PVP Mode" | "Team Mode";
type ActivityStatus = "All Status" | "Open" | "Live" | "Resolving" | "Resolved" | "Expired" | "Cancelled";

const activityTypeOptions: ActivityType[] = ["All Activity", "Sports", "Crypto", "PVP Mode", "Team Mode"];
const activityStatusOptions: ActivityStatus[] = ["All Status", "Open", "Live", "Resolving", "Resolved", "Expired", "Cancelled"];
const SKELETON_CARDS_COUNT = 4;

function getChallengeEndTime(challenge: Challenge): string {
    const candidates = [
        challenge.expire_time,
        challenge.expiry,
        challenge.resolve_time,
        challenge.resolution_date,
    ];
    return candidates.find((value) => value && !Number.isNaN(new Date(value).getTime())) || "";
}

function getActivityHeadline(challenge: Challenge, endTime: string): string {
    const statement = stripUsdcQuote(challenge.statement?.trim() || challenge.title?.trim()) || "Challenge";
    if (!endTime || /\bby\s+\d{1,2}\s+[a-z]+\s+\d{4}\b/i.test(statement)) return statement;

    const endDate = new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(endTime));

    return `${statement} by ${endDate}`;
}

function formatTimeAgo(dateString: string): string {
    const dateMs = new Date(dateString).getTime();
    if (Number.isNaN(dateMs)) return "Recently";
    const elapsed = Math.max(0, Date.now() - dateMs);
    const minutes = Math.floor(elapsed / 60_000);
    const hours = Math.floor(elapsed / 3_600_000);
    const days = Math.floor(elapsed / 86_400_000);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
}

function getShortWallet(address: string): string {
    if (!address) return "";
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getModeLabel(mode?: string): string {
    const normalizedMode = mode?.toLowerCase() || "";
    if (normalizedMode.includes("pvp")) return "PVP";
    if (normalizedMode.includes("team") || normalizedMode.includes("multi")) return "Team";
    return mode || "Challenge";
}

function getResolutionStatus(challenge: Challenge, currentTimeMs: number): string {
    const resolutionStatus = challenge.resolution_status?.trim().toLowerCase();
    const lifecycle = getActivityChallengeLifecycle(challenge, currentTimeMs);

    if (lifecycle === "RESOLVED") return "Resolved";
    if (lifecycle === "CANCELLED") return "Cancelled";
    if (resolutionStatus && !["none", "null", "pending"].includes(resolutionStatus)) {
        return resolutionStatus
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }
    if (lifecycle === "RESOLVING") return "Resolving";
    if (lifecycle === "LIVE") return "Live";
    if (lifecycle === "EXPIRED") return "Expired";
    return "Open";
}

function getResolutionStatusClass(status: string): string {
    if (status === "Resolved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (status === "Cancelled" || status === "Expired" || status === "Failed") return "border-red-200 bg-red-50 text-red-700";
    if (status === "Resolving") return "border-amber-200 bg-amber-50 text-amber-700";
    if (status === "Live") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    return "border-sky-200 bg-sky-50 text-sky-700";
}

function getActivityCreator(challenge: Challenge) {
    const creator =
        typeof challenge.creator === "object" && challenge.creator !== null
            ? challenge.creator
            : challenge.creator_details;

    const wallet = creator?.wallet_address || creator?.pubkey || "";
    const username = creator?.username || getShortWallet(wallet) || "Unknown user";

    return {
        username,
        wallet,
        profileSlug: wallet || username,
        avatar: creator?.profile_image || getChallengeCategoryImage(challenge),
    };
}

function formatCurrency(value?: number): string {
    return `$${Number(value ?? 0).toLocaleString(undefined, {
        maximumFractionDigits: 2,
    })}`;
}

const activityAppearance = {
    won: { Icon: Trophy, card: "bg-gradient-to-r from-amber-50/60 via-white to-white", badge: "bg-amber-100 text-amber-800" },
    redeemed: { Icon: Crown, card: "bg-gradient-to-r from-violet-50/50 via-white to-white", badge: "bg-violet-100 text-violet-700" },
    accepted: { Icon: LogIn, card: "bg-gradient-to-r from-emerald-50/50 via-white to-white", badge: "bg-emerald-100 text-emerald-700" },
    joined: { Icon: LogIn, card: "bg-gradient-to-r from-emerald-50/50 via-white to-white", badge: "bg-emerald-100 text-emerald-700" },
    created: { Icon: Plus, card: "bg-gradient-to-r from-sky-50/50 via-white to-white", badge: "bg-sky-100 text-sky-700" },
    cancelled: { Icon: Ban, card: "bg-gradient-to-r from-rose-50/50 via-white to-white", badge: "bg-rose-100 text-rose-700" },
    expired: { Icon: TimerOff, card: "bg-gradient-to-r from-slate-50/70 via-white to-white", badge: "bg-slate-100 text-slate-600" },
    refunded: { Icon: RotateCcw, card: "bg-gradient-to-r from-teal-50/50 via-white to-white", badge: "bg-teal-100 text-teal-700" },
} as const;

function ActivitySkeleton() {
    return (
        <div
            className="overflow-hidden rounded-2xl border border-[#eadfd8] bg-white p-4 sm:p-5"
            aria-hidden="true"
        >
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

export default function ActivityPage() {
    const [activeFilter, setActiveFilter] = useState<ActivityType>("All Activity");
    const [activeStatus, setActiveStatus] = useState<ActivityStatus>("All Status");
    const [searchQuery, setSearchQuery] = useState("");
    const [activities, setActivities] = useState<ChallengeActivity[]>([]);
    const [pageIndex, setPageIndex] = useState(1);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [serverHasMore, setServerHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());
    const typeDropdownRef = useRef<HTMLDivElement>(null);
    const statusDropdownRef = useRef<HTMLDivElement>(null);
    const typeButtonRef = useRef<HTMLButtonElement>(null);
    const statusButtonRef = useRef<HTMLButtonElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const [typeDropdownStyle, setTypeDropdownStyle] = useState<React.CSSProperties | null>(null);
    const [statusDropdownStyle, setStatusDropdownStyle] = useState<React.CSSProperties | null>(null);

    useBodyScrollLock(isMobileFiltersOpen);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (target.closest("[data-activity-filter-menu]")) return;

            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
                setIsTypeDropdownOpen(false);
            }
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => setCurrentTimeMs(Date.now()), 60000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        if (typeof document === "undefined") return;

        const updateDropdownPositions = () => {
            const typeRect = typeButtonRef.current?.getBoundingClientRect();
            const statusRect = statusButtonRef.current?.getBoundingClientRect();

            if (typeRect) {
                setTypeDropdownStyle({
                    position: "fixed",
                    top: typeRect.bottom + 8,
                    left: typeRect.left,
                    width: Math.max(typeRect.width, 224),
                    zIndex: 9999,
                });
            } else {
                setTypeDropdownStyle(null);
            }

            if (statusRect) {
                setStatusDropdownStyle({
                    position: "fixed",
                    top: statusRect.bottom + 8,
                    left: statusRect.left,
                    width: Math.max(statusRect.width, 224),
                    zIndex: 9999,
                });
            } else {
                setStatusDropdownStyle(null);
            }
        };

        if (isTypeDropdownOpen || isStatusDropdownOpen) {
            updateDropdownPositions();
        }

        window.addEventListener("resize", updateDropdownPositions);
        window.addEventListener("scroll", updateDropdownPositions, true);
        return () => {
            window.removeEventListener("resize", updateDropdownPositions);
            window.removeEventListener("scroll", updateDropdownPositions, true);
        };
    }, [isStatusDropdownOpen, isTypeDropdownOpen]);

    useEffect(() => {
        let active = true;

        const loadActivities = async (initial = false) => {
            if (initial) {
                setIsInitialLoading(true);
                setError(null);
            }
            try {
                const response = await getChallengeActivityPage(15, 0);
                if (active) {
                    setActivities((current) => {
                        if (initial) return response.activities;
                        const refreshedIds = new Set(response.activities.map((event) => event.id));
                        return [...response.activities, ...current.filter((event) => !refreshedIds.has(event.id))];
                    });
                    setServerHasMore(response.has_more);
                }
            } catch (fetchError) {
                if (active && initial) {
                    setError(fetchError instanceof Error ? fetchError.message : "Failed to load activity.");
                }
            } finally {
                if (active && initial) setIsInitialLoading(false);
            }
        };

        void loadActivities(true);
        const interval = window.setInterval(() => {
            if (document.visibilityState === "visible") void loadActivities();
        }, 60_000);

        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (pageIndex === 1) return;
        let active = true;

        const loadNextPage = async () => {
            setIsLoadingMore(true);
            try {
                const offset = 15 + (pageIndex - 2) * 15;
                const response = await getChallengeActivityPage(15, offset);
                if (!active) return;
                setActivities((current) => {
                    const ids = new Set(current.map((event) => event.id));
                    return [...current, ...response.activities.filter((event) => !ids.has(event.id))];
                });
                setServerHasMore(response.has_more);
            } catch (fetchError) {
                if (active) setError(fetchError instanceof Error ? fetchError.message : "Failed to load activity.");
            } finally {
                if (active) setIsLoadingMore(false);
            }
        };

        void loadNextPage();
        return () => { active = false; };
    }, [pageIndex]);

    const matchingActivities = useMemo(() => {
        return activities.filter((activity) => {
            const challenge = activity.challenge;
            const mode = challenge.mode?.toLowerCase() ?? "";
            const marketName = (challenge.market?.name || challenge.category || "").toLowerCase();
            const parentId = challenge.market?.parent_id?.toLowerCase() ?? "";
            const resolutionSource = challenge.resolution_source?.toLowerCase() ?? "";
            const normalizedSearch = searchQuery.trim().toLowerCase();
            const lifecycle = getActivityChallengeLifecycle(challenge, currentTimeMs);
            if (activity.type === "expired" && lifecycle !== "EXPIRED") return false;
            const creator = getActivityCreator(challenge);

            const matchesType =
                activeFilter === "All Activity" ||
                (activeFilter === "Sports" &&
                    (marketName.includes("sport") || parentId.includes("sport") || resolutionSource === "manual")) ||
                (activeFilter === "Crypto" &&
                    !marketName.includes("sport") &&
                    !parentId.includes("sport") &&
                    resolutionSource !== "manual") ||
                (activeFilter === "PVP Mode" && mode.includes("pvp")) ||
                (activeFilter === "Team Mode" && (mode.includes("multi") || mode.includes("team")));

            const matchesStatus =
                activeStatus === "All Status" ||
                activeStatus.toUpperCase() === lifecycle;

            const matchesSearch =
                normalizedSearch.length === 0 ||
                challenge.title?.toLowerCase().includes(normalizedSearch) ||
                getActivityVerb(activity.type, activity.challenge).includes(normalizedSearch) ||
                activity.actor?.username?.toLowerCase().includes(normalizedSearch) ||
                creator.username.toLowerCase().includes(normalizedSearch) ||
                creator.wallet.toLowerCase().includes(normalizedSearch) ||
                marketName.includes(normalizedSearch);

            return matchesType && matchesStatus && matchesSearch;
        });
    }, [activeFilter, activeStatus, activities, currentTimeMs, searchQuery]);

    const filteredActivities = matchingActivities;
    const hasMore = serverHasMore;

    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore && !isInitialLoading && !isLoadingMore && !error) {
                    setPageIndex((current) => current + 1);
                }
            },
            { rootMargin: "400px 0px", threshold: 0 },
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [error, hasMore, isInitialLoading, isLoadingMore]);

    const handleActivityClick = async (challenge: Challenge) => {
        try {
            setSelectedChallenge(await getChallengeById(challenge.id));
        } catch (fetchError) {
            console.error("Failed to load challenge details:", fetchError);
            setSelectedChallenge(challenge);
        }
        setIsDetailModalOpen(true);
    };

    const updateSearch = (nextSearch: string) => {
        setSearchQuery(nextSearch);
        setPageIndex(1);
        setIsTypeDropdownOpen(false);
        setIsStatusDropdownOpen(false);
    };

    const mobileFiltersSheet =
        isMobileFiltersOpen && typeof document !== "undefined"
            ? createPortal(
                <div className="fixed inset-0 z-[200] sm:hidden">
                    <button
                        type="button"
                        aria-label="Close filters"
                        onClick={() => setIsMobileFiltersOpen(false)}
                        className="absolute inset-0 bg-black/40"
                    />

                    <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto border-2 border-b-0 border-black bg-[#f3e1d7] p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                        <div className="mx-auto mb-4 h-1.5 w-12 bg-[#211530]" />

                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-[#211530]">Activity filters</h3>
                            <button
                                type="button"
                                onClick={() => setIsMobileFiltersOpen(false)}
                                className="px-2 py-1 text-sm font-medium text-gray-500 transition hover:text-gray-900"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-5">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Search</p>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search activity..."
                                    value={searchQuery}
                                    onChange={(e) => updateSearch(e.target.value)}
                                    className="w-full rounded-xl border border-black/[0.07] py-3 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-gray-300 focus:ring-4 focus:ring-gray-900/[0.04]"
                                />
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Activity</p>
                            <div className="space-y-2">
                                {activityTypeOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setActiveFilter(option);
                                            setIsMobileFiltersOpen(false);
                                        }}
                                        className={`flex w-full items-center gap-2 border-2 border-black px-3 py-3 text-left text-sm font-black transition ${activeFilter === option
                                            ? "bg-[#211530] text-white shadow-[3px_3px_0_#e85a2d]"
                                            : "bg-[#fffaf6] text-[#493b35]"
                                            }`}
                                    >
                                        <ListFilter className="h-4 w-4" />
                                        <span>{option}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
                            <div className="space-y-2">
                                {activityStatusOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setActiveStatus(option);
                                            setIsMobileFiltersOpen(false);
                                        }}
                                        className={`flex w-full items-center gap-2 border-2 border-black px-3 py-3 text-left text-sm font-black transition ${activeStatus === option
                                            ? "bg-[#e85a2d] text-white shadow-[3px_3px_0_#211530]"
                                            : "bg-[#fffaf6] text-[#493b35]"
                                            }`}
                                    >
                                        <Clock className="h-4 w-4" />
                                        <span>{option}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body,
            )
            : null;

    return (
        <div className="rekto-page min-h-screen">
            <div className="mx-auto max-w-5xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
                <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-black text-[#2d1f1a] sm:text-4xl">Activity</h1>
                </div>
                <p className="text-sm text-[#5c4a42] sm:text-base">
                    View the latest challenges and bets made across the platform
                </p>
            </div>

            <div className="relative z-[120] isolate mx-auto max-w-5xl px-4 pb-8 sm:px-6 lg:px-8">
                <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">

                    <div className="relative hidden w-full sm:block lg:max-w-md lg:flex-1">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) => updateSearch(event.target.value)}
                            placeholder="Search activity..."
                            className="w-full rounded-full border border-black/15 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-gray-800 shadow-[2px_2px_0_rgba(0,0,0,0.16)] placeholder:text-gray-400 outline-none transition hover:shadow-[3px_3px_0_rgba(0,0,0,0.18)] focus:border-black/25 focus:bg-white focus:ring-4 focus:ring-gray-900/[0.04]"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="flex w-full cursor-pointer items-center justify-between border-2 border-black bg-[#fffaf6] px-4 py-3 text-sm font-black text-[#211530] shadow-[3px_3px_0_#211530] transition active:translate-y-0.5 active:shadow-none sm:hidden"
                    >
                        <span>Filters</span>
                        <span className="max-w-[65%] truncate text-right text-xs text-gray-500">
                            {activeFilter} | {activeStatus}
                        </span>
                    </button>

                    <div className="hidden w-full items-stretch gap-3 sm:flex lg:w-auto">
                        <div className="relative w-full min-w-0 lg:w-48" ref={typeDropdownRef}>
                            <button
                                ref={typeButtonRef}
                                type="button"
                                onClick={() => {
                                    setIsTypeDropdownOpen(!isTypeDropdownOpen);
                                    setIsStatusDropdownOpen(false);
                                }}
                                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${isTypeDropdownOpen
                                    ? "border-black/25 bg-white text-gray-950 shadow-[3px_3px_0_rgba(0,0,0,0.2)] ring-4 ring-gray-900/[0.04]"
                                    : "border-black/15 bg-white/70 text-gray-700 hover:border-black/25 hover:bg-white hover:shadow-[3px_3px_0_rgba(0,0,0,0.18)]"
                                    }`}
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <ListFilter className="h-4 w-4 text-gray-500" />
                                    <span className="truncate">{activeFilter}</span>
                                </div>
                                <ChevronDown
                                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isTypeDropdownOpen ? "rotate-180 text-gray-700" : ""
                                        }`}
                                />
                            </button>

                        </div>

                        <div className="relative w-full min-w-0 lg:w-48" ref={statusDropdownRef}>
                            <button
                                ref={statusButtonRef}
                                type="button"
                                onClick={() => {
                                    setIsStatusDropdownOpen(!isStatusDropdownOpen);
                                    setIsTypeDropdownOpen(false);
                                }}
                                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${isStatusDropdownOpen
                                    ? "border-black/25 bg-white text-gray-950 shadow-[3px_3px_0_rgba(0,0,0,0.2)] ring-4 ring-gray-900/[0.04]"
                                    : "border-black/15 bg-white/70 text-gray-700 hover:border-black/25 hover:bg-white hover:shadow-[3px_3px_0_rgba(0,0,0,0.18)]"
                                    }`}
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <Shapes className="h-4 w-4 text-gray-500" />
                                    <span className="truncate">{activeStatus}</span>
                                </div>
                                <ChevronDown
                                    className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isStatusDropdownOpen ? "rotate-180 text-gray-700" : ""
                                        }`}
                                />
                            </button>

                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-0 mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
                <div className="space-y-2.5">
                    {isInitialLoading &&
                        Array.from({ length: SKELETON_CARDS_COUNT }).map((_, index) => (
                            <ActivitySkeleton key={`activity-skeleton-${index}`} />
                        ))}

                    {!isInitialLoading && error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                            Failed to load activity: {error}
                        </div>
                    )}

                    {!isInitialLoading && !error && filteredActivities.length === 0 && (
                        <div className="mx-auto max-w-2xl px-6 py-10 text-center sm:py-12">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-black/15 bg-[#f5d547] shadow-[3px_3px_0_#111]">
                                <Clock className="h-7 w-7 text-black" aria-hidden="true" />
                            </div>
                            <h2 className="mt-6 text-xl font-black text-gray-950 sm:text-2xl">No activity found</h2>
                        </div>
                    )}

                    {!isInitialLoading &&
                        filteredActivities.map((item) => {
                            const challenge = item.challenge;
                            const creator = getActivityCreator(challenge);
                            const actorName = item.actor?.username || creator.username;
                            const actorAvatar = item.actor?.profile_image || creator.avatar;
                            const actorSlug = item.actor?.wallet_address || item.actor?.pubkey || creator.profileSlug;
                            const marketIcon = getChallengeCategoryImage(challenge);
                            const totalPool = challenge.total_pool || challenge.pool_size || challenge.initial_bet || 0;
                            const participantCount = challenge.total_challengers || challenge.participants || 0;
                            const resolutionStatus = getResolutionStatus(challenge, currentTimeMs);
                            const modeLabel = getModeLabel(challenge.mode);
                            const endTime = getChallengeEndTime(challenge);
                            const activityHeadline = getActivityHeadline(challenge, endTime);
                            const appearance = activityAppearance[item.type];
                            const ActivityIcon = appearance.Icon;

                            return (
                                <article
                                    key={item.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleActivityClick(challenge)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            handleActivityClick(challenge);
                                        }
                                    }}
                                    className={`group cursor-pointer overflow-hidden rounded-2xl border border-[#e8ddd6] p-4 shadow-[0_2px_12px_rgba(70,45,30,0.035)] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#cfb5a4] hover:shadow-[0_10px_30px_rgba(70,45,30,0.08)] focus-visible:ring-2 focus-visible:ring-[#8b5e3c]/35 focus-visible:ring-offset-2 sm:p-5 ${appearance.card}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Image
                                            src={actorAvatar}
                                            alt=""
                                            width={36}
                                            height={36}
                                            className="h-9 w-9 shrink-0 rounded-full border border-[#e8ddd6] object-cover"
                                        />
                                        <div className="min-w-0 flex-1 text-xs text-[#826e62]">
                                            <div className="flex min-w-0 items-center gap-1.5">
                                                <Link
                                                    href={`/profile/${actorSlug}`}
                                                    onClick={(event) => event.stopPropagation()}
                                                    className="max-w-36 truncate font-bold text-[#352720] transition-colors hover:text-[#8b5e3c]"
                                                >
                                                    {actorName}
                                                </Link>
                                                <span className="min-w-0 truncate">{getActivityVerb(item.type, item.challenge).toLowerCase()}</span>
                                                {item.type === "created" && item.challenge.visibility === "DIRECT" && item.challenge.challenged_user_details ? (
                                                    <Link
                                                        href={`/profile/${encodeURIComponent(item.challenge.challenged_user_details.pubkey)}`}
                                                        onClick={(event) => event.stopPropagation()}
                                                        className="max-w-36 truncate font-bold text-[#352720] transition-colors hover:text-[#8b5e3c] hover:underline"
                                                    >
                                                        {item.challenge.challenged_user_details.username}
                                                    </Link>
                                                ) : null}
                                                {item.amount != null && (
                                                    <span className="shrink-0 font-bold text-[#352720]">
                                                        ${Number(item.amount).toLocaleString()}
                                                    </span>
                                                )}
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
                                            <Image
                                                src={marketIcon}
                                                alt={challenge.ticker || "Asset"}
                                                width={64}
                                                height={64}
                                                unoptimized
                                                className="h-full w-full object-cover"
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                                <span className="rounded-md bg-[#f5eee9] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#60483b]">
                                                    {modeLabel}
                                                </span>
                                                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold ${getResolutionStatusClass(resolutionStatus)}`}>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                    {resolutionStatus}
                                                </span>
                                            </div>
                                            <h2 className="line-clamp-2 text-sm font-black leading-snug text-[#17110e] sm:text-base" title={activityHeadline}>
                                                {activityHeadline}
                                            </h2>

                                            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-[#826e62]">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <UsersRound className="h-3.5 w-3.5 text-[#a38674]" aria-hidden="true" />
                                                    {participantCount} joined
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Wallet className="h-3.5 w-3.5 text-[#a38674]" aria-hidden="true" />
                                                    {formatCurrency(totalPool)} pool
                                                </span>
                                            </div>
                                        </div>

                                        <ChevronRight className="mt-5 h-5 w-5 shrink-0 text-[#b29d91] transition-all group-hover:translate-x-0.5 group-hover:text-[#76513d]" />
                                    </div>
                                </article>
                            );
                        })}

                    {hasMore && <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />}

                </div>
            </div>

            <ChallengeDetailModal
                challenge={selectedChallenge}
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedChallenge(null);
                }}
            />

            {mobileFiltersSheet}

            {typeof document !== "undefined" && (isTypeDropdownOpen || isStatusDropdownOpen)
                ? createPortal(
                    <>
                        {isTypeDropdownOpen && typeDropdownStyle && (
                            <div
                                data-activity-filter-menu="type"
                                style={typeDropdownStyle}
                                className="max-h-64 overflow-y-auto rounded-[3px] border-2 border-black bg-white p-1.5 shadow-none"
                            >
                                {activityTypeOptions.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        aria-pressed={activeFilter === option}
                                        onClick={() => {
                                            setActiveFilter(option);
                                            setIsTypeDropdownOpen(false);
                                        }}
                                        className={`flex w-full cursor-pointer items-center gap-3 border-b border-black/10 px-3 py-2.5 text-left text-sm transition last:border-b-0 ${activeFilter === option
                                            ? "rounded-[2px] border-b-transparent bg-gray-950 font-semibold text-white"
                                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
                                            }`}
                                    >
                                        <ListFilter
                                            className={`h-4 w-4 ${activeFilter === option ? "text-white" : "text-gray-500"}`}
                                        />
                                        <span>{option}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {isStatusDropdownOpen && statusDropdownStyle && (
                            <div
                                data-activity-filter-menu="status"
                                style={statusDropdownStyle}
                                className="max-h-64 overflow-y-auto rounded-[3px] border-2 border-black bg-white p-1.5 shadow-none"
                            >
                                {activityStatusOptions.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        aria-pressed={activeStatus === option}
                                        onClick={() => {
                                            setActiveStatus(option);
                                            setIsStatusDropdownOpen(false);
                                        }}
                                        className={`flex w-full cursor-pointer items-center gap-3 border-b border-black/10 px-3 py-2.5 text-left text-sm transition last:border-b-0 ${activeStatus === option
                                            ? "rounded-[2px] border-b-transparent bg-gray-950 font-semibold text-white"
                                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-950"
                                            }`}
                                    >
                                        <Clock
                                            className={`h-4 w-4 ${activeStatus === option ? "text-white" : "text-gray-500"
                                                }`}
                                        />
                                        <span>{option}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>,
                    document.body,
                )
                : null}
        </div>
    );
}
