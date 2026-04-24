/**
 * Sentry Nitro Server Plugin
 *
 * Catches server-side errors in Nitro API routes and server middleware.
 * This ensures errors from server routes, middleware, and Nitro internals
 * are captured and reported to Sentry.
 *
 * Requires: @sentry/node (already in package.json dependencies)
 * Env: SENTRY_DSN, NODE_ENV, SENTRY_SERVER_SAMPLE_RATE
 */

import * as Sentry from '@sentry/node'

interface SentryPluginOptions {
  dsn?: string
  environment?: string
  tracesSampleRate?: number
  sampleRate?: number
  enabled?: boolean
}

const DEFAULT_OPTIONS: Required<SentryPluginOptions> = {
  dsn: '',
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  sampleRate: 1.0,
  enabled: true,
}

export default defineNitroPlugin((nitroApp) => {
  const options: SentryPluginOptions = {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.SENTRY_SERVER_SAMPLE_RATE
      ? parseFloat(process.env.SENTRY_SERVER_SAMPLE_RATE)
      : process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
    sampleRate: 1.0,
    enabled: process.env.SENTRY_ENABLED !== 'false' && !!process.env.SENTRY_DSN,
  }

  // Merge with defaults
  const merged = { ...DEFAULT_OPTIONS, ...options }

  if (!merged.enabled || !merged.dsn) {
    if (process.env.SENTRY_DSN && process.env.SENTRY_ENABLED === 'false') {
      console.warn('[Sentry][Server] SENTRY_ENABLED=false, skipping initialization')
    } else if (!process.env.SENTRY_DSN) {
      console.warn('[Sentry][Server] SENTRY_DSN not set, skipping initialization')
    }
    return
  }

  const isProduction = merged.environment === 'production'

  Sentry.init({
    dsn: merged.dsn,
    environment: merged.environment,
    // Use esmBuilder instrumentor for Nitro (modern Node.js)
    instrumenter: 'node',
    integrations: [
      // HTTP server tracing
      new Sentry.HttpIntegration({
        tracing: true,
        // Don't trace health check endpoints
        filter(scope) {
          scope.addEventProcessor((event) => {
            // Skip health check pings
            if (event.request?.url?.includes('/api/health') || event.request?.url?.includes('/_health')) {
              return null
            }
            return event
          })
        },
      }),
      // Intra-process context propagation (for queues, workers)
      new Sentry.ContextLines(),
      // Local variables debugging (limited to non-production)
      new Sentry.LocalVariablesSync({
        captureAllExceptions: isProduction ? false : true,
      }),
      // Node profiler for performance
      ...(isProduction
        ? [
            new Sentry.ProfilingIntegration(),
          ]
        : []),
    ],
    tracesSampleRate: merged.tracesSampleRate,
    sampleRate: merged.sampleRate,
    // Attach stack traces to messages
    attachStacktrace: true,
    // Set SDK info so events are properly categorized
    sdkMetadata: {
      npm_pkg_name: 'recipe-app',
      runtime: 'node',
      framework: 'nitro/nuxt',
    },
    // Ignore specific server-side noise
    ignoreErrors: [
      'ECONNREFUSED', // Database/service not ready
      'ETIMEDOUT',
      'ENOTFOUND',
      'Socket closed',
      'SyntaxError: Unexpected end of JSON input', // May be client issue
      'AbortError', // Client-initiated aborts
    ],
    // Deny list for sensitive endpoints
    denyUrls: [
      /\/api\/auth\/login$/i, // Don't capture auth endpoint errors (they're handled)
      /\/admin\/api\/secret/i,
    ],
    beforeSend(event) {
      // Add server metadata
      if (!event.tags) event.tags = {}
      event.tags.serverRuntime = 'nitro'
      event.tags.nodeVersion = process.version
      event.tags.appVersion = process.env.APP_VERSION || 'unknown'

      // Remove PII from query parameters
      if (event.request?.query) {
        const cleanQuery = { ...event.request.query } as Record<string, string>
        const sensitiveParams = ['password', 'token', 'secret', 'key', 'authorization']
        for (const key of Object.keys(cleanQuery)) {
          if (sensitiveParams.some((p) => key.toLowerCase().includes(p))) {
            cleanQuery[key] = '[REDACTED]'
          }
        }
        event.request.query = cleanQuery
      }

      return event
    },
  })

  // Capture unhandled errors from Nitro
  nitroApp.hooks.hook('error', (error) => {
    Sentry.captureException(error, {
      tags: {
        source: 'nitro-error-hook',
        runtime: 'nitro',
      },
    })
    console.error('[Sentry][Nitro] Error caught by error hook:', error.message)
  })

  // Capture async errors from Nitro
  nitroApp.hooks.hook('request', (event) => {
    // Add request context to current scope
    Sentry.withScope((scope) => {
      scope.setTag('nitro_request', true)
      if (event.path) scope.setTag('request_path', event.path)
      if (event.method) scope.setTag('request_method', event.method)
    })
  })

  // Global error handlers for Node.js
  process.on('uncaughtException', (error) => {
    Sentry.captureException(error, {
      tags: { source: 'uncaughtException', runtime: 'node' },
    })
    console.error('[Sentry][Server] Uncaught Exception:', error.message)
    // Don't exit in production - let the process handle graceful shutdown
    if (!isProduction) {
      console.error(error.stack)
    }
  })

  process.on('unhandledRejection', (reason, promise) => {
    // Ignore AbortError (client-initiated fetch aborts)
    if (reason instanceof Error && reason.name === 'AbortError') return

    Sentry.captureException(
      reason instanceof Error ? reason : new Error(String(reason)),
      {
        tags: { source: 'unhandledRejection', runtime: 'node' },
        extra: { promise: String(promise) },
      },
    )
    if (!isProduction) {
      console.error('[Sentry][Server] Unhandled Rejection:', reason)
    }
  })

  console.log(
    `[Sentry][Server] Initialized (env=${merged.environment}, tracesSampleRate=${merged.tracesSampleRate})`,
  )
})

// Export for use in server routes
export { Sentry }
