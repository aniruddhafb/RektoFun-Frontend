"use client";

import React from "react";
import { Challenge } from "@/app/components/challenge-components/challengesData";
import { ChallengeCard } from "@/app/components/challenge-components/ChallengeCard";

// Static placeholder data
const PLACEHOLDER_CHALLENGES: Challenge[] = [
    {
        id: "placeholder-1",
        status: "open",
        asset: "BTC",
        creator_wallet: "placeholder-wallet-1",
        challenge_type: "price_up",
        amount: "100",
        expires_at: Date.now() + 86400000,
        created_at: Date.now(),
        description: "Bitcoin price prediction challenge",
        assetLogo: "/scribbles/btc.png",
        title: "BTC Price Challenge",
        creator: {
            name: "Anonymous",
            avatar: "/scribbles/pepe.png",
        },
        betAmount: 100,
        prediction: "Price will go up",
        currentPrice: 0,
        priceChange: 0,
        targetPrice: 0,
        startPrice: 0,
        timeRemaining: "24h",
        likes: 0,
        mode: "pvp",
        challengerCount: 1,
        defenderCount: 0,
        totalPool: 100,
    },
    {
        id: "placeholder-2",
        status: "open",
        asset: "SOL",
        creator_wallet: "placeholder-wallet-2",
        challenge_type: "price_down",
        amount: "50",
        expires_at: Date.now() + 172800000,
        created_at: Date.now(),
        description: "Solana price prediction challenge",
        assetLogo: "/scribbles/sol.png",
        title: "SOL Price Challenge",
        creator: {
            name: "TraderX",
            avatar: "/scribbles/sol.png",
        },
        betAmount: 50,
        prediction: "Price will go down",
        currentPrice: 0,
        priceChange: 0,
        targetPrice: 0,
        startPrice: 0,
        timeRemaining: "48h",
        likes: 0,
        mode: "pvp",
        challengerCount: 1,
        defenderCount: 0,
        totalPool: 50,
    },
];

interface ProfileChallengesProps {
    onChallengeClick: (challenge: Challenge) => void;
}

export function ProfileChallenges({ onChallengeClick }: ProfileChallengesProps) {
    return (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {PLACEHOLDER_CHALLENGES.map((challenge) => (
                <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClick={onChallengeClick}
                />
            ))}
        </div>
    );
}