/**
 * useRecipeReviews - Recipe reviews composable with pagination
 *
 * Provides reactive review state and operations for a recipe.
 */

import { useAuth } from './useAuth'
import { useToast } from './useToast'

export interface Review {
  id: string
  recipeId: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

export interface ReviewWithPagination {
  reviews: Review[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const useRecipeReviews = (recipeId: string) => {
  const reviews = ref<Review[]>([])
  const userReview = ref<Review | null>(null)
  const loading = ref<boolean>(false)
  const submitting = ref<boolean>(false)
  const error = ref<string | null>(null)
  const toast = useToast()

  const { isAuthenticated, user } = useAuth()

  // Pagination state
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalReviews = ref(0)
  const pageSize = ref(10)

  /**
   * Fetch reviews for the recipe with pagination
   */
  const fetchReviews = async (page: number = 1) => {
    try {
      loading.value = true
      const response = await $fetch<{ success: boolean; data: ReviewWithPagination }>(
        `/api/reviews/${recipeId}?page=${page}&limit=${pageSize.value}`
      )

      if (response.success && response.data) {
        reviews.value = response.data.reviews
        currentPage.value = response.data.pagination.page
        totalPages.value = response.data.pagination.totalPages
        totalReviews.value = response.data.pagination.total
      }
    } catch (err) {
      console.error('[useRecipeReviews] Error fetching reviews:', err)
      error.value = 'Failed to load reviews'
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch the current user's review for this recipe
   */
  const fetchUserReview = async () => {
    if (!isAuthenticated.value || !user.value) {
      userReview.value = null
      return
    }

    try {
      const response = await $fetch<{ success: boolean; data: Review | null }>(
        `/api/reviews/${recipeId}/user`,
        {
          headers: {
            'x-user-id': user.value.id,
          },
        }
      )

      if (response.success) {
        userReview.value = response.data
      }
    } catch (err) {
      console.error('[useRecipeReviews] Error fetching user review:', err)
    }
  }

  /**
   * Submit a review for the recipe
   */
  const submitReview = async (content: string): Promise<boolean> => {
    if (!isAuthenticated.value) {
      error.value = 'Please login to write reviews'
      return false
    }

    if (!content.trim()) {
      error.value = 'Review content cannot be empty'
      return false
    }

    if (content.length > 2000) {
      error.value = 'Review content is too long (max 2000 characters)'
      return false
    }

    submitting.value = true
    error.value = null

    // Store previous review for rollback
    const previousReview = userReview.value

    try {
      const response = await $fetch<{ success: boolean; data: Review }>(
        '/api/reviews',
        {
          method: 'POST',
          body: {
            recipeId,
            content: content.trim(),
          },
        }
      )

      if (response.success && response.data) {
        userReview.value = {
          ...response.data,
          user: {
            id: user.value!.id,
            name: user.value!.name || 'You',
            avatarUrl: user.value!.avatarUrl || null,
          },
        }

        // Update the reviews list if this is an edit
        const existingIndex = reviews.value.findIndex((r) => r.id === response.data.id)
        if (existingIndex >= 0) {
          reviews.value[existingIndex] = userReview.value
        } else {
          // Add to the beginning for new reviews
          reviews.value.unshift(userReview.value)
          totalReviews.value++
        }

        toast.success(userReview.value ? 'Review updated!' : 'Review submitted!')
        return true
      } else {
        userReview.value = previousReview
        error.value = response.error?.message || 'Failed to submit review'
        toast.error(error.value)
        return false
      }
    } catch (err: unknown) {
      userReview.value = previousReview
      const message = err instanceof Error ? err.message : 'Failed to submit review'
      error.value = message
      toast.error(message)
      return false
    } finally {
      submitting.value = false
    }
  }

  /**
   * Delete the current user's review
   */
  const deleteReview = async (): Promise<boolean> => {
    if (!userReview.value) {
      return false
    }

    if (!isAuthenticated.value) {
      error.value = 'Please login to delete reviews'
      return false
    }

    submitting.value = true
    error.value = null

    const reviewId = userReview.value.id

    try {
      const response = await $fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      })

      if (response.success) {
        // Remove from reviews list
        reviews.value = reviews.value.filter((r) => r.id !== reviewId)
        userReview.value = null
        totalReviews.value = Math.max(0, totalReviews.value - 1)
        toast.success('Review deleted')
        return true
      } else {
        error.value = response.error?.message || 'Failed to delete review'
        toast.error(error.value)
        return false
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete review'
      error.value = message
      toast.error(message)
      return false
    } finally {
      submitting.value = false
    }
  }

  /**
   * Initialize review data
   */
  const init = async (page: number = 1) => {
    loading.value = true
    try {
      await Promise.all([fetchReviews(page), fetchUserReview()])
    } finally {
      loading.value = false
    }
  }

  /**
   * Go to next page
   */
  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      init(currentPage.value + 1)
    }
  }

  /**
   * Go to previous page
   */
  const prevPage = () => {
    if (currentPage.value > 1) {
      init(currentPage.value - 1)
    }
  }

  return {
    reviews,
    userReview,
    loading,
    submitting,
    error,
    currentPage,
    totalPages,
    totalReviews,
    pageSize,
    fetchReviews,
    fetchUserReview,
    submitReview,
    deleteReview,
    init,
    nextPage,
    prevPage,
  }
}
