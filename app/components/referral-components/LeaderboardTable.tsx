"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Sparkles, Search, ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react";
import { getLeaderboard, LeaderboardUser } from "@/app/lib/users-service/users";
import Link from "next/link";

const ITEMS_PER_PAGE = 10;
const POINTS_PER_REFERRAL = 100;
const SEARCH_DEBOUNCE_MS = 300;

interface LeaderboardEntry {
    rank: number;
    user: LeaderboardUser;
    referralCount: number;
    points: number;
}

function formatDate(dateString: string | null): string {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function getRankBadgeClass(rank: number): string {
    if (rank === 1) return "border-amber-300 bg-amber-100 text-amber-800";
    if (rank === 2) return "border-slate-300 bg-slate-100 text-slate-700";
    if (rank === 3) return "border-orange-300 bg-orange-100 text-orange-800";
    return "border-gray-200 bg-white text-gray-700";
}

interface LeaderboardRowProps {
    entry: LeaderboardEntry;
}

function LeaderboardRow({ entry }: LeaderboardRowProps) {
    const { rank, user, referralCount, points } = entry;
    const username = user.username || "Anonymous";
    const profileHref = user.wallet_address ? `/profile/${user.wallet_address}` : "#";

    // Validate profile_image URL - use fallback if invalid or from unknown domain
    let profileImage = "/scribbles/pepe.png";
    if (user.profile_image) {
        try {
            // Check if it's a valid URL and from allowed domain
            const url = new URL(user.profile_image);
            if (url.hostname === 'earningrecords.com' || url.protocol === 'data:') {
                profileImage = user.profile_image;
            }
        } catch {
            // If URL parsing fails, check if it's a relative path
            if (user.profile_image.startsWith('/')) {
                profileImage = user.profile_image;
            }
        }
    }

    return (
        <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all duration-200 hover:bg-white">
            {/* Rank */}
            <div className="col-span-1 flex items-center gap-2">
                <span className={`flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-sm font-black ${getRankBadgeClass(rank)}`}>
                    {rank}
                </span>
                {rank === 1 && <Star className="h-4 w-4 fill-amber-500 text-amber-600" />}
            </div>

            {/* Player */}
            <Link href={profileHref} className="col-span-3 flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-none flex-shrink-0">
                    <Image
                        src={profileImage}
                        alt={username}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-gray-900 truncate">{username}</span>
                </div>
            </Link>

            {/* Joined */}
            <div className="col-span-2 text-sm font-semibold text-gray-700">{formatDate(user.created_at)}</div>

            {/* Referrals */}
            <div className="col-span-2 text-sm font-black text-gray-900">{referralCount}</div>

            {/* REKTO points */}
            <div className="col-span-2 flex items-center gap-2 text-sm font-black text-gray-900">
                <Sparkles className="h-4 w-4 text-amber-500" />
                {points}
            </div>

            {/* Earnings */}
            <div className="col-span-2 text-right text-sm font-black text-gray-900">
                {user.earnings !== null ? `$${user.earnings.toFixed(1)}` : "$0.0"}
            </div>
        </div >
    );
}

export function LeaderboardTable() {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset to first page on new search
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch leaderboard data
    const fetchLeaderboard = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getLeaderboard(ITEMS_PER_PAGE, offset, debouncedSearch);

            // Calculate ranks and points
            const entries: LeaderboardEntry[] = response.users.map((user, index) => ({
                rank: offset + index + 1,
                user,
                referralCount: user.referrals?.length || 0,
                points: (user.referrals?.length || 0) * POINTS_PER_REFERRAL,
            }));

            // Sort by referral count (descending) - most referrals first
            entries.sort((a, b) => b.referralCount - a.referralCount);

            // Recalculate ranks after sorting
            entries.forEach((entry, index) => {
                entry.rank = offset + index + 1;
            });

            setLeaderboardData(entries);
            setTotalCount(response.count);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch leaderboard");
        } finally {
            setIsLoading(false);
        }
    }, [offset, debouncedSearch]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    return (
        <>
            <div className="mb-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="relative max-w-md w-full">
                    <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search traders"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="referral-hover-shadow pl-11 pr-4 py-3 bg-white/80 border border-black/10 rounded-xl text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 w-full"
                    />
                </div>
                <div className="rounded-full border border-black/10 bg-white/60 px-4 py-2 text-sm font-semibold text-gray-600">
                    {totalCount} {totalCount === 1 ? "user" : "users"} ranked
                </div>
            </div>

            <div className="referral-table-shell bg-[#fffaf6]/80 backdrop-blur-sm rounded-2xl border border-black/10 overflow-hidden transition-all duration-200 hover:border-black">
                <div className="flex flex-col gap-1 border-b border-black/10 bg-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-black text-gray-900">Referral Leaderboard</h2>
                        <p className="text-sm font-medium text-gray-500">Ranked by referrals and REKTO points</p>
                    </div>
                    <div className="text-sm font-semibold text-gray-600">
                        Page {currentPage} of {totalPages || 1}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                        <div className="grid grid-cols-12 gap-4 border-b border-black/10 bg-[#fff8f4] px-6 py-3 text-xs font-black uppercase tracking-wide text-gray-500">
                            <div className="col-span-1">Rank</div>
                            <div className="col-span-3">Player</div>
                            <div className="col-span-2 flex items-center gap-1 cursor-pointer transition hover:text-gray-900">
                            Joined
                                <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                            </div>
                            <div className="col-span-2 flex items-center gap-1 cursor-pointer transition hover:text-gray-900">
                            Referrals
                                <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                            </div>
                            <div className="col-span-2 flex items-center gap-1 cursor-pointer transition hover:text-gray-900">
                            Points
                                <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                            </div>
                            <div className="col-span-2 flex items-center justify-end gap-1 cursor-pointer transition hover:text-gray-900">
                            Earnings
                                <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                            </div>
                        </div>

                        <div className="divide-y divide-black/5 bg-white/55">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center py-12 font-semibold text-red-600">
                                    {error}
                                </div>
                            ) : leaderboardData.length === 0 ? (
                                <div className="flex items-center justify-center py-12 font-semibold text-gray-600">
                                    No users found
                                </div>
                            ) : (
                                leaderboardData.map((entry) => (
                                    <LeaderboardRow key={entry.user.id} entry={entry} />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-black/10 bg-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-semibold text-gray-600">
                        {totalCount > 0 ? (
                            <>
                                Showing {offset + 1}-{Math.min(offset + ITEMS_PER_PAGE, totalCount)} of {totalCount} users
                            </>
                        ) : (
                            "No users"
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1 || isLoading}
                            className={`referral-pagination-button inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-black transition-all ${currentPage === 1 || isLoading
                                ? "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"
                                : "border border-black/10 bg-white text-gray-700 hover:border-black hover:bg-[#fff8f4] hover:text-gray-900"
                                }`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>
                        <span className="flex h-9 items-center rounded-lg border border-black/10 bg-white px-3 text-sm font-black text-gray-700">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages || isLoading}
                            className={`referral-pagination-button inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-black transition-all ${currentPage >= totalPages || isLoading
                                ? "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"
                                : "border border-black/10 bg-white text-gray-700 hover:border-black hover:bg-[#fff8f4] hover:text-gray-900"
                                }`}
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
