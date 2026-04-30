// Unified Challenge type with API fields + UI placeholders
export interface Challenge {
    // Core API fields
    id: string;
    status: 'open' | 'accepted' | 'closed' | 'active' | 'expired' | 'won' | 'lost' | 'created';
    asset: string;
    creator_wallet: string;
    challenge_type: string;
    amount: string;
    expires_at: number;
    created_at: number;
    description?: string;
    
    // UI placeholder fields (API should provide these)
    assetLogo: string;
    title: string;
    creator: {
        name: string;
        avatar: string;
    };
    betAmount: number;
    prediction: string;
    currentPrice: number;
    priceChange: number;
    targetPrice: number;
    startPrice: number;
    timeRemaining: string;
    likes: number;
    mode: "pvp" | "multi";
    challengerCount: number;
    defenderCount: number;
    totalPool: number;
    accepter?: {
        name: string;
        avatar: string;
    };
    
    // Legacy/optional fields for compatibility
    createdAt?: string;
    expiresAt?: string;
    endsAt?: string;
    challengerPlayers?: { name: string; avatar: string }[];
    defenderPlayers?: { name: string; avatar: string }[];
}

// Helper to map API response to unified Challenge
export function mapApiChallenge(apiChallenge: any): Challenge {
    const coinLogos: Record<string, string> = {
        BTC: "/scribbles/btc.png",
        ETH: "/scribbles/coins.png",
        SOL: "/scribbles/sol.png",
        PEPE: "/scribbles/pepe.png",
        DOGE: "/scribbles/doge.png",
        SHIB: "/scribbles/shiba.png",
    };
    
    return {
        // API fields
        id: apiChallenge.id,
        status: apiChallenge.status,
        asset: apiChallenge.asset,
        creator_wallet: apiChallenge.creator_wallet,
        challenge_type: apiChallenge.challenge_type,
        amount: apiChallenge.amount,
        expires_at: apiChallenge.expires_at,
        created_at: apiChallenge.created_at,
        description: apiChallenge.description,
        
        // UI placeholder fields
        assetLogo: coinLogos[apiChallenge.asset] || "/scribbles/coins.png",
        title: apiChallenge.description || `${apiChallenge.asset} Challenge`,
        creator: {
            name: apiChallenge.creator_wallet ? `${apiChallenge.creator_wallet.slice(0, 6)}...` : "Unknown",
            avatar: "/scribbles/pepe.png",
        },
        betAmount: parseFloat(apiChallenge.amount) || 0,
        prediction: apiChallenge.challenge_type || "N/A",
        currentPrice: 0,
        priceChange: 0,
        targetPrice: 0,
        startPrice: 0,
        timeRemaining: apiChallenge.expires_at ? `${Math.floor((apiChallenge.expires_at - Date.now()) / 60000)}m` : "N/A",
        likes: 0,
        mode: "pvp",
        challengerCount: 1,
        defenderCount: 0,
        totalPool: parseFloat(apiChallenge.amount) || 0,
    };
}

// Coin mappings
export const coins: Record<string, { logo: string; name: string }> = {
    BTC: { logo: "/scribbles/btc.png", name: "Bitcoin" },
    ETH: { logo: "/scribbles/coins.png", name: "Ethereum" },
    SOL: { logo: "/scribbles/sol.png", name: "Solana" },
    PEPE: { logo: "/scribbles/pepe.png", name: "Pepe" },
    DOGE: { logo: "/scribbles/doge.png", name: "Dogecoin" },
    SHIB: { logo: "/scribbles/shiba.png", name: "Shiba Inu" },
};
