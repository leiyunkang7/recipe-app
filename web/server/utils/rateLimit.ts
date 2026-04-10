/**
 * Rate Limiting Utility for API Protection
 *
 * Provides in-memory rate limiting with sliding window algorithm.
 * For production with multiple instances, replace with Redis-backed store.
 */

import { createError, getRequestIP, getHeader } from 'h3';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyGenerator?: (event: unknown) => string;
  message?: string;
  slidingWindow?: boolean;
  adaptive?: boolean;
}

export interface RateLimitRecord {
  count: number;
  resetAt: number;
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

interface BlockedIP {
  expiresAt: number;
  reason: string;
  blockedBy: 'manual' | 'auto';
}
const ipBlockList = new Map<string, BlockedIP>();

interface SuspiciousIP {
  violations: number;
  lastViolationAt: number;
  adaptiveWindowMs: number;
  adaptiveMax: number;
}
const suspiciousIPs = new Map<string, SuspiciousIP>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

const IP_BLOCK_DURATION_MS = 5 * 60 * 1000;
const MAX_VIOLATIONS_BEFORE_BLOCK = 5;
const VIOLATION_COOLDOWN_MS = 60 * 1000;

function cleanupExpiredRecords(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }

  for (const [ip, block] of ipBlockList.entries()) {
    if (now > block.expiresAt) {
      ipBlockList.delete(ip);
    }
  }

  for (const [ip, data] of suspiciousIPs.entries()) {
    if (now - data.lastViolationAt > data.adaptiveWindowMs * 2) {
      suspiciousIPs.delete(ip);
    }
  }

  lastCleanup = now;
}

export function getClientIdentifier(event: unknown): string {
  const forwarded = getHeader(event, 'x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]!.trim();
  }

  const realIP = getHeader(event, 'x-real-ip');
  if (realIP) {
    return realIP;
  }

  return getRequestIP(event, { xForwardedFor: true }) || 'unknown';
}

export function isIPBlocked(event: unknown): { blocked: boolean; reason?: string; blockedBy?: 'manual' | 'auto' } {
  const clientId = getClientIdentifier(event);
  const block = ipBlockList.get(clientId);

  if (!block) {
    return { blocked: false };
  }

  if (Date.now() > block.expiresAt) {
    ipBlockList.delete(clientId);
    return { blocked: false };
  }

  return { blocked: true, reason: block.reason, blockedBy: block.blockedBy };
}

export function blockIP(event: unknown, reason: string, durationMs: number = IP_BLOCK_DURATION_MS, blockedBy: 'manual' | 'auto' = 'auto'): void {
  const clientId = getClientIdentifier(event);
  ipBlockList.set(clientId, {
    expiresAt: Date.now() + durationMs,
    reason,
    blockedBy,
  });
}

export function unblockIP(event: unknown): boolean {
  const clientId = getClientIdentifier(event);
  return ipBlockList.delete(clientId);
}

export function getBlockedIPs(): Array<{ ip: string; reason: string; blockedBy: 'manual' | 'auto'; expiresAt: number }> {
  const now = Date.now();
  const result: Array<{ ip: string; reason: string; blockedBy: 'manual' | 'auto'; expiresAt: number }> = [];

  for (const [ip, block] of ipBlockList.entries()) {
    if (now < block.expiresAt) {
      result.push({ ip, ...block });
    }
  }

  return result;
}

function trackViolation(clientId: string): void {
  let suspicious = suspiciousIPs.get(clientId);

  if (!suspicious) {
    suspicious = {
      violations: 0,
      lastViolationAt: Date.now(),
      adaptiveWindowMs: 60 * 1000,
      adaptiveMax: 100,
    };
    suspiciousIPs.set(clientId, suspicious);
  }

  const now = Date.now();

  if (now - suspicious.lastViolationAt > VIOLATION_COOLDOWN_MS) {
    suspicious.violations = 0;
  }

  suspicious.violations++;
  suspicious.lastViolationAt = now;

  suspicious.adaptiveMax = Math.max(10, 100 - suspicious.violations * 15);
  suspicious.adaptiveWindowMs = Math.min(5 * 60 * 1000, 60 * 1000 + suspicious.violations * 10 * 1000);

  if (suspicious.violations >= MAX_VIOLATIONS_BEFORE_BLOCK) {
    ipBlockList.set(clientId, {
      expiresAt: Date.now() + IP_BLOCK_DURATION_MS,
      reason: `Automatic block due to ${suspicious.violations} rate limit violations`,
      blockedBy: 'auto',
    });
    suspiciousIPs.delete(clientId);
  }
}

