/**
 * Anti-Scraping Utility
 *
 * Provides protections against web scraping, bot detection, and abuse.
 */

import { createError, getHeader } from "h3";
import { getClientIdentifier } from "./rateLimit";

export interface AntiScrapeConfig {
  /** Allow browsers that send User-Agent */
  allowUserAgent?: boolean;
  /** Block known scraper User-Agents */
  blockKnownScrapers?: boolean;
  /** Require specific headers */
  requireHeaders?: string[];
  /** Enable honeypot detection */
  enableHoneypot?: boolean;
  /** Block requests with no User-Agent (unless whitelisted) */
  blockNoUserAgent?: boolean;
  /** Maximum acceptable request frequency per IP (for behavioral analysis) */
  maxRequestsPerMinute?: number;
}

/**
 * Track request patterns for behavioral analysis
 */
interface RequestPattern {
  timestamps: number[];
  suspiciousCount: number;
}

const behavioralStore = new Map<string, RequestPattern>();
const BEHAVIORAL_WINDOW_MS = 60 * 1000;
const MAX_BEHAVIORAL_REQUESTS = 60; // More than 60 requests/min is suspicious
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastBehavioralCleanup = Date.now();

/**
 * Known scraper User-Agent patterns
 */
const KNOWN_SCRAPER_PATTERNS = [
  /scrapy/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /node-fetch/i,
  /axios/i,
  /postman/i,
  /httpie/i,
  /go-http/i,
  /java-http/i,
  /libwww-perl/i,
  /mekanizch/i,
  /phantomjs/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
];

/**
 * Suspicious User-Agent patterns (may indicate abuse)
 */
const SUSPICIOUS_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /harvester/i,
  /extractor/i,
  /grab/i,
  /parse/i,
];

/**
 * Headers that legitimate browsers typically send
 */
const BROWSER_HEADERS = [
  "accept",
  "accept-language",
  "accept-encoding",
  "user-agent",
];

export interface ScrapeAnalysis {
  isSuspicious: boolean;
  reasons: string[];
  score: number;
}

/**
 * Clean up expired behavioral records
 */
function cleanupBehavioralStore(): void {
  const now = Date.now();
  if (now - lastBehavioralCleanup < CLEANUP_INTERVAL_MS) return;

  for (const [key, pattern] of behavioralStore.entries()) {
    pattern.timestamps = pattern.timestamps.filter((ts) => ts > now - BEHAVIORAL_WINDOW_MS);
    if (pattern.timestamps.length === 0) {
      behavioralStore.delete(key);
    }
  }
  lastBehavioralCleanup = now;
}

/**
 * Analyze request for scraping indicators
 */
export function analyzeRequest(event: unknown): ScrapeAnalysis {
  const reasons: string[] = [];
  let score = 0;

  const userAgent = getHeader(event, "user-agent") || "";
  const accept = getHeader(event, "accept");
  const acceptLanguage = getHeader(event, "accept-language");
  const _acceptEncoding = getHeader(event, "accept-encoding");
  const referer = getHeader(event, "referer");
  const origin = getHeader(event, "origin");

  if (KNOWN_SCRAPER_PATTERNS.some((pattern) => pattern.test(userAgent))) {
    reasons.push("Known scraper User-Agent");
    score += 50;
  }

  if (SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(userAgent)) && !userAgent.includes("Googlebot")) {
    reasons.push("Suspicious User-Agent pattern");
    score += 30;
  }

  if (!userAgent) {
    reasons.push("Missing User-Agent");
    score += 20;
  }

  if (!accept && !userAgent.includes("curl") && !userAgent.includes("wget")) {
    reasons.push("Missing Accept header");
    score += 15;
  }

  if (!acceptLanguage && !userAgent.includes("curl") && !userAgent.includes("wget")) {
    reasons.push("Missing Accept-Language header");
    score += 10;
  }

  const isAutomated = KNOWN_SCRAPER_PATTERNS.some((p) => p.test(userAgent));
  if (isAutomated) {
    if (!referer && !origin) {
      reasons.push("Automated request without referrer");
      score += 20;
    }
  }

  const clientId = getClientIdentifier(event);
  const now = Date.now();
  let pattern = behavioralStore.get(clientId);
  
  if (!pattern) {
    pattern = { timestamps: [], suspiciousCount: 0 };
    behavioralStore.set(clientId, pattern);
  }
  
  pattern.timestamps = pattern.timestamps.filter((ts) => ts > now - BEHAVIORAL_WINDOW_MS);
  
  if (pattern.timestamps.length >= MAX_BEHAVIORAL_REQUESTS) {
    reasons.push("High request frequency detected");
    score += 40;
    pattern.suspiciousCount++;
  }
  
  if (pattern.suspiciousCount >= 3) {
    reasons.push("Repeated suspicious behavior");
    score += 50;
  }
  
  pattern.timestamps.push(now);

  return {
    isSuspicious: score >= 50,
    reasons,
    score,
  };
}

