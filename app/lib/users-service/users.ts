export interface CreateUserParams {
  username?: string;
  email?: string;
  pubkey?: string;
  wallet_address?: string;
  profile_image?: string;
  twitter_profile_image?: string | null;
  bio?: string;
  description?: string;
  twitter_username?: string | null;
  referrer_code?: string;
}

export interface UpdateUserParams {
  username?: string;
  email?: string;
  pubkey?: string;
  wallet_address?: string;
  profile_image?: string;
  twitter_profile_image?: string | null;
  bio?: string;
  description?: string;
  twitter_username?: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  pubkey: string;
  wallet_address: string;
  profile_image: string;
  twitter_profile_image: string | null;
  bio: string;
  description: string;
  twitter_username: string | null;
  created_at: string;
  followers?: Array<number | string>;
  following?: Array<number | string>;
  referrals: string[];
  referral_code: string;
  referred_by: string | null;
  earnings?: number;
  user_type: "user" | "moderator";
}

export type LeaderboardPeriod = "1d" | "7d" | "30d" | "all";
export type LeaderboardSort = "rank" | "created_challenges" | "win_rate" | "won" | "lost" | "pnl" | "volume";
export type LeaderboardVerification = "all" | "x" | "kol";

export type LeaderboardUser = Omit<User, "id" | "followers" | "following"> & {
  id: string;
  followers: string[];
  following: string[];
  rank: number;
  created_challenges: number;
  won: number;
  lost: number;
  win_rate: number;
  pnl: number;
  volume: number;
};

export type UserProfile = Pick<User,
  "id" | "username" | "pubkey" | "wallet_address" | "profile_image" |
  "bio" | "description" | "twitter_username" | "created_at" | "followers" |
  "following" | "user_type"
> & {
  metrics: Pick<LeaderboardUser, "won" | "lost" | "win_rate" | "pnl" | "volume">;
};

export interface GetUsersResponse {
  users: User[];
  total: number;
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  count: number;
  period: LeaderboardPeriod;
  summary: {
    total_users: number;
    total_challenges: number;
    total_volume: number;
    total_pnl: number;
  };
}

export interface GetUsersParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface UsernameCheckResponse {
  username: string;
  exists: boolean;
}

const API_BASE_URL = "/api/backend";
const USER_CACHE_TTL_MS = 30_000;
const LEADERBOARD_CACHE_TTL_MS = 15_000;
const userRequests = new Map<string, Promise<User>>();
const userCache = new Map<string, { user: User; expiresAt: number }>();
const leaderboardRequests = new Map<string, Promise<LeaderboardResponse>>();
const leaderboardCache = new Map<string, { response: LeaderboardResponse; expiresAt: number }>();

type BackendUser = {
  id: number;
  username?: string | null;
  email?: string | null;
  pubkey?: string | null;
  wallet_address?: string | null;
  profile_image?: string | null;
  twitter_profile_image?: string | null;
  bio?: string | null;
  description?: string | null;
  twitter_username?: string | null;
  created_at: string;
  followers?: Array<number | string> | null;
  following?: Array<number | string> | null;
  referrals?: string[] | null;
  referral_code?: string | null;
  referred_by?: string | null;
  earnings?: number | null;
  user_type?: "user" | "moderator" | null;
};

function normalizeUser(user: BackendUser): User {
  const walletAddress = user.wallet_address || user.pubkey || "";
  const bio = user.description || user.bio || "";

  return {
    id: user.id,
    username: user.username || "",
    email: user.email || "",
    pubkey: user.pubkey || walletAddress,
    wallet_address: walletAddress,
    profile_image: user.profile_image || "",
    twitter_profile_image: user.twitter_profile_image || null,
    bio,
    description: bio,
    twitter_username: user.twitter_username || null,
    created_at: user.created_at,
    followers: user.followers || [],
    following: user.following || [],
    referrals: user.referrals || [],
    referral_code: user.referral_code || "",
    referred_by: user.referred_by || null,
    earnings: user.earnings || 0,
    user_type: user.user_type || "user",
  };
}

