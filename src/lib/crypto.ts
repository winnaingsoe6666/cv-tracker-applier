import { createHash, timingSafeEqual } from "crypto";

/** Hash a token with SHA-256 for safe storage (e.g., extension API tokens). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Timing-safe comparison of a raw token against a stored hash. */
export function verifyToken(raw: string, storedHash: string): boolean {
  const rawHash = hashToken(raw);
  if (rawHash.length !== storedHash.length) return false;
  return timingSafeEqual(Buffer.from(rawHash), Buffer.from(storedHash));
}
