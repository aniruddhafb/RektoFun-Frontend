import { NextRequest } from "next/server";
import { getAuthHeaders } from "@/app/lib/sports-service/txline-auth";

const TXLINE_BASE =
  process.env.TXLINE_NETWORK === "devnet"
    ? "https://txline-dev.txodds.com"
    : "https://txline.txodds.com";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fixtureId: string }> }
) {
  console.log("endpoint hit scores");
  const { fixtureId } = await params;

  console.log("fixtureId", fixtureId);

  let headers: HeadersInit;
  try {
    headers = await getAuthHeaders();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Auth error";
    return new Response(message, { status: 401 });
  }

  const upstream = await fetch(
    `${TXLINE_BASE}/api/scores/stream?fixtureId=${fixtureId}`,
    { headers }
  );

  if (!upstream.ok) {
    const body = await upstream.text();
    return new Response(body || `Upstream error: ${upstream.status}`, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  if (!upstream.body || !contentType.includes("text/event-stream")) {
    const body = upstream.body ? await upstream.text() : "No stream body";
    return new Response(body, {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