function toBackendUserPayload(params: CreateUserParams | UpdateUserParams) {
  return {
    username: params.username,
    email: params.email,
    pubkey: params.pubkey || params.wallet_address,
    profile_image: params.profile_image,
    twitter_profile_image: params.twitter_profile_image,
    bio: params.bio ?? params.description,
    twitter_username: params.twitter_username,
    referrer_code: "referrer_code" in params ? params.referrer_code : undefined,
  };
}

async function parseError(response: Response, fallback: string): Promise<Error> {
  try {
    const data = await response.json();
    return new Error(data.detail || fallback);
  } catch {
    return new Error(fallback);
  }
}

export async function createUser(params: CreateUserParams): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toBackendUserPayload(params)),
  });

  if (!response.ok) {
    throw await parseError(response, `Failed to create user: ${response.statusText}`);
  }

  return normalizeUser(await response.json());
}

export async function getUsers(params?: GetUsersParams): Promise<GetUsersResponse> {
  const queryParams = new URLSearchParams();

  if (params?.limit !== undefined) {
    queryParams.append("limit", params.limit.toString());
  }

  if (params?.offset !== undefined) {
    queryParams.append("offset", params.offset.toString());
  }

  if (params?.search) {
    queryParams.append("search", params.search);
  }

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/users${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw await parseError(response, `Failed to fetch users: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    users: (data.users || []).map(normalizeUser),
    total: data.total || 0,
  };
}

export async function getUserById(id: number): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw await parseError(response, `Failed to fetch user: ${response.statusText}`);
  }

  return normalizeUser(await response.json());
}

export async function updateUser(id: number, params: UpdateUserParams): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "PATCH",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toBackendUserPayload(params)),
  });

  if (!response.ok) {
    throw await parseError(response, `Failed to update user: ${response.statusText}`);
  }

  const updated = normalizeUser(await response.json());
  if (updated.pubkey) {
    userCache.set(updated.pubkey.trim().toLowerCase(), {
      user: updated,
      expiresAt: Date.now() + USER_CACHE_TTL_MS,
    });
  }
  leaderboardCache.clear();
  return updated;
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/users/check-username/${encodeURIComponent(username)}`, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw await parseError(response, `Failed to check username: ${response.statusText}`);
  }

  const data: UsernameCheckResponse = await response.json();
  return data.exists;
}

export async function getUserByPubkey(pubkey: string): Promise<User> {
  const key = pubkey.trim().toLowerCase();
  const cached = userCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.user;

  const pending = userRequests.get(key);
  if (pending) return pending;

  const request = fetch(`${API_BASE_URL}/users/by-pubkey/${encodeURIComponent(pubkey)}`, {
    method: "GET",
    headers: { accept: "application/json" },
  }).then(async (response) => {
    if (!response.ok) {
      throw await parseError(response, `User with pubkey ${pubkey} not found`);
    }
    const user = normalizeUser(await response.json());
    userCache.set(key, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
    return user;
  }).finally(() => userRequests.delete(key));

  userRequests.set(key, request);
  return request;
}

export const getUserByWallet = getUserByPubkey;

export async function getUserProfile(pubkey: string): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/users/profile/${encodeURIComponent(pubkey)}`, {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw await parseError(response, `User with pubkey ${pubkey} not found`);
  const raw = await response.json();
  const user = normalizeUser(raw);
  return {
    id: user.id,
    username: user.username,
    pubkey: user.pubkey,
    wallet_address: user.wallet_address,
    profile_image: user.profile_image,
    bio: user.bio,
    description: user.description,
    twitter_username: user.twitter_username,
    created_at: user.created_at,
    followers: user.followers,
    following: user.following,
    user_type: user.user_type,
    metrics: raw.metrics || { won: 0, lost: 0, win_rate: 0, pnl: 0, volume: 0 },
  };
}

export type ReferralHistory = {
  commissions: Array<{ amount: number; created_at: string }>;
  redemptions: Array<{ amount: number; status: "pending" | "paid" | "rejected"; requested_at: string }>;
};

export async function getReferralHistory(walletAddress: string): Promise<ReferralHistory> {
  const response = await fetch(`${API_BASE_URL}/users/referral-history/${encodeURIComponent(walletAddress)}`);
  if (!response.ok) throw await parseError(response, "Failed to load referral history");
  return response.json();
}

export async function requestReferralRedemption(walletAddress: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/referral-redemptions`, {
    method: "POST",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
  if (!response.ok) throw await parseError(response, "Failed to create redemption request");
  return normalizeUser(await response.json());
}

export async function getLeaderboard(
  limit = 100,
  offset = 0,
  search?: string,
  period: LeaderboardPeriod = "all",
  sort: LeaderboardSort = "pnl",
  order: "asc" | "desc" = "desc",
  verification: LeaderboardVerification = "all",
): Promise<LeaderboardResponse> {
  const queryParams = new URLSearchParams();

  queryParams.append("limit", limit.toString());
  queryParams.append("offset", offset.toString());
  queryParams.append("period", period);
  queryParams.append("sort", sort);
  queryParams.append("order", order);
  queryParams.append("verification", verification);
  if (search?.trim()) queryParams.append("search", search.trim());

  const url = `${API_BASE_URL}/users/leaderboard?${queryParams.toString()}`;
  const cached = leaderboardCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.response;

  const pending = leaderboardRequests.get(url);
  if (pending) return pending;

  const request = fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
  }).then(async (response) => {
    if (!response.ok) {
      throw await parseError(response, `Failed to fetch leaderboard: ${response.statusText}`);
    }

    const data = await response.json();
    const users = (data.users || []).map((rawUser: BackendUser & {
      rank: number; created_challenges: number; won: number; lost: number; win_rate: number; pnl: number; volume: number;
    }) => ({ ...normalizeUser(rawUser), ...rawUser }));

    const result: LeaderboardResponse = {
      users: users.map((user: User & { rank: number; created_challenges: number; won: number; lost: number; win_rate: number; pnl: number; volume: number }) => ({
        ...user,
        id: String(user.id),
        followers: (user.followers || []).map(String),
        following: (user.following || []).map(String),
      })),
      count: data.total || 0,
      period: data.period || period,
      summary: data.summary || { total_users: 0, total_challenges: 0, total_volume: 0, total_pnl: 0 },
    };
    leaderboardCache.set(url, { response: result, expiresAt: Date.now() + LEADERBOARD_CACHE_TTL_MS });
    return result;
  }).finally(() => leaderboardRequests.delete(url));

  leaderboardRequests.set(url, request);
  return request;
}

async function setFollowing(targetWalletAddress: string, viewerWalletAddress: string, follow: boolean): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(targetWalletAddress)}/follow`, {
    method: follow ? "POST" : "DELETE",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ follower_wallet: viewerWalletAddress }),
  });
  if (!response.ok) throw await parseError(response, `Failed to ${follow ? "follow" : "unfollow"} user`);
  return normalizeUser(await response.json());
}

export async function followUser(targetWalletAddress: string, viewerWalletAddress: string): Promise<User> {
  return setFollowing(targetWalletAddress, viewerWalletAddress, true);
}

export async function unfollowUser(targetWalletAddress: string, viewerWalletAddress: string): Promise<User> {
  return setFollowing(targetWalletAddress, viewerWalletAddress, false);
}

export async function acceptReferral(walletAddress: string, referralCode: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/accept-referral`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      new_user_wallet: walletAddress,
      referrer_code: referralCode,
    }),
  });

  if (!response.ok) {
    throw await parseError(response, `Failed to accept referral: ${response.statusText}`);
  }

  return normalizeUser(await response.json());
}
