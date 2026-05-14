/**
 * Security Headers Nitro Plugin
 *
 * Applies CSP and security headers to ALL responses (pages, API, assets).
 * This ensures full security coverage including CSP for the frontend.
 *
 * NOTE: This plugin is a fallback for API routes. Page routes get headers from
 * nuxt.config.ts routeRules. Keep CSP in sync with routeRules.
 */

// Content Security Policy - comprehensive, strict
// Sync with: /nuxt.config.ts routeRules '/**'
const cspDirectives = [
  "default-src 'self'",
  // Script sources: self + inline/eval (required for Nuxt/Vue SSR)
  // Google Tag Manager, Analytics, OAuth
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com",
  // Style sources: self + inline + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Image sources: self + data URIs + specific CDNs + blob (for canvas operations)
  "img-src 'self' data: https://*.supabase.co https://*.supabase.com https://images.unsplash.com https://*.unsplash.com https://*.pexels.com https://*.vercel.app https://*.vercel-services.com blob:",
  // Font sources: self + data URIs + Google Fonts
  "font-src 'self' data: https://fonts.gstatic.com",
  // Connect/API sources: self + analytics + Supabase (with WebSocket) + Sentry
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://*.supabase.co https://*.supabase.com wss://*.supabase.co https://accounts.google.com https://browser.sentry-cdn.com https://o*.sentry.io",
  // Frame sources: self + YouTube embeds + Vimeo
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  // Media sources: self + Supabase + blob
  "media-src 'self' https://*.supabase.co blob:",
  // Object/Embed: none (prevents Flash/PDF plugins)
  "object-src 'none'",
  // Base URI: self (prevents base tag attacks)
  "base-uri 'self'",
  // Form action: self (prevents form submission hijacking)
  "form-action 'self'",
  // Frame ancestors: none (strict clickjacking protection)
  "frame-ancestors 'none'",
  // Workers: self + blob (required for service workers)
  "worker-src 'self' blob:",
  // Manifest: self (PWA manifest)
  "manifest-src 'self'",
  // Prefetch: self
  "prefetch-src 'self'",
  // Upgrade insecure requests in production
  ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
];

// Security headers applied to all responses
const securityHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Permissions Policy: restrict sensitive APIs
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), interest-cohort=(), payment=(), fullscreen=(self)",
  "Content-Security-Policy": cspDirectives.join("; "),
};

// Production-only headers
if (process.env.NODE_ENV === 'production') {
  securityHeaders["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
}

// Cache the header entries for performance
const headerEntries = Object.entries(securityHeaders);

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("beforeResponse", (event) => {
    const response = event.res;

    // Apply security headers to every response
    // Note: Headers set here may be overridden by routeRules for page routes
    for (const [key, value] of headerEntries) {
      // Only set if not already set (prevents overwriting routeRules headers)
      if (!response.hasHeader(key)) {
        response.setHeader(key, value);
      }
    }
  });
});
