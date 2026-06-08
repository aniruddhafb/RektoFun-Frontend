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
    ChallengeListItem,
    getChallenges,
} from "@/app/lib/challenges-service/challenges";

type TabType = "challenges" | "activity";

export default function ProfilePage() {
    const params = useParams();
    const { address: connectedWalletAddress } = useAppKitAccount();
    const { user: currentUser } = useUserStore();
    
    const slug = params.slug as string;
    const walletFromSlug = decodeURIComponent(slug || "");

    const [activeTab, setActiveTab] = useState<TabType>("challenges");
    const [selectedChallenge, setSelectedChallenge] = useState<ChallengeListItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userChallenges, setUserChallenges] = useState<ChallengeListItem[]>([]);
    const [challengesLoading, setChallengesLoading] = useState(false);
    const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);

    const isOwnProfile = connectedWalletAddress?.toLowerCase() === user?.wallet_address?.toLowerCase();
    const isFollowing = !!(currentUser?.id && user?.followers?.includes(currentUser.id));

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

    const handleChallengeClick = (challenge: ChallengeListItem) => {
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
                                sol: 0,
                                solUsd: 0,
                                usdc: 0,
                                usdcUsd: 0,
                            }}
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
                            twitterUsername={null}
                            isOwnProfile={isOwnProfile}
                            isFollowing={isFollowing}
                            followersCount={user.followers?.length ?? 0}
                            followingCount={user.following?.length ?? 0}
                            onToggleFollow={handleToggleFollow}
                            isFollowActionLoading={isFollowActionLoading}
                            joinedDate={user.created_at}
                            balance={{
                                sol: user.earnings ?? 0,
                                solUsd: (user.earnings ?? 0) * 165,
                                usdc: 0,
                                usdcUsd: 0,
                            }}
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
                                challenges={userChallenges}
                                loading={challengesLoading}
                                onChallengeClick={handleChallengeClick}
                            />
                        )}

                        {activeTab === "activity" && (
                            <ProfileActivity
                                userId={user.id}
                                username={user.username}
                                avatar={user.profile_image || "/scribbles/pepe.png"}
                                isOwnProfile={isOwnProfile}
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
