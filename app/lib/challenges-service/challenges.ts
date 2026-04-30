export interface Challenge {
  id: string;
  status: 'open' | 'accepted' | 'closed';
  asset: string;
  creator_wallet: string;
  challenge_type: string;
  amount: string;
  expires_at: number;
  created_at: number;
  description?: string;
}

export interface ChallengesResponse {
  challenges: Challenge[];
  total: number;
}

export interface GetChallengesParams {
  status?: 'open' | 'locked' | 'resolved' | 'cancelled';
  category?: string;
  ticker?: string;
  creator_wallet?: string;
  limit?: number;
  offset?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getChallengeById(id: string): Promise<Challenge> {
  const response = await fetch(`${API_BASE_URL}/challenges/${id}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch challenge: ${response.statusText}`);
  }

  return response.json();
}

export async function getChallenges(params: GetChallengesParams = {}): Promise<ChallengesResponse> {
  const searchParams = new URLSearchParams();

  if (params.status) {
    searchParams.set('status', params.status);
  }
  if (params.category) {
    searchParams.set('category', params.category);
  }
  if (params.ticker) {
    searchParams.set('ticker', params.ticker);
  }
  if (params.creator_wallet) {
    searchParams.set('creator_wallet', params.creator_wallet);
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit));
  }
  if (params.offset !== undefined) {
    searchParams.set('offset', String(params.offset));
  }

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/challenges${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch challenges: ${response.statusText}`);
  }

  return response.json();
}

export interface CreateChallengeParams {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  event_type: string;
  ticker: string;
  created_by: string;
  resolution_source: string;
  resolution_details?: Record<string, unknown>;
  expire_time: string;
  resolve_time: string;
  result?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateChallengeResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  event_type: string;
  ticker: string;
  created_by: string;
  status: 'open' | 'accepted' | 'closed';
  resolution_source: string;
  resolution_details: Record<string, unknown>;
  expire_time: string;
  resolve_time: string;
  result: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function createChallenge(params: CreateChallengeParams): Promise<CreateChallengeResponse> {
  const response = await fetch(`${API_BASE_URL}/challenges`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to create challenge: ${response.statusText}`);
  }

  return response.json();
}