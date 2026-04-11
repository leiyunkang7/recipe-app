/**
 * useRecipeReviews - Recipe reviews composable with pagination and optimistic updates
 *
 * Provides reactive review state and operations for a recipe.
 * Review submissions and deletions use optimistic updates for immediate UI feedback.
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
   * Submit a review for the recipe with optimistic update
   *
   * Optimistically adds the review to the list immediately, then
   * confirms or rolls back based on server response.
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

    // Store previous state for rollback
    const previousReview = userReview.value
    const previousReviews = [...reviews.value]
    const previousTotalReviews = totalReviews.value

    // Create optimistic review object (immediate UI update)
    const optimisticReview: Review = {
      id: `temp-${Date.now()}`,
      recipeId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: user.value!.id,
        name: user.value!.name || 'You',
        avatarUrl: user.value!.avatarUrl || null,
      },
    }

    const isEditing = previousReview !== null

    // Optimistic update - immediately add/update review in the list
    if (isEditing) {
      // Update existing review in the list
      userReview.value = optimisticReview
      reviews.value = reviews.value.map((r) =>
        r.id === previousReview.id ? optimisticReview : r
      )
    } else {
      // Add new review to the beginning
      userReview.value = optimisticReview
      reviews.value = [optimisticReview, ...reviews.value]
      totalReviews.value++
    }

    try {
      const response = await $fetch<{ success: boolean; data: Review & { isNew?: boolean } }>(
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
        // Update with server-confirmed data
        const confirmedReview: Review = {
          ...response.data,
          user: {
            id: user.value!.id,
            name: user.value!.name || 'You',
            avatarUrl: user.value!.avatarUrl || null,
          },
        }

        userReview.value = confirmedReview

        // Replace optimistic review with confirmed review in the list
        reviews.value = reviews.value.map((r) =>
          r.id === optimisticReview.id ? confirmedReview : r
        )

        toast.success(isEditing ? 'Review updated!' : 'Review submitted!')
        return true
      } else {
        // Rollback on failure
        userReview.value = previousReview
        reviews.value = previousReviews
        totalReviews.value = previousTotalReviews
        error.value = response.error?.message || 'Failed to submit review'
        toast.error(error.value)
        return false
      }
    } catch (err: unknown) {
      // Rollback on error
      userReview.value = previousReview
      reviews.value = previousReviews
      totalReviews.value = previousTotalReviews
      const message = err instanceof Error ? err.message : 'Failed to submit review'
      error.value = message
      toast.error(message)
      return false
    } finally {
      submitting.value = false
    }
  }

  /**
   * Delete the current user's review with optimistic update
   *
   * Optimistically removes the review immediately, then confirms
   * or rolls back based on server response.
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

    // Store previous state for rollback
    const previousReviews = [...reviews.value]
    const previousTotalReviews = totalReviews.value
    const previousUserReview = userReview.value

    // Optimistic update - immediately remove from UI
    reviews.value = reviews.value.filter((r) => r.id !== reviewId)
    userReview.value = null
    totalReviews.value = Math.max(0, totalReviews.value - 1)

    try {
      const response = await $fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      })

      if (response.success) {
        toast.success('Review deleted')
        return true
      } else {
        // Rollback on failure
        reviews.value = previousReviews
        userReview.value = previousUserReview
        totalReviews.value = previousTotalReviews
        error.value = response.error?.message || 'Failed to delete review'
        toast.error(error.value)
        return false
      }
    } catch (err: unknown) {
      // Rollback on error
      reviews.value = previousReviews
      userReview.value = previousUserReview
      totalReviews.value = previousTotalReviews
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
