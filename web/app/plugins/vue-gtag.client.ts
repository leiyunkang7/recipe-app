/**
 * Vue Gtag - Google Analytics 4 Plugin
 *
 * Provides GA4 tracking with Funnel Analysis support
 *
 * Funnel Events (mark as conversions in GA4):
 * 1. page_view → view_recipe → start_cooking → step_complete → finish_cooking
 *
 * Conversion Events:
 * - view_recipe: Recipe detail views
 * - start_cooking: User enters cooking mode
 * - finish_cooking: User finishes all cooking steps
 * - add_favorite: User adds recipe to favorites
 * - search_query: User performs a search
 *
 * Custom Dimensions (configure in GA4 Admin > Custom definitions):
 * - funnel_step: Current step in funnel (homepage, recipe_detail, cooking_mode, etc.)
 * - recipe_id: Unique recipe identifier
 * - recipe_category: Recipe category (breakfast, lunch, dinner, etc.)
 * - step_number: Current cooking step number
 * - total_steps: Total number of cooking steps
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
  function gtag(..._args: unknown[]) {
    window.dataLayer.push(arguments)
  }
  gtag('js', new Date())

  // GA4 Configuration with Funnel Support
  gtag('config', gaId, {
    send_page_view: true,
    cookie_flags: 'SameSite=None;Secure',
    // Funnel analysis custom dimensions
    custom_map: {
      funnel_step: 'funnel_step',
      recipe_id: 'custom_event:recipe_id',
      recipe_category: 'custom_event:recipe_category',
      step_number: 'custom_event:step_number',
      total_steps: 'custom_event:total_steps',
      search_query: 'custom_event:search_query',
      results_count: 'custom_event:results_count',
      filter_type: 'custom_event:filter_type',
      filter_value: 'custom_event:filter_value',
    },
    // Enhanced measurement settings
    enable_enhanced_measurement: true,
    // Cookie consent mode
    cookie_domain: 'auto',
    cookie_expires: 63072000, // 2 years in seconds
  })

  // Conversion event configuration
  // These events will be marked as conversions in GA4
  const conversionEvents = [
    'view_recipe',
    'start_cooking',
    'finish_cooking',
    'add_favorite',
    'search_query',
  ]

  // Set conversion flags for key funnel events
  conversionEvents.forEach((event) => {
    gtag('event', event, {
      send_to: gaId,
      is_conversion: true,
    })
  })

  // Track page views on route change with funnel step
  router.afterEach((to) => {
    nextTick(() => {
      const path = to.fullPath
      let funnelStep = 'other'

      // Determine funnel step based on path
      if (path === '/' || path === '/recipes' || path === '/zh-CN' || path === '/ja') {
        funnelStep = 'homepage'
      } else if (path.match(/^\/recipes\/[^/]+$/) || path.match(/^\/zh-CN\/recipes\/[^/]+$/) || path.match(/^\/ja\/recipes\/[^/]+$/)) {
        funnelStep = 'recipe_detail'
      } else if (path.includes('/admin')) {
        funnelStep = 'admin'
      } else if (path.includes('/favorites')) {
        funnelStep = 'favorites'
      } else if (path.includes('/profile')) {
        funnelStep = 'profile'
      } else if (path.includes('/login') || path.includes('/register')) {
        funnelStep = 'auth'
      }

      gtag('event', 'page_view', {
        page_path: path,
        page_location: window.location.href,
        funnel_step: funnelStep,
        page_title: document.title,
      })
    })
  })

  // Provide gtag globally
  nuxtApp.provide('gtag', gtag)
})

// Extend Window interface
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}
