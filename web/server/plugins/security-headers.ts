/**
 * Security Headers Nitro Plugin
 *
 * Applies CSP and security headers to ALL responses (pages, API, assets).
 * This ensures full security coverage including CSP for the frontend.
 */

// Security headers applied to all responses
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Content-Security-Policy": [
    // Base restrictions
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    // External services (Supabase, Google, Sentry)
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://browser.sentry-cdn.com https://o*.sentry.io",
    "frame-src 'self' https://www.google.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Worker restrictions
    "worker-src 'self' blob:",
    // Manifest for PWA
    "manifest-src 'self'",
  ].join("; "),
};

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("beforeResponse", (event) => {
    const response = event.res;

    // Apply security headers to every response
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.setHeader(key, value);
    }
  });
});
