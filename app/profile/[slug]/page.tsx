"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import {
    Challenge,
    getChallenges,
} from "@/app/lib/challenges-service/challenges";
import { fetchRektoBalance, fetchUsdcBalance } from "@/app/lib/token-balances";

type TabType = "challenges" | "activity";

export default function ProfilePage() {
    const params = useParams();
    const { address: connectedWalletAddress } = useAppKitAccount();
    const { user: currentUser } = useUserStore();
    
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
    const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);
    const [rektoBalance, setRektoBalance] = useState(0);
    const [isRektoBalanceLoading, setIsRektoBalanceLoading] = useState(true);
    const [usdcBalance, setUsdcBalance] = useState(0);
    const [isUsdcBalanceLoading, setIsUsdcBalanceLoading] = useState(true);
    const [profileMetrics, setProfileMetrics] = useState<LeaderboardUser | null>(null);

    const isOwnProfile = connectedWalletAddress?.toLowerCase() === user?.wallet_address?.toLowerCase();
    const isFollowing = !!(currentUser?.id && user?.followers?.includes(currentUser.id));
    const profileWalletAddress = user?.wallet_address || walletFromSlug;

    // Fetch user data by wallet address
    useEffect(() => {
        async function fetchUser() {
            if (!walletFromSlug) return;
            
            try {
                setLoading(true);
                const userData = await getUserByWallet(walletFromSlug);
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
    }, [walletFromSlug]);

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
                    limit: 100,
                    offset: 0,
                });
                setUserChallenges(challengeData.challenges || []);
                setTotalChallengesCreated(challengeData.total ?? challengeData.challenges?.length ?? 0);
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

    useEffect(() => {
        let cancelled = false;

        async function fetchProfileRektoBalance() {
            if (!profileWalletAddress) {
                setRektoBalance(0);
                setIsRektoBalanceLoading(false);
                return;
            }

            try {
                setIsRektoBalanceLoading(true);
                const balance = await fetchRektoBalance(profileWalletAddress);
                if (!cancelled) {
                    setRektoBalance(balance);
                }
            } catch (balanceError) {
                console.error("Failed to fetch REKTO balance:", balanceError);
                if (!cancelled) {
                    setRektoBalance(0);
                }
            } finally {
                if (!cancelled) {
                    setIsRektoBalanceLoading(false);
                }
            }
        }

        fetchProfileRektoBalance();

        return () => {
            cancelled = true;
        };
    }, [profileWalletAddress]);

    useEffect(() => {
        let cancelled = false;

        async function fetchProfileUsdcBalance() {
            if (!profileWalletAddress) {
                setUsdcBalance(0);
                setIsUsdcBalanceLoading(false);
                return;
            }

            try {
                setIsUsdcBalanceLoading(true);
                const balance = await fetchUsdcBalance(profileWalletAddress);
                if (!cancelled) {
                    setUsdcBalance(balance);
                }
            } catch (balanceError) {
                console.error("Failed to fetch USDC balance:", balanceError);
                if (!cancelled) {
                    setUsdcBalance(0);
                }
            } finally {
                if (!cancelled) {
                    setIsUsdcBalanceLoading(false);
                }
            }
        }

        fetchProfileUsdcBalance();

        return () => {
            cancelled = true;
        };
    }, [profileWalletAddress]);

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
                                onCreateChallenge={() => setIsCreateModalOpen(true)}
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
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={() => {
                    setIsCreateModalOpen(false);
                    setChallengeRefreshKey((key) => key + 1);
                }}
            />
        </div>
    );
}
