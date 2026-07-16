import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { ADMIN_WALLET } from "@/app/lib/admin";
import {
  ADMIN_NONCE_COOKIE,
  ADMIN_SESSION_COOKIE,
  adminSessionMaxAge,
  createAdminSession,
  readSignedNonce,
} from "@/app/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { address?: string; message?: string; signature?: string };
    if (body.address !== ADMIN_WALLET || !body.message || !body.signature) {
      return NextResponse.json({ error: "Admin wallet signature required" }, { status: 401 });
    }
    const nonce = readSignedNonce(req.cookies.get(ADMIN_NONCE_COOKIE)?.value);
    const expectedMessage = nonce && [
      "Sign in to RektoFun Admin",
      "",
      "This request will not trigger a blockchain transaction.",
      `Nonce: ${nonce}`,
    ].join("\n");
    if (!nonce || body.message !== expectedMessage) {
      return NextResponse.json({ error: "Authentication request expired" }, { status: 401 });
    }
    const verified = nacl.sign.detached.verify(
      new TextEncoder().encode(body.message),
      Buffer.from(body.signature, "base64"),
      new PublicKey(body.address).toBytes(),
    );
    if (!verified) {
      return NextResponse.json({ error: "Invalid admin wallet signature" }, { status: 401 });
    }

    const response = NextResponse.json({ authenticated: true, address: body.address });
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(body.address), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: adminSessionMaxAge,
    });
    response.cookies.set(ADMIN_NONCE_COOKIE, "", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/api/admin/auth",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Signature verification failed" },
      { status: 500 },
    );
  }
}
