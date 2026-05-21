"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    BadgeCheck,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Info,
    Search,
    Shapes,
    Shield,
    ShieldCheck,
    ShieldOff,
    UserPlus,
} from "lucide-react";
import { getLeaderboard, type LeaderboardUser } from "@/app/lib/users-service/users";
import { LoadingPage } from "@/app/components/LoadingPage";
import { followUser, unfollowUser } from "@/app/lib/users-service/users";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import { useUserStore } from "@/app/store/useUserStore";
import Link from "next/link";

type MasterCategory = "Crypto" | "Sports" | "Stocks" | "Others";

type Master = {
    id: string;
    name: string;
    username: string;
    walletAddress: string;
    category: MasterCategory;
    verified: boolean;
    challenges: number;
    wins: number;
    rekts: number;
    followers: string[];
    avatarPath: string;
    banner: string;
};

const CATEGORY_OPTIONS = ["All Categories", "Crypto", "Sports", "Stocks", "Others"] as const;
type CategoryFilter = (typeof CATEGORY_OPTIONS)[number];
const VERIFICATION_OPTIONS = ["All Masters", "Verified", "Unverified"] as const;
type VerificationFilter = (typeof VERIFICATION_OPTIONS)[number];

const PAGE_SIZE_OPTIONS = [8, 12, 16];

const BANNERS = [
    "linear-gradient(120deg, #211548 0%, #3d2e7a 45%, #20163e 100%)",
    "linear-gradient(120deg, #121f2f 0%, #214062 50%, #132439 100%)",
    "linear-gradient(120deg, #1f1f1f 0%, #3a3a3a 50%, #212121 100%)",
    "linear-gradient(120deg, #0b0f18 0%, #1f2a43 52%, #111827 100%)",
    "linear-gradient(120deg, #052d15 0%, #0f5f2e 52%, #081f16 100%)",
    "linear-gradient(120deg, #2f0207 0%, #6b0914 52%, #1f0c12 100%)",
];

function getCategoryFromWallet(walletAddress: string): MasterCategory {
    const score = walletAddress
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const categories: MasterCategory[] = ["Crypto", "Sports", "Stocks", "Others"];
    return categories[score % categories.length];
}

function mapUserToMaster(user: LeaderboardUser, index: number): Master {
    const challenges = user.referrals?.length ?? 0;
    const wins = challenges * 100;
    const rekts = Math.max(0, Math.floor(challenges * 0.2));

    return {
        id: user.id,
        name: user.username || `user-${user.wallet_address.slice(0, 6)}`,
        username: `@${(user.username || `user-${user.wallet_address.slice(0, 6)}`).toLowerCase()}`,
        walletAddress: user.wallet_address,
        category: getCategoryFromWallet(user.wallet_address),
        verified: Boolean(user.username),
        challenges,
        wins,
        rekts,
        followers: user.followers ?? [],
        avatarPath: user.profile_image || "/scribbles/pepe.png",
        banner: BANNERS[index % BANNERS.length],
    };
}

async function fetchAllUsers(): Promise<LeaderboardUser[]> {
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

function buildPagination(currentPage: number, totalPages: number): Array<number | string> {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }

    const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

    if (currentPage <= 3) {
        pages.add(2);
        pages.add(3);
    }

    if (currentPage >= totalPages - 2) {
        pages.add(totalPages - 1);
        pages.add(totalPages - 2);
    }

    const sortedPages = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
    const output: Array<number | string> = [];

    sortedPages.forEach((page, idx) => {
        if (idx > 0 && page - sortedPages[idx - 1] > 1) {
            output.push(`ellipsis-${idx}`);
        }
        output.push(page);
    });

    return output;
}

