/**
 * Anti-Scraping Utility
 *
 * Provides protections against web scraping, bot detection, and abuse.
 */

import { createError, getHeader } from 'h3';
import { getClientIdentifier } from './rateLimit';

export interface AntiScrapeConfig {
  /** Allow browsers that send User-Agent */
  allowUserAgent?: boolean;
  /** Block known scraper User-Agents */
  blockKnownScrapers?: boolean;
  /** Require specific headers */
  requireHeaders?: string[];
  /** Enable honeypot detection */
  enableHoneypot?: boolean;
}

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
  / mekanizch/i,
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
  'accept',
  'accept-language',
  'accept-encoding',
  'user-agent',
];

export interface ScrapeAnalysis {
  isSuspicious: boolean;
  reasons: string[];
  score: number;
}

/**
 * Analyze request for scraping indicators
 */
export function analyzeRequest(event: any): ScrapeAnalysis {
  const reasons: string[] = [];
  let score = 0;

  const userAgent = getHeader(event, 'user-agent') || '';
  const accept = getHeader(event, 'accept');
  const acceptLanguage = getHeader(event, 'accept-language');
  const acceptEncoding = getHeader(event, 'accept-encoding');
  const referer = getHeader(event, 'referer');
  const origin = getHeader(event, 'origin');

  // Check for known scrapers
  if (KNOWN_SCRAPER_PATTERNS.some((pattern) => pattern.test(userAgent))) {
    reasons.push('Known scraper User-Agent');
    score += 50;
  }

  // Check for suspicious patterns
  if (SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(userAgent)) && !userAgent.includes('Googlebot')) {
    reasons.push('Suspicious User-Agent pattern');
    score += 30;
  }

  // Missing User-Agent is suspicious
  if (!userAgent) {
    reasons.push('Missing User-Agent');
    score += 20;
  }

  // Missing accept header is suspicious for browser requests
  if (!accept && !userAgent.includes('curl') && !userAgent.includes('wget')) {
    reasons.push('Missing Accept header');
    score += 15;
  }

  // Missing accept-language is suspicious
  if (!acceptLanguage && !userAgent.includes('curl') && !userAgent.includes('wget')) {
    reasons.push('Missing Accept-Language header');
    score += 10;
  }

  // Check for automated tools without proper headers
  const isAutomated = KNOWN_SCRAPER_PATTERNS.some((p) => p.test(userAgent));
  if (isAutomated) {
    if (!referer && !origin) {
      reasons.push('Automated request without referrer');
      score += 20;
    }
  }

  // Request frequency analysis (would need external store in production)
  // This is a placeholder for more sophisticated detection

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
    requireHeaders = BROWSER_HEADERS,
  } = config;

  return async function antiScrapeHandler(event: any): Promise<void> {
    const userAgent = getHeader(event, 'user-agent') || '';

    // Block known scrapers if configured
    if (blockKnownScrapers && KNOWN_SCRAPER_PATTERNS.some((pattern) => pattern.test(userAgent))) {
      // Allow legitimate services like Googlebot
      if (userAgent.includes('Googlebot') || userAgent.includes('Bingbot')) {
        return;
      }

      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        message: 'Access denied',
      });
    }

    // Check for missing required headers (but be lenient with GET requests)
    const method = event.method || 'GET';
    if (method !== 'GET' && requireHeaders.length > 0) {
      const missingHeaders = requireHeaders.filter(
        (header) => !getHeader(event, header)
      );

      // Only block if multiple headers are missing (single missing is acceptable)
      if (missingHeaders.length >= 3) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Bad Request',
          message: 'Missing required headers',
        });
      }
    }
  };
}

/**
 * Get client fingerprint for abuse detection
 */
export function getClientFingerprint(event: any): string {
  const identifier = getClientIdentifier(event);
  const userAgent = getHeader(event, 'user-agent') || '';
  const acceptLanguage = getHeader(event, 'accept-language') || '';

  // Simple fingerprint combining IP, UA, and language
  return `${identifier}:${userAgent.length}:${acceptLanguage.substring(0, 10)}`;
}

/**
 * Known bot User-Agents to allow (legitimate crawlers)
 */
export const ALLOWED_BOTS = [
  'Googlebot',
  'Googlebot-Image',
  'Googlebot-News',
  'Googlebot-Video',
  'Bingbot',
  'Slurp',
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  'Sogou',
  'Exabot',
  'Facebot',
  'Applebot',
];

/**
 * Check if User-Agent is a known legitimate bot
 */
export function isAllowedBot(userAgent: string): boolean {
  return ALLOWED_BOTS.some((bot) => userAgent.includes(bot));
}
