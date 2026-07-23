"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { getChallengeCategoryImage, type Challenge } from "@/app/lib/challenges-service/challenges";
import { getSearchModalResults, type SearchModalUser } from "@/app/lib/search-service";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";
import { stripUsdcQuote } from "@/app/lib/format-market-label";

type SearchTab = "all" | "challenges" | "users";
const CHALLENGE_RESULT_LIMIT = 6;
const USER_RESULT_LIMIT = 6;

type NavbarDesktopSearchProps = {
    searchQuery: string;
    onSearchQueryChange: (value: string) => void;
    isModalOpen: boolean;
    onOpenModal: () => void;
    onCloseModal: () => void;
};

function formatPool(value: number | undefined) {
    const amount = value ?? 0;
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(amount);
}

function parseDateValue(value: unknown) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string" || !value) return null;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
}

function parseResolutionDateValue(value: unknown) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return parseDateValue(`${value}T23:59:59.999Z`);
    }
    return parseDateValue(value);
}

function getResolveTimestamp(challenge: Challenge) {
    return parseDateValue(challenge.metadata?.composer?.resolves_at)
        ?? parseDateValue(challenge.resolve_time)
        ?? parseResolutionDateValue(challenge.resolution_date);
}

function formatCountdown(timestamp: number | null) {
    if (!timestamp) return "On result";
    const ms = timestamp - Date.now();
    if (ms <= 0) return "Now";

    const totalHours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${Math.max(1, minutes)}m`;
}

function formatResolutionMoment(timestamp: number | null) {
    if (!timestamp) return "Resolution time unavailable";
    return new Date(timestamp).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function getChallengeResultMeta(challenge: Challenge) {
    const teamA = challenge.bet_info?.team_count?.TEAM_A;
    const teamB = challenge.bet_info?.team_count?.TEAM_B;
    const recordedJoined = Number(teamA?.total_bets ?? 0) + Number(teamB?.total_bets ?? 0);
    const joined = recordedJoined || challenge.participants || challenge.total_challengers + challenge.total_opponents || 1;
    const recordedPool = Number(teamA?.total_amount ?? 0) + Number(teamB?.total_amount ?? 0);
    const pool = recordedPool || challenge.total_pool || challenge.pool_size || challenge.initial_bet || 0;
    const resolvesAt = getResolveTimestamp(challenge);
    const expiryAt = parseDateValue(challenge.expiry) ?? parseDateValue(challenge.expire_time);
    const hasOpponent = Number(teamB?.total_bets ?? 0) > 0 || challenge.total_opponents > 0;
    const isOpenStatus = challenge.status.toLowerCase() === "open";
    const isOpenToJoin = isOpenStatus
        && (!expiryAt || expiryAt > Date.now())
        && (!resolvesAt || resolvesAt > Date.now())
        && (challenge.mode === "TEAM" || !hasOpponent);
    const isManualResolution = String(challenge.resolution_method || challenge.resolution_source).toUpperCase() !== "PRICE_FEED";
    const title = stripUsdcQuote(challenge.statement) || `Bet on ${challenge.ticker}`;
    const hasResolvedTimePassed = Boolean(resolvesAt && resolvesAt <= Date.now());
    const resolveDate = resolvesAt
        ? new Date(resolvesAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
        : "";

    return { joined, pool, resolvesAt, isOpenToJoin, isManualResolution, title, hasResolvedTimePassed, resolveDate };
}

function getChallengeStatusMeta(status: Challenge["status"]) {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === "open") {
        return { label: "Live", className: "bg-[#eaf9ef] text-[#15803d] border-[#bbf7d0]" };
    }
    if (normalizedStatus === "locked" || normalizedStatus === "pending_resolution" || normalizedStatus === "expired") {
        return { label: "Locked", className: "bg-[#fff2e8] text-[#b45309] border-[#fed7aa]" };
    }
    if (normalizedStatus === "resolved") {
        return { label: "Resolved", className: "bg-[#e8f0ff] text-[#1d4ed8] border-[#bfdbfe]" };
    }
    return { label: "Cancelled", className: "bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]" };
}

function formatMode(mode: string) {
    return mode.replace(/[_-]/g, " ").toUpperCase();
}

function formatCompactNumber(value: number) {
    const numericValue = Number(value);
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })
        .format(Number.isFinite(numericValue) ? numericValue : 0);
}

function formatPnl(value: number) {
    const numericValue = Number(value);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
    const amount = Math.abs(safeValue).toLocaleString("en-US", { maximumFractionDigits: 2 });
    return `${safeValue > 0 ? "+" : safeValue < 0 ? "-" : ""}$${amount}`;
}

function UserVerifiedBadge({ isModerator, username }: { isModerator: boolean; username: string }) {
    const label = isModerator ? `${username} is a verified KOL` : `${username} is verified on X`;
    return (
        <span className="absolute -bottom-1 -right-1 z-10 flex h-5 w-5 items-center justify-center drop-shadow-sm" title={label} aria-label={label}>
            <svg className="h-full w-full" viewBox="0 0 32 32" aria-hidden="true">
                <path fill={isModerator ? "#F5B800" : "#378FDB"} stroke="white" strokeWidth="1.5" strokeLinejoin="round" d="M16 1.5l2.8 2.2 3.5-1 1.6 3.2 3.6.5.1 3.7 3 2-1.4 3.4 1.4 3.4-3 2-.1 3.7-3.6.5-1.6 3.2-3.5-1L16 30.5l-2.8-2.2-3.5 1-1.6-3.2-3.6-.5-.1-3.7-3-2 1.4-3.4-1.4-3.4 3-2 .1-3.7 3.6-.5 1.6-3.2 3.5 1L16 1.5Z" />
                <path d="m9.4 16.2 4.2 4.2 9-9" fill="none" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    );
}

export function NavbarDesktopSearch({
    searchQuery,
    onSearchQueryChange,
    isModalOpen,
    onOpenModal,
    onCloseModal,
}: NavbarDesktopSearchProps) {
    useBodyScrollLock(isModalOpen);

    const router = useRouter();
    const [query, setQuery] = useState(searchQuery);
    const [activeTab, setActiveTab] = useState<SearchTab>("all");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [challengeResults, setChallengeResults] = useState<Challenge[]>([]);
    const [userResults, setUserResults] = useState<SearchModalUser[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestIdRef = useRef(0);
    const hasInitializedOpenStateRef = useRef(false);

    const hasQuery = query.trim().length > 0;

    useEffect(() => {
        const preload = () => { void getSearchModalResults().catch(() => undefined); };
        const id = window.setTimeout(preload, 500);
        return () => window.clearTimeout(id);
    }, []);

    const closeModal = useCallback(() => onCloseModal(), [onCloseModal]);

    const loadInitialResults = useCallback(async () => {
        const reqId = ++requestIdRef.current;
        setIsLoading(true);
        setError(null);

        try {
            const response = await getSearchModalResults();

            if (requestIdRef.current !== reqId) return;

            setChallengeResults(response.challenges);
            setUserResults(response.users);
        } catch {
            if (requestIdRef.current !== reqId) return;
            setError("Could not load search results.");
        } finally {
            if (requestIdRef.current === reqId) {
                setIsLoading(false);
            }
        }
    }, []);

    const handleQueryChange = (value: string) => {
        setQuery(value);

        if (value.trim() === "") {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            onSearchQueryChange("");
            void loadInitialResults();
        }
    };

    const loadSearchResults = useCallback(async (searchTerm: string) => {
        const nextQuery = searchTerm.trim();
        if (!nextQuery) {
            await loadInitialResults();
            return;
        }

        onSearchQueryChange(nextQuery);

        const reqId = ++requestIdRef.current;
        setIsLoading(true);
        setError(null);

        try {
            const response = await getSearchModalResults(nextQuery);

            if (requestIdRef.current !== reqId) return;

            setChallengeResults(response.challenges);
            setUserResults(response.users);
        } catch {
            if (requestIdRef.current !== reqId) return;
            setError("Could not fetch search results. Please try again.");
            setChallengeResults([]);
            setUserResults([]);
        } finally {
            if (requestIdRef.current === reqId) {
                setIsLoading(false);
            }
        }
    }, [loadInitialResults, onSearchQueryChange]);

    useEffect(() => {
        if (!isModalOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeModal();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [closeModal, isModalOpen]);

    useEffect(() => {
        if (!isModalOpen) return;
        if (!hasQuery) return;

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            void loadSearchResults(query);
        }, 250);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [hasQuery, isModalOpen, loadSearchResults, query]);

    const handleRetry = () => {
        if (hasQuery) {
            void loadSearchResults(query);
            return;
        }

        void loadInitialResults();
    };

    const showChallenges = activeTab === "all" || activeTab === "challenges";
    const showUsers = activeTab === "all" || activeTab === "users";

    const emptyState = useMemo(() => {
        if (isLoading || error) return false;
        return challengeResults.length === 0 && userResults.length === 0;
    }, [challengeResults.length, error, isLoading, userResults.length]);

    const tabs: { key: SearchTab; label: string }[] = [
        { key: "all", label: "All" },
        { key: "challenges", label: "Challenges" },
        { key: "users", label: "Users" },
    ];

    const challengeSkeletons = Array.from({ length: CHALLENGE_RESULT_LIMIT });
    const cardSkeletons = Array.from({ length: USER_RESULT_LIMIT });

    useEffect(() => {
        if (!isModalOpen) {
            hasInitializedOpenStateRef.current = false;
            return;
        }

        if (hasInitializedOpenStateRef.current) return;

        hasInitializedOpenStateRef.current = true;
        setQuery(searchQuery);
        setActiveTab("all");
        void loadInitialResults();
    }, [isModalOpen, loadInitialResults, searchQuery]);

    const searchModal = isModalOpen && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[180]">
            <button
                type="button"
                onClick={closeModal}
                aria-label="Close search"
                className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm"
            />

            <div className="relative z-10 mx-2 mt-16 md:mx-auto md:mt-20 w-auto md:w-[86vw] max-w-5xl h-[calc(100vh-9rem)] md:max-h-[calc(100vh-10rem)] border-2 border-black bg-[#fff8f4] overflow-hidden flex flex-col">
                <div className="p-3 md:p-5 border-b-2 border-black">
                    <div className="flex items-stretch gap-2 md:gap-3">
                        <div className="relative flex-1">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search challenges, users..."
                                value={query}
                                onChange={(event) => handleQueryChange(event.target.value)}
                                className="h-11 md:h-12 w-full border-2 border-black bg-white px-10 md:px-11 text-base font-semibold md:text-[18px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:shadow-[0_0_0_4px_rgba(232,90,45,0.18)]"
                            />
                            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94a3b8]" strokeWidth={2.4} />
                        </div>
                        <span className="hidden h-11 items-center border-2 border-black bg-white px-3 text-[11px] font-black uppercase tracking-[0.12em] text-[#64748b] shadow-[2px_2px_0_#111] md:inline-flex md:h-12">
                            ESC
                        </span>
                        <button
                            type="button"
                            onClick={closeModal}
                            aria-label="Close search"
                            className="cursor-pointer inline-flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-[#ffe8db] text-[#2d1f1a] shadow-[2px_2px_0_#111] transition hover:-translate-y-0.5 hover:bg-[#ffcfbd] focus:outline-none focus:shadow-[0_0_0_4px_rgba(232,90,45,0.22)] md:h-12 md:w-12"
                        >
                            <X className="h-5 w-5" strokeWidth={3} />
                        </button>
                    </div>

                    <div className="mt-4 md:mt-5 flex items-center gap-2 overflow-x-auto pb-1">
                        {tabs.map((tab) => {
                            const selected = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`cursor-pointer whitespace-nowrap border-2 px-3 md:px-4 py-1.5 text-xs font-black md:text-sm transition ${selected ? "border-black bg-[#f5d547] text-black shadow-[2px_2px_0_#111]" : "border-black bg-white/70 text-[#475569] hover:bg-white"}`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#fffaf7]">
                    {isLoading && (
                        <>
                            {showChallenges && (
                                <section className="px-4 md:px-6 py-4 border-b border-[#f0dfd2] animate-pulse">
                                    <div className="mb-4 h-7 w-36 rounded bg-[#efe4db]" />
                                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                                        {challengeSkeletons.map((_, index) => (
                                            <div
                                                key={`challenge-skeleton-${index}`}
                                                className="rounded-lg border border-[#eadfd6] bg-white p-3"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="h-12 w-12 rounded-md bg-[#f3f4f6] flex-shrink-0" />
                                                    <div className="min-w-0 flex-1 space-y-2">
                                                        <div className="h-4 w-4/5 rounded bg-[#f1ece6]" />
                                                        <div className="h-3 w-1/2 rounded bg-[#f1ece6]" />
                                                    </div>
                                                </div>
                                                <div className="mt-3 grid grid-cols-4 gap-2">
                                                    <div className="h-8 rounded bg-[#f1ece6]" />
                                                    <div className="h-8 rounded bg-[#f1ece6]" />
                                                    <div className="h-8 rounded bg-[#f1ece6]" />
                                                    <div className="h-8 rounded bg-[#f1ece6]" />
                                                </div>
                                                <div className="mt-3 h-7 rounded bg-[#f1ece6]" />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {showUsers && (
                                <section className="px-4 md:px-6 py-4 border-b border-[#f0dfd2] animate-pulse">
                                    <div className="mb-4 h-7 w-20 rounded bg-[#efe4db]" />
                                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                        {cardSkeletons.map((_, index) => (
                                            <div key={`user-skeleton-${index}`} className="rounded-lg border border-[#eadfd6] bg-white p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-[#f3f4f6]" />
                                                    <div className="min-w-0 w-full space-y-2">
                                                        <div className="h-3.5 w-4/5 rounded bg-[#f1ece6]" />
                                                        <div className="h-3 w-3/5 rounded bg-[#f1ece6]" />
                                                    </div>
                                                </div>
                                                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#f0dfd2] pt-3">
                                                    <div className="h-8 rounded bg-[#f1ece6]" />
                                                    <div className="h-8 rounded bg-[#f1ece6]" />
                                                    <div className="h-8 rounded bg-[#f1ece6]" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                        </>
                    )}
                    {!isLoading && error && (
                        <div className="px-4 md:px-8 pt-6">
                            <p className="text-sm text-red-600">{error}</p>
                            <button
                                type="button"
                                onClick={handleRetry}
                                className="mt-3 inline-flex items-center rounded-lg border border-[#f6c9a7] bg-white px-3 py-1.5 text-sm font-medium text-[#f97316] hover:bg-[#fff3eb] transition"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                    {!isLoading && emptyState && (
                        <div className="px-4 md:px-6 py-10 md:py-12">
                            <div className="mx-auto max-w-md rounded-2xl border border-[#f0dfd2] bg-white/80 px-6 py-10 text-center">
                                <p className="text-base font-semibold text-[#334155]">No results found</p>
                                <p className="mt-2 text-sm text-[#64748b]">
                                    Try a different keyword or username.
                                </p>
                            </div>
                        </div>
                    )}

                    {!isLoading && showChallenges && challengeResults.length > 0 && (
                        <section className="px-4 md:px-6 py-4 border-b border-[#f0dfd2]">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg md:text-xl font-semibold text-[#1e293b]">
                                        {hasQuery ? "Matching challenges" : "Recent challenges"}
                                    </h3>
                                    <p className="text-xs font-semibold text-[#7c6a60]">
                                        Showing {Math.min(challengeResults.length, CHALLENGE_RESULT_LIMIT)} quick picks
                                    </p>
                                </div>
                                <Link href="/challenges" onClick={closeModal} className="text-[#f97316] text-xs md:text-sm font-bold">View all →</Link>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                                {challengeResults.map((challenge) => {
                                    const statusMeta = getChallengeStatusMeta(challenge.status);
                                    const meta = getChallengeResultMeta(challenge);
                                    const resolveState = meta.hasResolvedTimePassed
                                        ? challenge.status === "RESOLVED" ? "Resolved" : "Resolving"
                                        : formatCountdown(meta.resolvesAt);
                                    const resolutionMoment = meta.resolvesAt ? formatResolutionMoment(meta.resolvesAt) : "On result";
                                    return (
                                        <button
                                            key={challenge.id}
                                            type="button"
                                            onClick={() => {
                                                closeModal();
                                                router.push(`/challenges?challengeId=${encodeURIComponent(challenge.id)}`);
                                            }}
                                            className="group w-full cursor-pointer rounded-lg border-2 border-[#eadfd6] bg-white p-3 text-left shadow-[2px_2px_0_rgba(17,17,17,0.08)] transition hover:-translate-y-0.5 hover:border-black hover:bg-[#fffaf6] hover:shadow-[3px_3px_0_#111] focus:outline-none focus:shadow-[0_0_0_4px_rgba(232,90,45,0.18)]"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#eadfd6] bg-[#f3f4f6]">
                                                    <Image
                                                        src={getChallengeCategoryImage(challenge)}
                                                        alt={challenge.ticker || "Challenge category"}
                                                        fill
                                                        sizes="48px"
                                                        unoptimized
                                                        className="object-contain p-1.5"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${statusMeta.className}`}>
                                                            {statusMeta.label}
                                                        </span>
                                                        <span className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a7468]">
                                                            {stripUsdcQuote(challenge.trading_pair || challenge.ticker) || "General"}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 text-sm font-black leading-snug text-[#111827] group-hover:text-[#e85a2d] sm:text-[15px]">
                                                        {meta.isManualResolution || meta.hasResolvedTimePassed ? (
                                                            <p className="line-clamp-2">{meta.title}{!meta.isManualResolution && meta.hasResolvedTimePassed && meta.resolveDate ? ` by ${meta.resolveDate}` : ""}</p>
                                                        ) : (
                                                            <>
                                                                <p className="truncate">{meta.title} In</p>
                                                                <p>Next <span className="ml-1 text-sm font-bold text-emerald-800">{formatCountdown(meta.resolvesAt)}</span></p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 divide-x divide-y divide-[#f0dfd2] border-t border-[#f0dfd2] pt-3 min-[430px]:grid-cols-4 min-[430px]:divide-y-0">
                                                <div className="min-w-0 px-2 first:pl-0">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8a7468]">Total pool</p>
                                                    <p className="truncate text-sm font-black text-[#111827]">{formatPool(meta.pool)}</p>
                                                </div>
                                                <div className="min-w-0 px-2">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8a7468]">Joined</p>
                                                    <p className="truncate text-sm font-black text-[#111827]">{meta.joined} {meta.joined === 1 ? "player" : "players"}</p>
                                                </div>
                                                <div className="min-w-0 px-2 pt-2 min-[430px]:pt-0">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8a7468]">Mode</p>
                                                    <p className="truncate text-sm font-black text-[#111827]">{formatMode(challenge.mode)}</p>
                                                </div>
                                                <div className="min-w-0 px-2 pt-2 min-[430px]:pr-0 min-[430px]:pt-0">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8a7468]">Resolves</p>
                                                    <p className="truncate text-sm font-black text-[#166534]" title={resolutionMoment}>{resolveState}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#f0dfd2] pt-2.5">
                                                <span className="truncate text-[10px] font-semibold text-[#7c6a60]" title={resolutionMoment}>
                                                    Resolves {resolutionMoment}
                                                </span>
                                                <span className={`shrink-0 border px-2 py-1 text-[9px] font-black uppercase tracking-[0.06em] ${meta.isOpenToJoin ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-black/15 bg-[#f3ece7] text-[#75645c]"}`}>
                                                    {meta.isOpenToJoin ? "Open to join" : "Joining closed"}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {!isLoading && showUsers && userResults.length > 0 && (
                        <section className="px-4 md:px-6 py-4 border-b border-[#f0dfd2]">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-[#1e293b] md:text-xl">Users</h3>
                                    <p className="text-xs font-semibold text-[#7c6a60]">Quick user matches</p>
                                </div>
                                <Link href="/leaderboard" onClick={closeModal} className="text-[#f97316] text-xs md:text-sm font-bold">View all →</Link>
                            </div>
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                {userResults.map((user, index) => {
                                    const username = user.username || "Unnamed";
                                    const isVerified = Boolean(user.twitter_username || user.user_type === "moderator");
                                    const followerCount = user.follower_count;
                                    const wallet = user.pubkey;
                                    return (
                                        <Link
                                            key={user.id}
                                            href={wallet ? `/profile/${wallet}` : "/"}
                                            onClick={closeModal}
                                            className="group relative rounded-lg border-2 border-[#eadfd6] bg-white p-3 shadow-[2px_2px_0_rgba(17,17,17,0.08)] transition hover:-translate-y-0.5 hover:border-black hover:bg-[#fffaf6] hover:shadow-[3px_3px_0_#111] focus:outline-none focus:shadow-[0_0_0_4px_rgba(232,90,45,0.18)]"
                                        >
                                            <span className="absolute right-2.5 top-2.5 border border-black/15 bg-[#fff8f4] px-1.5 py-0.5 text-[9px] font-black text-[#7c6a60]">#{index + 1}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-12 w-12 shrink-0">
                                                    <Image
                                                        src={user.profile_image || user.twitter_profile_image || "https://earningrecords.com/assets/rektofun/profiles/1.svg"}
                                                        alt={username}
                                                        fill
                                                        sizes="48px"
                                                        className="rounded-full border-2 border-black bg-[#fff4ed] object-cover"
                                                    />
                                                    {isVerified && <UserVerifiedBadge isModerator={user.user_type === "moderator"} username={username} />}
                                                </div>
                                                <div className="min-w-0 flex-1 pr-7">
                                                    <p className="truncate text-sm font-black text-[#0f172a] group-hover:text-[#e85a2d]">{username}</p>
                                                    <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-4 text-[#64748b]">{user.bio || "No bio yet"}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-3 divide-x divide-[#f0dfd2] border-t border-[#f0dfd2] pt-3 text-center">
                                                <div className="min-w-0 px-1">
                                                    <p className="truncate text-sm font-black text-[#111827]">{formatCompactNumber(followerCount)}</p>
                                                    <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.07em] text-[#8a7468]">Followers</p>
                                                </div>
                                                <div className="min-w-0 px-1">
                                                    <p className="truncate text-sm font-black text-emerald-700">{user.won == null ? "—" : formatCompactNumber(user.won)}</p>
                                                    <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.07em] text-[#8a7468]">Wins</p>
                                                </div>
                                                <div className="min-w-0 px-1">
                                                    <p className={`truncate text-sm font-black ${user.pnl != null && user.pnl > 0 ? "text-emerald-700" : user.pnl != null && user.pnl < 0 ? "text-red-600" : "text-[#111827]"}`} title={user.pnl == null ? "Open leaderboard for performance" : formatPnl(user.pnl)}>{user.pnl == null ? "—" : formatPnl(user.pnl)}</p>
                                                    <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.07em] text-[#8a7468]">P&amp;L</p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                </div>
            </div>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <div className="hidden lg:flex items-center gap-4 xl:gap-6 flex-1 justify-center max-w-2xl mx-4 xl:mx-8">
                <div className="relative flex-1 max-w-md">
                    <button
                        type="button"
                        onClick={onOpenModal}
                        className="w-full border-2 border-black bg-white px-4 py-2.5 pl-10 text-left text-sm font-bold text-gray-700 shadow-[2px_2px_0_#111] transition-all hover:-translate-y-0.5 hover:bg-[#fffaf6] focus:outline-none cursor-pointer"
                    >
                        Search challenges, users...
                    </button>
                    <svg
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <a
                    href="https://rektofun.gitbook.io/rektofun/introduction/what-is-rektofun"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-sm font-black uppercase tracking-[0.06em] text-gray-700 transition-colors hover:text-[#e85a2d] whitespace-nowrap"
                >
                    How it works?
                </a>
            </div>

            {searchModal}
        </>
    );
}