export default function MastersPage() {
    const router = useRouter();
    const { solanaWallet } = useSolanaWallet();
    const { user: currentUser } = useUserStore();
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All Categories");
    const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>("All Masters");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isVerificationOpen, setIsVerificationOpen] = useState(false);
    const [masters, setMasters] = useState<Master[]>([]);
    const [followLoadingByWallet, setFollowLoadingByWallet] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const categoryRef = useRef<HTMLDivElement>(null);
    const verificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
            }
            if (verificationRef.current && !verificationRef.current.contains(event.target as Node)) {
                setIsVerificationOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleFollow = async (targetWalletAddress: string) => {
        if (!solanaWallet?.address || !currentUser?.id) return;

        const targetMaster = masters.find((m) => m.walletAddress === targetWalletAddress);
        if (!targetMaster || targetMaster.walletAddress === solanaWallet.address) return;

        const viewerAlreadyFollowing = targetMaster.followers.includes(currentUser.id);

        try {
            setFollowLoadingByWallet((prev) => ({ ...prev, [targetWalletAddress]: true }));
            const updatedTarget = viewerAlreadyFollowing
                ? await unfollowUser(targetWalletAddress, solanaWallet.address)
                : await followUser(targetWalletAddress, solanaWallet.address);

            setMasters((prev) =>
                prev.map((master) =>
                    master.walletAddress === targetWalletAddress
                        ? ({
                            ...master,
                            followers: updatedTarget.followers,
                        } as Master)
                        : master,
                ),
            );
        } catch (followError) {
            console.error("Failed to toggle follow:", followError);
        } finally {
            setFollowLoadingByWallet((prev) => ({ ...prev, [targetWalletAddress]: false }));
        }
    };

    useEffect(() => {
        const loadUsers = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const users = await fetchAllUsers();
                setMasters(users.map((user, index) => mapUserToMaster(user, index)));
            } catch {
                setError("Failed to load masters.");
            } finally {
                setIsLoading(false);
            }
        };

        loadUsers();
    }, []);

    const filteredMasters = useMemo(() => {
        return masters.filter((master) => {
            const matchesSearch =
                master.name.toLowerCase().includes(search.toLowerCase()) ||
                master.username.toLowerCase().includes(search.toLowerCase()) ||
                master.walletAddress.toLowerCase().includes(search.toLowerCase());

            const matchesCategory = categoryFilter === "All Categories" || master.category === categoryFilter;

            const matchesVerification =
                verificationFilter === "All Masters" ||
                (verificationFilter === "Verified" && master.verified) ||
                (verificationFilter === "Unverified" && !master.verified);

            return matchesSearch && matchesCategory && matchesVerification;
        });
    }, [masters, search, categoryFilter, verificationFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredMasters.length / itemsPerPage));
    const safeCurrentPage = Math.min(currentPage, totalPages);

    const pagedMasters = useMemo(() => {
        const startIndex = (safeCurrentPage - 1) * itemsPerPage;
        return filteredMasters.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredMasters, itemsPerPage, safeCurrentPage]);

    const pageButtons = useMemo(() => buildPagination(safeCurrentPage, totalPages), [safeCurrentPage, totalPages]);
    const currentStart = filteredMasters.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
    const currentEnd = Math.min(safeCurrentPage * itemsPerPage, filteredMasters.length);

    if (isLoading) {
        return <LoadingPage variant="simple" message="Loading masters..." />;
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#f3e1d7" }}>
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Explore Masters</h1>
                        <p className="mt-1 text-base text-gray-500">Discover top challenge creators and their track record</p>
                    </div>
                    <Link href="https://rektofun.gitbook.io/rektofun/introduction/what-is-rektofun" target="_blank" className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700">
                        <Info className="h-4 w-4" />
                        How it works?
                    </Link>
                </div>

                <div className="max-w-7xl pb-8">
                    <div className="flex flex-col items-stretch gap-3 sm:gap-4 lg:flex-row lg:items-center">
                        <div className="relative w-full lg:max-w-md lg:flex-1">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search masters..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full rounded-2xl bg-white/60 py-3 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 sm:rounded-full sm:py-2.5"
                            />
                        </div>

                        <div className="grid w-full grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:w-auto">
                            <div className="relative w-full min-w-0" ref={categoryRef}>
                                <button
                                    onClick={() => setIsCategoryOpen((prev) => !prev)}
                                    className="w-full cursor-pointer justify-between rounded-2xl border border-gray-300 bg-white/60 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-white/80 sm:rounded-full sm:py-2.5 flex items-center gap-2"
                                >
                                    <span className="min-w-0 truncate flex items-center gap-2">
                                        <Shapes className="h-4 w-4" />
                                        {categoryFilter}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
                                </button>
                                {isCategoryOpen ? (
                                    <div className="absolute left-0 top-full z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white py-2 shadow-lg sm:min-w-[14rem] sm:w-auto">
                                        {CATEGORY_OPTIONS.map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => {
                                                    setCategoryFilter(option);
                                                    setCurrentPage(1);
                                                    setIsCategoryOpen(false);
                                                }}
                                                className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-3 ${categoryFilter === option ? "font-semibold text-black" : "text-gray-700 hover:bg-gray-50"}`}
                                            >
                                                <Shapes className="h-4 w-4" />
                                                <span>{option}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            <div className="relative w-full min-w-0" ref={verificationRef}>
                                <button
                                    onClick={() => setIsVerificationOpen((prev) => !prev)}
                                    className="w-full cursor-pointer justify-between rounded-2xl border border-gray-300 bg-white/60 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-white/80 sm:rounded-full sm:py-2.5 flex items-center gap-2"
                                >
                                    <span className="min-w-0 truncate flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        {verificationFilter}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isVerificationOpen ? "rotate-180" : ""}`} />
                                </button>
                                {isVerificationOpen ? (
                                    <div className="absolute left-0 top-full z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white py-2 shadow-lg sm:min-w-[14rem] sm:w-auto">
                                        {VERIFICATION_OPTIONS.map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => {
                                                    setVerificationFilter(option);
                                                    setCurrentPage(1);
                                                    setIsVerificationOpen(false);
                                                }}
                                                className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-3 ${verificationFilter === option ? "font-semibold text-black" : "text-gray-700 hover:bg-gray-50"}`}
                                            >
                                                {option === "Verified" ? (
                                                    <ShieldCheck className="h-4 w-4" />
                                                ) : option === "Unverified" ? (
                                                    <ShieldOff className="h-4 w-4" />
                                                ) : (
                                                    <Shield className="h-4 w-4" />
                                                )}
                                                <span>{option}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                ) : null}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {!error && pagedMasters.length === 0 ? (
                        <div className="col-span-full rounded-xl border border-slate-200 bg-white/70 p-6 text-center text-slate-600">
                            No masters found.
                        </div>
                    ) : null}

                    {!error && pagedMasters.map((master) => {
                        const followerIds = master.followers;
                        const isOwnCard = master.walletAddress === solanaWallet?.address;
                        const isFollowing = currentUser?.id ? followerIds.includes(currentUser.id) : false;
                        const isFollowLoading = followLoadingByWallet[master.walletAddress];

                        return (
                            <article
                                key={master.id}
                                className="group mx-auto flex h-full w-full max-w-[400px] flex-col overflow-hidden rounded border border-gray-400 bg-white/70 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-gray-300/80 hover:shadow-xl md:max-w-[350px]"
                            >
                                <div className="relative h-[88px] overflow-hidden rounded-[8px] border border-[#d9d0ef]" style={{ background: master.banner }}>
                                    <div className="absolute inset-0 opacity-75 [background-image:linear-gradient(rgba(164,140,255,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(164,140,255,0.25)_1px,transparent_1px)] [background-size:24px_24px]" />
                                    <div className="absolute inset-0 opacity-65 [background-image:linear-gradient(0deg,transparent_0_58%,rgba(126,90,235,0.38)_58%_72%,transparent_72%_100%),linear-gradient(90deg,transparent_0_35%,rgba(126,90,235,0.4)_35%_48%,transparent_48%_100%)] [background-size:84px_84px] [background-position:0_0,14px_8px]" />
                                </div>

                                <div className="-mt-9 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/profile/${encodeURIComponent(master.walletAddress)}`)}
                                        className="relative h-[80px] w-[80px] cursor-pointer rounded-full border-4 border-white bg-slate-100 shadow-[0_4px_12px_rgba(15,23,42,0.18)]"
                                        aria-label={`View ${master.name}'s profile`}
                                    >
                                        <Image
                                            src={master.avatarPath}
                                            alt={`${master.name} avatar`}
                                            fill
                                            sizes="80px"
                                            className="rounded-full object-cover"
                                        />
                                        {master.verified ? (
                                            <span className="absolute -bottom-1 -right-1 z-10 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-[#2f7bff] text-white shadow-[0_3px_8px_rgba(47,123,255,0.45)]">
                                                <BadgeCheck className="h-3.5 w-3.5" />
                                            </span>
                                        ) : null}
                                    </button>
                                </div>

                                <div className="mt-4 text-center">
                                    <h2 className="text-[21px] leading-tight font-black text-slate-900">{master.name}</h2>
                                    <p className="mt-1 text-base font-semibold text-slate-500">{master.username}</p>
                                </div>

                                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                                    <div>
                                        <p className="text-[14px] leading-none font-black text-slate-900">{master.challenges}</p>
                                        <p className="mt-1 text-[12px] font-semibold text-slate-500">Challenges</p>
                                    </div>
                                    <div>
                                        <p className="text-[14px] leading-none font-black text-slate-900">+{master.wins}</p>
                                        <p className="mt-1 text-[12px] font-semibold text-slate-500">Wins</p>
                                    </div>
                                    <div>
                                        <p className="text-[14px] leading-none font-black text-slate-900">{master.rekts}</p>
                                        <p className="mt-1 text-[12px] font-semibold text-slate-500">Rekts</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => router.push(`/profile/${encodeURIComponent(master.walletAddress)}`)}
                                        className="flex-1 cursor-pointer rounded-xl border border-[#e6e2f0] bg-white/80 px-3 py-3 text-sm font-bold text-[#5a4fff] transition hover:bg-[#f5f3ff]"
                                    >
                                        View Profile
                                    </button>
                                    <button
                                        onClick={() => toggleFollow(master.walletAddress)}
                                        disabled={!currentUser?.id || !solanaWallet?.address || isOwnCard || isFollowLoading}
                                        title={!currentUser?.id ? "Connect wallet to follow users" : isOwnCard ? "You cannot follow yourself" : ""}
                                        className={`grid h-11 w-11 place-items-center rounded-xl border transition disabled:opacity-50 disabled:cursor-not-allowed ${isFollowing
                                            ? "cursor-pointer border-blue-600 bg-blue-500 text-white hover:bg-blue-700"
                                            : "cursor-pointer border-[#e6e2f0] bg-white/80 text-slate-500 hover:bg-slate-50"
                                            }`}
                                    >
                                        {isFollowLoading ? (
                                            <span className="text-[10px] font-bold">{isFollowing ? "..." : "..."}</span>
                                        ) : (
                                            <UserPlus className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                    <p className="hidden text-sm font-medium text-slate-500 md:block">
                        Showing {currentStart}-{currentEnd} of {filteredMasters.length}
                    </p>

                    <nav className="flex items-center justify-center gap-1.5">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                            disabled={safeCurrentPage === 1}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        {pageButtons.map((item) =>
                            typeof item === "number" ? (
                                <button
                                    key={item}
                                    onClick={() => setCurrentPage(item)}
                                    className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 text-sm font-semibold transition ${safeCurrentPage === item
                                        ? "bg-indigo-600 text-white shadow-[0_8px_18px_rgba(79,70,229,0.35)]"
                                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                        }`}
                                >
                                    {item}
                                </button>
                            ) : (
                                <span key={item} className="px-1 text-slate-400">
                                    ...
                                </span>
                            ),
                        )}

                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
                            disabled={safeCurrentPage === totalPages}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Next page"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </nav>

                    <div className="flex justify-center md:justify-end">
                        <label className="relative inline-flex items-center">
                            <span className="sr-only">Items per page</span>
                            <select
                                value={itemsPerPage}
                                onChange={(event) => {
                                    setItemsPerPage(Number(event.target.value));
                                    setCurrentPage(1);
                                }}
                                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            >
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size} per page
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
