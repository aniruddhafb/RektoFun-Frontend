import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_NONCE_COOKIE = "rekto_admin_nonce";
export const ADMIN_SESSION_COOKIE = "rekto_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be configured with at least 32 characters");
  }
  return value;
}

function signature(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function validSignature(value: string, supplied: string): boolean {
  const expected = signature(value);
  const left = Buffer.from(expected);
  const right = Buffer.from(supplied);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createSignedNonce(nonce: string): string {
  return `${nonce}.${signature(nonce)}`;
}

export function readSignedNonce(cookieValue?: string): string | null {
  if (!cookieValue) return null;
  const separator = cookieValue.lastIndexOf(".");
  if (separator < 1) return null;
  const nonce = cookieValue.slice(0, separator);
  const supplied = cookieValue.slice(separator + 1);
  return validSignature(nonce, supplied) ? nonce : null;
}

export function createAdminSession(address: string): string {
  const payload = Buffer.from(JSON.stringify({
    address,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function readAdminSession(cookieValue?: string): { address: string; exp: number } | null {
  if (!cookieValue) return null;
  const separator = cookieValue.lastIndexOf(".");
  if (separator < 1) return null;
  const payload = cookieValue.slice(0, separator);
  const supplied = cookieValue.slice(separator + 1);
  if (!validSignature(payload, supplied)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof parsed.address !== "string" || typeof parsed.exp !== "number") return null;
    if (parsed.exp <= Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const adminSessionMaxAge = SESSION_TTL_SECONDS;
