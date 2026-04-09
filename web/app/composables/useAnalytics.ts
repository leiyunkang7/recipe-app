/**
 * useAnalytics - GA4 Funnel Analytics Composable
 *
 * Provides structured tracking for recipe app funnel analysis
 *
 * Funnel Steps:
 * 1. homepage_view - User lands on homepage/recipe listing
 * 2. recipe_detail_view - User views recipe detail page
 * 3. cooking_mode_start - User enters cooking mode
 * 4. cooking_step_complete - User completes a cooking step
 * 5. cooking_finish - User finishes cooking (all steps complete)
 * 6. add_favorite - User adds recipe to favorites
 * 7. search_query - User performs a search
 * 8. filter_apply - User applies filters
 *
 * Conversion Events (mark in GA4 Admin):
 * - view_recipe
 * - start_cooking
 * - finish_cooking
 * - add_favorite
 * - search_query
 */

import type { Recipe } from '~/types'

export interface FunnelEventParams {
  recipe_id?: string
  recipe_name?: string
  recipe_category?: string
  step_number?: number
  total_steps?: number
  search_query?: string
  filter_type?: string
  filter_value?: string
  page_name?: string
  results_count?: number
  timestamp?: string
  path?: string
  funnel_step?: FunnelStep
  time_on_step?: number
  [key: string]: unknown
}

export type FunnelStep =
  | 'homepage'
  | 'recipe_listing'
  | 'recipe_detail'
  | 'cooking_mode'
  | 'cooking_complete'
  | 'favorites'
  | 'search'
  | 'profile'
  | 'auth'
  | 'other'

const FunnelEvents = {
  PAGE_VIEW: 'page_view',
  VIEW_RECIPE: 'view_recipe',
  START_COOKING: 'start_cooking',
  STEP_COMPLETE: 'step_complete',
  FINISH_COOKING: 'finish_cooking',
  ADD_FAVORITE: 'add_favorite',
  REMOVE_FAVORITE: 'remove_favorite',
  SEARCH_QUERY: 'search_query',
  FILTER_APPLY: 'filter_apply',
  SHARE_RECIPE: 'share_recipe',
  TIMER_START: 'timer_start',
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
} as const

// Funnel step definitions for consistent tracking
const FunnelSteps = {
  HOMEPAGE: 'homepage' as FunnelStep,
  RECIPE_LISTING: 'recipe_listing' as FunnelStep,
  RECIPE_DETAIL: 'recipe_detail' as FunnelStep,
  COOKING_MODE: 'cooking_mode' as FunnelStep,
  COOKING_COMPLETE: 'cooking_complete' as FunnelStep,
  FAVORITES: 'favorites' as FunnelStep,
  SEARCH: 'search' as FunnelStep,
  PROFILE: 'profile' as FunnelStep,
  AUTH: 'auth' as FunnelStep,
  OTHER: 'other' as FunnelStep,
}

