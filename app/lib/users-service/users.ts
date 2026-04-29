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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    throw new Error(`Failed to create user: ${response.statusText}`);
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