const API_BASE_URL = process.env.NEXT_PUBLIC_BE_API_URL || "http://localhost:8000/api";

export type AppNotification = {
  id: number;
  actor_id: number;
  challenge_id: number;
  event_type: "challenge_created" | "challenge_joined";
  message: string;
  is_read: boolean;
  created_at: string;
  actor_username: string | null;
  actor_profile_image: string | null;
};

export async function getNotifications(walletAddress: string, limit = 50) {
  const params = new URLSearchParams({ wallet_address: walletAddress, limit: String(limit) });
  const response = await fetch(`${API_BASE_URL}/notifications?${params}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load notifications");
  return response.json() as Promise<{ notifications: AppNotification[]; unread_count: number }>;
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
