/**
 * Clans Service
 * API calls for clan creation and management
 */

import { Clan as FrontendClan } from "@/app/components/clan-components/ClanTypes";
import { ClanData } from "@/app/components/clan-slug-components/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface Clan {
    id: string;
    clan_name: string;
    clan_description: string | null;
    clan_image: string | null;
    max_members: number;
    clan_leader: string;
    clan_members: string[];
    clan_status: "public" | "invite_only";
    clan_region: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface CreateClanParams {
    clan_name: string;
    clan_description?: string;
    clan_image?: string;
    max_members: number;
    clan_status: "public" | "invite_only";
    clan_region?: string;
    clan_leader: string;
}

export interface UpdateClanParams {
    clan_name: string;
    clan_description?: string;
    clan_image?: string;
    max_members: number;
    clan_status: "public" | "invite_only";
    clan_region?: string;
}

export async function createClan(params: CreateClanParams): Promise<Clan> {
    const response = await fetch(`${API_BASE_URL}/clans`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create clan: ${errorData.detail || response.statusText}`);
    }

    return response.json();
}

export async function getClanById(clanId: string): Promise<Clan> {
    const response = await fetch(`${API_BASE_URL}/clans/${encodeURIComponent(clanId)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch clan: ${response.statusText}`);
    }

    return response.json();
}

export interface PaginatedClansResponse {
    clans: FrontendClan[];
    total: number;
    limit: number;
    offset: number;
}

/**
 * Transform backend clan response to frontend Clan type
 */
function transformClanResponse(clan: Clan, index: number): FrontendClan {
    // Map backend fields to frontend Clan type
    return {
        id: clan.id,
        rank: index + 1,
        name: clan.clan_name,
        description: clan.clan_description || "",
        leader: clan.clan_leader,
        leaderAvatar: "/scribbles/btc.png", // Default avatar
        logo: clan.clan_image || "/scribbles/coins.png", // Default logo
        type: clan.clan_status === "public" ? "Public" : "Invite Only",
        members: clan.clan_members?.length || 0,
        maxMembers: clan.max_members,
        totalWins: 0, // These would need to be calculated from challenge data
        totalRekts: 0,
        winRate: 0,
        rektPoints: "0",
        verified: false,
        chain: clan.clan_region || "Solana",
    };
}

/**
 * Fetch leader info (name and avatar) from the users API
 */
async function fetchLeaderInfo(leaderId: string): Promise<{ name: string; avatar: string }> {
    let leaderName = leaderId;
    let leaderAvatar = "/scribbles/btc.png"; // Default avatar

    try {
        const leaderResponse = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(leaderId)}`, {
            method: "GET",
            headers: {
                "accept": "application/json",
            },
        });

        if (leaderResponse.ok) {
            const leaderData = await leaderResponse.json();
            leaderName = leaderData.username || leaderId;
            leaderAvatar = leaderData.profile_image || "/scribbles/btc.png";
        }
    } catch (error) {
        console.error("Failed to fetch leader profile:", error);
        // Use default values if fetch fails
    }

    return { name: leaderName, avatar: leaderAvatar };
}

/**
 * Transform backend clan response to frontend Clan type
 */
async function transformClanResponseAsync(clan: Clan, index: number): Promise<FrontendClan> {
    // Fetch leader info
    const leaderInfo = await fetchLeaderInfo(clan.clan_leader);

    // Map backend fields to frontend Clan type
    return {
        id: clan.id,
        rank: index + 1,
        name: clan.clan_name,
        description: clan.clan_description || "",
        leader: leaderInfo.name,
        leaderAvatar: leaderInfo.avatar,
        logo: clan.clan_image || "/scribbles/coins.png", // Default logo
        type: clan.clan_status === "public" ? "Public" : "Invite Only",
        members: clan.clan_members?.length || 0,
        maxMembers: clan.max_members,
        totalWins: 0, // These would need to be calculated from challenge data
        totalRekts: 0,
        winRate: 0,
        rektPoints: "0",
        verified: false,
        chain: clan.clan_region || "Solana",
    };
}

