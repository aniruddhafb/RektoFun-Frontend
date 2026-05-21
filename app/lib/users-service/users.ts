export interface User {
  id: string;
  wallet_address: string;
  username: string;
  description: string;
  profile_image: string;
  login_type: string;
  referral_code: string;
  referred_by: string;
  referrals: string[];
  followers: string[];
  following: string[];
  created_at: string;
  updated_at: string;
  earnings: number;
}

export interface CreateUserParams {
  wallet_address: string;
  username: string;
  description?: string;
  profile_image?: string;
  login_type?: string;
  referral_code?: string;
  referred_by?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function createUser(params: CreateUserParams): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new ApiError(`Failed to create user: ${response.statusText}`, response.status);
  }

  return response.json();
}

export async function ensureUserByWallet(
  walletAddress: string,
  params?: Partial<CreateUserParams>
): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/wallet/${encodeURIComponent(walletAddress)}/ensure`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params ?? {}),
  });

  if (!response.ok) {
    throw new ApiError(`Failed to ensure user: ${response.statusText}`, response.status);
  }

  return response.json();
}

export async function getUserById(id: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  return response.json();
}

export async function getUserByWallet(wallet_address: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/wallet/${encodeURIComponent(wallet_address)}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  return response.json();
}

export async function updateUser(id: string, params: Partial<CreateUserParams>): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PATCH',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to update user: ${response.statusText}`);
  }

  return response.json();
}

export async function acceptReferral(newUserWallet: string, referrerCode: string): Promise<{ newUser: User; referrer: User }> {
  const response = await fetch(`${API_BASE_URL}/users/accept-referral`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ new_user_wallet: newUserWallet, referrer_code: referrerCode }),
  });

  if (!response.ok) {
    throw new Error(`Failed to accept referral: ${response.statusText}`);
  }

  return response.json();
}

export interface LeaderboardUser {
  id: string;
  wallet_address: string;
  username: string | null;
  profile_image: string | null;
  referrals: string[];
  followers?: string[];
  following?: string[];
  created_at: string | null;
  earnings: number | null;
}

export interface LeaderboardResponse {
  users: LeaderboardUser[];
  count: number;
}

export async function getLeaderboard(
  limit: number = 10,
  offset: number = 0,
  search?: string
): Promise<LeaderboardResponse> {
  let url = `${API_BASE_URL}/users/leaderboard?limit=${limit}&offset=${offset}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
  }

  return response.json();
}

export async function followUser(targetWalletAddress: string, followerWalletAddress: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/wallet/${encodeURIComponent(targetWalletAddress)}/follow`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ follower_wallet_address: followerWalletAddress }),
  });

  if (!response.ok) {
    throw new Error(`Failed to follow user: ${response.statusText}`);
  }

  return response.json();
}

export async function unfollowUser(targetWalletAddress: string, followerWalletAddress: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/wallet/${encodeURIComponent(targetWalletAddress)}/unfollow`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ follower_wallet_address: followerWalletAddress }),
  });

  if (!response.ok) {
    throw new Error(`Failed to unfollow user: ${response.statusText}`);
  }

  return response.json();
}

export async function getFollowStatus(targetWalletAddress: string, followerWalletAddress: string): Promise<{ is_following: boolean }> {
  const response = await fetch(
    `${API_BASE_URL}/users/wallet/${encodeURIComponent(targetWalletAddress)}/follow-status?follower_wallet_address=${encodeURIComponent(followerWalletAddress)}`,
    {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch follow status: ${response.statusText}`);
  }

  return response.json();
}

