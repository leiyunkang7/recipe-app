import * as Sentry from '@sentry/vue'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  if (!config.public.sentryDsn) {
    console.warn('[Sentry] DSN not configured, skipping initialization')
    return
  }

  Sentry.init({
    app: nuxtApp.vueApp,
    dsn: config.public.sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
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
    Sentry.captureException(err, {
      extra: {
        componentName: instance?.$options?.name || 'Unknown',
        errorInfo: info,
      },
    })
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      Sentry.captureException(event.reason)
    })
  }

  console.log('[Sentry] Initialized successfully')
})
