/**
 * Rate Limiting & Anti-Scraping Nitro Plugin
 *
 * Applies global rate limiting and anti-scraping protections to all API routes.
 * Runs before each request to enforce rate limits and add security headers.
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
    // Add security headers to all responses
    const response = event.res;

    // Prevent clickjacking
    response.setHeader("X-Frame-Options", "DENY");

    // XSS protection
    response.setHeader("X-XSS-Protection", "1; mode=block");

    // Content type sniffing protection
    response.setHeader("X-Content-Type-Options", "nosniff");

    // Referrer policy
    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions policy (disable features we dont use)
    response.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()"
    );

    // Content Security Policy
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none'"
    );

    // Add rate limit headers if available
    const rateLimit = event.context.rateLimit;
    if (rateLimit) {
      response.setHeader("X-RateLimit-Limit", String(rateLimit.limit));
      response.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));
      response.setHeader("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetAt / 1000)));
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
