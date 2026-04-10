/**
 * Sentry Server-Side Integration for Nitro
 * Provides comprehensive error tracking and performance monitoring for the server
 */

import * as Sentry from "@sentry/node"
import { requestHandler, tracingHandler } from "@sentry/node"

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()
  if (!config.public.sentryDsn) {
    console.warn("[Sentry Server] DSN not configured, skipping server-side initialization")
    return
  }

  const isProduction = process.env.NODE_ENV === "production"
  const tracesSampleRate = isProduction ? 0.05 : 1.0

  Sentry.init({
    dsn: config.public.sentryDsn,
    environment: isProduction ? "production" : (process.env.NODE_ENV || "development"),
    integrations: [
      // Enable HTTP tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Node.js profiling
      new Sentry.Integrations.ProfilingIntegration(),
      // Enable node auto patching for fs, http, etc.
      new Sentry.Integrations.NodeBuiltInHints(),
    ],
    tracesSampleRate,
    sampleRate: 1.0,
    attachStacktrace: true,
    debug: !isProduction,
    enabled: isProduction || process.env.SENTRY_ENABLED === "true",
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with inequalities",
      "ECONNRESET",
      "ETIMEDOUT",
      "socket hang up",
    ],
    beforeSend(event) {
      if (event.tags) {
        event.tags.appVersion = config.public.appVersion || "unknown"
      }
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers["authorization"]
        delete event.request.headers["cookie"]
        delete event.request.headers["x-api-key"]
      }
      // Sanitize request URL
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url)
          // Remove query params that might contain sensitive data
          event.request.url = url.pathname
        } catch (_e) { /* ignore */ }
      }
      return event
    },
  })

  // Enable request handler and tracing middleware
  nitroApp.router.use(requestHandler as any)
  nitroApp.router.use(tracingHandler as any)

  // Capture Nitro errors
  nitroApp.hooks.hook("error", (error) => {
    console.error("[Sentry Server] Nitro error:", error)
    Sentry.captureException(error, {
      tags: { source: "nitro", type: "server-error" },
      extra: { framework: "nitro" },
    })
  })

  // Set user context for each request
  nitroApp.hooks.hook("request", (event) => {
    try {
      // Try to get user from session or auth context
      const session = event.context.session
      const userId = event.context.userId || session?.userId
      if (userId) {
        Sentry.setUser({ id: String(userId) })
      }
    } catch (_e) { /* ignore */ }
  })

  // Clear user context after response
  nitroApp.hooks.hook("afterResponse", () => {
    Sentry.setUser(null)
  })

  console.log("[Sentry Server] Initialized successfully")
})
