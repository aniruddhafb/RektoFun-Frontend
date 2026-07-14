import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { createHash, createHmac, randomBytes } from "crypto";

const COOKIE_NAME = "rekto_x_oauth";
const MAX_MESSAGE_AGE_MS = 5 * 60 * 1000;

type StartBody = {
  userId?: number;
  address?: string;
  message?: string;
  signature?: string;
};

const base64Url = (value: Buffer) => value.toString("base64url");

export async function POST(request: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  const redirectUri = process.env.X_REDIRECT_URI;
  const cookieSecret = process.env.X_OAUTH_COOKIE_SECRET;
  if (!clientId || !redirectUri || !cookieSecret) {
    return NextResponse.json({ error: "X OAuth is not configured." }, { status: 503 });
  }

  let body: StartBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { userId, address, message, signature } = body;
  if (!userId || !address || !message || !signature) {
    return NextResponse.json({ error: "Missing wallet verification." }, { status: 400 });
  }

  const expectedPrefix = `Link X to RektoFun\nWallet: ${address}\nUser ID: ${userId}\nTimestamp: `;
  if (!message.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "Invalid signing message." }, { status: 400 });
  }
  const timestamp = Number(message.slice(expectedPrefix.length));
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > MAX_MESSAGE_AGE_MS) {
    return NextResponse.json({ error: "Wallet verification expired. Try again." }, { status: 400 });
  }

  try {
    const valid = nacl.sign.detached.verify(
      new TextEncoder().encode(message),
      Buffer.from(signature, "base64"),
      new PublicKey(address).toBytes(),
    );
    if (!valid) return NextResponse.json({ error: "Invalid wallet signature." }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid wallet verification." }, { status: 401 });
  }

  const apiBase = process.env.NEXT_PUBLIC_BE_API_URL || "http://localhost:8000/api";
  const userResponse = await fetch(`${apiBase}/users/${userId}`, { cache: "no-store" });
  if (!userResponse.ok) return NextResponse.json({ error: "User was not found." }, { status: 404 });
  const backendUser = await userResponse.json();
  if ((backendUser.pubkey || backendUser.wallet_address) !== address) {
    return NextResponse.json({ error: "Wallet does not own this profile." }, { status: 403 });
  }

  const state = base64Url(randomBytes(32));
  const verifier = base64Url(randomBytes(48));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  const oauthData = Buffer.from(JSON.stringify({ state, verifier, userId, address })).toString("base64url");
  const proof = createHmac("sha256", cookieSecret).update(oauthData).digest("base64url");

  const authorizationUrl = new URL("https://twitter.com/i/oauth2/authorize");
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("scope", "users.read tweet.read");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", challenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.json({ authorizationUrl: authorizationUrl.toString() });
  response.cookies.set(COOKIE_NAME, `${oauthData}.${proof}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
