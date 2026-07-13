"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getLeaderboard, type LeaderboardPeriod, type LeaderboardSort, type LeaderboardUser } from "../lib/users-service/users";
import { Search } from "lucide-react";

const SparkleIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 0L7 5L12 6L7 7L6 12L5 7L0 6L5 5L6 0Z" fill="currentColor" />
    </svg>
);

const VerifiedBadge = ({ isModerator = false }: { isModerator?: boolean }) => (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 32 32" aria-hidden="true">
        <path
            fill={isModerator ? "#F5B800" : "#378FDB"}
            d="M16 1.5l2.8 2.2 3.5-1 1.6 3.2 3.6.5.1 3.7 3 2-1.4 3.4 1.4 3.4-3 2-.1 3.7-3.6.5-1.6 3.2-3.5-1L16 30.5l-2.8-2.2-3.5 1-1.6-3.2-3.6-.5-.1-3.7-3-2 1.4-3.4-1.4-3.4 3-2 .1-3.7 3.6-.5 1.6-3.2 3.5 1L16 1.5Z"
        />
        <path d="m9.4 16.2 4.2 4.2 9-9" fill="none" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ChallengeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-amber-500">
        <path d="M8 1L9.5 5.5L14 6L10.5 9L11.5 13.5L8 11L4.5 13.5L5.5 9L2 6L6.5 5.5L8 1Z" fill="currentColor" />
    </svg>
);

const HandshakeIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-amber-700">
        <path d="M10 2C10 2 12 4 14 4C16 4 17 6 17 8C17 10 16 12 14 13L10 17L6 13C4 12 3 10 3 8C3 6 4 4 6 4C8 4 10 2 10 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M7 8C7 8 8 9 10 9C12 9 13 8 13 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const CoinsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-amber-600">
        <ellipse cx="10" cy="14" rx="6" ry="3" fill="currentColor" opacity="0.6" />
        <ellipse cx="10" cy="11" rx="6" ry="3" fill="currentColor" opacity="0.8" />
        <ellipse cx="10" cy="8" rx="6" ry="3" fill="currentColor" />
        <ellipse cx="10" cy="8" rx="4" ry="2" fill="#fbbf24" />
    </svg>
);

const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

const ChevronIcon = ({ direction }: { direction: "up" | "down" }) => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400">
        {direction === "up" ? (
            <path d="M6 4L3 7H9L6 4Z" fill="currentColor" />
        ) : (
            <path d="M6 8L9 5H3L6 8Z" fill="currentColor" />
        )}
    </svg>
);

const ArrowIcon = ({ direction }: { direction: "left" | "right" }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {direction === "left" ? (
            <path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
            <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        )}
    </svg>
);

type LeaderboardRow = {
    id: string;
    walletAddress: string;
    rank: number;
    username: string;
    twitterUsername: string | null;
    userType: "user" | "moderator";
    avatar: string;
    winRate: number;
    winRateLabel: string;
    won: number;
    rekt: number;
    profit: string;
    volume: string;
};

type SortField = "rank" | "winRate" | "won" | "rekt" | "profit" | "volume";
type SortOrder = "desc" | "asc";

const ITEMS_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const SortIndicator = ({ active, order }: { active: boolean; order: SortOrder }) => {
    if (!active) return <span className="text-gray-300">↕</span>;
    return <ChevronIcon direction={order === "asc" ? "up" : "down"} />;
};

function mapUserToRow(user: LeaderboardUser, rank: number): LeaderboardRow {
    const won = user.won;
    const rekt = user.lost;
    const profit = user.pnl.toFixed(2);
    const volume = user.volume.toFixed(2);
    const winRate = user.win_rate;
    const winRateLabel = `${winRate}%`;

    return {
        id: user.id,
        walletAddress: user.wallet_address,
        rank: user.rank || rank,
        username: user.username || `user-${user.wallet_address.slice(0, 6)}`,
        twitterUsername: user.twitter_username,
        userType: user.user_type,
        avatar: user.profile_image || "/scribbles/pepe.png",
        winRate,
        winRateLabel,
        won,
        rekt,
        profit,
        volume,
    };
}

function getRankBadgeClass(rank: number): string {
    if (rank === 1) return "border-amber-300 bg-amber-100 text-amber-800";
    if (rank === 2) return "border-slate-300 bg-slate-100 text-slate-700";
    if (rank === 3) return "border-orange-300 bg-orange-100 text-orange-800";
    return "border-gray-200 bg-white text-gray-700";
}

