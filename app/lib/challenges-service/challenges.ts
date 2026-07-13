import { User } from '../users-service/users';

type ChallengeCreator = number & User;

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

export interface HighestBetEntry {
  id: number;
  username: string;
  profile_image: string;
  pubkey: string;
  bet: number;
}

export interface HighestBets {
  TEAM_A?: HighestBetEntry;
  TEAM_B?: HighestBetEntry;
}

export interface TeamCountEntry {
  total_bets: number;
  total_amount: number;
}

export interface TeamCount {
  TEAM_A?: TeamCountEntry;
  TEAM_B?: TeamCountEntry;
}

export interface BetInfo {
  highest_bet?: HighestBets;
  team_count?: TeamCount;
}

export interface Challenge {
  id: number;
  views: number;
  title: string;
  statement: string;
  ticker: string;
  trading_pair: string;
  target: number;
  initial_bet: number;
  pool_size: number;
  total_pool: number;
  resolution_source: string;
  resolution_status?: string;
  metadata: Record<string, Record<string, unknown>>;
  creator: ChallengeCreator;
  creator_id?: number;
  creator_details?: User | null;
  resolution_method: 'PRICE_FEED' | string;
  participants: number;
  total_challengers: number;
  total_opponents: number;
  status: 'OPEN' | 'PENDING_RESOLUTION' | 'EXPIRED' | 'RESOLVED' | 'CANCELLED' | string;
  mode: 'PVP' | 'TEAM' | string;
  result: 'TEAM_A' | string;
  direction: 'UP' | 'DOWN' | string;
  expiry: string;
  expire_time: string;
  resolution_date: string;
  resolve_time: string;
  resolved_at: string;
  final_price: number;
  created_at: string;
  bet_info?: BetInfo | null;
  market: {
    name: string;
    icon: string;
    image: string;
    parent_market_id: string;
    parent_id: string;
  };
}

export interface GetChallengesResponse {
  challenges: Challenge[];
  total: number;
  count: number;
}

export interface GetChallengesParams {
  limit?: number;
  offset?: number;
  created_by?: number | string;
  search?: string;
  sort?: string;
}

export interface GetChallengesOptions {
  bypassCache?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BE_API_URL;

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

export async function getChallenges(
  params?: GetChallengesParams,
  _options?: GetChallengesOptions
): Promise<GetChallengesResponse> {
  if (params?.created_by !== undefined) {
    const response = await fetch(`${API_BASE_URL}/challenges/by-creator/${params.created_by}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch challenges by creator: ${response.statusText}`);
    }

    const challenges = await response.json();
    return {
      challenges,
      total: challenges.length,
      count: challenges.length,
    };
  }

  const queryParams = new URLSearchParams();
  
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  
  if (params?.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }

  if (params?.search) {
    queryParams.append('search', params.search);
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

  const data = await response.json();
  return {
    challenges: data.challenges || [],
    total: data.total || 0,
    count: data.count ?? data.total ?? 0,
  };
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

export async function incrementChallengeViews(id: number): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/challenges/${id}/view`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to record challenge view: ${response.statusText}`);
  }

  const data: { views: number } = await response.json();
  return data.views;
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
