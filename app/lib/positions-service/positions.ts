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
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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