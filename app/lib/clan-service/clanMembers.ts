/**
 * Clan Members Service
 * Fetch clan members with user details
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface ClanMember {
    id: string;
    wallet_address: string;
    name: string;
    avatar: string;
    role: "Leader" | "Member";
    rektPoints: string;
}

export interface ClanMembersResponse {
    members: ClanMember[];
    count: number;
}

interface BackendClanMember {
    id: string;
    wallet_address: string | null;
    username: string | null;
    profile_image: string | null;
    earnings: number | null;
    role: "Leader" | "Member";
}

interface BackendClanMembersResponse {
    members: BackendClanMember[];
    count: number;
}

/**
 * Fetch clan members by clan ID
 * Uses the dedicated /clans/{clan_id}/members endpoint
 */
export async function getClanMembers(clanId: string): Promise<ClanMembersResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/clans/${encodeURIComponent(clanId)}/members`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch clan members: ${response.statusText}`);
        }

        const data: BackendClanMembersResponse = await response.json();

        // Transform backend response to frontend format
        const members: ClanMember[] = data.members.map((member) => ({
            id: member.id,
            wallet_address: member.wallet_address || "",
            name: member.username || "Unknown",
            avatar: member.profile_image || "/profiles/1.svg",
            role: member.role,
            rektPoints: formatRektPoints(member.earnings || 0),
        }));

        return {
            members,
            count: members.length,
        };
    } catch (error) {
        console.error("Error fetching clan members:", error);
        throw error;
    }
}

/**
 * Format earnings into REKTO points display format
 */
function formatRektPoints(earnings: number): string {
    if (earnings >= 1000000) {
        return `${(earnings / 1000000).toFixed(1)}M`;
    }
    if (earnings >= 1000) {
        return `${(earnings / 1000).toFixed(1)}K`;
    }
    return earnings.toString();
}
