// Lazy-load Sentry only when an error occurs to reduce initial bundle size (~260KB savings)
let Sentry: typeof import("@sentry/vue") | null = null
let initialized = false
const pendingErrors: Error[] = []

async function getSentry() {
  if (!Sentry) {
    const module = await import("@sentry/vue")
    Sentry = module
  }
  return Sentry
}

async function initSentry(nuxtApp: Parameters<typeof defineNuxtPlugin>[0]) {
  if (initialized || typeof window === "undefined") return

  const config = useRuntimeConfig()
  if (!config.public.sentryDsn) return

  const sentry = await getSentry()

  // Performance monitoring configuration
  const tracesSampleRate = process.env.NODE_ENV === "production" ? 0.1 : 1.0

  sentry.init({
    app: nuxtApp.vueApp,
    dsn: config.public.sentryDsn,
    environment: process.env.NODE_ENV || "development",
    integrations: [
      sentry.browserTracingIntegration({
        // Trace navigation and API requests
        tracePropagationTargets: ["localhost", /^\/api\//, /^\//],
        instrumentPageLoad: true,
        instrumentNavigation: true,
      }),
      sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      }),
    ],
    tracesSampleRate,
    sampleRate: 1.0,
    attachStacktrace: true,
    debug: process.env.NODE_ENV !== "production",
    // Ignore known benign errors
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with inequalities",
      "Failed to fetch",
      "Network request failed",
    ],
    // Add app version to all events for filtering
    beforeSend(event) {
      if (event.tags) {
        event.tags.appVersion = config.public.appVersion || "unknown"
        event.tags.appEnvironment = process.env.NODE_ENV || "unknown"
      }
      return event
    },
    // Enable automatic Vue component tracking
    trackComponents: true,
  })

  // Set user context when available (after auth)
  if (import.meta.client) {
    try {
      const { user } = useAuth()
      if (user.value?.id) {
        sentry.setUser({ id: user.value.id })
      }
    } catch {}
  }

  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    getSentry().then(s => s.captureException(err, {
      extra: {
        componentName: instance?.$options?.name || "Unknown",
        errorInfo: info,
      },
    }))
  }

  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
      getSentry().then(s => s.captureException(event.reason))
    })
  }

  // Flush any pending errors
  if (pendingErrors.length > 0) {
    pendingErrors.forEach(err => {
      sentry.captureException(err, { tags: { source: "errorBoundary" } })
    })
    pendingErrors.length = 0
  }

  initialized = true
  console.log("[Sentry] Initialized successfully")
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  if (!config.public.sentryDsn) {
    console.warn("[Sentry] DSN not configured, skipping initialization")
    return
  }

  // Provide a function to capture errors from ErrorBoundary
  nuxtApp.provide("sentry", {
    captureException: (error: Error, context?: Record<string, unknown>) => {
      if (!initialized) {
        pendingErrors.push(error)
        return
      }
      getSentry().then(s => s.captureException(error, {
        extra: context,
        tags: { source: "errorBoundary" },
      }))
    },
    setUser: (user: { id: string } | null) => {
      if (initialized) {
        getSentry().then(s => s.setUser(user))
      }
    },
  })

  // Delay Sentry initialization to after page load
  // This saves ~260KB from initial bundle
  if (typeof window !== "undefined") {
    window.addEventListener("load", () => {
      setTimeout(() => initSentry(nuxtApp), 1000)
    }, { once: true })

    // Initialize on first error for faster error capture
    const handleError = () => {
      initSentry(nuxtApp)
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleError)
    }
    window.addEventListener("error", handleError, { once: true })
    window.addEventListener("unhandledrejection", handleError, { once: true })
  }
})

// Type augmentation for Nuxt plugin
declare module "#app" {
  interface NuxtApp {
    $sentry: {
      captureException: (error: Error, context?: Record<string, unknown>) => void
      setUser: (user: { id: string } | null) => void
    }
  }
}
