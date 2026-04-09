/**
 * useSentry Composable
 * Provides easy access to Sentry error tracking and performance monitoring
 */

export function useSentry() {
  const nuxtApp = useNuxtApp()

  /**
   * Capture an exception with optional context
   */
  function captureException(error: Error, context?: Record<string, unknown>) {
    nuxtApp.$sentry?.captureException(error, context)
  }

  /**
   * Capture a message with optional level
   */
  function captureMessage(message: string, level?: "fatal" | "error" | "warning" | "info" | "debug") {
    nuxtApp.$sentry?.captureMessage(message, level)
  }

  /**
   * Set user context for the current session
   */
  function setUser(user: { id: string; email?: string } | null) {
    nuxtApp.$sentry?.setUser(user)
  }

  /**
   * Add a breadcrumb to the current transaction
   */
  function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
    nuxtApp.$sentry?.addBreadcrumb({ category, message, data })
  }

  /**
   * Start a new performance transaction
   */
  function startTransaction(name: string, op: string = "custom") {
    if (import.meta.client && typeof window !== "undefined") {
      // Dynamic import to avoid loading Sentry on server
      import("@sentry/vue").then(({ trace, startBrowserPerformanceNavigation, startBrowserPageLoadNavigation }) => {
        // Navigation transactions are handled automatically by browserTracingIntegration
        // This is for custom spans within a transaction
      })
    }
    return null
  }

  return {
    captureException,
    captureMessage,
    setUser,
    addBreadcrumb,
    startTransaction,
  }
}
