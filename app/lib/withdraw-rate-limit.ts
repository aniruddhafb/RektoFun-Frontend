import "server-only";

import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { backendApiBase, internalApiHeaders } from "@/app/lib/server-api";

type LimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function firstForwardedIp(value: string | null) {
  return value?.split(",", 1)[0]?.trim() || null;
}

function requestIp(request: NextRequest) {
  return (
    firstForwardedIp(request.headers.get("x-vercel-forwarded-for")) ??
    firstForwardedIp(request.headers.get("x-forwarded-for")) ??
    request.headers.get("x-real-ip")?.trim() ??
    "unknown"
  );
}

function hashedIp(request: NextRequest) {
  return createHash("sha256").update(requestIp(request)).digest("hex");
}

export async function checkWithdrawalIpRateLimit(
  request: NextRequest
): Promise<LimitResult> {
  const response = await fetch(
    `${backendApiBase()}/internal/withdrawal-rate-limit`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...internalApiHeaders(),
      },
      body: JSON.stringify({ identifier: hashedIp(request) }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    }
  );
  const data = (await response.json().catch(() => null)) as
    | {
        allowed?: unknown;
        retry_after_seconds?: unknown;
        detail?: unknown;
      }
    | null;
  if (!response.ok) {
    console.error(
      "[withdraw-rate-limit] Backend rate-limit check failed:",
      data?.detail || response.status
    );
    throw new Error("Withdrawal rate limiting is temporarily unavailable.");
  }

  if (
    !data ||
    typeof data.allowed !== "boolean" ||
    typeof data.retry_after_seconds !== "number"
  ) {
    throw new Error("Withdrawal rate limiting returned an invalid response.");
  }

  return {
    allowed: data.allowed,
    retryAfterSeconds: Math.max(0, Math.ceil(data.retry_after_seconds)),
  };
}
