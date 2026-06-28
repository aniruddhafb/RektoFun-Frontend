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
  parent_name?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRIES = 2;

interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  retries?: number;
  cacheKey?: string;
  cacheTtlMs?: number;
  bypassCache?: boolean;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const requestCache = new Map<string, CacheEntry<unknown>>();

function shouldRetryStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry<T>(url: string, init: RequestInit, options: RequestOptions = {}): Promise<T> {
  const retries = options.retries ?? DEFAULT_RETRIES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let abortListener: (() => void) | undefined;

    if (options.signal) {
      abortListener = () => controller.abort();
      options.signal.addEventListener('abort', abortListener, { once: true });
    }

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      if (!response.ok) {
        if (attempt < retries && shouldRetryStatus(response.status)) {
          await wait(250 * (attempt + 1));
          continue;
        }
        throw new Error(`Error fetching markets: ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      const isAborted = error instanceof DOMException && error.name === 'AbortError';
      const parentAborted = !!options.signal?.aborted;

      if (parentAborted) {
        throw error;
      }

      if (attempt < retries && isAborted) {
        await wait(250 * (attempt + 1));
        continue;
      }

      if (attempt < retries) {
        await wait(250 * (attempt + 1));
        continue;
      }

      throw error;
    } finally {
      clearTimeout(timeout);
      if (options.signal && abortListener) {
        options.signal.removeEventListener('abort', abortListener);
      }
    }
  }

  throw new Error('Request failed after retries');
}

export async function getMarkets(
  params: GetMarketsParams = {},
  requestOptions: RequestOptions = {},
): Promise<MarketResponse> {
  const queryParams = new URLSearchParams();

  if (params.market_type) queryParams.append('market_type', params.market_type);
  if (params.parent_id === null) {
    queryParams.append('parent_id', 'null');
  } else if (params.parent_id) {
    queryParams.append('parent_id', params.parent_id);
  }
  if (params.parent_name) queryParams.append('parent_name', params.parent_name);
  if (params.is_active !== undefined) queryParams.append('is_active', String(params.is_active));
  if (params.limit !== undefined) queryParams.append('limit', String(params.limit));
  if (params.offset !== undefined) queryParams.append('offset', String(params.offset));

  const url = `${BASE_URL}/markets?${queryParams.toString()}`;

  const cacheKey = requestOptions.cacheKey ?? url;
  const cacheTtlMs = requestOptions.cacheTtlMs ?? 20000;
  const now = Date.now();

  if (!requestOptions.bypassCache) {
    const cached = requestCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.data as MarketResponse;
    }
  }

  const response = await fetchJsonWithRetry<MarketResponse>(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  }, requestOptions);

  requestCache.set(cacheKey, {
    data: response,
    expiresAt: now + cacheTtlMs,
  });

  return response;
}

export interface CreateMarketParams {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  icon?: string;
  parent_id?: string | null;
  market_type?: string;
  resolution_source?: string | null;
}

export async function createMarket(params: CreateMarketParams): Promise<Market> {
  const url = `${BASE_URL}/markets`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Error creating market: ${response.statusText}`);
  }

  return response.json();
}

