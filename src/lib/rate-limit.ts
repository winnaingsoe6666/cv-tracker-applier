/**
 * Simple in-memory rate limiter for API endpoints.
 *
 * Tracks per-user request counts within a sliding window.
 * Returns { allowed: boolean, remaining: number, resetAt: number }.
 *
 * Production note: replace with Redis-backed limiter for multi-instance deploys.
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

// Cleanup stale entries every 5 minutes
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (typically `userId:endpoint`).
 * @param key — unique identifier (e.g. "abc123:match")
 * @param max — max requests allowed in the window
 * @param windowMs — window duration in milliseconds (default: 60s)
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs = 60_000
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

// Pre-defined limits for different endpoints
export const RATE_LIMITS = {
  /** Match analysis runs — generous for PRO, tight for FREE */
  match: { free: 20, pro: 200, windowMs: 60 * 60 * 1000 }, // per hour
  /** Cover letter generation */
  letter: { free: 10, pro: 100, windowMs: 60 * 60 * 1000 },
  /** Resume critique (LLM) */
  critique: { free: 5, pro: 50, windowMs: 60 * 60 * 1000 },
  /** Login attempts per IP */
  login: { max: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  /** Registration attempts per IP */
  register: { max: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
} as const;

export type RateLimitEndpoint = keyof typeof RATE_LIMITS;

/** Extract client IP from request headers (works with Vercel/proxy). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "127.0.0.1";
}
