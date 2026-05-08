/**
 * Clan Messages Service
 * API calls for clan chat functionality
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface ClanMessage {
    id: string;
    clan_id: string;
    sender_id: string;
    sender_walletAddress: string | null;
    message: string;
    created_at: string;
    sender_username: string | null;
    sender_avatar: string | null;
}

export interface ClanMessageListResponse {
    messages: ClanMessage[];
    count: number;
}

export interface CreateClanMessageParams {
    clan_id: string;
    sender_id: string;
    message: string;
}

export async function getClanMessages(
    clanSlug: string,
    limit: number = 50,
    offset: number = 0
): Promise<ClanMessageListResponse> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const response = await fetch(
        `${API_BASE_URL}/clans/${encodeURIComponent(clanSlug)}/messages?${params}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch clan messages: ${response.statusText}`);
    }

    return response.json();
}

export async function createClanMessage(
    clanSlug: string,
    params: CreateClanMessageParams
): Promise<ClanMessage> {
    const response = await fetch(
        `${API_BASE_URL}/clans/${encodeURIComponent(clanSlug)}/messages`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(params),
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to create clan message: ${response.statusText}`);
    }

    return response.json();
}

export async function deleteClanMessage(
    clanSlug: string,
    messageId: string
): Promise<void> {
    const response = await fetch(
        `${API_BASE_URL}/clans/${encodeURIComponent(clanSlug)}/messages/${messageId}`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to delete clan message: ${response.statusText}`);
    }
}
