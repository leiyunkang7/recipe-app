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
  [key: string]: unknown
}

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
} as const

export function useAnalytics() {
  const route = useRoute()

  const trackEvent = (eventName: string, params?: FunnelEventParams) => {
    if (import.meta.client && typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        ...params,
        timestamp: new Date().toISOString(),
        path: route.path,
      })
    }
  }

  const trackPageView = (pageName: string, additionalParams?: FunnelEventParams) => {
    trackEvent(FunnelEvents.PAGE_VIEW, { page_name: pageName, ...additionalParams })
  }

  const trackRecipeView = (recipe: Recipe) => {
    trackEvent(FunnelEvents.VIEW_RECIPE, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
      recipe_category: recipe.category,
    })
  }

  const trackCookingStart = (recipe: Recipe) => {
    trackEvent(FunnelEvents.START_COOKING, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
      total_steps: recipe.steps?.length || 0,
    })
  }

  const trackStepComplete = (recipe: Recipe, stepNumber: number) => {
    trackEvent(FunnelEvents.STEP_COMPLETE, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
      step_number: stepNumber,
      total_steps: recipe.steps?.length || 0,
    })
  }

  const trackCookingFinish = (recipe: Recipe) => {
    trackEvent(FunnelEvents.FINISH_COOKING, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
    })
  }

  const trackAddFavorite = (recipe: Recipe) => {
    trackEvent(FunnelEvents.ADD_FAVORITE, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
      recipe_category: recipe.category,
    })
  }

  const trackRemoveFavorite = (recipe: Recipe) => {
    trackEvent(FunnelEvents.REMOVE_FAVORITE, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
      recipe_category: recipe.category,
    })
  }

  const trackSearch = (query: string, resultsCount: number) => {
    trackEvent(FunnelEvents.SEARCH_QUERY, {
      search_query: query,
      results_count: resultsCount,
    })
  }

  const trackFilter = (filterType: string, filterValue: string) => {
    trackEvent(FunnelEvents.FILTER_APPLY, {
      filter_type: filterType,
      filter_value: filterValue,
    })
  }

  const trackShare = (recipe: Recipe) => {
    trackEvent(FunnelEvents.SHARE_RECIPE, {
      recipe_id: recipe.id,
      recipe_name: recipe.title,
    })
  }

  const trackTimerStart = (recipe: Recipe, stepNumber: number) => {
    trackEvent(FunnelEvents.TIMER_START, {
      recipe_id: recipe.id,
      step_number: stepNumber,
    })
  }

  return {
    trackEvent,
    trackPageView,
    trackRecipeView,
    trackCookingStart,
    trackStepComplete,
    trackCookingFinish,
    trackAddFavorite,
    trackRemoveFavorite,
    trackSearch,
    trackFilter,
    trackShare,
    trackTimerStart,
  }
}
