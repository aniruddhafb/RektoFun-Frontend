export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  event_type: string;
  ticker: string;
  created_by: string;
  mode: string;
  initial_bet: number;
  min_accept_bet: number;
  max_accept_bet: number;
  min_bet: number;
  bet_unit: number;
  total_pool: number;
  status: 'open' | 'locked' | 'resolved' | 'cancelled';
  resolution_status: string;
  resolution_mode: string;
  resolution_source: string;
  resolution_config: Record<string, unknown>;
  expire_time: string;
  resolve_time: string;
  resolved_at: string | null;
  result: Record<string, unknown>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ChallengeListItem {
  id: string;
  title: string;
  mode: string;
  initial_bet: number;
  min_accept_bet?: number;
  max_accept_bet?: number;
  min_bet?: number;
  total_pool: number;
  status: 'open' | 'locked' | 'resolved' | 'cancelled';
  expire_time: string;
  resolve_time: string;
  resolved_at: string | null;
  result: Record<string, unknown>;
  created_at: string;
  total_challengers: number;
  total_opponents: number;
  market: {
    name: string;
    image: string;
    icon: string;
    parent_id: string | null;
  };
  creator: {
    username: string;
    profile_image: string;
    wallet_address: string;
  };
  opponent_info: {
    username: string;
    profile_image: string;
    wallet_address: string;
  };
}

export interface ChallengesResponse {
  challenges: ChallengeListItem[];
  count: number;
}

export interface GetChallengesParams {
  status?: 'open' | 'locked' | 'resolved' | 'cancelled';
  category?: string;
  ticker?: string;
  created_by?: string;
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
  if (params.created_by) {
    searchParams.set('created_by', params.created_by);
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
  event_type: string;
  ticker: string;
  created_by: string;
  mode: string;
  initial_bet: number;
  min_accept_bet?: number;
  max_accept_bet?: number;
  min_bet?: number;
  bet_unit: number;
  expire_time: string;
  resolve_time: string;
  resolution_source: string;
  resolution_config?: Record<string, unknown>;
  result?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateChallengeResponse {
  status: string;
}

export interface CreateChallengeSideParams {
  challenge_id: string;
  side_key: string;
  display_name: string;
  total_amount: number;
}

export interface CreateChallengeSideResponse {
  status: string;
}

export interface ChallengeSide {
  id: string;
  challenge_id: string;
  side_key: string;
  display_name: string;
  total_amount: number;
  created_at: string;
}

export interface ChallengeSidesResponse {
  sides: ChallengeSide[];
  count: number;
}

export interface GetChallengeSidesParams {
  limit?: number;
  offset?: number;
}

export interface JoinChallengeParams {
  challenge_id: string;
  user_id: string;
  side: string;
  bet_amount: number;
}

export interface JoinChallengeResponse {
  status: string;
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

export async function joinChallenge(params: JoinChallengeParams): Promise<JoinChallengeResponse> {
  const response = await fetch(`${API_BASE_URL}/challenges/join`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to join challenge: ${response.statusText}`);
  }

  return response.json();
}

export async function getChallengeSides(params: GetChallengeSidesParams = {}): Promise<ChallengeSidesResponse> {
  const searchParams = new URLSearchParams();

  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit));
  }
  if (params.offset !== undefined) {
    searchParams.set('offset', String(params.offset));
  }

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/challenge-sides${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch challenge sides: ${response.statusText}`);
  }

  return response.json();
}

export interface CreatePositionParams {
  challenge_id: string;
  side_id: string;
  user_id: string;
  amount: number;
}

export interface CreatePositionResponse {
  status: string;
}

export async function createPosition(params: CreatePositionParams): Promise<CreatePositionResponse> {
  const response = await fetch(`${API_BASE_URL}/positions`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to create position: ${response.statusText}`);
  }

  return response.json();
}

export async function createChallengeSide(params: CreateChallengeSideParams): Promise<CreateChallengeSideResponse> {
  const response = await fetch(`${API_BASE_URL}/challenge-sides`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to create challenge side: ${response.statusText}`);
  }

  return response.json();
}

export interface Position {
  id: string;
  challenge_id: string;
  side_id: string;
  user_id: string;
  amount: number;
  created_at: string;
}

export interface PositionsResponse {
  positions: Position[];
  count: number;
}

export interface GetPositionsParams {
  challenge_id?: string;
  side_id?: string;
  user_id?: string;
  limit?: number;
  offset?: number;
}

export async function getPositions(params: GetPositionsParams = {}): Promise<PositionsResponse> {
  const searchParams = new URLSearchParams();

  if (params.challenge_id) {
    searchParams.set('challenge_id', params.challenge_id);
  }
  if (params.side_id) {
    searchParams.set('side_id', params.side_id);
  }
  if (params.user_id) {
    searchParams.set('user_id', params.user_id);
  }
  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit));
  }
  if (params.offset !== undefined) {
    searchParams.set('offset', String(params.offset));
  }

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/positions${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch positions: ${response.statusText}`);
  }

  return response.json();
}