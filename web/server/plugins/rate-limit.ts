/**
 * Rate Limiting & Anti-Scraping Nitro Plugin
 *
 * Applies global rate limiting and anti-scraping protections to all API routes.
 * Runs before each request to enforce rate limits.
 *
 * Note: Security headers (CSP, X-Frame-Options, etc.) are handled by
 * the dedicated security-headers.ts plugin.
 */

import { rateLimiters } from "../utils/rateLimit";
import { createAntiScrapeMiddleware } from "../utils/antiScrape";

// Create anti-scraping middleware
const antiScrape = createAntiScrapeMiddleware({
  blockKnownScrapers: true,
  blockNoUserAgent: false, // Be lenient since some legitimate clients dont send UA
});

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("beforeResponse", (event) => {
    // Add rate limit headers if available
    const rateLimit = event.context.rateLimit;
    if (rateLimit) {
      event.res.setHeader("X-RateLimit-Limit", String(rateLimit.limit));
      event.res.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));
      event.res.setHeader("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetAt / 1000)));
    }

    // Anti-scraping header
    const scrapeAnalysis = event.context.scrapeAnalysis;
    if (scrapeAnalysis && scrapeAnalysis.score > 0) {
      event.res.setHeader("X-Suspicious-Score", String(scrapeAnalysis.score));
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
      // Store analysis result for header injection
      const analysis = event.context.scrapeAnalysis;
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

    // Apply standard rate limiting for general API routes
    await rateLimiters.standard(event);
  });
});