const LeaderboardRowSkeleton = ({ index }: { index: number }) => (
    <div className="grid grid-cols-12 items-center gap-4 px-6 py-4" aria-hidden="true">
        <div className="col-span-1 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-200/80" />
            <div className="h-3 w-3 rounded-sm bg-gray-200/80" />
        </div>
        <div className="col-span-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200/80" />
            <div className="h-4 w-24 rounded bg-gray-200/80" />
        </div>
        <div className="col-span-2 flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-gray-200/80" />
            <div className="h-4 w-14 rounded bg-gray-200/80" />
        </div>
        <div className="col-span-1">
            <div className="h-6 w-9 rounded-full bg-gray-200/80" />
        </div>
        <div className="col-span-2">
            <div className="h-4 w-10 rounded bg-gray-200/80" />
        </div>
        <div className="col-span-1">
            <div className="h-6 w-12 rounded-full bg-gray-200/80" />
        </div>
        <div className="col-span-2 flex justify-end">
            <div className={`h-4 rounded bg-gray-200/80 ${index % 2 === 0 ? "w-16" : "w-12"}`} />
        </div>
    </div>
);

export default function LeaderboardPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [sortField, setSortField] = useState<SortField>("profit");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [rows, setRows] = useState<LeaderboardRow[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<LeaderboardPeriod>("all");

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearchQuery(searchQuery.trim());
            setCurrentPage(1);
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;

        const loadUsers = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const apiSort: LeaderboardSort = ({ winRate: "win_rate", rekt: "lost", profit: "pnl" } as const)[sortField as "winRate" | "rekt" | "profit"] || sortField as LeaderboardSort;
                const response = await getLeaderboard(ITEMS_PER_PAGE, offset, debouncedSearchQuery, period, apiSort, sortOrder);
                const mapped = response.users.map((user, index) => mapUserToRow(user, offset + index + 1));
                setRows(mapped);
                setTotalCount(response.count);
            } catch {
                setError("Failed to load leaderboard users.");
                setRows([]);
                setTotalCount(0);
            } finally {
                setIsLoading(false);
            }
        };

        loadUsers();
    }, [currentPage, debouncedSearchQuery, period, sortField, sortOrder]);

    const sortedData = useMemo(() => {
        const sorted = [...rows];
        sorted.sort((a, b) => {
            const direction = sortOrder === "asc" ? 1 : -1;
            if (sortField === "profit" || sortField === "volume") {
                return (Number(a[sortField]) - Number(b[sortField])) * direction;
            }
            return ((a[sortField] as number) - (b[sortField] as number)) * direction;
        });
        return sorted;
    }, [rows, sortField, sortOrder]);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = sortedData;

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
        }
    };

    const handleSort = (field: SortField) => {
        setCurrentPage(1);
        if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }
        setSortField(field);
        setSortOrder("desc");
    };

    const periods: Array<{ value: LeaderboardPeriod; label: string }> = [
        { value: "1d", label: "1D" }, { value: "7d", label: "7D" },
        { value: "30d", label: "30D" }, { value: "all", label: "All Time" },
    ];

    return (
        <div className="rekto-page min-h-screen">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Leaderboards</h1>
                        <p className="text-gray-600 text-base sm:text-lg">Explore the top challengers and their achievements</p>
                    </div>
                </div>

                {/* stats website  */}
                {/* <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                    <div className="leaderboard-hover-shadow group bg-[#fffaf6]/80 backdrop-blur-sm rounded-xl px-5 py-4 flex items-center justify-between border border-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-black">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                <ChallengeIcon />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-gray-900">{totalChallenges}</div>
                                <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Page Challenges</div>
                            </div>
                        </div>
                    </div>

                    <div className="leaderboard-hover-shadow group bg-[#fffaf6]/80 backdrop-blur-sm rounded-xl px-5 py-4 flex items-center justify-between border border-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-black">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                                <HandshakeIcon />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-gray-900">{totalCount}</div>
                                <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Total Traders</div>
                            </div>
                        </div>
                    </div>

                    <div className="leaderboard-hover-shadow group bg-[#fffaf6]/80 backdrop-blur-sm rounded-xl px-5 py-4 flex items-center justify-between border border-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-black">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                <CoinsIcon />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-gray-900">${totalEarned.toFixed(1)}</div>
                                <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Page Earned</div>
                            </div>
                        </div>
                    </div>

                    <div className="leaderboard-hover-shadow group bg-[#fffaf6]/80 backdrop-blur-sm rounded-xl px-5 py-4 flex items-center justify-between border border-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-black">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                                <SparkleIcon className="text-rose-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-black text-gray-900">{totalPoints}</div>
                                <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Page Points</div>
                            </div>
                        </div>
                    </div>
                </div> */}

                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-md sm:flex-1">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                            }}
                            className="w-full rounded-full border border-black/15 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-gray-800 shadow-[2px_2px_0_rgba(0,0,0,0.16)] placeholder:text-gray-400 outline-none transition hover:shadow-[3px_3px_0_rgba(0,0,0,0.18)] focus:border-black/25 focus:bg-white focus:ring-4 focus:ring-gray-900/[0.04]"
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <div className="grid w-full grid-cols-4 rounded-lg border border-black/10 bg-white/70 p-1 shadow-sm backdrop-blur-sm sm:flex sm:w-auto" aria-label="Leaderboard period">
                            {periods.map((item) => (
                                <button key={item.value} onClick={() => { setPeriod(item.value); setCurrentPage(1); }}
                                    aria-pressed={period === item.value}
                                    className={`min-h-8 cursor-pointer whitespace-nowrap rounded-md border-0 px-3 py-1.5 text-xs font-bold transition-all duration-200 ${period === item.value ? "bg-gray-900 text-white shadow-sm" : "bg-transparent text-gray-500 hover:text-gray-900"}`}>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="leaderboard-hover-shadow leaderboard-table-shell bg-[#fffaf6]/80 backdrop-blur-sm rounded-2xl border border-black/10 overflow-hidden transition-all duration-200 hover:border-black">
                    <div className="flex flex-col gap-1 border-b border-black/10 bg-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-black text-gray-900">User Rankings</h2>
                            <p className="text-sm font-medium text-gray-500">Realized performance · {periods.find((item) => item.value === period)?.label}</p>
                        </div>
                        <div className="text-sm font-semibold text-gray-600">
                            Page {Math.min(currentPage, Math.max(totalPages, 1))} of {Math.max(totalPages, 1)}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            <div className="grid grid-cols-12 gap-4 border-b border-black/10 bg-[#fff8f4] px-6 py-3 text-xs font-black uppercase tracking-wide text-gray-500">
                                <div onClick={() => handleSort("rank")} className="col-span-1 flex cursor-pointer items-center gap-1 bg-transparent p-0 text-left font-black text-gray-500 transition hover:text-gray-900">
                                    Rank <SortIndicator active={sortField === "rank"} order={sortOrder} />
                                </div>
                                <div className="col-span-3">User</div>
                                <div onClick={() => handleSort("winRate")} className="col-span-2 flex cursor-pointer items-center gap-1 bg-transparent p-0 text-left font-black text-gray-500 transition hover:text-gray-900">
                                    Win Rate <SortIndicator active={sortField === "winRate"} order={sortOrder} />
                                </div>
                                <div onClick={() => handleSort("won")} className="col-span-1 flex cursor-pointer items-center gap-1 bg-transparent p-0 text-left font-black text-gray-500 transition hover:text-gray-900">
                                    Won <SortIndicator active={sortField === "won"} order={sortOrder} />
                                </div>
                                <div onClick={() => handleSort("rekt")} className="col-span-1 flex cursor-pointer items-center gap-1 bg-transparent p-0 text-left font-black text-gray-500 transition hover:text-gray-900">
                                    Rekt <SortIndicator active={sortField === "rekt"} order={sortOrder} />
                                </div>
                                <div onClick={() => handleSort("profit")} className="col-span-2 flex cursor-pointer items-center justify-end gap-1 bg-transparent p-0 text-right font-black text-gray-500 transition hover:text-gray-900">
                                    P&amp;L <SortIndicator active={sortField === "profit"} order={sortOrder} />
                                </div>
                                <div onClick={() => handleSort("volume")} className="col-span-2 flex cursor-pointer items-center justify-end gap-1 bg-transparent p-0 text-right font-black text-gray-500 transition hover:text-gray-900">
                                    Volume <SortIndicator active={sortField === "volume"} order={sortOrder} />
                                </div>
                            </div>

                            <div className="divide-y divide-black/5 bg-white/55">
                                {error && <div className="px-6 py-10 text-center font-semibold text-red-600">{error}</div>}
                                {!error && isLoading && (
                                    <div className="animate-pulse divide-y divide-black/5">
                                        {Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
                                            <LeaderboardRowSkeleton key={index} index={index} />
                                        ))}
                                    </div>
                                )}
                                {!error && !isLoading && paginatedData.length === 0 && (
                                    <div className="px-6 py-10 text-center font-semibold text-gray-600">No users found.</div>
                                )}

                                {!error && !isLoading && paginatedData.map((user) => (
                                    <div
                                        key={user.id}
                                        className="grid cursor-pointer grid-cols-12 items-center gap-4 px-6 py-4 transition-all duration-200 hover:bg-white"
                                        onClick={() => router.push(`/profile/${user.walletAddress}`)}
                                    >
                                        <div className="col-span-1 flex items-center gap-2">
                                            <span className={`flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-sm font-black ${getRankBadgeClass(user.rank)}`}>
                                                {user.rank}
                                            </span>
                                        </div>

                                        <div className="col-span-3 flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex-shrink-0">
                                                <Image src={user.avatar} alt={user.username} fill className="object-cover" sizes="40px" />
                                            </div>
                                            <div className="flex min-w-0 items-center gap-1">
                                                <span className="truncate font-semibold text-gray-900">{user.username}</span>
                                                {(user.userType === "moderator" || user.twitterUsername) && (
                                                    <span
                                                        className="inline-flex shrink-0"
                                                        title={user.userType === "moderator" ? "Verified as KOL" : `Verified on X as @${user.twitterUsername}`}
                                                        aria-label={user.userType === "moderator" ? "Verified as KOL" : `Verified on X as @${user.twitterUsername}`}
                                                    >
                                                        <VerifiedBadge isModerator={user.userType === "moderator"} />
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-span-2 flex items-center gap-1">
                                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{user.winRateLabel}</span>
                                        </div>

                                        <div className="col-span-1 flex items-center gap-1">
                                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{user.won}</span>
                                        </div>

                                        <div className="col-span-1 flex items-center gap-1">
                                            <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-black text-red-600">{user.rekt}</span>
                                        </div>

                                        <div className="col-span-2 text-right">
                                            <span className={`font-black ${Number(user.profit) < 0 ? "text-red-600" : "text-emerald-700"}`}>{Number(user.profit) >= 0 ? "+" : "-"}${Math.abs(Number(user.profit)).toFixed(2)}</span>
                                        </div>

                                        <div className="col-span-2 text-right">
                                            <span className="font-black text-gray-900">${user.volume}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {!error && totalPages > 1 && (
                        <div className="flex flex-col gap-4 border-t border-black/10 bg-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm font-semibold text-gray-600">
                                Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalCount)} of {totalCount} users
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || isLoading}
                                    className={`leaderboard-pagination-button inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-black transition-all ${currentPage === 1 || isLoading
                                        ? "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"
                                        : "border border-black/10 bg-white text-gray-700 hover:border-black hover:bg-[#fff8f4] hover:text-gray-900"
                                        }`}
                                >
                                    <ArrowIcon direction="left" />
                                    Previous
                                </button>

                                <span className="flex h-9 items-center rounded-lg border border-black/10 bg-white px-3 text-sm font-black text-gray-700">
                                    Page {Math.min(currentPage, Math.max(totalPages, 1))} of {Math.max(totalPages, 1)}
                                </span>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || isLoading}
                                    className={`leaderboard-pagination-button inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-black transition-all ${currentPage === totalPages || isLoading
                                        ? "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"
                                        : "border border-black/10 bg-white text-gray-700 hover:border-black hover:bg-[#fff8f4] hover:text-gray-900"
                                        }`}
                                >
                                    Next
                                    <ArrowIcon direction="right" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style jsx global>{`
                .pixel-shell .leaderboard-hover-shadow.leaderboard-hover-shadow {
                    box-shadow: none !important;
                }

                .pixel-shell .leaderboard-hover-shadow.leaderboard-hover-shadow:hover {
                    box-shadow: 4px 4px 0 #111 !important;
                }

                .pixel-shell .leaderboard-table-shell.leaderboard-table-shell,
                .pixel-shell .leaderboard-table-shell.leaderboard-table-shell:hover,
                .pixel-shell .leaderboard-pagination-button.leaderboard-pagination-button,
                .pixel-shell .leaderboard-pagination-button.leaderboard-pagination-button:hover {
                    box-shadow: none !important;
                    transform: none !important;
                }

                .pixel-shell input.leaderboard-hover-shadow.leaderboard-hover-shadow:focus {
                    box-shadow: 4px 4px 0 #111 !important;
                }

                .pixel-shell input.leaderboard-hover-shadow.leaderboard-hover-shadow:hover:not(:focus) {
                    box-shadow: 4px 4px 0 #111 !important;
                }
            `}</style>
        </div>
    );
}
