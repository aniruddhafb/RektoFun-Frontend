import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { ADMIN_NONCE_COOKIE, createSignedNonce } from "@/app/lib/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    const nonce = randomBytes(24).toString("base64url");
    const message = [
      "Sign in to RektoFun Admin",
      "",
      "This request will not trigger a blockchain transaction.",
      `Nonce: ${nonce}`,
    ].join("\n");
    const response = NextResponse.json({ message });
    response.cookies.set(ADMIN_NONCE_COOKIE, createSignedNonce(nonce), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/api/admin/auth",
      maxAge: 5 * 60,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin authentication is unavailable" },
      { status: 500 },
    );
  }
}
