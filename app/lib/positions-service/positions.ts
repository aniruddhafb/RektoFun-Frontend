export interface CreatePositionParams {
  challenge_id: number;
  bet: number;
  side: 'TEAM_A' | 'TEAM_B' | string;
  creator: number;
}

export interface Position {
  id: number;
  challenge_id: number;
  bet: number;
  side: 'TEAM_A' | 'TEAM_B' | string;
  creator: number;
  created_at: string;
}

export interface GetPositionsResponse {
  positions: Position[];
  total: number;
}

export interface GetPositionsParams {
  limit?: number;
  offset?: number;
  creator?: number;
}

const API_BASE_URL = "/api/backend";

export async function createPosition(params: CreatePositionParams): Promise<Position> {
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

export async function getPositions(params?: GetPositionsParams): Promise<GetPositionsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  
  if (params?.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }

  if (params?.creator !== undefined) {
    queryParams.append('creator', params.creator.toString());
  }
  
  const queryString = queryParams.toString();
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

export interface ParticipantUser {
  id: number;
  username?: string | null;
  pubkey?: string | null;
  wallet_address?: string | null;
  profile_image?: string | null;
  twitter_username?: string | null;
  user_type?: 'user' | 'moderator';
}

export interface ChallengeParticipantPosition extends Position {
  user?: ParticipantUser | null;
}

export async function getJoinedChallengeIds(creator: number): Promise<number[]> {
  const response = await fetch(
    `${API_BASE_URL}/positions/joined-challenge-ids?creator=${encodeURIComponent(creator)}`,
    { method: 'GET', headers: { accept: 'application/json' } },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch joined challenges: ${response.statusText}`);
  }

  return response.json();
}

export async function getPositionById(id: number): Promise<Position> {
  const response = await fetch(`${API_BASE_URL}/positions/${id}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch position: ${response.statusText}`);
  }

  return response.json();
}

const participantRequests = new Map<number, Promise<ChallengeParticipantPosition[]>>();

export async function getPositionsByChallenge(challengeId: number): Promise<ChallengeParticipantPosition[]> {
  const pending = participantRequests.get(challengeId);
  if (pending) return pending;

  const request = fetch(`${API_BASE_URL}/positions/by-challenge/${encodeURIComponent(challengeId)}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch challenge participants: ${response.statusText}`);
    }
    return response.json() as Promise<ChallengeParticipantPosition[]>;
  });
  participantRequests.set(challengeId, request);
  // Deduplicate simultaneous modal/card requests without keeping betting data stale.
  void request.then(
    () => participantRequests.delete(challengeId),
    () => participantRequests.delete(challengeId),
  );
  return request;
}