/**
 * Create an anti-scraping middleware
 */
export function createAntiScrapeMiddleware(config: AntiScrapeConfig = {}) {
  const {
    blockKnownScrapers = true,
    blockNoUserAgent = false,
    requireHeaders = BROWSER_HEADERS,
  } = config;

  return async function antiScrapeHandler(event: unknown): Promise<void> {
    const userAgent = getHeader(event, "user-agent") || "";

    cleanupBehavioralStore();

    if (blockKnownScrapers && KNOWN_SCRAPER_PATTERNS.some((pattern) => pattern.test(userAgent))) {
      if (userAgent.includes("Googlebot") || userAgent.includes("Bingbot")) {
        return;
      }

      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Access denied",
      });
    }

    if (blockNoUserAgent && !userAgent) {
      const clientId = getClientIdentifier(event);
      if (clientId === "127.0.0.1" || clientId === "::1" || clientId === "::ffff:127.0.0.1") {
        return;
      }

      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "User-Agent header is required",
      });
    }

    const method = event.method || "GET";
    if (method !== "GET" && requireHeaders.length > 0) {
      const missingHeaders = requireHeaders.filter(
        (header) => !getHeader(event, header)
      );

      if (missingHeaders.length >= 3) {
        throw createError({
          statusCode: 400,
          statusMessage: "Bad Request",
          message: "Missing required headers",
        });
      }
    }

    const clientId = getClientIdentifier(event);
    let pattern = behavioralStore.get(clientId);
    if (!pattern) {
      pattern = { timestamps: [], suspiciousCount: 0 };
      behavioralStore.set(clientId, pattern);
    }

    const now = Date.now();
    pattern.timestamps = pattern.timestamps.filter((ts) => ts > now - BEHAVIORAL_WINDOW_MS);

    if (pattern.timestamps.length >= MAX_BEHAVIORAL_REQUESTS) {
      pattern.suspiciousCount++;
      
      if (pattern.suspiciousCount >= 3) {
        throw createError({
          statusCode: 429,
          statusMessage: "Too Many Requests",
          message: "Too many requests from this IP, please try again later",
        });
      }
    }
    // Only push timestamp once, after the check
    pattern.timestamps.push(now);
  };
}

/**
 * Get client fingerprint for abuse detection
 */
export function getClientFingerprint(event: unknown): string {
  const identifier = getClientIdentifier(event);
  const userAgent = getHeader(event, "user-agent") || "";
  const acceptLanguage = getHeader(event, "accept-language") || "";

  return identifier + ":" + userAgent.length + ":" + acceptLanguage.substring(0, 10);
}

/**
 * Known bot User-Agents to allow (legitimate crawlers)
 */
export const ALLOWED_BOTS = [
  "Googlebot",
  "Googlebot-Image",
  "Googlebot-News",
  "Googlebot-Video",
  "Bingbot",
  "Slurp",
  "DuckDuckBot",
  "Baiduspider",
  "YandexBot",
  "Sogou",
  "Exabot",
  "Facebot",
  "Applebot",
];

/**
 * Check if User-Agent is a known legitimate bot
 */
export function isAllowedBot(userAgent: string): boolean {
  return ALLOWED_BOTS.some((bot) => userAgent.includes(bot));
}
