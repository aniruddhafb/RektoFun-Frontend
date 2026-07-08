export interface CreateUserParams {
  username?: string;
  email?: string;
  pubkey: string;
  profile_image?: string;
  bio?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  pubkey: string;
  profile_image: string;
  bio: string;
  created_at: string;
}

export interface GetUsersResponse {
  users: User[];
  total: number;
}

export interface GetUsersParams {
  limit?: number;
  offset?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BE_API_URL || 'http://localhost:8000/api';

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

export async function getUsers(params?: GetUsersParams): Promise<GetUsersResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  
  if (params?.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }
  
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/users${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }

  return response.json();
}

export async function getUserById(id: number): Promise<User> {
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

export interface UsernameCheckResponse {
  username: string;
  exists: boolean;
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/users/check-username/${encodeURIComponent(username)}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check username: ${response.statusText}`);
  }

  const data: UsernameCheckResponse = await response.json();
  return data.exists;
}

export async function getUserByPubkey(pubkey: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/by-pubkey/${pubkey}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `User with pubkey ${pubkey} not found`);
    }
    throw new Error(`Failed to fetch user by pubkey: ${response.statusText}`);
  }

  return response.json();
}