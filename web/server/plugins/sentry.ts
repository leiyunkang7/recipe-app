/**
 * Sentry Server-Side Integration for Nitro
 */

import * as Sentry from "@sentry/node"

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()
  if (!config.public.sentryDsn) {
    console.warn("[Sentry Server] DSN not configured, skipping server-side initialization")
    return
  }

  Sentry.init({
    dsn: config.public.sentryDsn,
    environment: process.env.NODE_ENV || "development",
    integrations: [],
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    enabled: process.env.NODE_ENV === "production" || process.env.SENTRY_ENABLED === "true",
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with inequalities",
    ],
    beforeSend(event) {
      if (event.tags) {
        event.tags.appVersion = config.public.appVersion || "unknown"
      }
      if (event.request?.headers) {
        delete event.request.headers["authorization"]
        delete event.request.headers["cookie"]
      }
      return event
    },
  })

  nitroApp.hooks.hook("error", (error) => {
    console.error("[Sentry Server] Nitro error:", error)
    Sentry.captureException(error, { tags: { source: "nitro" } })
  })

  nitroApp.hooks.hook("request", (event) => {
    try {
      const session = event.context.session
      if (session?.userId) {
        Sentry.setUser({ id: session.userId })
      }
    } catch {}
  })

  nitroApp.hooks.hook("afterResponse", () => {
    Sentry.setUser(null)
  })

  console.log("[Sentry Server] Initialized successfully")
})
