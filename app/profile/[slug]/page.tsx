"use client";

import React, { useState } from "react";
import { Challenge, DUMMY_CHALLENGES } from "@/app/components/challenge-components/challengesData";
import ChallengeDetailModal from "@/app/components/challenge-components/ChallengeDetailModal";
import {
    ProfileHeader,
    ProfileTabs,
    ProfileChallenges,
    ProfileActivity,
} from "@/app/components/profile-components";

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

// Dummy data for the profile
const profileData = {
    username: "DegenLord",
    avatar: "/scribbles/pepe.png",
    walletAddress: "0x7a89...3f4a",
    bio: "King of the Degens, betting big and laughing at tears of REKTed noobs",
    joinedDate: "Feb",
    balance: {
        sol: 7.02,
        solUsd: 1160,
    },
    stats: {
        wins: 528,
        rekts: 145,
        totalChallenges: 673,
        winRatio: 78.5,
    },
};

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

// Tab types
type TabType = "challenges" | "activity";

// Static params since profile page uses demo data
export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<TabType>("challenges");
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Handle challenge card click
    const handleChallengeClick = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        setIsModalOpen(true);
    };

    // Close modal handler
    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedChallenge(null), 300);
    };

    return (
        <div className="min-h-screen bg-[#f3e1d7] pb-8">
            {/* Profile Header Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <ProfileHeader
                    username={profileData.username}
                    avatar={profileData.avatar}
                    walletAddress={profileData.walletAddress}
                    bio={profileData.bio}
                    joinedDate={profileData.joinedDate}
                    balance={profileData.balance}
                    stats={profileData.stats}
                />

                {/* Tab Navigation */}
                <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

                {/* Challenges Tab Content */}
                {activeTab === "challenges" && (
                    <ProfileChallenges onChallengeClick={handleChallengeClick} />
                )}

                {/* Activity Tab Content */}
                {activeTab === "activity" && (
                    <ProfileActivity activityData={activityData} />
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
