/**
 * Vercel Analytics Plugin (@vercel/analytics v2.x)
 *
 * Provides lightweight pageview and custom event tracking via Vercel's
 * edge analytics infrastructure. Vercel Analytics dashboard shows:
 * - Page views over time
 * - Top pages
 * - Traffic sources
 * - Real-time visitors
 *
 * For funnel/conversion analytics, see useAnalytics() composable (GA4).
 * For Core Web Vitals, see web-vitals.client.ts.
 */

import { inject, pageview } from '@vercel/analytics'

export default defineNuxtPlugin((nuxtApp) => {
  // Initialize Vercel Analytics (injects the analytics script)
  inject()

  // Track pageviews on route changes
  const router = useRouter()

  router.afterEach((to) => {
    // pageview() sends the new path to Vercel Analytics
    // Calling after IGT paint ensures the DOM is ready
    if (import.meta.client) {
      nextTick(() => {
        pageview({
          path: to.fullPath,
          name: document.title,
        })
      })
    }
  })
})
