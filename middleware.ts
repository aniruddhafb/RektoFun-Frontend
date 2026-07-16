import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const WINDOW_MS = 60_000;
const MUTATION_LIMIT = 60;
const requests = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
    if (SAFE_METHODS.has(request.method)) return NextResponse.next();

    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    if (!origin || !ALLOWED_ORIGINS.has(origin) || (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site")) {
        return NextResponse.json({ error: "Cross-site mutation rejected" }, { status: 403 });
    }

    const maxBytes = request.nextUrl.pathname.startsWith("/api/admin/backend/category-image")
        ? 6 * 1024 * 1024
        : 1024 * 1024;
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (!Number.isFinite(contentLength) || contentLength > maxBytes) {
        return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }

    const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
    const key = forwarded || "unknown";
    const now = Date.now();
    const current = requests.get(key);
    if (!current || current.resetAt <= now) {
        requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    } else if (current.count >= MUTATION_LIMIT) {
        return NextResponse.json(
            { error: "Too many requests. Please try again shortly." },
            { status: 429, headers: { "Retry-After": "60" } },
        );
    } else {
        current.count += 1;
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/api/:path*"],
};
