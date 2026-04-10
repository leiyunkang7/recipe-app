/**
 * useSentry Composable
 * Provides easy access to Sentry error tracking and performance monitoring
 */
export function useSentry() {
  const nuxtApp = useNuxtApp()

  // Access the injected Sentry instance from the plugin
  const sentry = computed(() => nuxtApp.$sentry as {
    captureException: (error: Error, context?: Record<string, unknown>) => void
    captureMessage: (message: string, level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug') => void
    setUser: (user: { id: string; email?: string } | null) => void
    addBreadcrumb: (breadcrumb: { category: string; message: string; data?: Record<string, unknown> }) => void
  } | undefined)

  /**
   * Capture an exception with optional context
   */
  function captureException(error: Error, context?: Record<string, unknown>) {
    sentry.value?.captureException(error, context)
  }

  /**
   * Capture a message with optional level
   */
  function captureMessage(message: string, level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug') {
    sentry.value?.captureMessage(message, level)
  }

  /**
   * Set user context for the current session
   */
  function setUser(user: { id: string; email?: string } | null) {
    sentry.value?.setUser(user)
  }

  /**
   * Add a breadcrumb to the current transaction
   */
  function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
    sentry.value?.addBreadcrumb({ category, message, data })
  }

  /**
   * Start a custom performance span
   * Note: For Vue components, transactions are tracked automatically via browserTracingIntegration
   */
  async function startSpan(name: string, op: string = 'custom', fn: () => Promise<unknown> | unknown) {
    if (!import.meta.client) return await fn()

    const sentryModule = await import('@sentry/vue')
    const span = sentryModule.startSpan({ name, op }, async () => {
      return await fn()
    })
    return span
  }

  return {
    sentry,
    captureException,
    captureMessage,
    setUser,
    addBreadcrumb,
    startSpan,
  }
}
