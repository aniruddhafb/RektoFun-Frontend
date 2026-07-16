import { NextRequest, NextResponse } from "next/server";
import { ADMIN_WALLET } from "@/app/lib/admin";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "@/app/lib/admin-auth";
import { backendApiBase, internalApiHeaders } from "@/app/lib/server-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 6 * 1024 * 1024;

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const session = readAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session || session.address !== ADMIN_WALLET) {
    return NextResponse.json({ error: "Verified admin session required" }, { status: 401 });
  }
  const { path } = await context.params;
  if (!path?.length || path.some((part) => part === "..")) {
    return NextResponse.json({ error: "Invalid admin path" }, { status: 400 });
  }
  const body = request.method === "GET" ? undefined : await request.arrayBuffer();
  if (body && body.byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }
  const headers = new Headers(internalApiHeaders());
  for (const name of ["accept", "content-type"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const response = await fetch(`${backendApiBase()}/admin/${path.map(encodeURIComponent).join("/")}`, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });
    return new NextResponse(response.body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[api/admin/backend] proxy failed:", error);
    return NextResponse.json({ error: "Backend API unavailable" }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
