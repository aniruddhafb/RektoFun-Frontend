// Challenge type definition (matching ChallengeDetailModal)
export interface Challenge {
    id: string;
    asset: string;
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
    status: "active" | "expired" | "won" | "lost" | "created" | "accepted";
    mode: "pvp" | "multi";
    challengerCount: number;
    defenderCount: number;
    totalPool: number;
    accepter?: {
        name: string;
        avatar: string;
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

// Dummy challenges data
export const DUMMY_CHALLENGES: Challenge[] = [
    {
        id: "1",
        asset: "SOL",
        assetLogo: coins.SOL.logo,
        title: "SOL Above $160 in 1 Hour?",
        creator: {
            name: "DegenLord",
            avatar: "/scribbles/pepe.png",
        },
        betAmount: 100,
        prediction: "SOL > $160",
        currentPrice: 157.4,
        priceChange: -1.8,
        targetPrice: 160,
        startPrice: 168,
        timeRemaining: "59m 12s",
        likes: 5,
        status: "active",
        mode: "pvp",
        challengerCount: 3,
        defenderCount: 2,
        totalPool: 500,
        accepter: { name: "CryptoKing", avatar: "/scribbles/pepe.png" },
    },
    {
        id: "2",
        asset: "BTC",
        assetLogo: coins.BTC.logo,
        title: "BTC Above $95K in 2 Hours?",
        creator: {
            name: "CryptoKing",
            avatar: "/scribbles/doge.png",
        },
        betAmount: 250,
        prediction: "BTC > $95,000",
        currentPrice: 94300,
        priceChange: 2.3,
        targetPrice: 95000,
        startPrice: 92000,
        timeRemaining: "1h 45m",
        likes: 12,
        status: "active",
        mode: "multi",
        challengerCount: 5,
        defenderCount: 4,
        totalPool: 2250,
    },
    {
        id: "3",
        asset: "ETH",
        assetLogo: coins.ETH.logo,
        title: "ETH Below $3,200 in 30 mins?",
        creator: {
            name: "BearWhale",
            avatar: "/scribbles/shiba.png",
        },
        betAmount: 500,
        prediction: "ETH < $3,200",
        currentPrice: 3250,
        priceChange: -0.5,
        targetPrice: 3200,
        startPrice: 3300,
        timeRemaining: "28m 45s",
        likes: 8,
        status: "active",
        mode: "pvp",
        challengerCount: 2,
        defenderCount: 3,
        totalPool: 2500,
    },
    {
        id: "4",
        asset: "DOGE",
        assetLogo: coins.DOGE.logo,
        title: "DOGE Above $0.18 in 1 Hour?",
        creator: {
            name: "DegenLord",
            avatar: "/scribbles/pepe.png",
        },
        betAmount: 50,
        prediction: "DOGE > $0.18",
        currentPrice: 0.175,
        priceChange: 3.2,
        targetPrice: 0.18,
        startPrice: 0.165,
        timeRemaining: "52m 30s",
        likes: 3,
        status: "created",
        mode: "multi",
        challengerCount: 1,
        defenderCount: 0,
        totalPool: 50,
    },
    {
        id: "5",
        asset: "PEPE",
        assetLogo: coins.PEPE.logo,
        title: "PEPE Above $0.000015 in 3 Hours?",
        creator: {
            name: "MoonBoy",
            avatar: "/scribbles/pepe.png",
        },
        betAmount: 150,
        prediction: "PEPE > $0.000015",
        currentPrice: 0.0000142,
        priceChange: -2.1,
        targetPrice: 0.000015,
        startPrice: 0.0000145,
        timeRemaining: "2h 15m",
        likes: 7,
        status: "accepted",
        mode: "pvp",
        challengerCount: 4,
        defenderCount: 2,
        totalPool: 900,
        accepter: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
    },
    {
        id: "6",
        asset: "SHIB",
        assetLogo: coins.SHIB.logo,
        title: "SHIB Above $0.000025 in 1 Hour?",
        creator: {
            name: "ShibArmy",
            avatar: "/scribbles/pepe.png",
        },
        betAmount: 75,
        prediction: "SHIB > $0.000025",
        currentPrice: 0.0000245,
        priceChange: 1.5,
        targetPrice: 0.000025,
        startPrice: 0.000024,
        timeRemaining: "48m 20s",
        likes: 4,
        status: "expired",
        mode: "multi",
        challengerCount: 2,
        defenderCount: 1,
        totalPool: 225,
        accepter: { name: "DegenLord", avatar: "/scribbles/pepe.png" },
    },
];
