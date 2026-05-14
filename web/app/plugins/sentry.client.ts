// Lazy-load Sentry only when an error occurs to reduce initial bundle size (~260KB savings)
let Sentry: typeof import("@sentry/vue") | null = null
let initialized = false
const pendingErrors: Array<{ error: Error; context?: Record<string, unknown> }> = []

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
  const isProduction = process.env.NODE_ENV === "production"
  const tracesSampleRate = isProduction ? 0.05 : 1.0

  sentry.init({
    app: nuxtApp.vueApp,
    dsn: config.public.sentryDsn,
    environment: isProduction ? "production" : (process.env.NODE_ENV || "development"),
    integrations: [
      sentry.browserTracingIntegration({
        tracePropagationTargets: [
          "localhost",
          /^\/api\//,
          /^\/recipes\//,
          /\.vercel\.app$/,
        ],
        instrumentPageLoad: true,
        instrumentNavigation: true,
        markBackgroundTasks: true,
      }),
      sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
        replaysSessionSampleRate: isProduction ? 0.05 : 0.1,
        replaysOnErrorSampleRate: 1.0,
        stickySession: true,
      }),
      sentry.feedbackIntegration({
        colorScheme: "auto",
        useSentryUserFeedback: true,
      }),
    ],
    tracesSampleRate,
    sampleRate: 1.0,
    attachStacktrace: true,
    debug: !isProduction,
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with inequalities",
      "ResizeObserver loop completed with inequalities'",
      "Failed to fetch",
      "Network request failed",
      "Failed to load resource",
      "net::ERR_",
      "Non-Error promise rejection captured with keys:",
    ],
    denyUrls: [
      /extensions\//i,
      /chrome-extension:\/\//i,
      /moz-extension:\/\//i,
    ],
    beforeSend(event) {
      if (event.tags) {
        event.tags.appVersion = config.public.appVersion || "unknown"
        event.tags.appEnvironment = process.env.NODE_ENV || "unknown"
        event.tags.vueVersion = nuxtApp.vueApp.version
      }
      if (event.extra && typeof event.extra === "object") {
        delete (event.extra as Record<string, unknown>)["NuxtState"]
      }
      return event
    },
    trackComponents: true,
    sendDefaultPii: false,
  })

  nuxtApp.hook("app:mounted", () => {
    try {
      const { user } = useAuth()
      watch(user, (newUser) => {
        if (initialized) {
          getSentry().then(s => {
            if (newUser?.id) {
              s.setUser({ id: newUser.id, email: newUser.email })
            } else {
              s.setUser(null)
            }
          })
        }
      }, { immediate: true })
    } catch (_error) {}
  })

  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    getSentry().then(s => s.captureException(err, {
      extra: {
        componentName: instance?.$options?.name || "Unknown",
        errorInfo: info,
        componentStack: instance ? getComponentStack(instance) : undefined,
      },
      tags: { errorType: "vue" },
    }))
  }

  if (typeof window !== "undefined") {
    window.addEventListener("unhandledrejection", (event) => {
      if (event.reason?.name === "AbortError") return
      getSentry().then(s => s.captureException(event.reason || new Error("Unhandled Promise Rejection"), {
        tags: { errorType: "unhandledRejection" },
      }))
    })
    window.addEventListener("error", (event) => {
      if (event.target && event.target !== window) return
      getSentry().then(s => s.captureException(event.error || new Error("Uncaught Error"), {
        tags: { errorType: "uncaught" },
      }))
    })
  }

  if (pendingErrors.length > 0) {
    const sentry = await getSentry()
    pendingErrors.forEach(({ error, context }) => {
      sentry.captureException(error, {
        extra: context,
        tags: { source: "preInit" },
      })
    })
    pendingErrors.length = 0
  }

  initialized = true
  console.log("[Sentry] Client initialized successfully")
}

function getComponentStack(instance: unknown): string | undefined {
  if (!instance) return undefined
  try {
    const components: string[] = []
    let current: unknown = instance
    while (current && components.length < 10) {
      const name = (current as { $options?: { name?: string } }).$options?.name
      if (name) components.push(name)
      current = (current as { $parent?: unknown }).$parent
    }
    return components.join(" > ")
  } catch {
    return undefined
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  if (!config.public.sentryDsn) {
    console.warn("[Sentry] DSN not configured, skipping initialization")
    return
  }
  nuxtApp.provide("sentry", {
    captureException: (error: Error, context?: Record<string, unknown>) => {
      if (!initialized) {
        pendingErrors.push({ error, context })
        return
      }
      getSentry().then(s => s.captureException(error, {
        extra: context,
        tags: { source: "plugin" },
      }))
    },
    captureMessage: (message: string, level?: "fatal" | "error" | "warning" | "info" | "debug") => {
      if (!initialized) return
      getSentry().then(s => s.captureMessage(message, level))
    },
    setUser: (user: { id: string; email?: string } | null) => {
      if (initialized) {
        getSentry().then(s => s.setUser(user))
      }
    },
    addBreadcrumb: (breadcrumb: { category: string; message: string; data?: Record<string, unknown> }) => {
      if (initialized) {
        getSentry().then(s => s.addBreadcrumb(breadcrumb.message, {
          category: breadcrumb.category,
          data: breadcrumb.data,
        }))
      }
    },
  })
  if (typeof window !== "undefined") {
    window.addEventListener("load", () => {
      setTimeout(() => initSentry(nuxtApp), 1000)
    }, { once: true })
    const handleError = () => {
      initSentry(nuxtApp)
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleError)
    }
    window.addEventListener("error", handleError, { once: true })
    window.addEventListener("unhandledrejection", handleError, { once: true })
  }
})

declare module "#app" {
  interface NuxtApp {
    $sentry: {
      captureException: (error: Error, context?: Record<string, unknown>) => void
      captureMessage: (message: string, level?: "fatal" | "error" | "warning" | "info" | "debug") => void
      setUser: (user: { id: string; email?: string } | null) => void
      addBreadcrumb: (breadcrumb: { category: string; message: string; data?: Record<string, unknown> }) => void
    }
  }
}
