"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAppKitAccount } from "@reown/appkit/react";
import ChallengeDetailModal from "@/app/components/challenge-components/ChallengeDetailModal";
import {
    ProfileHeader,
    ProfileTabs,
    ProfileChallenges,
    ProfileActivity,
} from "@/app/components/profile-components";
import { LoadingPage } from "@/app/components/LoadingPage";
import { followUser, getUserByWallet, unfollowUser, User } from "@/app/lib/users-service/users";
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
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userChallenges, setUserChallenges] = useState<Challenge[]>([]);
    const [challengesLoading, setChallengesLoading] = useState(false);
    const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);
    const [rektoBalance, setRektoBalance] = useState(0);
    const [isRektoBalanceLoading, setIsRektoBalanceLoading] = useState(true);
    const [usdcBalance, setUsdcBalance] = useState(0);
    const [isUsdcBalanceLoading, setIsUsdcBalanceLoading] = useState(true);

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

    // Fetch challenges created by this user
    useEffect(() => {
        async function fetchUserChallenges() {
            if (!user?.id) {
                setUserChallenges([]);
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
            } catch (challengeError) {
                console.error("Failed to fetch user challenges:", challengeError);
                setUserChallenges([]);
            } finally {
                setChallengesLoading(false);
            }
        }

        fetchUserChallenges();
    }, [user?.id]);

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
                            onToggleFollow={handleToggleFollow}
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
                                wins: userChallenges.filter((c) => c.status === "resolved").length,
                                rekts: 0,
                                totalChallenges: userChallenges.length,
                                winRatio: 0,
                            }}
                        />

                        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

                        {activeTab === "challenges" && (
                            <ProfileChallenges
                                key={user.id}
                                challenges={userChallenges}
                                loading={challengesLoading}
                                onChallengeClick={handleChallengeClick}
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
        </div>
    );
}
