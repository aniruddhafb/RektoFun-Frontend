import { NextRequest, NextResponse } from "next/server";
import { ADMIN_WALLET } from "@/app/lib/admin";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "@/app/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let session;
  try {
    session = readAdminSession(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  } catch {
    session = null;
  }
  if (session?.address !== ADMIN_WALLET) {
    return NextResponse.json({ error: "Verified admin session required" }, { status: 401 });
  }

  const cronApiKey = process.env.CRON_API_KEY;
  if (!cronApiKey) {
    return NextResponse.json(
      { error: "CRON_API_KEY is not configured on the frontend server" },
      { status: 500 },
    );
  }

  const apiBase = (
    process.env.BE_API_URL
    || process.env.NEXT_PUBLIC_BE_API_URL
    || "http://localhost:8000/api"
  ).replace(/\/$/, "");

  try {
    const response = await fetch(`${apiBase}/challenges/cron/resolve-due`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "X-API-Key": cronApiKey,
      },
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: result?.detail || result?.error || "Challenge resolution failed",
        },
        { status: response.status },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/admin/challenges/resolve-due] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not reach the backend" },
      { status: 502 },
    );
  }
}
