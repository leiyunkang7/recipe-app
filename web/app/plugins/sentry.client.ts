// Lazy-load Sentry only when an error occurs to reduce initial bundle size (~260KB savings)
let Sentry: typeof import('@sentry/vue') | null = null
let initialized = false

async function getSentry() {
  if (!Sentry) {
    const module = await import('@sentry/vue')
    Sentry = module
  }
  return Sentry
}

async function initSentry(nuxtApp: Parameters<typeof defineNuxtPlugin>[0]) {
  if (initialized || typeof window === 'undefined') return

  const config = useRuntimeConfig()
  if (!config.public.sentryDsn) return

  const sentry = await getSentry()

  sentry.init({
    app: nuxtApp.vueApp,
    dsn: config.public.sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      sentry.browserTracingIntegration(),
      sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    sampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    attachStacktrace: true,
    debug: process.env.NODE_ENV !== 'production',
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with inequalities',
    ],
    beforeSend(event) {
      if (event.tags) {
        event.tags.appVersion = config.public.appVersion || 'unknown'
      }
      return event
    },
  })

  nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
    getSentry().then(s => s.captureException(err, {
      extra: {
        componentName: instance?.$options?.name || 'Unknown',
        errorInfo: info,
      },
    }))
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      getSentry().then(s => s.captureException(event.reason))
    })
  }

  initialized = true
  console.log('[Sentry] Initialized successfully')
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  if (!config.public.sentryDsn) {
    console.warn('[Sentry] DSN not configured, skipping initialization')
    return
  }

  // Delay Sentry initialization to after page load
  // This saves ~260KB from initial bundle
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => initSentry(nuxtApp), 1000)
    }, { once: true })

    // Initialize on first error for faster error capture
    const handleError = () => {
      initSentry(nuxtApp)
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleError)
    }
    window.addEventListener('error', handleError, { once: true })
    window.addEventListener('unhandledrejection', handleError, { once: true })
  }
})
