"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { getChallenges, type ChallengeListItem } from "@/app/lib/challenges-service/challenges";
import { getLeaderboard, type LeaderboardUser } from "@/app/lib/users-service/users";
import { useBodyScrollLock } from "@/app/lib/useBodyScrollLock";

type SearchTab = "all" | "challenges" | "users";
const CHALLENGE_RESULT_LIMIT = 8;
const USER_RESULT_LIMIT = 5;

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

function formatEndsAt(expireTime: string) {
    const ms = new Date(expireTime).getTime() - Date.now();
    if (Number.isNaN(ms)) return "Ends soon";
    if (ms <= 0) return "0m";

    const totalHours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;

    const mins = Math.max(1, Math.floor(ms / (1000 * 60)));
    return `${mins}m`;
}

function getChallengeStatusMeta(status: ChallengeListItem["status"]) {
    if (status === "open") {
        return { label: "Live", className: "bg-[#eaf9ef] text-[#15803d] border-[#bbf7d0]" };
    }
    if (status === "locked") {
        return { label: "Locked", className: "bg-[#fff2e8] text-[#b45309] border-[#fed7aa]" };
    }
    if (status === "resolved") {
        return { label: "Resolved", className: "bg-[#e8f0ff] text-[#1d4ed8] border-[#bfdbfe]" };
    }
    return { label: "Cancelled", className: "bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]" };
}

function formatMode(mode: string) {
    return mode.replace(/[_-]/g, " ").toUpperCase();
}

