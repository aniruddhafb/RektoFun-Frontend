"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { ChallengeListItem } from "@/app/lib/challenges-service/challenges";

// Activity item interface
interface ActivityItem {
    id: string;
    type: "bet" | "win" | "follow" | "buy";
    user: {
        name: string;
        avatar: string;
    };
    action: string;
    target?: string;
    amount?: string;
    details: string;
    subAction?: {
        user: string;
        action: string;
        icon?: string;
        highlight?: string;
    };
    timestamp: string;
}

// Tab types
type TabType = "challenges" | "activity";

// Activity data matching the activity page style
const activityData: ActivityItem[] = [
    {
        id: "1",
        type: "win",
        user: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        action: "won",
        amount: "+2.5 SOL",
        target: "Bitcoin Above $95K",
        details: "vs CryptoKing",
        subAction: {
            user: "BTC",
            action: "bought",
            highlight: "🎫",
        },
        timestamp: "2hr ago",
    },
    {
        id: "2",
        type: "bet",
        user: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        action: "got REKT",
        amount: "-1.2 SOL",
        target: "Ethereum Below $3,200",
        details: "by BearWhale",
        subAction: {
            user: "ETH",
            action: "bought",
            highlight: "Down",
        },
        timestamp: "5hr ago",
    },
    {
        id: "3",
        type: "bet",
        user: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        action: "created challenge",
        amount: "1.0 SOL",
        target: "SOL Above $160",
        details: "",
        subAction: {
            user: "SOL",
            action: "bought",
            highlight: "🎫",
        },
        timestamp: "1 day ago",
    },
    {
        id: "4",
        type: "follow",
        user: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        action: "joined",
        target: "MoonBoy's challenge",
        details: "x0.5 SOL bet",
        subAction: {
            user: "DOGE",
            action: "bought",
            highlight: "🥞",
        },
        timestamp: "2 days ago",
    },
    {
        id: "5",
        type: "win",
        user: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
        action: "hit jackpot!",
        amount: "+5.0 SOL",
        target: "PEPE Above $0.000015",
        details: "",
        subAction: {
            user: "PEPE",
            action: "bought",
            highlight: "Up x5",
        },
        timestamp: "3 days ago",
    },
];

export default function ProfilePage() {
    const params = useParams();
    const slug = params.slug as string;
    const { solBalance, usdcBalance } = useSolanaWallet();
    const [activeTab, setActiveTab] = useState<TabType>("challenges");
    const [selectedChallenge, setSelectedChallenge] = useState<ChallengeListItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user data by wallet address (slug)
    useEffect(() => {
        async function fetchUser() {
            try {
                setLoading(true);
                const userData = await getUserByWallet(slug);
                console.log("Fetched user data:", userData);
                setUser(userData);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch user");
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        if (slug) {
            fetchUser();
        }
    }, [slug]);

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
                            joinedDate={user.created_at}
                            balance={{
                                sol: solBalance ?? user.earnings ?? 0,
                                solUsd: (solBalance ?? user.earnings ?? 0) * 165, // Approximate SOL to USD
                                usdc: usdcBalance ?? 0,
                                usdcUsd: usdcBalance ?? 0, // USDC is 1:1 with USD
                            }}
                            stats={{
                                wins: 0, // These would come from challenges data
                                rekts: 0,
                                totalChallenges: 0,
                                winRatio: 0,
                            }}
                        />

                        {/* Tab Navigation */}
                        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

                        {/* Challenges Tab Content */}
                        {/* {activeTab === "challenges" && (
                            <ProfileChallenges onChallengeClick={handleChallengeClick} />
                        )} */}

                        {/* Activity Tab Content */}
                        {activeTab === "activity" && (
                            <ProfileActivity activityData={activityData} />
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
