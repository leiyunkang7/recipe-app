/**
 * Vue Gtag - Google Analytics 4 Plugin
 *
 * Provides GA4 tracking via gtag.js
 * Funnel events tracked:
 * - page_view: Homepage/listing page views
 * - view_recipe: Recipe detail views
 * - start_cooking: User enters cooking mode
 * - step_complete: User completes a cooking step
 * - finish_cooking: User finishes all cooking steps
 * - search: User performs a search
 * - filter: User applies filters
 */

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const router = useRouter()
  const gaId = config.public.gaId as string | undefined

  if (!gaId || !import.meta.client) {
    console.warn('[Analytics] GA_ID not configured - analytics disabled')
    return
  }

  // Load gtag script
  useHead({
    script: [
      {
        src: 'https://www.googletagmanager.com/gtag/js?id=' + gaId,
        async: true,
        tagPosition: 'head',
      },
    ],
  })

  // Initialize gtag
  window.dataLayer = window.dataLayer || []
  function gtag(...args: any[]) {
    window.dataLayer.push(arguments)
  }
  gtag('js', new Date())
  gtag('config', gaId, { send_page_view: true })

  // Track page views on route change
  router.afterEach((to) => {
    nextTick(() => {
      gtag('event', 'page_view', {
        page_path: to.fullPath,
        page_location: window.location.href,
      })
    })
  })

  // Provide gtag globally
  nuxtApp.provide('gtag', gtag)
})

// Extend Window interface
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}
