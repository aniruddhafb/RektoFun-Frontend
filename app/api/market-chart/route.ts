import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const RANGE_CONFIG = {
    "24H": { interval: "1h", limit: 24 },
    "7D": { interval: "4h", limit: 42 },
    "30D": { interval: "1d", limit: 30 },
    "3M": { interval: "1d", limit: 90 },
} as const;

type ChartRange = keyof typeof RANGE_CONFIG;

export async function GET(request: NextRequest) {
    const pair = (request.nextUrl.searchParams.get("pair") ?? "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
    const asset = (request.nextUrl.searchParams.get("asset") ?? "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
    const requestedRange = request.nextUrl.searchParams.get("range")?.toUpperCase() as ChartRange | undefined;
    const range: ChartRange = requestedRange && requestedRange in RANGE_CONFIG ? requestedRange : "24H";

    // Prefer the exact configured market. Keep `asset` as a compatibility
    // fallback for older callers that expect ASSETUSDT.
    const symbol = pair || (asset ? `${asset}USDT` : "");
    if (!symbol || symbol.length > 20) {
        return NextResponse.json({ error: "Invalid market pair" }, { status: 400 });
    }

    const { interval, limit } = RANGE_CONFIG[range];
    const url = new URL("https://data-api.binance.vision/api/v3/klines");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", interval);
    url.searchParams.set("limit", String(limit));

    try {
        const response = await fetch(url, { next: { revalidate: 60 } });
        if (!response.ok) {
            return NextResponse.json({ error: "Market data unavailable" }, { status: 404 });
        }

        const rows = await response.json() as unknown[][];
        const candles = rows.map((row) => ({
            time: Number(row[0]),
            open: Number(row[1]),
            high: Number(row[2]),
            low: Number(row[3]),
            close: Number(row[4]),
        })).filter((candle) => Object.values(candle).every(Number.isFinite));

        if (candles.length < 2) {
            return NextResponse.json({ error: "Not enough market data" }, { status: 404 });
        }

        return NextResponse.json({ asset: asset || pair, symbol, range, candles });
    } catch (error) {
        console.error("[api/market-chart] failed:", error);
        return NextResponse.json({ error: "Market data unavailable" }, { status: 502 });
    }
}
