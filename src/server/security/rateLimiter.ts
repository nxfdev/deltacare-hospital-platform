import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// DeltaCare Server-Side Rate Limiter & Abuse Prevention Guard
//
// ARCHITECTURAL LIMITATION & SCALE-OUT BOUNDARY:
// This implementation uses an in-memory sliding window counter suitable for
// single-node / local environments. In a horizontally scaled multi-instance
// deployment (e.g. multiple Kubernetes pods or serverless functions), each
// instance maintains its own memory space, dividing the effective limits.
// For production multi-node deployments, replace the in-memory Map with a
// distributed store (e.g. Redis / Upstash Token Bucket).
// ============================================================================

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired rate limit entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, record] of memoryStore.entries()) {
    if (record.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Extracts a privacy-safe client identifier from request headers without logging.
 */
export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * Evaluates rate limit for a given action and client identifier.
 */
export function checkRateLimit(
  action: string,
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  purgeExpiredEntries();

  const now = Date.now();
  const key = `${action}:${identifier}`;
  const record = memoryStore.get(key);

  if (!record || record.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= config.maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Standard HTTP 429 response helper with Retry-After header.
 */
export function buildRateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error: "Too many requests. Please try again later.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

/**
 * Resets rate limiter memory for testing.
 */
export function resetRateLimitsForTests(): void {
  memoryStore.clear();
}

