import type { Challenge } from "@/app/lib/challenges-service/challenges";

export type SearchModalUser = {
  id: number | string;
  username?: string | null;
  pubkey?: string | null;
  profile_image?: string | null;
  twitter_profile_image?: string | null;
  bio?: string | null;
  twitter_username?: string | null;
  user_type?: "user" | "moderator" | null;
  follower_count: number;
  won: number;
  pnl: number;
};

export type SearchModalResponse = {
  challenges: Challenge[];
  users: SearchModalUser[];
};

const API_BASE_URL = "/api/backend";
const requests = new Map<string, Promise<SearchModalResponse>>();
const cache = new Map<string, { data: SearchModalResponse; expiresAt: number }>();
const CACHE_TTL_MS = 30_000;

export async function getSearchModalResults(query = ""): Promise<SearchModalResponse> {
  const normalized = query.trim();
  const cached = cache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const existing = requests.get(normalized);
  if (existing) return existing;

  const params = new URLSearchParams();
  if (normalized) params.set("q", normalized);
  const request = fetch(`${API_BASE_URL}/search${params.size ? `?${params}` : ""}`, {
    headers: { accept: "application/json" },
  }).then(async (response) => {
    if (!response.ok) throw new Error("Could not load search results.");
    const data = await response.json() as SearchModalResponse;
    cache.set(normalized, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  }).finally(() => requests.delete(normalized));

  requests.set(normalized, request);
  return request;
}
