export interface User {
  id: string | number;
  username: string;
  email: string;
  pubkey: string;
  profile_image: string;
  bio: string;
  created_at: string;
}

export interface GetAllUsersResponse {
  users: User[];
  total: number;
}

export interface CreateUserParams {
  username: string;
  email: string;
  pubkey: string;
  profile_image?: string;
  bio?: string;
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

export async function getUserById(id: string | number): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(`Failed to fetch user: ${response.statusText}`, response.status);
  }

  return response.json();
}


export async function updateUser(id: string | number, params: Partial<CreateUserParams>): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PATCH',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new ApiError(`Failed to update user: ${response.statusText}`, response.status);
  }

  return response.json();
}




export async function getAllUsers(limit: number = 100, offset: number = 0): Promise<GetAllUsersResponse> {
  const response = await fetch(`${API_BASE_URL}/users?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(`Failed to fetch users: ${response.statusText}`, response.status);
  }

  return response.json();
}

export async function getUserByPubkey(pubkey: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/by-pubkey/${pubkey}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(`Failed to fetch user by pubkey: ${response.statusText}`, response.status);
  }

  return response.json();
}


