import { ref, computed } from 'vue'
import type { SearchSuggestion } from 'shared/types'

interface SearchCorrectionResult {
  original: string
  suggestion: string | null
  hasCorrection: boolean
}

interface DidYouMeanResult {
  suggestion: string | null
  hasSuggestion: boolean
}

/**
 * Composable for search error correction (did-you-mean functionality)
 * Provides suggestions for misspelled search queries
 */
export function useSearchCorrection() {
  const lastCorrection = ref<SearchCorrectionResult>({
    original: '',
    suggestion: null,
    hasCorrection: false,
  })

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Request version tracking to prevent race conditions
  let activeRequestVersion = 0

  /**
   * Check if a search query might be misspelled by checking if results are too few
   * This is a lightweight check that doesn't require API calls
   */
  function needsCorrection(query: string, resultCount: number): boolean {
    if (!query || query.length < 3) return false
    // If search returned no results and query has 3+ chars, might be misspelled
    return resultCount === 0 && query.length >= 3
  }

  /**
   * Fetch did-you-mean suggestion from the search API
   * Uses request version tracking to prevent race conditions
   */
  async function fetchSuggestion(query: string): Promise<DidYouMeanResult> {
    if (!query || query.trim().length < 3) {
      return { suggestion: null, hasSuggestion: false }
    }

    // Increment version to track this request
    const requestVersion = ++activeRequestVersion
    isLoading.value = true
    error.value = null

    try {
      // Call the search API with typo tolerance enabled
      const response = await $fetch<{ data: SearchSuggestion[]; suggestion?: string }>('/api/search', {
        params: {
          q: query,
          scope: 'all',
          limit: 5,
          suggest: true, // Request suggestion
        },
      })

      // Discard stale responses from older requests
      if (requestVersion !== activeRequestVersion) {
        return { suggestion: null, hasSuggestion: false }
      }

      // If no exact results but we got suggestions
      if (response.suggestion && response.suggestion !== query) {
        lastCorrection.value = {
          original: query,
          suggestion: response.suggestion,
          hasCorrection: true,
        }
        return { suggestion: response.suggestion, hasSuggestion: true }
      }

      return { suggestion: null, hasSuggestion: false }
    } catch (e) {
      // Only update error if this is still the active request
      if (requestVersion === activeRequestVersion) {
        error.value = e instanceof Error ? e.message : 'Failed to fetch suggestion'
      }
      return { suggestion: null, hasSuggestion: false }
    } finally {
      // Only clear loading if this is still the active request
      if (requestVersion === activeRequestVersion) {
        isLoading.value = false
      }
    }
  }

  /**
   * Clear the last correction
   */
  function clearCorrection() {
    lastCorrection.value = {
      original: '',
      suggestion: null,
      hasCorrection: false,
    }
  }

  const hasCorrection = computed(() => lastCorrection.value.hasCorrection)
  const currentSuggestion = computed(() => lastCorrection.value.suggestion)

  return {
    lastCorrection: readonly(lastCorrection),
    isLoading: readonly(isLoading),
    error: readonly(error),
    hasCorrection,
    currentSuggestion,
    needsCorrection,
    fetchSuggestion,
    clearCorrection,
  }
}
