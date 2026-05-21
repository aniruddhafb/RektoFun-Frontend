"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getChallenges, type ChallengeListItem } from "@/app/lib/challenges-service/challenges";
import { getLeaderboard, type LeaderboardUser } from "@/app/lib/users-service/users";

type SearchTab = "all" | "challenges" | "users";

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
        return { label: "Live", className: "bg-[#eaf9ef] text-[#16a34a]" };
    }
    if (status === "locked") {
        return { label: "Locked", className: "bg-[#fff2e8] text-[#f59e0b]" };
    }
    if (status === "resolved") {
        return { label: "Resolved", className: "bg-[#e8f0ff] text-[#2563eb]" };
    }
    return { label: "Cancelled", className: "bg-[#fee2e2] text-[#dc2626]" };
}

export function NavbarDesktopSearch({
    searchQuery,
    onSearchQueryChange,
    isModalOpen,
    onOpenModal,
    onCloseModal,
}: NavbarDesktopSearchProps) {
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

    const closeModal = () => onCloseModal();

    const handleQueryChange = (value: string) => {
        setQuery(value);

        if (value.trim() === "") {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            onSearchQueryChange("");
            loadInitialResults();
        }
    };

    async function loadInitialResults() {
        const reqId = ++requestIdRef.current;
        setIsLoading(true);
        setError(null);

        try {
            const [challengesRes, usersRes] = await Promise.all([
                getChallenges({ limit: 3, sort: "latest" }).catch(() => null),
                getLeaderboard(5, 0).catch(() => null),
            ]);

            if (requestIdRef.current !== reqId) return;

            setChallengeResults((challengesRes?.challenges ?? []).slice(0, 3));
            setUserResults((usersRes?.users ?? []).slice(0, 5));

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
    }

    async function loadSearchResults(searchTerm: string) {
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
                getChallenges({ search: nextQuery, limit: 3, sort: "latest" }).catch(() => null),
                getLeaderboard(5, 0, nextQuery).catch(() => null),
            ]);

            if (requestIdRef.current !== reqId) return;

            setChallengeResults((challengesRes?.challenges ?? []).slice(0, 3));
            setUserResults((usersRes?.users ?? []).slice(0, 5));

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
    }

    useEffect(() => {
        if (!isModalOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeModal();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isModalOpen]);

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
    }, [hasQuery, isModalOpen, onSearchQueryChange, query]);

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
        { key: "challenges", label: "Challenges" },
        { key: "users", label: "Users" },
    ];

    const challengeSkeletons = Array.from({ length: 3 });
    const cardSkeletons = Array.from({ length: 5 });

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
    }, [isModalOpen, searchQuery]);

    return (
        <>
            <div className="hidden md:flex items-center gap-6 flex-1 justify-center max-w-2xl mx-8">
                <div className="relative flex-1 max-w-md">
                    <button
                        type="button"
                        onClick={onOpenModal}
                        className="w-full text-left px-4 py-2.5 pl-10 bg-white/50 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-black/20 transition-all cursor-pointer"
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
                    className="text-sm font-medium text-gray-700 hover:text-black transition-colors whitespace-nowrap"
                >
                    How it works?
                </a>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[180]">
                    <button
                        type="button"
                        onClick={closeModal}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                    />

                    <div className="relative z-10 mx-2 mt-16 md:mx-auto md:mt-20 w-auto md:w-[82vw] max-w-4xl h-[calc(100vh-9rem)] md:h-auto rounded-[16px] md:rounded-[20px] border border-[#f1c7a7] bg-[#fff8f4] shadow-[0_20px_52px_rgba(0,0,0,0.28)] overflow-hidden flex flex-col">
                        <div className="p-3 md:p-5 border-b border-[#f0dfd2]">
                            <div className="flex items-center gap-2 md:gap-4">
                                <div className="relative flex-1">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Search challenges, users..."
                                        value={query}
                                        onChange={(event) => handleQueryChange(event.target.value)}
                                        className="w-full rounded-[12px] md:rounded-[14px] border border-[#e8ddd3] bg-white px-9 md:px-10 py-2.5 text-base md:text-[18px] leading-none text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]/20"
                                    />
                                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <span className="hidden md:inline-block rounded-lg border border-[#e8ddd3] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#64748b]">ESC</span>
                                <button type="button" onClick={closeModal} className="text-[#64748b] hover:text-[#334155] text-2xl md:text-3xl leading-none px-2">×</button>
                            </div>

                            <div className="mt-4 md:mt-5 flex items-center gap-2 overflow-x-auto pb-1">
                                {tabs.map((tab) => {
                                    const selected = activeTab === tab.key || (activeTab === "all" && tab.key === "challenges");
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`whitespace-nowrap rounded-2xl border px-3 md:px-4 py-1.5 text-xs md:text-sm transition ${selected ? "border-[#f6c9a7] bg-white text-[#f97316]" : "border-[#e8ddd3] bg-white/70 text-[#475569] hover:bg-white"}`}
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
                                            <div className="rounded-2xl border border-[#eadfd6] bg-white overflow-hidden">
                                                {challengeSkeletons.map((_, index) => (
                                                    <div
                                                        key={`challenge-skeleton-${index}`}
                                                        className="w-full flex items-center gap-3 px-3.5 py-3 border-b border-[#f3e8df] last:border-b-0"
                                                    >
                                                        <div className="h-12 w-20 rounded-lg bg-[#f3f4f6] flex-shrink-0" />
                                                        <div className="flex-1 min-w-0 space-y-2">
                                                            <div className="h-4 w-4/5 rounded bg-[#f1ece6]" />
                                                            <div className="h-3 w-1/3 rounded bg-[#f1ece6]" />
                                                        </div>
                                                        <div className="pl-5 pr-4 border-l border-[#f0dfd2] space-y-2">
                                                            <div className="h-5 w-20 rounded bg-[#f1ece6]" />
                                                            <div className="h-3 w-14 rounded bg-[#f1ece6]" />
                                                        </div>
                                                        <div className="h-6 w-16 rounded-full bg-[#f1ece6]" />
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {showUsers && (
                                        <section className="px-4 md:px-6 py-4 border-b border-[#f0dfd2] animate-pulse">
                                            <div className="mb-4 h-7 w-20 rounded bg-[#efe4db]" />
                                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-2.5">
                                                {cardSkeletons.map((_, index) => (
                                                    <div key={`user-skeleton-${index}`} className="rounded-xl border border-[#eadfd6] bg-white p-3">
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
                                        <h3 className="text-lg md:text-xl font-semibold text-[#1e293b]">Challenges</h3>
                                        <Link href="/challenges" onClick={closeModal} className="text-[#f97316] text-xs md:text-sm font-medium">View all challenges →</Link>
                                    </div>

                                    <div className="rounded-2xl border border-[#eadfd6] bg-white overflow-hidden">
                                        {challengeResults.map((challenge) => {
                                            const statusMeta = getChallengeStatusMeta(challenge.status);
                                            return (
                                                <button
                                                    key={challenge.id}
                                                    type="button"
                                                    onClick={() => {
                                                        closeModal();
                                                        router.push(`/challenges?challengeId=${encodeURIComponent(challenge.id)}`);
                                                    }}
                                                    className="cursor-pointer w-full flex flex-col md:flex-row md:items-center gap-3 px-3.5 py-3 text-left border-b border-[#f3e8df] last:border-b-0 hover:bg-[#fffbf8]"
                                                >
                                                    <div className="h-12 w-20 rounded-lg bg-[#f3f4f6] overflow-hidden flex-shrink-0">
                                                        {challenge.market?.image ? (
                                                            <img src={challenge.market.image} alt={challenge.title} className="h-full w-full object-cover" />
                                                        ) : null}
                                                    </div>
                                                    <div className="w-full md:flex-1 min-w-0">
                                                        <p className="truncate text-sm md:text-base font-semibold text-[#111827]">{challenge.title} In Next <span className="ml-1 text-[#166534]">{formatEndsAt(challenge.resolve_time || challenge.expire_time)}</span></p>
                                                        <p className="text-xs text-[#64748b]">
                                                            {(challenge.market?.name ?? "General")} • {challenge.mode}
                                                        </p>
                                                    </div>
                                                    <div className="w-full md:w-auto text-left md:text-right md:pr-4 md:border-l md:border-[#f0dfd2] md:pl-5">
                                                        <p className="text-base md:text-xl font-semibold text-[#111827]">{formatPool((challenge.total_pool ?? 0) > 0 ? challenge.total_pool : challenge.initial_bet)}</p>
                                                        <p className="text-xs md:text-sm text-[#64748b]">Total Pool</p>
                                                    </div>
                                                    <span className={`self-start md:self-auto rounded-full px-3 py-1 text-xs font-medium ${statusMeta.className}`}>
                                                        {statusMeta.label}
                                                    </span>
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
                                        <Link href="/leaderboard" onClick={closeModal} className="text-[#f97316] text-xs md:text-sm font-medium">View all users →</Link>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-2.5">
                                        {userResults.map((user) => (
                                            <Link
                                                key={user.id}
                                                href={user.wallet_address ? `/profile/${user.wallet_address}` : "/settings"}
                                                onClick={closeModal}
                                                className="rounded-xl border border-[#eadfd6] bg-white p-3 hover:bg-[#fffbf8]"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={user.profile_image || "https://earningrecords.com/assets/rektofun/profiles/1.svg"}
                                                        alt={user.username || "User"}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-[#0f172a]">{user.username || "Unnamed"}</p>
                                                        <p className="truncate text-sm text-[#64748b]">@{(user.username || "user").toLowerCase()}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