export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    max,
    keyGenerator = getClientIdentifier,
    message = 'Too many requests, please try again later',
    slidingWindow = true,
    adaptive = false,
  } = config;

  return async function rateLimitMiddleware(event: unknown): Promise<void> {
    cleanupExpiredRecords();

    const clientId = keyGenerator(event);

    const blockCheck = isIPBlocked(event);
    if (blockCheck.blocked) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: `Access denied: ${blockCheck.reason || 'Your IP has been temporarily blocked'}`,
        data: {
          code: 'IP_BLOCKED',
          retryAfter: Math.ceil((ipBlockList.get(clientId)?.expiresAt || Date.now()) / 1000),
        },
      });
    }

    let effectiveMax = max;
    let effectiveWindowMs = windowMs;

    if (adaptive) {
      const suspicious = suspiciousIPs.get(clientId);
      if (suspicious && Date.now() - suspicious.lastViolationAt < suspicious.adaptiveWindowMs) {
        effectiveMax = suspicious.adaptiveMax;
        effectiveWindowMs = suspicious.adaptiveWindowMs;
      }
    }

    const now = Date.now();
    let record = rateLimitStore.get(clientId);

    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + effectiveWindowMs,
        timestamps: [now],
      };
      rateLimitStore.set(clientId, record);

      event.context.rateLimit = {
        limit: effectiveMax,
        remaining: effectiveMax - 1,
        resetAt: record.resetAt,
      };
      return;
    }

    if (slidingWindow) {
      const windowStart = now - effectiveWindowMs;
      record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
      record.count = record.timestamps.length;

      if (record.count >= effectiveMax) {
        trackViolation(clientId);

        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        throw createError({
          statusCode: 429,
          statusMessage: 'Too Many Requests',
          message,
          data: {
            retryAfter,
            limit: effectiveMax,
            windowMs: effectiveWindowMs,
          },
        });
      }

      record.timestamps.push(now);
      record.count++;
    } else {
      if (record.count >= effectiveMax) {
        trackViolation(clientId);

        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        throw createError({
          statusCode: 429,
          statusMessage: 'Too Many Requests',
          message,
          data: {
            retryAfter,
            limit: effectiveMax,
            windowMs: effectiveWindowMs,
          },
        });
      }

      record.count++;
    }

    event.context.rateLimit = {
      limit: effectiveMax,
      remaining: Math.max(0, effectiveMax - record.count),
      resetAt: record.resetAt,
    };
  };
}

export function getRateLimitStatus(event: unknown, max: number = 100): { limit: number; remaining: number; resetAt: number } | null {
  const key = getClientIdentifier(event);
  const record = rateLimitStore.get(key);
  const now = Date.now();

  if (!record || now > record.resetAt) {
    return null;
  }

  const windowStart = now - (record.resetAt - now);
  const validTimestamps = record.timestamps.filter((ts) => ts > windowStart);
  const currentCount = validTimestamps.length;

  return {
    limit: max,
    remaining: Math.max(0, max - currentCount),
    resetAt: record.resetAt,
  };
}

export const rateLimiters = {
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again in 15 minutes',
  }),

  userAction: createRateLimiter({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many requests, please slow down',
  }),

  standard: createRateLimiter({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Rate limit exceeded, please try again later',
    adaptive: true,
  }),

  search: createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many search requests, please try again later',
    adaptive: true,
  }),

  upload: createRateLimiter({
    windowMs: 60 * 1000,
    max: 5,
    message: 'Too many upload requests, please try again later',
  }),

  registration: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Too many registration attempts, please try again later',
  }),

  strict: createRateLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many requests, please try again later',
    adaptive: true,
  }),
};
