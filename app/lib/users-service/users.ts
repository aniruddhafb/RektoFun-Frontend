export interface CreateUserParams {
  username?: string;
  email?: string;
  pubkey?: string;
  wallet_address?: string;
  profile_image?: string;
  bio?: string;
  description?: string;
  referrer_code?: string;
}

export interface UpdateUserParams {
  username?: string;
  email?: string;
  pubkey?: string;
  wallet_address?: string;
  profile_image?: string;
  bio?: string;
  description?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  pubkey: string;
  wallet_address: string;
  profile_image: string;
  bio: string;
  description: string;
  created_at: string;
  followers?: Array<number | string>;
  following?: Array<number | string>;
  referrals: string[];
  referral_code: string;
  referred_by: string | null;
  earnings?: number;
}

export type LeaderboardUser = Omit<User, "id" | "followers" | "following"> & {
  id: string;
  followers: string[];
  following: string[];
};

export interface GetUsersResponse {
  users: User[];
  total: number;
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  count: number;
}

export interface GetUsersParams {
  limit?: number;
  offset?: number;
}

export interface UsernameCheckResponse {
  username: string;
  exists: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BE_API_URL || "http://localhost:8000/api";

type BackendUser = {
  id: number;
  username?: string | null;
  email?: string | null;
  pubkey?: string | null;
  wallet_address?: string | null;
  profile_image?: string | null;
  bio?: string | null;
  description?: string | null;
  created_at: string;
  followers?: Array<number | string> | null;
  following?: Array<number | string> | null;
  referrals?: string[] | null;
  referral_code?: string | null;
  referred_by?: string | null;
  earnings?: number | null;
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
    bio,
    description: bio,
    created_at: user.created_at,
    followers: user.followers || [],
    following: user.following || [],
    referrals: user.referrals || [],
    referral_code: user.referral_code || "",
    referred_by: user.referred_by || null,
    earnings: user.earnings || 0,
  };
}

function toBackendUserPayload(params: CreateUserParams | UpdateUserParams) {
  return {
    username: params.username,
    email: params.email,
    pubkey: params.pubkey || params.wallet_address,
    profile_image: params.profile_image,
    bio: params.bio ?? params.description,
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

  return normalizeUser(await response.json());
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
  const response = await fetch(`${API_BASE_URL}/users/by-pubkey/${encodeURIComponent(pubkey)}`, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw await parseError(response, `User with pubkey ${pubkey} not found`);
  }

  return normalizeUser(await response.json());
}

export const getUserByWallet = getUserByPubkey;

export async function getLeaderboard(
  limit = 100,
  offset = 0,
  search?: string,
): Promise<LeaderboardResponse> {
  const queryParams = new URLSearchParams();

  queryParams.append("limit", limit.toString());
  queryParams.append("offset", offset.toString());

  const response = await fetch(`${API_BASE_URL}/users/leaderboard?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw await parseError(response, `Failed to fetch leaderboard: ${response.statusText}`);
  }

  const data = await response.json();
  const leaderboardResponse: { users: User[]; total: number } = {
    users: ((data.users || []) as BackendUser[]).map(normalizeUser),
    total: data.total || 0,
  };
  const normalizedSearch = search?.trim().toLowerCase();
  const users = normalizedSearch
    ? leaderboardResponse.users.filter((user) =>
        user.username.toLowerCase().includes(normalizedSearch) ||
        user.wallet_address.toLowerCase().includes(normalizedSearch),
      )
    : leaderboardResponse.users;

  return {
    users: users.map((user) => ({
      ...user,
      id: String(user.id),
      followers: (user.followers || []).map(String),
      following: (user.following || []).map(String),
    })),
    count: normalizedSearch ? users.length : leaderboardResponse.total,
  };
}

export async function followUser(targetWalletAddress: string, _viewerWalletAddress: string): Promise<User> {
  void _viewerWalletAddress;
  return getUserByWallet(targetWalletAddress);
}

export async function unfollowUser(targetWalletAddress: string, _viewerWalletAddress: string): Promise<User> {
  void _viewerWalletAddress;
  return getUserByWallet(targetWalletAddress);
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
