const TXLINE_BASE =
  process.env.TXLINE_NETWORK === "devnet"
    ? "https://txline-dev.txodds.com"
    : "https://txline.txodds.com";

let cachedJwt: string | null = process.env.TXLINE_JWT ?? null;
let jwtExpiresAt: number | null = cachedJwt ? Date.now() + 29 * 24 * 60 * 60 * 1000 : null;
let cachedApiToken: string | null = process.env.TXLINE_API_TOKEN ?? null;

export async function getGuestJwt(): Promise<string> {
  const now = Date.now();
  if (cachedJwt && jwtExpiresAt && now < jwtExpiresAt) {
    return cachedJwt;
  }

  const res = await fetch(`${TXLINE_BASE}/auth/guest/start`, { method: "POST" });
  if (!res.ok) throw new Error(`Failed to get guest JWT: ${res.status}`);

  const { token } = await res.json();
  cachedJwt = token;
  // JWT is valid for 30 days; refresh 1 day early
  jwtExpiresAt = now + 29 * 24 * 60 * 60 * 1000;
  return token;
}

export function setApiToken(token: string) {
  cachedApiToken = token;
}

export function getApiToken(): string | null {
  return cachedApiToken;
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  const jwt = await getGuestJwt();
  if (!cachedApiToken) throw new Error("API token not set — activate subscription first");
  return {
    Authorization: `Bearer ${jwt}`,
    "X-Api-Token": cachedApiToken,
  };
}

export async function activateFreeSubscription(
  txSig: string,
  walletSignature: string
): Promise<string> {
  const jwt = await getGuestJwt();
  const res = await fetch(`${TXLINE_BASE}/api/token/activate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ txSig, walletSignature, leagues: [] }),
  });
  if (!res.ok) throw new Error(`Activation failed: ${res.status}`);
  const apiToken = await res.text();
  setApiToken(apiToken);
  return apiToken;
}
