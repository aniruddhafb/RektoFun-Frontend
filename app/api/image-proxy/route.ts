import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
    "api.dicebear.com",
    "earningrecords.com",
    "pbs.twimg.com",
]);

export async function GET(request: NextRequest) {
    const source = request.nextUrl.searchParams.get("url");
    if (!source) return NextResponse.json({ error: "Missing image URL" }, { status: 400 });

    let url: URL;
    try { url = new URL(source); } catch { return NextResponse.json({ error: "Invalid image URL" }, { status: 400 }); }
    if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
        return NextResponse.json({ error: "Image host not allowed" }, { status: 403 });
    }

    try {
        const response = await fetch(url, { cache: "force-cache" });
        if (!response.ok) return NextResponse.json({ error: "Image unavailable" }, { status: response.status });
        const contentType = response.headers.get("content-type") || "image/jpeg";
        if (!contentType.startsWith("image/")) return NextResponse.json({ error: "Invalid image" }, { status: 415 });
        return new NextResponse(response.body, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
            },
        });
    } catch {
        return NextResponse.json({ error: "Image unavailable" }, { status: 502 });
    }
}
