const API_BASE_URL = "/api/backend";

export type AppNotification = {
  id: number;
  actor_id: number;
  recipient_id: number;
  challenge_id: number | null;
  event_type: "challenge_created" | "challenge_joined" | "user_followed" | "user_followed_back" | "challenge_won" | "challenge_received" | "challenge_accepted" | "challenge_declined";
  message: string;
  is_read: boolean;
  created_at: string;
  actor_username: string | null;
  actor_profile_image: string | null;
  actor_wallet_address: string | null;
};

export async function getNotifications(walletAddress: string, limit = 50) {
  const params = new URLSearchParams({ wallet_address: walletAddress, limit: String(limit) });
  const response = await fetch(`${API_BASE_URL}/notifications?${params}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load notifications");
  return response.json() as Promise<{ notifications: AppNotification[]; unread_count: number }>;
}

export async function declineChallengeInvitation(challengeId: number, walletAddress: string) {
  const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/invitation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: walletAddress, action: "decline" }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || "Failed to decline invitation");
  }
}

export async function markNotificationRead(walletAddress: string, id?: number) {
  const path = id === undefined ? "read-all" : `${id}/read`;
  const response = await fetch(`${API_BASE_URL}/notifications/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
  if (!response.ok) throw new Error("Failed to mark notification as read");
}
