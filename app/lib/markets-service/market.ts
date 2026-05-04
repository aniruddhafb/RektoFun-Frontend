export interface Market {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  icon: string;
  parent_id: string | null;
  market_type: string;
  resolution_source: string | null;
  config: any | null;
  total_volume: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketResponse {
  markets: Market[];
  count: number;
}

export interface GetMarketsParams {
  market_type?: string;
  parent_id?: string | null;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getMarkets(params: GetMarketsParams = {}): Promise<MarketResponse> {
  const queryParams = new URLSearchParams();

  if (params.market_type) queryParams.append('market_type', params.market_type);
  if (params.parent_id === null) {
    queryParams.append('parent_id', 'null');
  } else if (params.parent_id) {
    queryParams.append('parent_id', params.parent_id);
  }
  if (params.is_active !== undefined) queryParams.append('is_active', String(params.is_active));
  if (params.limit !== undefined) queryParams.append('limit', String(params.limit));
  if (params.offset !== undefined) queryParams.append('offset', String(params.offset));

  const url = `${BASE_URL}/markets?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching markets: ${response.statusText}`);
  }

  return response.json();
}
