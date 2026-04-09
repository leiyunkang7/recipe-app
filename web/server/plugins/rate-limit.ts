/**
 * Rate Limiting & Anti-Scraping Nitro Plugin
 *
 * Applies global rate limiting and anti-scraping protections to all API routes.
 * Runs before each request to enforce rate limits.
 *
 * Note: Security headers (CSP, X-Frame-Options, etc.) are handled by
 * the dedicated security-headers.ts plugin.
 */

import { rateLimiters, getRateLimitStatus } from "../utils/rateLimit";
import { createAntiScrapeMiddleware } from "../utils/antiScrape";

// Create anti-scraping middleware
const antiScrape = createAntiScrapeMiddleware({
  blockKnownScrapers: true,
  blockNoUserAgent: false, // Be lenient since some legitimate clients dont send UA
});

// Paths that should use search rate limiting
const SEARCH_PATHS = [
  "/api/tags/recommend",
  "/api/recipes/export",
  "/api/recommendations",
];

// Paths that should use userAction rate limiting
const USER_ACTION_PATHS = [
  "/api/my-recipes",
  "/api/ratings",
  "/api/reviews",
  "/api/reminders",
  "/api/subscriptions",
  "/api/notifications",
  "/api/tips",
  "/api/groups",
  "/api/challenges",
];

function getRateLimiterForPath(path: string): typeof rateLimiters.standard {
  if (SEARCH_PATHS.some((p) => path.startsWith(p))) {
    return rateLimiters.search;
  }
  if (USER_ACTION_PATHS.some((p) => path.startsWith(p))) {
    return rateLimiters.userAction;
  }
  if (path.includes("/auth/login") || path.includes("/auth/register")) {
    return rateLimiters.auth;
  }
  if (path.includes("/uploads") || path.includes("/import") || path.includes("/ai/")) {
    return rateLimiters.upload;
  }
  return rateLimiters.standard;
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("beforeResponse", (event) => {
    const response = event.res;
    const path = event.path || "";

    // Add rate limit headers if available
    const rateLimit = event.context.rateLimit;
    if (rateLimit) {
      response.setHeader("X-RateLimit-Limit", String(rateLimit.limit));
      response.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));
      response.setHeader("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetAt / 1000)));
    } else if (path.startsWith("/api/")) {
      // For API routes without explicit rate limiting, get current status
      const status = getRateLimitStatus(event);
      if (status) {
        response.setHeader("X-RateLimit-Limit", String(status.limit));
        response.setHeader("X-RateLimit-Remaining", String(status.remaining));
        response.setHeader("X-RateLimit-Reset", String(Math.ceil(status.resetAt / 1000)));
      }
    }

    // Anti-scraping header
    const scrapeAnalysis = event.context.scrapeAnalysis;
    if (scrapeAnalysis && scrapeAnalysis.score > 0) {
      response.setHeader("X-Suspicious-Score", String(scrapeAnalysis.score));
    }
  });

  // Apply global rate limiting and anti-scraping to API routes
  nitroApp.hooks.hook("request", async (event) => {
    const url = event.path || "";

    // Skip rate limiting for non-API routes
    if (!url.startsWith("/api/")) {
      return;
    }

    // Apply anti-scraping protection first
    try {
      await antiScrape(event);
    } catch (err) {
      // Anti-scraping middleware throws on blocked requests
      throw err;
    }

    // Apply appropriate rate limiter based on endpoint
    const rateLimit = event.context.rateLimit;

    if (rateLimit) {
      // Already set by specific endpoint handler
      return;
    }

    // Apply path-specific rate limiting for general API routes
    const rateLimiter = getRateLimiterForPath(url);
    await rateLimiter(event);
  });
});
