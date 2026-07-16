import { NextRequest, NextResponse } from "next/server";
import { backendApiBase, internalApiHeaders } from "@/app/lib/server-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 1024 * 1024;
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const ALLOWED_ORIGINS = new Set([
  "https://rekto.fun",
  "https://www.rekto.fun",
  "https://devnet.rekto.fun",
  "https://devnet-api.rekto.fun",
  "https://sports.rekto.fun",
  "https://api.rekto.fun",
  "https://settlements.rekto.fun",
  "http://localhost:3000",
]);

function mutationOriginAllowed(request: NextRequest): boolean {
  if (!MUTATION_METHODS.has(request.method)) return true;
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return Boolean(origin && ALLOWED_ORIGINS.has(origin) && (!fetchSite || fetchSite === "same-origin" || fetchSite === "same-site"));
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (!path?.length || path[0] === "admin" || (path[0] === "challenges" && path[1] === "cron")) {
    return NextResponse.json({ error: "Route is not available through this proxy" }, { status: 404 });
  }
  if (!mutationOriginAllowed(request)) {
    return NextResponse.json({ error: "Cross-site mutation rejected" }, { status: 403 });
  }

  let body: ArrayBuffer | undefined;
  if (MUTATION_METHODS.has(request.method)) {
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
  }

  const target = new URL(`${backendApiBase()}/${path.map(encodeURIComponent).join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value));
  const headers = new Headers();
  for (const name of ["accept", "content-type"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (MUTATION_METHODS.has(request.method)) {
    Object.entries(internalApiHeaders()).forEach(([key, value]) => headers.set(key, value));
  }

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[api/backend] proxy failed:", error);
    return NextResponse.json({ error: "Backend API unavailable" }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
