/**
 * Rate Limiting Utility for API Protection
 *
 * Provides in-memory rate limiting with sliding window algorithm.
 * For production with multiple instances, replace with Redis-backed store.
 */

import { createError, getRequestIP, getHeader } from 'h3';

export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  max: number;
  /** Custom key generator function */
  keyGenerator?: (event: any) => string;
  /** Message to return when rate limited */
  message?: string;
  /** Whether to use sliding window (default: true) */
  slidingWindow?: boolean;
}

export interface RateLimitRecord {
  count: number;
  resetAt: number;
  timestamps: number[];
}

// In-memory store for rate limits
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old entries periodically (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

/**
 * Clean up expired rate limit records
 */
function cleanupExpiredRecords(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
  lastCleanup = now;
}

/**
 * Get client identifier for rate limiting
 * Prioritizes X-Forwarded-For header (for proxied requests)
 */
export function getClientIdentifier(event: any): string {
  // Check for forwarded header (when behind proxy/load balancer)
  const forwarded = getHeader(event, 'x-forwarded-for');
  if (forwarded) {
    // Take the first IP in the chain (original client)
    return forwarded.split(',')[0]!.trim();
  }

  // Check for real IP header (nginx)
  const realIP = getHeader(event, 'x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fall back to direct IP
  return getRequestIP(event, { xForwardedFor: true }) || 'unknown';
}

/**
 * Create a rate limiter function
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    max,
    keyGenerator = getClientIdentifier,
    message = 'Too many requests, please try again later',
    slidingWindow = true,
  } = config;

  return async function rateLimitMiddleware(event: any): Promise<void> {
    cleanupExpiredRecords();

    const key = keyGenerator(event);
    const now = Date.now();
    let record = rateLimitStore.get(key);

    // Initialize or reset record
    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + windowMs,
        timestamps: [now],
      };
      rateLimitStore.set(key, record);
      return;
    }

    if (slidingWindow) {
      // Sliding window: remove timestamps outside current window
      const windowStart = now - windowMs;
      record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
      record.count = record.timestamps.length;

      if (record.count >= max) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        throw createError({
          statusCode: 429,
          statusMessage: 'Too Many Requests',
          message,
          data: {
            retryAfter,
            limit: max,
            windowMs,
          },
        });
      }

      record.timestamps.push(now);
      record.count++;
    } else {
      // Fixed window
      if (record.count >= max) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        throw createError({
          statusCode: 429,
          statusMessage: 'Too Many Requests',
          message,
          data: {
            retryAfter,
            limit: max,
            windowMs,
          },
        });
      }

      record.count++;
    }

    // Set rate limit headers
    event.context.rateLimit = {
      limit: max,
      remaining: Math.max(0, max - record.count),
      resetAt: record.resetAt,
    };
  };
}

/**
 * Get current rate limit status for a client
 */
export function getRateLimitStatus(event: any): { limit: number; remaining: number; resetAt: number } | null {
  const key = getClientIdentifier(event);
  const record = rateLimitStore.get(key);
  const now = Date.now();

  if (!record || now > record.resetAt) {
    return null;
  }

  return {
    limit: record.count,
    remaining: Math.max(0, 100 - record.count),
    resetAt: record.resetAt,
  };
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  // Strict: 5 requests per 15 minutes (auth endpoints)
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again in 15 minutes',
  }),

  // Moderate: 10 requests per minute (ratings, favorites)
  userAction: createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many requests, please slow down',
  }),

  // Standard: 100 requests per minute (general API)
  standard: createRateLimiter({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Rate limit exceeded, please try again later',
  }),

  // Search: 30 requests per minute
  search: createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many search requests, please try again later',
  }),

  // Upload: 5 requests per minute (expensive operation)
  upload: createRateLimiter({
    windowMs: 60 * 1000,
    max: 5,
    message: 'Too many upload requests, please try again later',
  }),

  // Registration: 3 per hour
  registration: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Too many registration attempts, please try again later',
  }),
};
