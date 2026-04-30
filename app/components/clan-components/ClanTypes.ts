// ─── Types ────────────────────────────────────────────────────────────────────
export interface Clan {
    rank: number;
    name: string;
    description: string;
    leader: string;
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
    chain: string;
}