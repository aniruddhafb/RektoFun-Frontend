"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    ChevronDown,
    ChevronRight,
    Clock,
    ListFilter,
    Search,
    Shapes,
} from "lucide-react";
import ChallengeDetailModal from "@/app/components/challenge-components/ChallengeDetailModal";
import {
    Challenge,
    getChallenges,
} from "@/app/lib/challenges-service/challenges";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { stripUsdcQuote } from "@/app/lib/format-market-label";

type ActivityType = "All Activity" | "Sports" | "Crypto" | "PVP Mode" | "Multi Mode";
type ActivityStatus = "All Status" | "Expired" | "Ongoing" | "Resolved" | "Resolving" | "Completed";

const activityTypeOptions: ActivityType[] = ["All Activity", "Sports", "Crypto", "PVP Mode", "Multi Mode"];
const activityStatusOptions: ActivityStatus[] = ["All Status", "Expired", "Ongoing", "Resolved", "Resolving", "Completed"];
const PAGE_SIZE = 5;
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

function getStatusKey(challenge: Challenge): string {
    return (challenge.status || "").toLowerCase();
}

function getModeLabel(mode?: string): string {
    const normalizedMode = mode?.toLowerCase() || "";
    if (normalizedMode.includes("pvp")) return "PVP";
    if (normalizedMode.includes("team") || normalizedMode.includes("multi")) return "Team";
    return mode || "Challenge";
}

function getResolutionStatus(challenge: Challenge, currentTimeMs: number): string {
    const challengeStatus = getStatusKey(challenge);
    const resolutionStatus = challenge.resolution_status?.trim().toLowerCase();
    const resolveMs = new Date(challenge.resolve_time).getTime();

    if (challengeStatus === "resolved" || Boolean(challenge.resolved_at)) return "Resolved";
    if (challengeStatus === "cancelled") return "Cancelled";
    if (resolutionStatus && !["none", "null", "pending"].includes(resolutionStatus)) {
        return resolutionStatus
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }
    if (
        challengeStatus === "locked" ||
        challengeStatus === "pending_resolution" ||
        (Number.isFinite(resolveMs) && resolveMs <= currentTimeMs)
    ) {
        return "Resolving";
    }
    return "Pending";
}

function getResolutionStatusClass(status: string): string {
    if (status === "Resolved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (status === "Cancelled" || status === "Failed") return "border-red-200 bg-red-50 text-red-700";
    if (status === "Resolving") return "border-amber-200 bg-amber-50 text-amber-700";
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
        avatar: creator?.profile_image || challenge.market?.icon || "/scribbles/btc.png",
    };
}

function formatCurrency(value?: number): string {
    return `$${Number(value ?? 0).toLocaleString(undefined, {
        maximumFractionDigits: 2,
    })}`;
}