export async function getClans(
    limit: number = 10,
    offset: number = 0,
    leaderId?: string
): Promise<PaginatedClansResponse> {
    const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
    });
    if (leaderId) {
        params.set("leader_id", leaderId);
    }

    const response = await fetch(`${API_BASE_URL}/clans?${params.toString()}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch clans: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform backend clans to frontend format with leader info
    const transformedClans = await Promise.all(
        data.clans.map((clan: Clan, index: number) =>
            transformClanResponseAsync(clan, offset + index)
        )
    );

    return {
        clans: transformedClans,
        total: data.total,
        limit,
        offset,
    };
}

export async function hasClanByLeader(leaderId: string): Promise<boolean> {
    const result = await getClans(1, 0, leaderId);
    return result.total > 0;
}

/**
 * Get user ID by wallet address
 */
export async function getUserIdByWallet(walletAddress: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/users/wallet/${encodeURIComponent(walletAddress)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    const user = await response.json();
    return user.id;
}

/**
 * Transform backend clan response to ClanData format for clan detail page
 */
export async function transformClanToClanData(clan: Clan, index: number = 0): Promise<ClanData> {
    // Fetch leader profile data
    let leaderName = clan.clan_leader;
    let leaderAvatar = "/scribbles/btc.png"; // Default avatar
    let leaderWallet = ""; // Initialize as empty

    try {
        const leaderResponse = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(clan.clan_leader)}`, {
            method: "GET",
            headers: {
                "accept": "application/json",
            },
        });

        if (leaderResponse.ok) {
            const leaderData = await leaderResponse.json();
            leaderName = leaderData.username || clan.clan_leader;
            leaderAvatar = leaderData.profile_image || "/scribbles/btc.png";
            leaderWallet = leaderData.wallet_address || leaderData.wallet || "";
        }
    } catch (error) {
        console.error("Failed to fetch leader profile:", error);
        // Use default values if fetch fails
    }

    return {
        name: clan.clan_name,
        slug: clan.id,
        tagline: clan.clan_description || "Elite trading clan",
        description: clan.clan_description || "Join us to trade and win together!",
        leader: leaderName,
        leaderWallet: leaderWallet,
        leaderAvatar: leaderAvatar,
        logo: clan.clan_image || "/scribbles/coins.png", // Default logo
        type: clan.clan_status === "public" ? "Public" : "Invite Only",
        members: clan.clan_members?.length || 0,
        maxMembers: clan.max_members,
        totalWins: 0, // These would need to be calculated from challenge data
        totalRekts: 0,
        winRate: 0,
        rektPoints: "0",
        verified: false,
        isOpenToJoin: clan.clan_status === "public",
        country: clan.clan_region || undefined,
    };
}

/**
 * Get clan by slug/ID and return in ClanData format
 */
export async function getClanDataBySlug(slug: string): Promise<ClanData> {
    const clan = await getClanById(slug);
    return transformClanToClanData(clan);
}

/**
 * Update an existing clan
 */
export async function updateClan(clanId: string, params: UpdateClanParams): Promise<Clan> {
    const response = await fetch(`${API_BASE_URL}/clans/${encodeURIComponent(clanId)}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to update clan: ${errorData.detail || response.statusText}`);
    }

    return response.json();
}

/**
 * Join a clan by adding user to members array
 */
export interface JoinClanResponse {
    success: boolean;
    message: string;
    members: string[];
}

export async function joinClan(clanId: string, userId: string): Promise<JoinClanResponse> {
    const response = await fetch(`${API_BASE_URL}/clans/${encodeURIComponent(clanId)}/join?user_id=${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to join clan: ${errorData.detail || response.statusText}`);
    }

    return response.json();
}

/**
 * Leave a clan by removing user from members array
 */
export async function leaveClan(clanId: string, userId: string): Promise<JoinClanResponse> {
    const response = await fetch(`${API_BASE_URL}/clans/${encodeURIComponent(clanId)}/leave?user_id=${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to leave clan: ${errorData.detail || response.statusText}`);
    }

    return response.json();
}
