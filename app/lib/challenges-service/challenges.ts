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
  category?: string;
  visibility?: "PUBLIC" | "DIRECT";
  challenged_user_id?: number;
  invitation_status?: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";
}

export interface ChallengeAvailability {
  allowed: boolean;
  reason?: string | null;
  available_at?: string | null;
  conflicting_challenge_ids: number[];
}

export interface HighestBetEntry {
  id: number;
  username: string;
  profile_image: string;
  pubkey: string;
  bet: number;
  twitter_username?: string | null;
  user_type?: "user" | "moderator";
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
  category?: string;
  category_image?: string | null;
  visibility?: "PUBLIC" | "DIRECT";
  challenged_user_id?: number;
  challenged_user_details?: User | null;
  invitation_status?: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";
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

export interface ChallengeHistoryEvent {
  id: string;
  type: "redeemed" | "refunded";
  user_id: number;
  amount: number;
  occurred_at: string;
  signature?: string;
}

export function getChallengeHistoryEvents(challenge: Challenge): ChallengeHistoryEvent[] {
  const value = challenge.metadata?.activity_events;
  if (!Array.isArray(value)) return [];
  return value.filter((event): event is ChallengeHistoryEvent => (
    Boolean(event)
    && typeof event === "object"
    && (event.type === "redeemed" || event.type === "refunded")
    && typeof event.user_id === "number"
    && typeof event.amount === "number"
    && typeof event.occurred_at === "string"
  ));
}

export function getChallengeCategoryImage(challenge: Challenge): string {
  const composer = challenge.metadata?.composer;
  const metadataImage = typeof composer?.category_image === "string"
    ? composer.category_image
    : typeof composer?.image_url === "string"
      ? composer.image_url
      : "";

  return challenge.category_image
    || metadataImage
    || challenge.market?.image
    || challenge.market?.icon
    || "/scribbles/btc.png";
}

export interface GetChallengesResponse {
  challenges: Challenge[];
  total: number;
  count: number;
  has_more: boolean;
}

export interface GetChallengesParams {
  limit?: number;
  offset?: number;
  created_by?: number | string;
  search?: string;
  sort?: string;
  resolution_source?: string;
  open_first?: boolean;
  status?: string;
  expiring_soon?: boolean;
  joinable?: boolean;
  include_total?: boolean;
  visibility?: "PUBLIC" | "DIRECT";
}

export interface GetChallengesOptions {
  bypassCache?: boolean;
}

const API_BASE_URL = "/api/backend";
const challengeListRequests = new Map<string, Promise<GetChallengesResponse>>();

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
    const data = await response.json().catch(() => null);
    const detail = data?.detail;
    throw new Error(
      (typeof detail === "object" ? detail?.reason : detail)
      || `Failed to create challenge: ${response.statusText}`
    );
  }

  return response.json();
}

export async function checkChallengeAvailability(
  params: CreateChallengeParams
): Promise<ChallengeAvailability> {
  const response = await fetch(`${API_BASE_URL}/challenges/availability`, {
    method: "POST",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error("Could not check whether this challenge is available.");
  return response.json();
}

export async function getChallenges(
  params?: GetChallengesParams,
  _options?: GetChallengesOptions
): Promise<GetChallengesResponse> {
  void _options;
  const queryParams = new URLSearchParams();
  
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  
  if (params?.offset !== undefined) {
    queryParams.append('offset', params.offset.toString());
  }

  if (params?.created_by !== undefined) {
    queryParams.append('created_by', params.created_by.toString());
  }

  if (params?.search) {
    queryParams.append('search', params.search);
  }

  if (params?.resolution_source) {
    queryParams.append('resolution_source', params.resolution_source);
  }

  if (params?.open_first !== undefined) {
    queryParams.append('open_first', params.open_first.toString());
  }

  if (params?.status) {
    queryParams.append('status', params.status);
  }

  if (params?.expiring_soon !== undefined) {
    queryParams.append('expiring_soon', params.expiring_soon.toString());
  }

  if (params?.joinable !== undefined) {
    queryParams.append('joinable', params.joinable.toString());
  }

  if (params?.include_total !== undefined) {
    queryParams.append('include_total', params.include_total.toString());
  }

  if (params?.visibility) {
    queryParams.append("visibility", params.visibility);
  }
  
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/challenges${queryString ? `?${queryString}` : ''}`;
  
  const pending = challengeListRequests.get(url);
  if (pending) return pending;

  const request = fetch(url, {
    method: 'GET',
    headers: { 'accept': 'application/json' },
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Failed to fetch challenges: ${response.statusText}`);
    const data = await response.json();
    return {
      challenges: data.challenges || [],
      total: data.total || 0,
      count: data.count ?? data.total ?? 0,
      has_more: data.has_more ?? false,
    };
  }).finally(() => challengeListRequests.delete(url));

  challengeListRequests.set(url, request);
  return request;
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

export async function recordChallengeHistoryEvent(
  challenge: Challenge,
  event: ChallengeHistoryEvent,
  status?: Challenge["status"],
): Promise<void> {
  const existing = getChallengeHistoryEvents(challenge);
  const metadata = { ...(challenge.metadata || {}), activity_events: [...existing.filter((item) => item.id !== event.id), event] };
  const response = await fetch(`${API_BASE_URL}/challenges/${challenge.id}`, {
    method: "PATCH",
    headers: { accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ metadata, ...(status ? { status } : {}) }),
  });
  if (!response.ok) throw new Error(`Failed to record challenge history: ${response.statusText}`);
}

export async function updateChallengeStatus(challengeId: number, status: Challenge["status"]): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}`, {
    method: 'PATCH',
    headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(`Failed to update challenge status: ${response.statusText}`);
}