function ActivitySkeleton() {
    return (
        <div
            className="overflow-hidden rounded-[28px] border border-[#ead7ca] bg-white/80 p-5"
            aria-hidden="true"
        >
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

export default function ActivityPage() {
    const [activeFilter, setActiveFilter] = useState<ActivityType>("All Activity");
    const [activeStatus, setActiveStatus] = useState<ActivityStatus>("All Status");
    const [searchQuery, setSearchQuery] = useState("");
    const [activities, setActivities] = useState<Challenge[]>([]);
    const [pageIndex, setPageIndex] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
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
    const requestIdRef = useRef(0);
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
        let isMounted = true;
        const requestId = ++requestIdRef.current;
        const offset = (pageIndex - 1) * PAGE_SIZE;
        const normalizedSearch = searchQuery.trim();

        const loadActivities = async () => {
            try {
                if (pageIndex === 1) {
                    setIsInitialLoading(true);
                    setActivities([]);
                    setError(null);
                    setHasMore(true);
                } else {
                    setIsLoadingMore(true);
                }

                const response = await getChallenges(
                    {
                        limit: PAGE_SIZE,
                        offset,
                        search: normalizedSearch.length > 0 ? normalizedSearch : undefined,
                        sort: "latest",
                    },
                    { bypassCache: true },
                );

                if (!isMounted || requestId !== requestIdRef.current) return;

                const sorted = [...response.challenges].sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                );

                setActivities((current) => {
                    if (pageIndex === 1) return sorted;

                    const seen = new Set(current.map((item) => item.id));
                    return [...current, ...sorted.filter((item) => !seen.has(item.id))];
                });
                setHasMore(sorted.length === PAGE_SIZE && offset + sorted.length < (response.count ?? offset + sorted.length));
            } catch (fetchError) {
                if (!isMounted || requestId !== requestIdRef.current) return;
                setError(fetchError instanceof Error ? fetchError.message : "Failed to load activity.");
            } finally {
                if (!isMounted || requestId !== requestIdRef.current) return;
                if (pageIndex === 1) {
                    setIsInitialLoading(false);
                } else {
                    setIsLoadingMore(false);
                }
            }
        };

        loadActivities();

        return () => {
            isMounted = false;
        };
    }, [pageIndex, reloadKey, searchQuery]);

    useEffect(() => {
        const target = loadMoreRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore && !isInitialLoading && !isLoadingMore && !error) {
                    setPageIndex((current) => current + 1);
                }
            },
            {
                rootMargin: "400px 0px",
                threshold: 0,
            },
        );

        observer.observe(target);
        return () => observer.disconnect();
    }, [error, hasMore, isInitialLoading, isLoadingMore]);

    const filteredActivities = useMemo(() => {
        return activities.filter((activity) => {
            const mode = activity.mode?.toLowerCase() ?? "";
            const marketName = activity.market?.name?.toLowerCase() ?? "";
            const parentId = activity.market?.parent_id?.toLowerCase() ?? "";
            const resolutionSource = activity.resolution_source?.toLowerCase() ?? "";
            const resolutionStatus = activity.resolution_status?.toLowerCase() ?? "";
            const normalizedSearch = searchQuery.trim().toLowerCase();
            const expireMs = new Date(activity.expire_time).getTime();
            const resolveMs = new Date(activity.resolve_time).getTime();
            const status = getStatusKey(activity);
            const creator = getActivityCreator(activity);

            const matchesType =
                activeFilter === "All Activity" ||
                (activeFilter === "Sports" &&
                    (marketName.includes("sport") || parentId.includes("sport") || resolutionSource === "manual")) ||
                (activeFilter === "Crypto" &&
                    !marketName.includes("sport") &&
                    !parentId.includes("sport") &&
                    resolutionSource !== "manual") ||
                (activeFilter === "PVP Mode" && mode.includes("pvp")) ||
                (activeFilter === "Multi Mode" && (mode.includes("multi") || mode.includes("team")));

            const matchesStatus =
                activeStatus === "All Status" ||
                (activeStatus === "Expired" && Number.isFinite(expireMs) && expireMs <= currentTimeMs && status !== "resolved") ||
                (activeStatus === "Ongoing" && status === "open" && (!Number.isFinite(expireMs) || expireMs > currentTimeMs)) ||
                (activeStatus === "Resolved" && status === "resolved") ||
                (activeStatus === "Resolving" &&
                    (status === "locked" ||
                        status === "pending_resolution" ||
                        resolutionStatus.includes("resolving") ||
                        (Number.isFinite(resolveMs) && resolveMs <= currentTimeMs && status !== "resolved"))) ||
                (activeStatus === "Completed" && (status === "resolved" || Boolean(activity.resolved_at)));

            const matchesSearch =
                normalizedSearch.length === 0 ||
                activity.title?.toLowerCase().includes(normalizedSearch) ||
                creator.username.toLowerCase().includes(normalizedSearch) ||
                creator.wallet.toLowerCase().includes(normalizedSearch) ||
                marketName.includes(normalizedSearch);

            return matchesType && matchesStatus && matchesSearch;
        });
    }, [activeFilter, activeStatus, activities, currentTimeMs, searchQuery]);

    const handleActivityClick = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        setIsDetailModalOpen(true);
    };

    const resetAndReload = (nextSearch: string) => {
        setSearchQuery(nextSearch);
        setPageIndex(1);
        setReloadKey((current) => current + 1);
        setActivities([]);
        setError(null);
        setHasMore(true);
        setIsInitialLoading(true);
        setIsLoadingMore(false);
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

                    <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-3xl border border-b-0 border-black/[0.06] bg-white p-4 pb-6">
                        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gray-300" />

                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">Activity Filters</h3>
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
                                    onChange={(e) => resetAndReload(e.target.value)}
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
                                        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition ${activeFilter === option
                                            ? "border-gray-950 bg-gray-950 font-semibold text-white"
                                            : "border-black/[0.07] text-gray-700 hover:bg-gray-50"
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
                                        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition ${activeStatus === option
                                            ? "border-gray-950 bg-gray-950 font-semibold text-white"
                                            : "border-black/[0.07] text-gray-700 hover:bg-gray-50"
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
                            onChange={(event) => resetAndReload(event.target.value)}
                            placeholder="Search activity..."
                            className="w-full rounded-full border border-black/15 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-gray-800 shadow-[2px_2px_0_rgba(0,0,0,0.16)] placeholder:text-gray-400 outline-none transition hover:shadow-[3px_3px_0_rgba(0,0,0,0.18)] focus:border-black/25 focus:bg-white focus:ring-4 focus:ring-gray-900/[0.04]"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-black/15 bg-white/75 px-4 py-3 text-sm font-medium text-gray-800 !shadow-none transition hover:border-black/25 hover:bg-white hover:!shadow-none active:!shadow-none sm:hidden"
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
                            const creator = getActivityCreator(item);
                            const marketIcon = item.market?.icon || "/scribbles/btc.png";
                            const totalPool = item.total_pool || item.pool_size || item.initial_bet || 0;
                            const participantCount = item.total_challengers || item.participants || 0;
                            const resolutionStatus = getResolutionStatus(item, currentTimeMs);
                            const modeLabel = getModeLabel(item.mode);
                            const endTime = getChallengeEndTime(item);
                            const activityHeadline = getActivityHeadline(item, endTime);

                            return (
                                <article
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
                                    className="group cursor-pointer rounded-xl border border-[#e6d8ce] bg-white px-3 py-3 transition-colors hover:border-[#c9a58b] hover:bg-[#fffcfa] sm:px-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e5d6cb] bg-[#f7eee8] sm:h-14 sm:w-14">
                                            <Image
                                                src={marketIcon}
                                                alt={item.ticker || "Asset"}
                                                width={56}
                                                height={56}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h2 className="line-clamp-2 text-sm font-black leading-snug text-[#17110e] sm:text-base">
                                                {activityHeadline}
                                            </h2>

                                            <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-[#8b7467]">
                                                <Image src={creator.avatar} alt="" width={20} height={20} className="h-5 w-5 shrink-0 rounded-full object-cover" />
                                                <Link
                                                    href={`/profile/${creator.profileSlug}`}
                                                    onClick={(event) => event.stopPropagation()}
                                                    className="max-w-28 truncate font-bold text-[#4b382f] hover:text-[#8b5e3c]"
                                                >
                                                    {creator.username}
                                                </Link>
                                                <span className="hidden shrink-0 sm:inline">created this</span>
                                                <span className="text-[#c1aa9d]">·</span>
                                                <span className="shrink-0 font-semibold text-emerald-700">{participantCount} joined</span>
                                                <span className="hidden text-[#c1aa9d] sm:inline">·</span>
                                                <span className="hidden shrink-0 sm:inline">{formatCurrency(totalPool)} pool</span>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="rounded-full border border-[#dfd0c6] bg-[#f8f1ec] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#60483b]">
                                                    {modeLabel}
                                                </span>
                                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${getResolutionStatusClass(resolutionStatus)}`}>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                    {resolutionStatus}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] font-medium text-[#9a8274]">
                                                <span>{formatTimeAgo(item.created_at)}</span>
                                                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}

                    {!isInitialLoading && isLoadingMore && (
                        <div className="space-y-4" aria-hidden="true">
                            {Array.from({ length: SKELETON_CARDS_COUNT }).map((_, index) => (
                                <ActivitySkeleton key={`activity-more-skeleton-${index}`} />
                            ))}
                        </div>
                    )}

                    <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />

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
