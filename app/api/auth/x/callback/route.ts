import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "rekto_x_oauth";

type OAuthCookie = { state: string; verifier: string; userId: number; address: string };

function redirect(request: NextRequest, address: string | undefined, result: "success" | "error", message?: string) {
  const target = new URL(address ? `/profile/${address}` : "/", request.url);
  target.searchParams.set("x_link", result);
  if (message) target.searchParams.set("message", message);
  const response = NextResponse.redirect(target);
  response.cookies.delete(COOKIE_NAME);
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  const rawCookie = request.cookies.get(COOKIE_NAME)?.value;
  const cookieSecret = process.env.X_OAUTH_COOKIE_SECRET;

  if (!rawCookie || !cookieSecret) return redirect(request, undefined, "error", "OAuth session expired.");
  const separator = rawCookie.lastIndexOf(".");
  const data = rawCookie.slice(0, separator);
  const suppliedProof = rawCookie.slice(separator + 1);
  const expectedProof = createHmac("sha256", cookieSecret).update(data).digest("base64url");
  if (!suppliedProof || suppliedProof.length !== expectedProof.length || !timingSafeEqual(Buffer.from(suppliedProof), Buffer.from(expectedProof))) {
    return redirect(request, undefined, "error", "Invalid OAuth session.");
  }

  let session: OAuthCookie;
  try {
    session = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return redirect(request, undefined, "error", "Invalid OAuth session.");
  }
  if (oauthError || !code || !returnedState || returnedState !== session.state) {
    return redirect(request, session.address, "error", oauthError || "X authorization was cancelled.");
  }

  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const redirectUri = process.env.X_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return redirect(request, session.address, "error", "X OAuth is not configured.");
  }

  try {
    const tokenResponse = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code_verifier: session.verifier,
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) throw new Error("X token exchange failed.");
    const token = await tokenResponse.json();

    const xUserResponse = await fetch("https://api.x.com/2/users/me?user.fields=username,profile_image_url", {
      headers: { Authorization: `Bearer ${token.access_token}` },
      cache: "no-store",
    });
    if (!xUserResponse.ok) throw new Error("Could not retrieve the X account.");
    const xUser = await xUserResponse.json();
    const username = xUser.data?.username;
    if (!username) throw new Error("X did not return a username.");
    // X returns a 48x48 "_normal" avatar by default. Store the original-sized
    // variant so profile pages remain sharp at larger display sizes.
    const profileImage = xUser.data?.profile_image_url?.replace("_normal.", ".");

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    const updateResponse = await fetch(`${apiBase}/users/${session.userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        twitter_username: username,
        ...(profileImage ? {
          profile_image: profileImage,
          twitter_profile_image: profileImage,
        } : {}),
      }),
    });
    if (!updateResponse.ok) throw new Error("Could not save the linked X account.");

    return redirect(request, session.address, "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "X account linking failed.";
    return redirect(request, session.address, "error", message);
  }
}
