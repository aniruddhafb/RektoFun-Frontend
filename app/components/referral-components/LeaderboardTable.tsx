"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Sparkles, Search, ChevronLeft, ChevronRight, Crown, Gem, Loader2 } from "lucide-react";
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
        <div className="grid grid-cols-12 gap-4 px-4 lg:px-6 py-4 items-center hover:bg-white/30 transition-colors">
            {/* Rank */}
            <div className="col-span-1 flex items-center gap-2">
                {rank}
            </div>

            {/* Player */}
            <Link href={profileHref} className="col-span-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    <Image
                        src={profileImage}
                        alt={username}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-gray-900 truncate">{username}</span>
                </div>
            </Link>

            {/* Joined */}
            <div className="col-span-2 text-gray-600 text-sm">{formatDate(user.created_at)}</div>

            {/* Referrals */}
            <div className="col-span-2 text-gray-900 font-medium text-sm">{referralCount}</div>

            {/* REKT POINTS */}
            <div className="col-span-2 text-gray-900 font-medium text-sm">{points}</div>

            {/* Earnings */}
            <div className="col-span-2 text-gray-900 font-medium text-sm">
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
            {/* Leaderboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-gray-600" />
                    <h2 className="text-xl font-bold text-gray-900">Referral Leaderboard</h2>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Search - Bigger */}
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search traders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white/60 border border-white/50 rounded-lg text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 w-full sm:w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Leaderboard Table - Horizontally Scrollable */}
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 overflow-hidden">
                <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div className="min-w-[700px] grid grid-cols-12 gap-4 px-4 lg:px-6 py-4 border-b border-white/50 text-sm font-medium text-gray-500">
                        <div className="col-span-1">Rank</div>
                        <div className="col-span-3">Player</div>
                        <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-700">
                            Joined
                            <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                        </div>
                        <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-700">
                            Referrals
                            <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                        </div>
                        <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-700">
                            Points
                            <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                        </div>
                        <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-700">
                            Earnings
                            <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="min-w-[700px] divide-y divide-white/50">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center py-12 text-red-500">
                                {error}
                            </div>
                        ) : leaderboardData.length === 0 ? (
                            <div className="flex items-center justify-center py-12 text-gray-500">
                                No users found
                            </div>
                        ) : (
                            leaderboardData.map((entry) => (
                                <LeaderboardRow key={entry.user.id} entry={entry} />
                            ))
                        )}
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4">
                    <div className="text-sm text-gray-500">
                        {totalCount > 0 ? (
                            <>
                                Showing {offset + 1} to {Math.min(offset + ITEMS_PER_PAGE, totalCount)} of {totalCount} users
                            </>
                        ) : (
                            "No users"
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1 || isLoading}
                            className={`p-2 rounded-lg transition-colors ${currentPage === 1 || isLoading
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm text-gray-600 px-2">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage >= totalPages || isLoading}
                            className={`p-2 rounded-lg transition-colors ${currentPage >= totalPages || isLoading
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                                }`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}