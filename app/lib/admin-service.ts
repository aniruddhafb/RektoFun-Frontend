const API_BASE_URL = "/api/admin/backend";
const headers = { accept: "application/json", "Content-Type": "application/json" };

export type AdminReferralUser = { id: number; username: string | null; pubkey: string; referral_code: string | null; referred_by: string | null; referrals: string[]; earnings: number };
export type AdminRedemption = { id: number; user_id: number; username: string | null; wallet_address: string | null; amount: number; status: string; requested_at: string };
export type ResolutionRunResult = {
  status: string;
  message: string;
  remaining_active_challenges: number;
};
export type ChallengeResolutionResult = {
  challenge_id: number;
  status: string;
  resolution_method: "PRICE_FEED" | "MANUAL";
  creator_wins: boolean;
  final_price: number | null;
  settlement_attempted: boolean;
  settlement_succeeded: boolean;
  settlement_note?: string | null;
};

export async function resolveChallenge(
  challengeId: number,
  resolution: { creator_wins?: boolean; final_price?: number; operation?: "resolve_all" | "resolve_db" | "settle_onchain" },
): Promise<ChallengeResolutionResult> {
  const response = await fetch(`/api/admin/challenges/resolve/${challengeId}`, {
    method: "POST",
    headers,
    body: JSON.stringify(resolution),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to resolve challenge");
  return data;
}

export async function withdrawChallengeFunds(
  challengeId: number,
  recipientWallet: string,
  amount: number,
) {
  const response = await fetch(`/api/admin/challenges/withdraw/${challengeId}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ recipient_wallet: recipientWallet, amount }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to withdraw challenge funds");
  return data as { success: true; signature: string; explorerUrl?: string };
}

export async function resolveDueChallenges(): Promise<ResolutionRunResult> {
  const response = await fetch("/api/admin/challenges/resolve-due", {
    method: "POST",
    headers,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Failed to resolve due challenges");
  return data;
}

export async function updateUserRole(userId: number, userType: "user" | "moderator") {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, { method: "PATCH", headers, body: JSON.stringify({ user_type: userType }) });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || "Failed to update user role");
  return response.json();
}

export async function getAdminReferrals(): Promise<{ users: AdminReferralUser[]; redemptions: AdminRedemption[] }> {
  const response = await fetch(`${API_BASE_URL}/referrals`, { headers });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || "Failed to load referrals");
  return response.json();
}

export async function updateRedemptionStatus(redemptionId: number, status: "pending" | "paid" | "rejected") {
  const response = await fetch(`${API_BASE_URL}/referrals/redemptions/${redemptionId}`, { method: "PATCH", headers, body: JSON.stringify({ status }) });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || "Failed to update withdrawal status");
  return response.json();
}

export async function uploadCategoryImage(file: File): Promise<string> {
  const form = new FormData(); form.append("image", file);
  const response = await fetch(`${API_BASE_URL}/category-image`, { method: "POST", body: form });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || "Failed to upload category image");
  return (await response.json()).url;
}