export function useAnalytics() {
  const route = useRoute()

  /**
   * Core event tracking function
   * Sends event to GA4 with funnel parameters
   */
  const trackEvent = (eventName: string, params?: FunnelEventParams) => {
    if (import.meta.client && typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        ...params,
        timestamp: new Date().toISOString(),
        path: route.path,
        // Always include funnel context if available
        funnel_source: 'recipe_app',
      })
    }
  }

  /**
   * Track page views with funnel step detection
   */
  const trackPageView = (pageName: string, additionalParams?: FunnelEventParams) => {
    const funnelStep = detectFunnelStep(route.path)
    trackEvent(FunnelEvents.PAGE_VIEW, {
      page_name: pageName,
      funnel_step: funnelStep,
      ...additionalParams,
    })
  }

  /**
   * Detect funnel step from URL path
   */
  const detectFunnelStep = (path: string): FunnelStep => {
    if (path === '/' || path === '/zh-CN' || path === '/ja') {
      return FunnelSteps.HOMEPAGE
    }
    if (path === '/recipes' || path.includes('/recipes?')) {
      return FunnelSteps.RECIPE_LISTING
    }
    if (path.match(/^\/recipes\/[^/]+$/) || path.match(/^\/zh-CN\/recipes\/[^/]+$/) || path.match(/^\/ja\/recipes\/[^/]+$/)) {
      return FunnelSteps.RECIPE_DETAIL
    }
    if (path.includes('/favorites')) {
      return FunnelSteps.FAVORITES
    }
    if (path.includes('/profile')) {
      return FunnelSteps.PROFILE
    }
    if (path.includes('/login') || path.includes('/register')) {
      return FunnelSteps.AUTH
    }
    if (path.includes('/search') || path.includes('?')) {
      return FunnelSteps.SEARCH
    }
    return FunnelSteps.OTHER
  }

  /**
   * Track recipe detail view (Conversion event)
   */
  const trackRecipeView = (recipe: Recipe) => {
    trackEvent(FunnelEvents.VIEW_RECIPE, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
      recipe_category: recipe.category,
      funnel_step: FunnelSteps.RECIPE_DETAIL,
      // Mark as conversion
      conversion: true,
    })
  }

  /**
   * Track cooking mode start (Conversion event)
   */
  const trackCookingStart = (recipe: Recipe) => {
    trackEvent(FunnelEvents.START_COOKING, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
      total_steps: recipe.steps?.length || 0,
      funnel_step: FunnelSteps.COOKING_MODE,
      conversion: true,
    })
  }

  /**
   * Track individual cooking step completion
   */
  const trackStepComplete = (recipe: Recipe, stepNumber: number, timeSpent?: number) => {
    trackEvent(FunnelEvents.STEP_COMPLETE, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
      step_number: stepNumber,
      total_steps: recipe.steps?.length || 0,
      funnel_step: FunnelSteps.COOKING_MODE,
      time_on_step: timeSpent,
    })
  }

  /**
   * Track cooking completion (Conversion event)
   */
  const trackCookingFinish = (recipe: Recipe, totalTimeSpent?: number) => {
    trackEvent(FunnelEvents.FINISH_COOKING, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
      funnel_step: FunnelSteps.COOKING_COMPLETE,
      total_time_spent: totalTimeSpent,
      conversion: true,
    })
  }

  /**
   * Track favorite add (Conversion event)
   */
  const trackAddFavorite = (recipe: Recipe) => {
    trackEvent(FunnelEvents.ADD_FAVORITE, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
      recipe_category: recipe.category,
      funnel_step: FunnelSteps.RECIPE_DETAIL,
      conversion: true,
    })
  }

  /**
   * Track favorite remove
   */
  const trackRemoveFavorite = (recipe: Recipe) => {
    trackEvent(FunnelEvents.REMOVE_FAVORITE, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
      recipe_category: recipe.category,
    })
  }

  /**
   * Track search query (Conversion event)
   */
  const trackSearch = (query: string, resultsCount: number) => {
    trackEvent(FunnelEvents.SEARCH_QUERY, {
      search_query: query,
      results_count: resultsCount,
      funnel_step: FunnelSteps.SEARCH,
      conversion: true,
    })
  }

  /**
   * Track filter application
   */
  const trackFilter = (filterType: string, filterValue: string, resultsCount?: number) => {
    trackEvent(FunnelEvents.FILTER_APPLY, {
      filter_type: filterType,
      filter_value: filterValue,
      results_count: resultsCount,
      funnel_step: FunnelSteps.RECIPE_LISTING,
    })
  }

  /**
   * Track recipe share
   */
  const trackShare = (recipe: Recipe) => {
    trackEvent(FunnelEvents.SHARE_RECIPE, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
      funnel_step: FunnelSteps.RECIPE_DETAIL,
    })
  }

  /**
   * Track timer start
   */
  const trackTimerStart = (recipe: Recipe, stepNumber: number) => {
    trackEvent(FunnelEvents.TIMER_START, {
      recipe_id: recipe.id,
      step_number: stepNumber,
      funnel_step: FunnelSteps.COOKING_MODE,
    })
  }

  /**
   * Track user signup (Conversion event)
   */
  const trackUserSignup = (method: 'email' | 'google' | 'github') => {
    trackEvent(FunnelEvents.USER_SIGNUP, {
      signup_method: method,
      funnel_step: FunnelSteps.AUTH,
      conversion: true,
    })
  }

  /**
   * Track user login (Conversion event)
   */
  const trackUserLogin = (method: 'email' | 'google' | 'github') => {
    trackEvent(FunnelEvents.USER_LOGIN, {
      login_method: method,
      funnel_step: FunnelSteps.AUTH,
      conversion: true,
    })
  }

  /**
   * Track funnel progression
   * Use this to track user progression through the funnel
   */
  const trackFunnelStep = (step: FunnelStep, metadata?: Record<string, unknown>) => {
    trackEvent('funnel_step', {
      funnel_step: step,
      ...metadata,
    })
  }

  return {
    // Core tracking
    trackEvent,
    trackPageView,
    trackFunnelStep,
    // Recipe events
    trackRecipeView,
    trackCookingStart,
    trackStepComplete,
    trackCookingFinish,
    trackAddFavorite,
    trackRemoveFavorite,
    trackShare,
    trackTimerStart,
    // Discovery events
    trackSearch,
    trackFilter,
    // Auth events
    trackUserSignup,
    trackUserLogin,
    // Utilities
    detectFunnelStep,
    FunnelSteps,
    FunnelEvents,
  }
}
