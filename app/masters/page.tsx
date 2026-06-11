"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import { getLeaderboard, type LeaderboardUser, followUser, unfollowUser } from "@/app/lib/users-service/users";
import { useUserStore } from "@/app/store/useUserStore";
import {
    CATEGORY_OPTIONS,
    mapUserToMaster,
    MastersFiltersBar,
    MastersGrid,
    MastersMobileFiltersSheet,
    MastersPageHeader,
    type CategoryFilter,
    type Master,
    type VerificationFilter,
} from "@/app/components/master-components";

const INITIAL_VISIBLE_MASTERS = 12;
const LOAD_MORE_MASTERS = 12;
const PLACEHOLDER_CARD_COUNT = 6;

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

export default function MastersPage() {
    const router = useRouter();
    const { address } = useAppKitAccount();
    const { user: currentUser } = useUserStore();

    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(CATEGORY_OPTIONS[0]);
    const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>("All Masters");
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_MASTERS);
    const [isAppending, setIsAppending] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isVerificationOpen, setIsVerificationOpen] = useState(false);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [masters, setMasters] = useState<Master[]>([]);
    const [followLoadingByWallet, setFollowLoadingByWallet] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const categoryRef = useRef<HTMLDivElement>(null);
    const verificationRef = useRef<HTMLDivElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Load users on mount
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

    // Close dropdowns when clicking outside
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
        if (!address || !currentUser?.id) return;

        const targetMaster = masters.find((m) => m.walletAddress === targetWalletAddress);
        if (!targetMaster || targetMaster.walletAddress === address) return;

        const viewerAlreadyFollowing = targetMaster.followers.includes(currentUser.id);

        try {
            setFollowLoadingByWallet((prev) => ({ ...prev, [targetWalletAddress]: true }));
            const updatedTarget = viewerAlreadyFollowing
                ? await unfollowUser(targetWalletAddress, address)
                : await followUser(targetWalletAddress, address);

            setMasters((prev) =>
                prev.map((master) =>
                    master.walletAddress === targetWalletAddress
                        ? { ...master, followers: updatedTarget.followers }
                        : master,
                ),
            );
        } catch (followError) {
            console.error("Failed to toggle follow:", followError);
        } finally {
            setFollowLoadingByWallet((prev) => ({ ...prev, [targetWalletAddress]: false }));
        }
    };

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

    const visibleMasters = useMemo(() => filteredMasters.slice(0, visibleCount), [filteredMasters, visibleCount]);
    const hasMoreMasters = visibleCount < filteredMasters.length;

    const resetVisibleCards = () => {
        setVisibleCount(INITIAL_VISIBLE_MASTERS);
        setIsAppending(false);
    };

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(INITIAL_VISIBLE_MASTERS);
    }, [search, categoryFilter, verificationFilter]);

    // Infinite scroll observer
    useEffect(() => {
        const loadMoreElement = loadMoreRef.current;
        if (!loadMoreElement || !hasMoreMasters || isAppending) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;

                setIsAppending(true);
                window.setTimeout(() => {
                    setVisibleCount((count) => Math.min(count + LOAD_MORE_MASTERS, filteredMasters.length));
                    setIsAppending(false);
                }, 350);
            },
            { rootMargin: "600px 0px" },
        );

        observer.observe(loadMoreElement);
        return () => observer.disconnect();
    }, [hasMoreMasters, isAppending, filteredMasters.length]);

    const canFollow = Boolean(currentUser?.id && address);
    const getIsOwnCard = (master: Master) => master.walletAddress === address;
    const getIsFollowing = (master: Master) => currentUser?.id ? master.followers.includes(currentUser.id) : false;
    const getIsFollowLoading = (walletAddress: string) => Boolean(followLoadingByWallet[walletAddress]);

    return (
        <div className="rekto-page min-h-screen">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <MastersPageHeader />

                <MastersFiltersBar
                    search={search}
                    categoryFilter={categoryFilter}
                    verificationFilter={verificationFilter}
                    isCategoryOpen={isCategoryOpen}
                    isVerificationOpen={isVerificationOpen}
                    categoryRef={categoryRef}
                    verificationRef={verificationRef}
                    onSearchChange={setSearch}
                    onCategoryToggle={() => {
                        setIsCategoryOpen((prev) => !prev);
                        setIsVerificationOpen(false);
                    }}
                    onVerificationToggle={() => {
                        setIsVerificationOpen((prev) => !prev);
                        setIsCategoryOpen(false);
                    }}
                    onCategorySelect={setCategoryFilter}
                    onVerificationSelect={setVerificationFilter}
                    onOpenMobileFilters={() => setIsMobileFiltersOpen(true)}
                />

                <MastersMobileFiltersSheet
                    isOpen={isMobileFiltersOpen}
                    search={search}
                    categoryFilter={categoryFilter}
                    verificationFilter={verificationFilter}
                    onClose={() => setIsMobileFiltersOpen(false)}
                    onSearchChange={setSearch}
                    onCategorySelect={(value) => {
                        setCategoryFilter(value);
                        setIsMobileFiltersOpen(false);
                    }}
                    onVerificationSelect={(value) => {
                        setVerificationFilter(value);
                        setIsMobileFiltersOpen(false);
                    }}
                />

                {error && (
                    <div className="rekto-surface mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <MastersGrid
                    masters={visibleMasters}
                    error={error}
                    showPlaceholders={isLoading || isAppending}
                    placeholderCount={isLoading ? INITIAL_VISIBLE_MASTERS : PLACEHOLDER_CARD_COUNT}
                    canFollow={canFollow}
                    getIsOwnCard={getIsOwnCard}
                    getIsFollowing={getIsFollowing}
                    getIsFollowLoading={getIsFollowLoading}
                    onViewProfile={(walletAddress) => router.push(`/profile/${encodeURIComponent(walletAddress)}`)}
                    onToggleFollow={toggleFollow}
                />

                {hasMoreMasters && <div ref={loadMoreRef} className="h-12" aria-hidden="true" />}
            </div>
        </div>
    );
}
