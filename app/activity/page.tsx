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
    ChallengeListItem,
    getChallenges,
} from "@/app/lib/challenges-service/challenges";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

type ActivityType = "All Activity" | "Sports" | "Crypto" | "PVP Mode" | "Multi Mode";
type ActivityStatus = "All Status" | "Expired" | "Ongoing" | "Resolved" | "Resolving" | "Completed";

const activityTypeOptions: ActivityType[] = ["All Activity", "Sports", "Crypto", "PVP Mode", "Multi Mode"];
const activityStatusOptions: ActivityStatus[] = ["All Status", "Expired", "Ongoing", "Resolved", "Resolving", "Completed"];
const PAGE_SIZE = 5;
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

function getShortWallet(address: string): string {
    if (!address) return "";
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
    const [activities, setActivities] = useState<ChallengeListItem[]>([]);
    const [pageIndex, setPageIndex] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedChallenge, setSelectedChallenge] = useState<ChallengeListItem | null>(null);
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
                    width: typeRect.width,
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
                    width: statusRect.width,
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
            const marketName = activity.market.name?.toLowerCase() ?? "";
            const parentId = activity.market.parent_id?.toLowerCase() ?? "";
            const resolutionStatus = activity.resolution_status?.toLowerCase() ?? "";
            const normalizedSearch = searchQuery.trim().toLowerCase();
            const expireMs = new Date(activity.expire_time).getTime();
            const resolveMs = new Date(activity.resolve_time).getTime();

            const matchesType =
                activeFilter === "All Activity" ||
                (activeFilter === "Sports" &&
                    (marketName.includes("sport") || parentId.includes("sport") || activity.resolution_source === "manual")) ||
                (activeFilter === "Crypto" && !marketName.includes("sport") && activity.resolution_source !== "manual") ||
                (activeFilter === "PVP Mode" && mode.includes("pvp")) ||
                (activeFilter === "Multi Mode" && mode.includes("multi"));

            const matchesStatus =
                activeStatus === "All Status" ||
                (activeStatus === "Expired" && Number.isFinite(expireMs) && expireMs <= currentTimeMs && activity.status !== "resolved") ||
                (activeStatus === "Ongoing" && activity.status === "open" && (!Number.isFinite(expireMs) || expireMs > currentTimeMs)) ||
                (activeStatus === "Resolved" && activity.status === "resolved") ||
                (activeStatus === "Resolving" &&
                    (activity.status === "locked" ||
                        resolutionStatus.includes("resolving") ||
                        (Number.isFinite(resolveMs) && resolveMs <= currentTimeMs && activity.status !== "resolved"))) ||
                (activeStatus === "Completed" && (activity.status === "resolved" || Boolean(activity.resolved_at)));

            const matchesSearch =
                normalizedSearch.length === 0 ||
                activity.title.toLowerCase().includes(normalizedSearch) ||
                activity.creator.username?.toLowerCase().includes(normalizedSearch) ||
                activity.creator.wallet_address?.toLowerCase().includes(normalizedSearch) ||
                activity.market.name?.toLowerCase().includes(normalizedSearch);

            return matchesType && matchesStatus && matchesSearch;
        });
    }, [activeFilter, activeStatus, activities, currentTimeMs, searchQuery]);

    const handleActivityClick = (challenge: ChallengeListItem) => {
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
                        className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-medium text-gray-800 transition hover:border-black/20 hover:bg-white sm:hidden"
                    >
                        <span>Filters</span>
                        <span className="max-w-[65%] truncate text-right text-xs text-gray-500">
                            {activeFilter} | {activeStatus}
                        </span>
                    </button>

                    <div className="hidden w-full items-stretch gap-3 sm:grid sm:grid-cols-2 lg:w-auto">
                        <div className="relative w-full min-w-0" ref={typeDropdownRef}>
                            <button
                                ref={typeButtonRef}
                                type="button"
                                onClick={() => {
                                    setIsTypeDropdownOpen(!isTypeDropdownOpen);
                                    setIsStatusDropdownOpen(false);
                                }}
                                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition ${isTypeDropdownOpen
                                    ? "border-black/25 bg-white text-gray-950"
                                    : "border-black/15 bg-[#fffaf6]/90 text-gray-700 hover:border-black/25 hover:bg-white"
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

                        <div className="relative w-full min-w-0" ref={statusDropdownRef}>
                            <button
                                ref={statusButtonRef}
                                type="button"
                                onClick={() => {
                                    setIsStatusDropdownOpen(!isStatusDropdownOpen);
                                    setIsTypeDropdownOpen(false);
                                }}
                                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition ${isStatusDropdownOpen
                                    ? "border-black/25 bg-white text-gray-950"
                                    : "border-black/15 bg-[#fffaf6]/90 text-gray-700 hover:border-black/25 hover:bg-white"
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
                <div className="space-y-4">
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
                        <div className="rounded-2xl border border-[#ead7ca] bg-white/80 p-6 text-[#5c4a42]">
                            {activities.length === 0 ? "No activity yet." : "No activity found."}
                        </div>
                    )}

                    {!isInitialLoading &&
                        filteredActivities.map((item) => {
                            const creatorName = item.creator.username || "Unknown user";
                            const creatorWallet = item.creator.wallet_address || "";
                            const profileSlug = creatorWallet || creatorName;
                            const avatar = item.creator.profile_image || item.market.icon || "/scribbles/btc.png";
                            const timeAgo = formatTimeAgo(item.created_at);
                            const resolveCountdown = formatResolveCountdown(item.resolve_time);

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
                                    className="group relative cursor-pointer overflow-hidden rounded-[28px] border border-[#ead7ca] bg-gradient-to-br from-white via-[#fffaf7] to-[#f8ede7] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d2b6a1] hover:shadow-[0_18px_45px_rgba(71,45,20,0.14)]"
                                >
                                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(224,167,110,0.15),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(187,132,96,0.08),transparent_30%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                                    <div className="relative flex items-start gap-4">
                                        <div className="relative flex-shrink-0">
                                            <div className="h-14 w-14 overflow-hidden rounded-2xl border border-[#dec5b4] bg-white">
                                                <Image
                                                    src={avatar}
                                                    alt={creatorName}
                                                    width={56}
                                                    height={56}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    href={`/profile/${profileSlug}`}
                                                    onClick={(event) => event.stopPropagation()}
                                                    className="text-sm font-semibold text-[#2d1f1a] transition-colors hover:text-[#8b5e3c]"
                                                >
                                                    {creatorName}
                                                </Link>
                                                <span className="text-xs text-[#a08070]">{getShortWallet(creatorWallet)}</span>
                                                <span className="text-xs text-[#c8a693]">|</span>
                                                <span className="text-xs text-[#8b7355]">{timeAgo}</span>
                                            </div>

                                            <h2 className="mt-3 max-w-3xl text-lg font-bold leading-snug text-[#2d1f1a] sm:text-xl">
                                                {item.title}
                                            </h2>

                                            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f574d]">
                                                Expires {resolveCountdown || "soon"}
                                            </p>
                                        </div>

                                        <div className="flex-shrink-0">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ead7ca] bg-white/85 text-[#5c4a42] transition-all duration-200 group-hover:border-[#2d1f1a] group-hover:bg-[#2d1f1a] group-hover:text-[#f8ede7]">
                                                <ChevronRight className="h-4 w-4" />
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
                                style={typeDropdownStyle}
                                className="max-h-64 overflow-y-auto rounded-2xl border border-black/15 bg-white p-1.5"
                            >
                                {activityTypeOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setActiveFilter(option);
                                            setIsTypeDropdownOpen(false);
                                        }}
                                        className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition ${activeFilter === option
                                            ? "bg-gray-950 font-semibold text-white"
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
                                style={statusDropdownStyle}
                                className="max-h-64 overflow-y-auto rounded-2xl border border-black/15 bg-white p-1.5"
                            >
                                {activityStatusOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setActiveStatus(option);
                                            setIsStatusDropdownOpen(false);
                                        }}
                                        className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition ${activeStatus === option
                                            ? "bg-gray-950 font-semibold text-white"
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
