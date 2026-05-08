"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { getLeaderboard, type LeaderboardUser } from "../lib/users-service/users";

const SparkleIcon = ({ className }: { className?: string }) => (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 0L7 5L12 6L7 7L6 12L5 7L0 6L5 5L6 0Z" fill="currentColor" />
    </svg>
);

const StarBadge = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L9.5 5.5L14 6L10.5 9L11.5 13.5L8 11L4.5 13.5L5.5 9L2 6L6.5 5.5L8 1Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
    </svg>
);

const DiamondIcon = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 2L10 6L6 10L2 6L6 2Z" fill="#9ca3af" />
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

type LeaderboardRow = {
    id: string;
    rank: number;
    username: string;
    avatar: string;
    wins: number;
    rekts: number;
    challenges: number;
    winRate: string;
    earnings: string;
};

function mapUserToRow(user: LeaderboardUser, rank: number): LeaderboardRow {
    const referralCount = user.referrals?.length ?? 0;
    const wins = referralCount * 100;
    const challenges = referralCount;
    const rekts = Math.max(0, Math.floor(challenges * 0.2));
    const winRate = challenges > 0 ? `${Math.min(99, Math.max(1, Math.round((wins / (wins + rekts || 1)) * 100)))}%` : "0%";

    return {
        id: user.id,
        rank,
        username: user.username || `user-${user.wallet_address.slice(0, 6)}`,
        avatar: user.profile_image || "/scribbles/pepe.png",
        wins,
        rekts,
        challenges,
        winRate,
        earnings: (user.earnings ?? 0).toFixed(1),
    };
}

async function fetchAllLeaderboardUsers(): Promise<LeaderboardUser[]> {
    const pageSize = 100;
    let offset = 0;
    let total = 0;
    const allUsers: LeaderboardUser[] = [];

    do {
        const response = await getLeaderboard(pageSize, offset);
        total = response.count;
        allUsers.push(...response.users);
        offset += pageSize;
    } while (allUsers.length < total);

    return allUsers;
}

export default function LeaderboardPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [rows, setRows] = useState<LeaderboardRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const itemsPerPage = 10;

    useEffect(() => {
        const loadUsers = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const users = await fetchAllLeaderboardUsers();
                const mapped = users.map((user, index) => mapUserToRow(user, index + 1));
                setRows(mapped);
            } catch {
                setError("Failed to load leaderboard users.");
            } finally {
                setIsLoading(false);
            }
        };

        loadUsers();
    }, []);

    const filteredData = useMemo(
        () => rows.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase())),
        [rows, searchQuery]
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
    const totalEarned = rows.reduce((sum, row) => sum + Number(row.earnings), 0);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Leaderboard</h1>
                        <p className="text-gray-600 text-base sm:text-lg">Explore the top challengers and their achievements</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl px-5 py-4 flex items-center justify-between border border-white/50 shadow-sm">
                        <div className="flex items-center gap-3">
                            <ChallengeIcon />
                            <div>
                                <div className="text-xl font-bold text-gray-900">{rows.reduce((sum, row) => sum + row.challenges, 0)}</div>
                                <div className="text-sm text-gray-600">Challenges Created</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-xl px-5 py-4 flex items-center justify-between border border-white/50 shadow-sm">
                        <div className="flex items-center gap-3">
                            <HandshakeIcon />
                            <div>
                                <div className="text-xl font-bold text-gray-900">{rows.length}</div>
                                <div className="text-sm text-gray-600">Total Traders</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-xl px-5 py-4 flex items-center justify-between border border-white/50 shadow-sm">
                        <div className="flex items-center gap-3">
                            <CoinsIcon />
                            <div>
                                <div className="text-xl font-bold text-gray-900">${totalEarned.toFixed(1)}</div>
                                <div className="text-sm text-gray-600">Total Earned</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-sm rounded-xl px-5 py-4 flex items-center justify-between border border-white/50 shadow-sm">
                        <div className="flex items-center gap-3">
                            <SparkleIcon className="text-amber-500" />
                            <div>
                                <div className="text-xl font-bold text-gray-900">{rows.reduce((sum, row) => sum + row.wins, 0)}</div>
                                <div className="text-sm text-gray-600">Total Points</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="relative max-w-md">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Search traders"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-11 pr-4 py-3 bg-white/60 border border-white/50 rounded-xl text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 w-full"
                        />
                    </div>
                </div>

                <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/50 text-sm font-medium text-gray-600">
                                <div className="col-span-1">Rank</div>
                                <div className="col-span-3">Trader</div>
                                <div className="col-span-2 flex items-center gap-1">Wins <ChevronIcon direction="up" /></div>
                                <div className="col-span-1 flex items-center gap-1">Rekts <ChevronIcon direction="down" /></div>
                                <div className="col-span-2 flex items-center gap-1">Challenges <ChevronIcon direction="up" /></div>
                                <div className="col-span-1 flex items-center gap-1">Win% <ChevronIcon direction="up" /></div>
                                <div className="col-span-2 flex items-center gap-1 justify-end">Earnings <ChevronIcon direction="up" /></div>
                            </div>

                            <div className="divide-y divide-white/30">
                                {isLoading && <div className="px-6 py-8 text-gray-600">Loading users...</div>}
                                {!isLoading && error && <div className="px-6 py-8 text-red-600">{error}</div>}
                                {!isLoading && !error && paginatedData.length === 0 && (
                                    <div className="px-6 py-8 text-gray-600">No users found.</div>
                                )}

                                {!isLoading && !error && paginatedData.map((user) => (
                                    <div key={user.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/30 transition-colors">
                                        <div className="col-span-1 flex items-center gap-2">
                                            <span className="text-lg font-semibold text-gray-700 w-4">{user.rank}</span>
                                            {user.rank === 1 ? <StarBadge /> : <DiamondIcon />}
                                        </div>

                                        <div className="col-span-3 flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex-shrink-0">
                                                <Image src={user.avatar} alt={user.username} fill className="object-cover" sizes="40px" />
                                            </div>
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="font-semibold text-gray-900 truncate">{user.username}</span>
                                            </div>
                                        </div>

                                        <div className="col-span-2 flex items-center gap-2">
                                            <SparkleIcon className="text-amber-500" />
                                            <span className="font-semibold text-gray-900">{user.wins}</span>
                                        </div>

                                        <div className="col-span-1 flex items-center gap-1">
                                            <span className="font-semibold text-red-600">{user.rekts}</span>
                                        </div>

                                        <div className="col-span-2 flex items-center gap-1">
                                            <span className="text-gray-900">{user.challenges}</span>
                                        </div>

                                        <div className="col-span-1">
                                            <span className="text-gray-900">{user.winRate}</span>
                                        </div>

                                        <div className="col-span-2 text-right">
                                            <span className="font-semibold text-gray-900">${user.earnings}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {!isLoading && !error && totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/50">
                            <div className="text-sm text-gray-600">
                                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} traders
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === 1
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-white/60 text-gray-700 hover:bg-white/80 border border-white/50"
                                        }`}
                                >
                                    Previous
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${currentPage === page
                                            ? "bg-amber-500 text-white"
                                            : "bg-white/60 text-gray-700 hover:bg-white/80 border border-white/50"
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === totalPages
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-white/60 text-gray-700 hover:bg-white/80 border border-white/50"
                                        }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
