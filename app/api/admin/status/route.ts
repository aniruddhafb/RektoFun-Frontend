import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, readAdminSession } from "@/app/lib/admin-auth";
import { ADMIN_WALLET } from "@/app/lib/admin";
import { backendApiBase } from "@/app/lib/server-api";

export const dynamic = "force-dynamic";

type ServiceStatus = {
  id: "frontend" | "backend" | "settlement";
  name: string;
  status: "operational" | "degraded" | "down";
  message: string;
  responseTimeMs: number | null;
  checkedAt: string;
  details?: Record<string, string | boolean | number | null>;
};

const timeoutMs = 5_000;
const healthUrl = (base: string) =>
  `${base.replace(/\/api\/?$/, "").replace(/\/$/, "")}/health`;

async function checkService(
  id: "backend" | "settlement",
  name: string,
  url: string | undefined,
): Promise<ServiceStatus> {
  const checkedAt = new Date().toISOString();
  if (!url) return {
    id, name, status: "down", message: "Service URL is not configured",
    responseTimeMs: null, checkedAt,
    details: { url: `Not configured (${id === "settlement" ? "SETTLEMENT_API" : "BE_API_URL"})` },
  };

  const tracedUrl = healthUrl(url);
  const started = performance.now();
  try {
    const response = await fetch(tracedUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const responseTimeMs = Math.round(performance.now() - started);
    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const reportedHealthy = body.status === "healthy" || body.status === "ok";
    const databaseConnected = body.database_connected;
    const status = response.ok && reportedHealthy
      ? databaseConnected === false ? "degraded" : "operational"
      : "down";

    return {
      id, name, status,
      message: status === "operational"
        ? "Service is responding normally"
        : status === "degraded"
          ? "API is online, but its database is disconnected"
          : `Health check returned HTTP ${response.status}`,
      responseTimeMs, checkedAt,
      details: {
        url: tracedUrl,
        ...(typeof body.version === "string" ? { version: body.version } : {}),
        ...(typeof databaseConnected === "boolean" ? { databaseConnected } : {}),
        ...(typeof body.cluster === "string" ? { cluster: body.cluster } : {}),
        ...(typeof body.adminWallet === "string" ? { adminWallet: body.adminWallet } : {}),
      },
    };
  } catch (error) {
    return {
      id, name, status: "down",
      message: error instanceof Error && error.name === "TimeoutError"
        ? `Health check timed out after ${timeoutMs / 1000}s`
        : "Service could not be reached",
      responseTimeMs: Math.round(performance.now() - started), checkedAt,
      details: { url: tracedUrl },
    };
  }
}

export async function GET(request: NextRequest) {
  const session = readAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session || session.address !== ADMIN_WALLET) {
    return NextResponse.json({ error: "Verified admin session required" }, { status: 401 });
  }

  const checkedAt = new Date().toISOString();
  const frontendUrl = request.nextUrl.origin;
  const frontend: ServiceStatus = {
    id: "frontend", name: "Frontend", status: "operational",
    message: "Admin interface is responding normally", responseTimeMs: 0, checkedAt,
    details: {
      url: `${frontendUrl}/api/admin/status`,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    },
  };
  const [backend, settlement] = await Promise.all([
    checkService("backend", "Backend API", backendApiBase()),
    checkService("settlement", "Settlement API", process.env.SETTLEMENT_API),
  ]);
  const services = [frontend, backend, settlement];
  const overall = services.some((service) => service.status === "down")
    ? "down"
    : services.some((service) => service.status === "degraded") ? "degraded" : "operational";

  return NextResponse.json(
    { overall, checkedAt, services },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
