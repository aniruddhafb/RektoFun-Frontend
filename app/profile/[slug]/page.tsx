"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import ChallengeDetailModal from "@/app/components/challenge-components/ChallengeDetailModal";
import {
    ProfileHeader,
    ProfileTabs,
    ProfileChallenges,
    ProfileActivity,
} from "@/app/components/profile-components";
import { LoadingPage } from "@/app/components/LoadingPage";
import { getUserByWallet, User } from "@/app/lib/users-service/users";
import { useSolanaWallet } from "@/app/lib/useSolanaWallet";
import {
    ChallengeListItem,
    getChallenges,
} from "@/app/lib/challenges-service/challenges";

// Tab types
type TabType = "challenges" | "activity";


export default function ProfilePage() {
    const BOOKMARKS_STORAGE_KEY = "rektofun:challenge-bookmarks";
    const params = useParams();
    const { user: privyUser } = usePrivy();
    const slug = params.slug as string;
    const { solBalance, usdcBalance, solanaWallet } = useSolanaWallet();
    const [activeTab, setActiveTab] = useState<TabType>("challenges");
    const [selectedChallenge, setSelectedChallenge] = useState<ChallengeListItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userChallenges, setUserChallenges] = useState<ChallengeListItem[]>([]);
    const [challengesLoading, setChallengesLoading] = useState(false);
    const [bookmarkedChallengeIds, setBookmarkedChallengeIds] = useState<string[]>(() => {
        if (typeof window === "undefined") return [];
        try {
            const rawBookmarks = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY);
            if (!rawBookmarks) return [];
            const parsed = JSON.parse(rawBookmarks);
            if (!Array.isArray(parsed)) return [];
            return parsed.filter((value): value is string => typeof value === "string");
        } catch (error) {
            console.error("Failed to read challenge bookmarks from localStorage:", error);
            return [];
        }
    });

    const walletFromSlug = decodeURIComponent(slug || "");
    const linkedTwitter = privyUser?.linkedAccounts?.find((acc) => acc.type === "twitter_oauth");
    const isOwnProfile = !!(
        solanaWallet?.address &&
        user?.wallet_address &&
        solanaWallet.address === user.wallet_address
    );
    const twitterUsername = isOwnProfile ? linkedTwitter?.username ?? null : null;

    useEffect(() => {
        try {
            window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedChallengeIds));
        } catch (error) {
            console.error("Failed to persist challenge bookmarks to localStorage:", error);
        }
    }, [bookmarkedChallengeIds]);

    const toggleBookmark = useCallback((challengeId: string) => {
        setBookmarkedChallengeIds((prev) =>
            prev.includes(challengeId)
                ? prev.filter((id) => id !== challengeId)
                : [...prev, challengeId]
        );
    }, []);

    const isChallengeBookmarked = useCallback(
        (challengeId: string) => bookmarkedChallengeIds.includes(challengeId),
        [bookmarkedChallengeIds]
    );

    // Fetch user data by wallet address (slug)
    useEffect(() => {
        async function fetchUser() {
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

        if (walletFromSlug) {
            fetchUser();
        }
    }, [walletFromSlug]);

    // Fetch challenges created by this user id
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

    // Handle challenge card click
    const handleChallengeClick = (challenge: ChallengeListItem) => {
        setSelectedChallenge(challenge);
        setIsModalOpen(true);
    };

    // Close modal handler
    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedChallenge(null), 300);
    };

    // Format wallet address for display (shorten it)
    const formatWalletAddress = (address: string) => {
        if (address.length > 10) {
            return `${address.slice(0, 6)}...${address.slice(-4)}`;
        }
        return address;
    };

    if (loading) {
        return <LoadingPage variant="simple" message="Loading profile..." />;
    }

    const userNotFound = error || !user;

    return (
        <div className="min-h-screen bg-[#f3e1d7] pb-8">
            {/* Profile Header Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                {userNotFound ? (
                    <>
                        <ProfileHeader
                            username={slug}
                            avatar="/scribbles/pepe.png"
                            walletAddress={formatWalletAddress(slug)}
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
                        {/* User Not Found Message */}
                        <div className="mt-6 p-4 bg-orange-100/50 backdrop-blur-sm rounded-2xl border border-orange-200/50 text-center">
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
                            walletAddress={formatWalletAddress(user.wallet_address)}
                            bio={user.description || "No bio yet"}
                            twitterUsername={twitterUsername}
                            joinedDate={user.created_at}
                            balance={{
                                sol: solBalance ?? user.earnings ?? 0,
                                solUsd: (solBalance ?? user.earnings ?? 0) * 165, // Approximate SOL to USD
                                usdc: usdcBalance ?? 0,
                                usdcUsd: usdcBalance ?? 0, // USDC is 1:1 with USD
                            }}
                            stats={{
                                wins: userChallenges.filter((c) => c.status === "resolved").length,
                                rekts: 0,
                                totalChallenges: userChallenges.length,
                                winRatio: 0,
                            }}
                        />

                        {/* Tab Navigation */}
                        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

                        {/* Challenges Tab Content */}
                        {activeTab === "challenges" && (
                            <ProfileChallenges
                                challenges={userChallenges}
                                loading={challengesLoading}
                                onChallengeClick={handleChallengeClick}
                                onToggleBookmark={toggleBookmark}
                                isBookmarked={isChallengeBookmarked}
                            />
                        )}

                        {/* Activity Tab Content */}
                        {activeTab === "activity" && (
                            <ProfileActivity
                                userId={user.id}
                                username={user.username}
                                avatar={user.profile_image || "/scribbles/pepe.png"}
                                isOwnProfile={solanaWallet?.address === user.wallet_address}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Challenge Detail Modal */}
            <ChallengeDetailModal
                challenge={selectedChallenge}
                isOpen={isModalOpen}
                onClose={closeModal}
            />
        </div>
    );
}
