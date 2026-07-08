"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getLeaderboard, type LeaderboardUser } from "@/app/lib/users-service/users";

type ReferralLeaderboardRow = {
    id: string;
    walletAddress: string;
    rank: number;
    username: string;
    avatar: string;
    referrals: number;
    points: number;
    earnings: number;
};

const ITEMS_PER_PAGE = 10;
const REFERRAL_POINTS_PER_USER = 100;

function mapUserToRow(user: LeaderboardUser, rank: number): ReferralLeaderboardRow {
    const referrals = user.referrals?.length ?? 0;

    return {
        id: user.id,
        walletAddress: user.wallet_address,
        rank,
        username: user.username || `user-${user.wallet_address.slice(0, 6)}`,
        avatar: user.profile_image || "/scribbles/pepe.png",
        referrals,
        points: referrals * REFERRAL_POINTS_PER_USER,
        earnings: user.earnings ?? 0,
    };
}

function getRankBadgeClass(rank: number): string {
    if (rank === 1) return "border-amber-300 bg-amber-100 text-amber-800";
    if (rank === 2) return "border-slate-300 bg-slate-100 text-slate-700";
    if (rank === 3) return "border-orange-300 bg-orange-100 text-orange-800";
    return "border-gray-200 bg-white text-gray-700";
}

const ArrowIcon = ({ direction }: { direction: "left" | "right" }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {direction === "left" ? (
            <path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
            <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        )}
    </svg>
);

const LeaderboardRowSkeleton = ({ index }: { index: number }) => (
    <div className="grid grid-cols-12 items-center gap-4 px-6 py-4" aria-hidden="true">
        <div className="col-span-2">
            <div className="h-8 w-10 rounded-full bg-gray-200/80" />
        </div>
        <div className="col-span-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200/80" />
            <div className="h-4 w-24 rounded bg-gray-200/80" />
        </div>
        <div className="col-span-2">
            <div className="h-6 w-12 rounded-full bg-gray-200/80" />
        </div>
        <div className="col-span-2">
            <div className="h-4 w-16 rounded bg-gray-200/80" />
        </div>
        <div className="col-span-2 flex justify-end">
            <div className={`h-4 rounded bg-gray-200/80 ${index % 2 === 0 ? "w-16" : "w-12"}`} />
        </div>
    </div>
);

export function LeaderboardTable() {
    const router = useRouter();
    const [rows, setRows] = useState<ReferralLeaderboardRow[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;

        const loadUsers = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await getLeaderboard(ITEMS_PER_PAGE, offset);
                const mapped = response.users.map((user, index) => mapUserToRow(user, offset + index + 1));
                setRows(mapped);
                setTotalCount(response.count);
            } catch (loadError) {
                console.error("[ReferralLeaderboard] Failed to load users:", loadError);
                setError("Failed to load referral leaderboard.");
                setRows([]);
                setTotalCount(0);
            } finally {
                setIsLoading(false);
            }
        };

        loadUsers();
    }, [currentPage]);

    const sortedRows = useMemo(
        () =>
            [...rows].sort((a, b) => {
                if (b.referrals !== a.referrals) return b.referrals - a.referrals;
                return b.points - a.points;
            }),
        [rows],
    );

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="referral-hover-shadow referral-table-shell overflow-hidden rounded-2xl border border-black/10 bg-[#fffaf6]/80 backdrop-blur-sm transition-all duration-200 hover:border-black">
            <div className="flex flex-col gap-1 border-b border-black/10 bg-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-black text-gray-950">Referral Leaderboard</h2>
                    <p className="text-sm font-medium text-gray-500">Ranked by friends referred</p>
                </div>
                <div className="rounded-full border border-black/10 bg-white px-3 py-1 text-sm font-black text-gray-700">
                    {totalCount} {totalCount === 1 ? "user" : "users"} ranked
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                    <div className="grid grid-cols-12 gap-4 border-b border-black/10 bg-[#fff8f4] px-6 py-3 text-xs font-black uppercase tracking-wide text-gray-500">
                        <div className="col-span-2">Rank</div>
                        <div className="col-span-4">User</div>
                        <div className="col-span-2">Referrals</div>
                        <div className="col-span-2">Points</div>
                        <div className="col-span-2 text-right">Earnings</div>
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

                        {!error && !isLoading && sortedRows.length === 0 && (
                            <div className="px-6 py-10 text-center font-semibold text-gray-600">No referral rankings found.</div>
                        )}

                        {!error && !isLoading && sortedRows.map((user) => (
                            <div
                                key={user.id}
                                className="grid cursor-pointer grid-cols-12 items-center gap-4 px-6 py-4 transition-all duration-200 hover:bg-white"
                                onClick={() => router.push(`/profile/${user.walletAddress}`)}
                            >
                                <div className="col-span-2">
                                    <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-sm font-black ${getRankBadgeClass(user.rank)}`}>
                                        {user.rank}
                                    </span>
                                </div>

                                <div className="col-span-4 flex min-w-0 items-center gap-3">
                                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-white bg-gray-200 shadow-sm">
                                        <Image src={user.avatar} alt={user.username} fill className="object-cover" sizes="40px" />
                                    </div>
                                    <span className="truncate font-semibold text-gray-900">{user.username}</span>
                                </div>

                                <div className="col-span-2">
                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">{user.referrals}</span>
                                </div>

                                <div className="col-span-2 font-black text-gray-900">{user.points.toLocaleString()}</div>

                                <div className="col-span-2 text-right font-black text-gray-900">${user.earnings.toFixed(1)}</div>
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
                            className={`referral-pagination-button inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-black transition-all ${currentPage === 1 || isLoading
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
                            className={`referral-pagination-button inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-black transition-all ${currentPage === totalPages || isLoading
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
    );
}
