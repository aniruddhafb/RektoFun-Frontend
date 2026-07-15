import { ADMIN_WALLET } from "@/app/lib/admin";

const API_BASE_URL = process.env.NEXT_PUBLIC_BE_API_URL || "http://localhost:8000/api";
const headers = { accept: "application/json", "Content-Type": "application/json", "X-Admin-Wallet": ADMIN_WALLET };

export type AdminReferralUser = { id: number; username: string | null; pubkey: string; referral_code: string | null; referred_by: string | null; referrals: string[]; earnings: number };
export type AdminRedemption = { id: number; user_id: number; username: string | null; wallet_address: string | null; amount: number; status: string; requested_at: string };

export async function updateUserRole(userId: number, userType: "user" | "moderator") {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, { method: "PATCH", headers, body: JSON.stringify({ user_type: userType }) });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || "Failed to update user role");
  return response.json();
}

export async function getAdminReferrals(): Promise<{ users: AdminReferralUser[]; redemptions: AdminRedemption[] }> {
  const response = await fetch(`${API_BASE_URL}/admin/referrals`, { headers });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || "Failed to load referrals");
  return response.json();
}

export async function updateRedemptionStatus(redemptionId: number, status: "pending" | "paid" | "rejected") {
  const response = await fetch(`${API_BASE_URL}/admin/referrals/redemptions/${redemptionId}`, { method: "PATCH", headers, body: JSON.stringify({ status }) });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || "Failed to update withdrawal status");
  return response.json();
}

export async function uploadCategoryImage(file: File): Promise<string> {
  const form = new FormData(); form.append("image", file);
  const response = await fetch(`${API_BASE_URL}/admin/category-image`, { method: "POST", headers: { "X-Admin-Wallet": ADMIN_WALLET }, body: form });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail || "Failed to upload category image");
  return (await response.json()).url;
}
