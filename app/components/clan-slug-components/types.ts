// ─── Types ────────────────────────────────────────────────────────────────────
export type MemberRole = "Leader" | "Co-Leader" | "Member";
export type MemberStatus = "Online" | "Away" | "Offline";
export type ChallengeMode = "PVP Mode" | "Multi Mode";
export type ChallengeAction = "ACCEPT" | "JOIN CHALLENGE";

export interface Member {
    id: number;
    name: string;
    avatar: string;
    role: MemberRole;
    rektPoints: string;
    status: MemberStatus;
}

export interface ChallengeParticipant {
    name: string;
    avatar: string;
    label: "CHALLENGER" | "DEFENDER";
    sublabel: string;
    pool?: string;
}

export interface ClanChallenge {
    id: number;
    title: string;
    asset: string;
    assetColor: string;
    creator: string;
    mode: ChallengeMode;
    challenger: ChallengeParticipant;
    defender: ChallengeParticipant | null;
    action: ChallengeAction;
    expiresIn: string;
    createdAgo: string;
    shares: number;
    views: number;
}

export interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    message: string;
    timestamp: Date;
}

export interface ClanData {
    name: string;
    slug: string;
    tagline: string;
    description: string;
    leader: string;
    leaderWallet: string;
    leaderAvatar: string;
    logo: string;
    type: "Public" | "Invite Only";
    members: number;
    maxMembers: number;
    totalWins: number;
    totalRekts: number;
    winRate: number;
    rektPoints: string;
    verified: boolean;
    isOpenToJoin: boolean;
    country?: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
export const clanData: ClanData = {
    name: "Alpha Syndicate",
    slug: "alpha-syndicate",
    tagline: "Trade smart. Win together.",
    description: "Always stay one step ahead of the market.",
    leader: "LionKing",
    leaderWallet: "fake-wallet-address-123",
    leaderAvatar: "/profiles/1.svg",
    logo: "/scribbles/coins.png",
    type: "Public",
    members: 37,
    maxMembers: 50,
    totalWins: 128,
    totalRekts: 78,
    winRate: 78,
    rektPoints: "12.4K",
    verified: true,
    isOpenToJoin: true,
};

export const membersData: Member[] = [
    { id: 1, name: "LionKing", avatar: "/profiles/1.svg", role: "Leader", rektPoints: "12.4K", status: "Online" },
    { id: 2, name: "Ragnar", avatar: "/profiles/2.svg", role: "Co-Leader", rektPoints: "9.8K", status: "Online" },
    { id: 3, name: "Maverick", avatar: "/profiles/3.svg", role: "Co-Leader", rektPoints: "8.2K", status: "Away" },
    { id: 4, name: "CryptoKing", avatar: "/profiles/4.svg", role: "Member", rektPoints: "6.6K", status: "Online" },
    { id: 5, name: "DegenLord", avatar: "/profiles/5.svg", role: "Member", rektPoints: "5.4K", status: "Offline" },
    { id: 6, name: "Aqua", avatar: "/profiles/6.svg", role: "Member", rektPoints: "4.1K", status: "Online" },
    { id: 7, name: "MoonBoy", avatar: "/profiles/7.svg", role: "Member", rektPoints: "3.8K", status: "Offline" },
];

export const challengesData: ClanChallenge[] = [
    {
        id: 1,
        title: "SOL Above $160 in 1 Hour?",
        asset: "SOL",
        assetColor: "#9945FF",
        creator: "DegenLord",
        mode: "PVP Mode",
        challenger: {
            name: "DegenLord",
            avatar: "/profiles/5.svg",
            label: "CHALLENGER",
            sublabel: "Created",
            pool: "$500",
        },
        defender: {
            name: "CryptoKing",
            avatar: "/profiles/4.svg",
            label: "DEFENDER",
            sublabel: "Defending",
        },
        action: "ACCEPT",
        expiresIn: "59m 12s",
        createdAgo: "2h ago",
        shares: 5,
        views: 0,
    },
    {
        id: 2,
        title: "BTC Above $95K in 2 Hours?",
        asset: "BTC",
        assetColor: "#F7931A",
        creator: "CryptoKing",
        mode: "Multi Mode",
        challenger: {
            name: "CryptoKing",
            avatar: "/profiles/4.svg",
            label: "CHALLENGER",
            sublabel: "Created",
            pool: "$2250",
        },
        defender: null,
        action: "JOIN CHALLENGE",
        expiresIn: "1h 45m",
        createdAgo: "2h ago",
        shares: 12,
        views: 0,
    },
    {
        id: 3,
        title: "ETH Below $3,200 in 30 mins?",
        asset: "ETH",
        assetColor: "#627EEA",
        creator: "BearWhale",
        mode: "PVP Mode",
        challenger: {
            name: "BearWhale",
            avatar: "/profiles/8.svg",
            label: "CHALLENGER",
            sublabel: "Created",
            pool: "$2500",
        },
        defender: null,
        action: "ACCEPT",
        expiresIn: "28m 45s",
        createdAgo: "2h ago",
        shares: 8,
        views: 0,
    },
];

// ─── Mock Chat Data ───────────────────────────────────────────────────────────
export const mockChatUsers = [
    { id: "1", name: "CryptoKing", avatar: "/profiles/4.svg" },
    { id: "2", name: "DiamondHands", avatar: "/profiles/5.svg" },
    { id: "3", name: "WhaleWatcher", avatar: "/profiles/6.svg" },
    { id: "4", name: "MoonBoi", avatar: "/profiles/7.svg" },
    { id: "5", name: "ToTheMoon", avatar: "/profiles/8.svg" },
];

export const initialMessages: ChatMessage[] = [
    { id: "1", userId: "1", userName: "CryptoKing", userAvatar: "/profiles/4.svg", message: "Hey everyone! Anyone up for a challenge?", timestamp: new Date(Date.now() - 300000) },
    { id: "2", userId: "2", userName: "DiamondHands", userAvatar: "/profiles/5.svg", message: "I'm in! Let's gooo! 🚀", timestamp: new Date(Date.now() - 240000) },
    { id: "3", userId: "3", userName: "WhaleWatcher", userAvatar: "/profiles/6.svg", message: "SOL looking strong today", timestamp: new Date(Date.now() - 180000) },
    { id: "4", userId: "4", userName: "MoonBoi", userAvatar: "/profiles/7.svg", message: "HODL! Bulls are coming!", timestamp: new Date(Date.now() - 120000) },
    { id: "5", userId: "5", userName: "ToTheMoon", userAvatar: "/profiles/8.svg", message: "Just won a challenge, feeling great! 💰", timestamp: new Date(Date.now() - 60000) },
];
