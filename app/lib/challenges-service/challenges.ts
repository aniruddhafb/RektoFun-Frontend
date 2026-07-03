export interface CreateChallengeParams {
  statement: string;
  ticker: string;
  trading_pair: string;
  target: number;
  initial_bet: number;
  pool_size: number;
  resolution_source: string;
  metadata: Record<string, Record<string, unknown>>;
  creator: number;
  resolution_method: 'PRICE_FEED' | string;
  participants: number;
  status: 'OPEN' | string;
  mode: 'PVP' | string;
  result: 'TEAM_A' | string;
  direction: 'UP' | string;
  expiry: string;
  resolution_date: string;
  final_price: number;
}

export interface Challenge {
  id: number;
  statement: string;
  ticker: string;
  trading_pair: string;
  target: number;
  initial_bet: number;
  pool_size: number;
  resolution_source: string;
  metadata: Record<string, Record<string, unknown>>;
  creator: number;
  resolution_method: 'PRICE_FEED' | string;
  participants: number;
  status: 'OPEN' | string;
  mode: 'PVP' | string;
  result: 'TEAM_A' | string;
  direction: 'UP' | string;
  expiry: string;
  resolution_date: string;
  final_price: number;
  created_at: string;
}

export interface GetChallengesResponse {
  challenges: Challenge[];
  total: number;
}

export interface GetChallengesParams {
  limit?: number;
  offset?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createChallenge(params: CreateChallengeParams): Promise<Challenge> {
  const response = await fetch(`${API_BASE_URL}/challenges`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  console.log("response", response);

  if (!response.ok) {
    throw new Error(`Failed to create challenge: ${response.statusText}`);
  }

  return response.json();
}

export async function getChallenges(params?: GetChallengesParams): Promise<GetChallengesResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  
  if (params?.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }
  
  const queryString = queryParams.toString();
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

export async function getChallengeById(id: number): Promise<Challenge> {
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

export async function updateChallengeMetadata(
  challengeId: number,
  metadata: Record<string, unknown>
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}`, {
    method: 'PATCH',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ metadata }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update challenge metadata: ${response.statusText}`);
  }
}