function formatCompactWallet(walletAddress: string | null | undefined) {
    if (!walletAddress) return "No wallet";
    if (walletAddress.length <= 10) return walletAddress;
    return `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
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
    const [challengeResults, setChallengeResults] = useState<ChallengeListItem[]>([]);
    const [userResults, setUserResults] = useState<LeaderboardUser[]>([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestIdRef = useRef(0);
    const hasInitializedOpenStateRef = useRef(false);

    const hasQuery = query.trim().length > 0;

    const closeModal = useCallback(() => onCloseModal(), [onCloseModal]);

    const loadInitialResults = useCallback(async () => {
        const reqId = ++requestIdRef.current;
        setIsLoading(true);
        setError(null);

        try {
            const [challengesRes, usersRes] = await Promise.all([
                getChallenges({ limit: CHALLENGE_RESULT_LIMIT, sort: "latest" }).catch(() => null),
                getLeaderboard(USER_RESULT_LIMIT, 0).catch(() => null),
            ]);

            if (requestIdRef.current !== reqId) return;

            setChallengeResults((challengesRes?.challenges ?? []).slice(0, CHALLENGE_RESULT_LIMIT));
            setUserResults((usersRes?.users ?? []).slice(0, USER_RESULT_LIMIT));

            if (!challengesRes && !usersRes) {
                setError("Could not load search results.");
            }
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
            const [challengesRes, usersRes] = await Promise.all([
                getChallenges({ search: nextQuery, limit: CHALLENGE_RESULT_LIMIT, sort: "latest" }).catch(() => null),
                getLeaderboard(USER_RESULT_LIMIT, 0, nextQuery).catch(() => null),
            ]);

            if (requestIdRef.current !== reqId) return;

            setChallengeResults((challengesRes?.challenges ?? []).slice(0, CHALLENGE_RESULT_LIMIT));
            setUserResults((usersRes?.users ?? []).slice(0, USER_RESULT_LIMIT));

            if (!challengesRes && !usersRes) {
                setError("Could not fetch search results. Please try again.");
            }
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

            <div className="relative z-10 mx-2 mt-16 md:mx-auto md:mt-20 w-auto md:w-[86vw] max-w-5xl h-[calc(100vh-9rem)] md:max-h-[calc(100vh-10rem)] border-2 border-black bg-[#fff8f4] shadow-[5px_5px_0_#111] overflow-hidden flex flex-col">
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
                                                <div className="mt-3 grid grid-cols-3 gap-2">
                                                    <div className="h-8 rounded bg-[#f1ece6]" />
                                                    <div className="h-8 rounded bg-[#f1ece6]" />
                                                    <div className="h-8 rounded bg-[#f1ece6]" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {showUsers && (
                                <section className="px-4 md:px-6 py-4 border-b border-[#f0dfd2] animate-pulse">
                                    <div className="mb-4 h-7 w-20 rounded bg-[#efe4db]" />
                                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                                        {cardSkeletons.map((_, index) => (
                                            <div key={`user-skeleton-${index}`} className="rounded-lg border border-[#eadfd6] bg-white p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-[#f3f4f6]" />
                                                    <div className="min-w-0 w-full space-y-2">
                                                        <div className="h-3.5 w-4/5 rounded bg-[#f1ece6]" />
                                                        <div className="h-3 w-3/5 rounded bg-[#f1ece6]" />
                                                    </div>
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
                                    const participantCount = (challenge.total_challengers ?? 0) + (challenge.total_opponents ?? 0);
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
                                                <div className="relative h-12 w-12 overflow-hidden rounded-md border border-[#eadfd6] bg-[#f3f4f6] flex-shrink-0">
                                                    {challenge.market?.image ? (
                                                        <Image src={challenge.market.image} alt={challenge.title} fill sizes="48px" className="object-cover" />
                                                    ) : null}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.08em] ${statusMeta.className}`}>
                                                            {statusMeta.label}
                                                        </span>
                                                        <span className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a7468]">
                                                            {challenge.market?.name ?? "General"}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 line-clamp-2 text-sm font-black leading-snug text-[#111827] group-hover:text-[#e85a2d]">
                                                        {challenge.title}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#f0dfd2] pt-3">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8a7468]">Pool</p>
                                                    <p className="truncate text-sm font-black text-[#111827]">
                                                        {formatPool((challenge.total_pool ?? 0) > 0 ? challenge.total_pool : challenge.initial_bet)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8a7468]">Ends</p>
                                                    <p className="truncate text-sm font-black text-[#166534]">
                                                        {formatEndsAt(challenge.resolve_time || challenge.expire_time)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8a7468]">Players</p>
                                                    <p className="truncate text-sm font-black text-[#111827]">
                                                        {participantCount}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between gap-2">
                                                <span className="truncate text-xs font-semibold text-[#64748b]">
                                                    by {challenge.creator?.username || "Unknown"}
                                                </span>
                                                <span className="shrink-0 rounded-md bg-[#f5d547] px-2 py-1 text-[10px] font-black uppercase text-black">
                                                    {formatMode(challenge.mode)}
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
                                <h3 className="text-lg md:text-xl font-semibold text-[#1e293b]">Users</h3>
                                <Link href="/leaderboard" onClick={closeModal} className="text-[#f97316] text-xs md:text-sm font-bold">View all →</Link>
                            </div>
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                                {userResults.map((user, index) => {
                                    const username = user.username || "Unnamed";
                                    return (
                                        <Link
                                            key={user.id}
                                            href={user.wallet_address ? `/profile/${user.wallet_address}` : "/settings"}
                                            onClick={closeModal}
                                            className="group rounded-lg border-2 border-[#eadfd6] bg-white p-3 shadow-[2px_2px_0_rgba(17,17,17,0.08)] transition hover:-translate-y-0.5 hover:border-black hover:bg-[#fffaf6] hover:shadow-[3px_3px_0_#111] focus:outline-none focus:shadow-[0_0_0_4px_rgba(232,90,45,0.18)]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative h-11 w-11 shrink-0">
                                                    <Image
                                                        src={user.profile_image || "https://earningrecords.com/assets/rektofun/profiles/1.svg"}
                                                        alt={username}
                                                        fill
                                                        sizes="44px"
                                                        className="rounded-full border-2 border-black bg-[#fff4ed] object-cover"
                                                    />
                                                    <span className="absolute -bottom-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-black bg-[#f5d547] px-1 text-[10px] font-black text-black">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-black text-[#0f172a] group-hover:text-[#e85a2d]">{username}</p>
                                                    <p className="truncate text-xs font-semibold text-[#64748b]">{formatCompactWallet(user.wallet_address)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#f0dfd2] pt-2">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8a7468]">Earned</p>
                                                    <p className="truncate text-xs font-black text-[#111827]">{formatPool(user.earnings ?? 0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#8a7468]">Refs</p>
                                                    <p className="truncate text-xs font-black text-[#111827]">{user.referrals?.length ?? 0}</p>
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
            <div className="hidden md:flex items-center gap-6 flex-1 justify-center max-w-2xl mx-8">
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
                    href="https://rektofun.gitbook.io/rektofun/introduction/how-it-works"
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
