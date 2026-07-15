"use client";

import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import ChallengeDetailModal from "@/app/components/challenge-components/ChallengeDetailModal";
import { CreateChallengeModal } from "@/app/components/challenge-components/CreateChallengeModal";
import {
    ProfileHeader,
    ProfileTabs,
    ProfileChallenges,
    ProfileActivity,
} from "@/app/components/profile-components";
import { LoadingPage } from "@/app/components/LoadingPage";
import { followUser, getLeaderboard, getUserByWallet, LeaderboardUser, unfollowUser, User } from "@/app/lib/users-service/users";
import { useUserStore } from "@/app/store/useUserStore";
import { useTokenBalanceStore } from "@/app/store/useTokenBalanceStore";
import {
    Challenge,
    getChallengeById,
    getChallenges,
} from "@/app/lib/challenges-service/challenges";
import { fetchRektoBalance, fetchUsdcBalance } from "@/app/lib/token-balances";
import {
    CHALLENGE_CREATED_EVENT,
    CHALLENGE_UPDATED_EVENT,
    type ChallengeUpdatedDetail,
} from "@/app/lib/realtime-events";

type TabType = "challenges" | "activity";

export default function ProfilePage() {
    const params = useParams();
    const { address: connectedWalletAddress } = useAppKitAccount();
    const { user: currentUser } = useUserStore();
    const storedBalanceWallet = useTokenBalanceStore((state) => state.walletAddress);
    const storedRektoBalance = useTokenBalanceStore((state) => state.rektoBalance);
    const storedUsdcBalance = useTokenBalanceStore((state) => state.usdcBalance);
    const storedBalancesLoading = useTokenBalanceStore((state) => state.isLoading);
    
    const slug = params.slug as string;
    const walletFromSlug = decodeURIComponent(slug || "");

    const [activeTab, setActiveTab] = useState<TabType>("challenges");
    const [profileSearchQuery, setProfileSearchQuery] = useState("");
    const [profileSortOrder, setProfileSortOrder] = useState<"latest" | "oldest">("latest");
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [challengeRefreshKey, setChallengeRefreshKey] = useState(0);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userChallenges, setUserChallenges] = useState<Challenge[]>([]);
    const [totalChallengesCreated, setTotalChallengesCreated] = useState(0);
    const [challengesLoading, setChallengesLoading] = useState(false);
    const [challengesLoadingMore, setChallengesLoadingMore] = useState(false);
    const [hasMoreChallenges, setHasMoreChallenges] = useState(true);
    const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);
    const [rektoBalance, setRektoBalance] = useState(0);
    const [isRektoBalanceLoading, setIsRektoBalanceLoading] = useState(true);
    const [usdcBalance, setUsdcBalance] = useState(0);
    const [isUsdcBalanceLoading, setIsUsdcBalanceLoading] = useState(true);
    const [profileMetrics, setProfileMetrics] = useState<LeaderboardUser | null>(null);

    const isOwnProfile = connectedWalletAddress?.toLowerCase() === user?.wallet_address?.toLowerCase();
    const isFollowing = !!(currentUser?.id && user?.followers?.includes(currentUser.id));
    const profileWalletAddress = user?.wallet_address || walletFromSlug;
    const profileUserId = user?.id;

    useLayoutEffect(() => {
        if (!window.matchMedia("(max-width: 767px)").matches) return;
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
        return () => window.cancelAnimationFrame(frame);
    }, [loading, walletFromSlug]);

    // Fetch user data by wallet address
    useEffect(() => {
        async function fetchUser() {
            if (!walletFromSlug) return;
            
            try {
                setLoading(true);
                const isConnectedUser = connectedWalletAddress?.toLowerCase() === walletFromSlug.toLowerCase();
                const userData = isConnectedUser && currentUser
                    ? currentUser
                    : await getUserByWallet(walletFromSlug);
                setUser(userData);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch user");
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, [connectedWalletAddress, currentUser, walletFromSlug]);

    useEffect(() => {
        if (!user?.wallet_address) {
            return;
        }

        let cancelled = false;

        // The leaderboard is the source of truth for resolved wins/losses. Search
        // by wallet so duplicate/similar usernames cannot show another user's stats.
        getLeaderboard(1, 0, user.wallet_address, "all")
            .then(({ users }) => {
                if (cancelled) return;
                const walletAddress = user.wallet_address.toLowerCase();
                setProfileMetrics(
                    users.find((item) => item.wallet_address.toLowerCase() === walletAddress) ?? null,
                );
            })
            .catch(() => {
                if (!cancelled) setProfileMetrics(null);
            });

        return () => { cancelled = true; };
    }, [user?.wallet_address]);

    // Fetch challenges created by this user
    useEffect(() => {
        async function fetchUserChallenges() {
            if (!user?.id) {
                setUserChallenges([]);
                setTotalChallengesCreated(0);
                return;
            }

            try {
                setChallengesLoading(true);
                const challengeData = await getChallenges({
                    created_by: user.id,
                    limit: 6,
                    offset: 0,
                });
                setUserChallenges(challengeData.challenges || []);
                setTotalChallengesCreated(challengeData.total ?? challengeData.challenges?.length ?? 0);
                setHasMoreChallenges((challengeData.challenges?.length ?? 0) < (challengeData.total ?? 0));
            } catch (challengeError) {
                console.error("Failed to fetch user challenges:", challengeError);
                setUserChallenges([]);
                setTotalChallengesCreated(0);
            } finally {
                setChallengesLoading(false);
            }
        }

        fetchUserChallenges();
    }, [user?.id, challengeRefreshKey]);

    const loadMoreChallenges = useCallback(async () => {
        if (!profileUserId || challengesLoading || challengesLoadingMore || !hasMoreChallenges) return;
        try {
            setChallengesLoadingMore(true);
            const challengeData = await getChallenges({
                created_by: profileUserId,
                limit: 9,
                offset: userChallenges.length,
            });
            setUserChallenges((current) => [...current, ...(challengeData.challenges || [])]);
            setTotalChallengesCreated((current) => challengeData.total ?? current);
            setHasMoreChallenges(userChallenges.length + (challengeData.challenges?.length ?? 0) < challengeData.total);
        } catch (challengeError) {
            console.error("Failed to load more user challenges:", challengeError);
        } finally {
            setChallengesLoadingMore(false);
        }
    }, [challengesLoading, challengesLoadingMore, hasMoreChallenges, profileUserId, userChallenges.length]);

    useEffect(() => {
        const refreshChallenges = () => setChallengeRefreshKey((key) => key + 1);
        const refreshUpdatedChallenge = (event: Event) => {
            refreshChallenges();
            const { challengeId } = (event as CustomEvent<ChallengeUpdatedDetail>).detail;
            if (selectedChallenge?.id !== challengeId) return;
            getChallengeById(challengeId)
                .then(setSelectedChallenge)
                .catch((refreshError) => console.error("Failed to refresh open challenge:", refreshError));
        };

        window.addEventListener(CHALLENGE_CREATED_EVENT, refreshChallenges);
        window.addEventListener(CHALLENGE_UPDATED_EVENT, refreshUpdatedChallenge);
        return () => {
            window.removeEventListener(CHALLENGE_CREATED_EVENT, refreshChallenges);
            window.removeEventListener(CHALLENGE_UPDATED_EVENT, refreshUpdatedChallenge);
        };
    }, [selectedChallenge?.id]);

    useEffect(() => {
        let cancelled = false;

        async function fetchProfileBalances() {
            if (!profileWalletAddress) {
                setRektoBalance(0);
                setUsdcBalance(0);
                setIsRektoBalanceLoading(false);
                setIsUsdcBalanceLoading(false);
                return;
            }

            const hasStoredBalances = storedBalanceWallet?.toLowerCase() === profileWalletAddress.toLowerCase();
            if (hasStoredBalances) {
                setRektoBalance(storedRektoBalance ?? 0);
                setUsdcBalance(storedUsdcBalance ?? 0);
                setIsRektoBalanceLoading(storedBalancesLoading && storedRektoBalance === null);
                setIsUsdcBalanceLoading(storedBalancesLoading && storedUsdcBalance === null);
                return;
            }

            try {
                setIsRektoBalanceLoading(true);
                setIsUsdcBalanceLoading(true);
                const [rektoResult, usdcResult] = await Promise.allSettled([
                    fetchRektoBalance(profileWalletAddress),
                    fetchUsdcBalance(profileWalletAddress),
                ]);
                if (!cancelled) {
                    setRektoBalance(rektoResult.status === "fulfilled" ? rektoResult.value : 0);
                    setUsdcBalance(usdcResult.status === "fulfilled" ? usdcResult.value : 0);
                }
            } catch (balanceError) {
                console.error("Failed to fetch profile balances:", balanceError);
                if (!cancelled) { setRektoBalance(0); setUsdcBalance(0); }
            } finally {
                if (!cancelled) {
                    setIsRektoBalanceLoading(false);
                    setIsUsdcBalanceLoading(false);
                }
            }
        }

        fetchProfileBalances();

        return () => {
            cancelled = true;
        };
    }, [profileWalletAddress, storedBalanceWallet, storedBalancesLoading, storedRektoBalance, storedUsdcBalance]);

    const handleChallengeClick = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedChallenge(null), 300);
    };

    const filteredChallenges = useMemo(() => {
        const query = profileSearchQuery.trim().toLowerCase();
        return userChallenges
            .filter((challenge) => !query || [challenge.statement, challenge.title, challenge.ticker, challenge.trading_pair]
                .some((value) => value?.toLowerCase().includes(query)))
            .sort((a, b) => {
                const difference = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                return profileSortOrder === "latest" ? difference : -difference;
            });
    }, [profileSearchQuery, profileSortOrder, userChallenges]);

    const handleToggleFollow = useCallback(async () => {
        if (!connectedWalletAddress || !user?.wallet_address || isOwnProfile) return;

        try {
            setIsFollowActionLoading(true);
            const updatedTarget = isFollowing
                ? await unfollowUser(user.wallet_address, connectedWalletAddress)
                : await followUser(user.wallet_address, connectedWalletAddress);
            setUser(updatedTarget);
        } catch (followError) {
            console.error("Failed to toggle follow:", followError);
        } finally {
            setIsFollowActionLoading(false);
        }
    }, [connectedWalletAddress, isOwnProfile, isFollowing, user]);

    if (loading) {
        return <LoadingPage variant="simple" message="Loading profile..." />;
    }

    const userNotFound = error || !user;

    return (
        <div className="rekto-page min-h-screen pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                {userNotFound ? (
                    <>
                        <ProfileHeader
                            username={slug}
                            avatar="/scribbles/pepe.png"
                            walletAddress={slug}
                            bio="No bio yet"
                            twitterUsername={null}
                            joinedDate={new Date().toISOString()}
                            balance={{
                                rekto: rektoBalance,
                                usdc: usdcBalance,
                                usdcUsd: 0,
                            }}
                            isRektoBalanceLoading={isRektoBalanceLoading}
                            isUsdcBalanceLoading={isUsdcBalanceLoading}
                            stats={{
                                wins: 0,
                                rekts: 0,
                                totalChallenges: 0,
                                winRatio: 0,
                                pnl: 0,
                                volume: 0,
                            }}
                        />
                        <div className="rekto-surface mt-6 p-4 bg-orange-100/50 backdrop-blur-sm rounded-2xl border border-orange-200/50 text-center">
                            <p className="text-gray-700 text-lg font-medium">
                                This user is not registered on RektoFun yet!
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <ProfileHeader
                            username={user.username}
                            avatar={user.profile_image || "/scribbles/pepe.png"}
                            walletAddress={user.wallet_address}
                            bio={user.description || "No bio yet"}
                            showSettingsIcon={isOwnProfile}
                            twitterUsername={user.twitter_username}
                            userType={user.user_type}
                            isOwnProfile={isOwnProfile}
                            isFollowing={isFollowing}
                            followersCount={user.followers?.length ?? 0}
                            followingCount={user.following?.length ?? 0}
                            onToggleFollow={connectedWalletAddress ? handleToggleFollow : undefined}
                            isFollowActionLoading={isFollowActionLoading}
                            joinedDate={user.created_at}
                            balance={{
                                rekto: rektoBalance,
                                usdc: usdcBalance,
                                usdcUsd: 0,
                            }}
                            isRektoBalanceLoading={isRektoBalanceLoading}
                            isUsdcBalanceLoading={isUsdcBalanceLoading}
                            stats={{
                                wins: profileMetrics?.won ?? 0,
                                rekts: profileMetrics?.lost ?? 0,
                                totalChallenges: totalChallengesCreated,
                                winRatio: profileMetrics?.win_rate ?? 0,
                                pnl: profileMetrics?.pnl ?? 0,
                                volume: profileMetrics?.volume ?? 0,
                            }}
                        />

                        <ProfileTabs
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            searchQuery={profileSearchQuery}
                            onSearchChange={setProfileSearchQuery}
                            sortOrder={profileSortOrder}
                            onSortChange={setProfileSortOrder}
                        />

                        {activeTab === "challenges" && (
                            <ProfileChallenges
                                key={user.id}
                                challenges={filteredChallenges}
                                loading={challengesLoading}
                                onChallengeClick={handleChallengeClick}
                                onCreateChallenge={isOwnProfile ? () => setIsCreateModalOpen(true) : undefined}
                                hasMore={hasMoreChallenges}
                                loadingMore={challengesLoadingMore}
                                onLoadMore={loadMoreChallenges}
                            />
                        )}

                        {activeTab === "activity" && (
                            <ProfileActivity
                                key={user.id}
                                userId={String(user.id)}
                                username={user.username}
                                avatar={user.profile_image || "/scribbles/pepe.png"}
                                isOwnProfile={isOwnProfile}
                                onActivityClick={handleChallengeClick}
                                searchQuery={profileSearchQuery}
                                sortOrder={profileSortOrder}
                            />
                        )}
                    </>
                )}
            </div>

            <ChallengeDetailModal
                challenge={selectedChallenge}
                isOpen={isModalOpen}
                onClose={closeModal}
            />
            <CreateChallengeModal
                isOpen={Boolean(isOwnProfile && isCreateModalOpen)}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={() => {
                    setIsCreateModalOpen(false);
                    setChallengeRefreshKey((key) => key + 1);
                }}
            />
        </div>
    );
}
