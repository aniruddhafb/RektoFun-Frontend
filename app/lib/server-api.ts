import "server-only";

export function backendApiBase(): string {
  return (process.env.BE_API_URL || process.env.NEXT_PUBLIC_BE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");
}

export function internalApiHeaders(): Record<string, string> {
  const key = process.env.INTERNAL_API_KEY || process.env.CRON_API_KEY;
  if (!key) throw new Error("INTERNAL_API_KEY (or CRON_API_KEY fallback) is not configured");
  return { "X-Internal-API-Key": key };
}
