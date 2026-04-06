/**
 * useRecipeRating - Recipe rating composable
 *
 * Provides reactive rating state and operations for a recipe.
 */

import { useAuth } from './useAuth';

export const useRecipeRating = (recipeId: string) => {
  const averageRating = ref<number>(0);
  const ratingCount = ref<number>(0);
  const userRating = ref<number>(0);
  const loading = ref<boolean>(false);
  const submitting = ref<boolean>(false);
  const error = ref<string | null>(null);

  const { isAuthenticated, user } = useAuth();

  /**
   * Fetch rating stats for the recipe
   */
  const fetchRatingStats = async () => {
    try {
      const response = await $fetch(`/api/ratings/${recipeId}`);
      if (response.success && response.data) {
        averageRating.value = response.data.averageRating;
        ratingCount.value = response.data.ratingCount;
      }
    } catch (err) {
      console.error('[useRecipeRating] Error fetching stats:', err);
    }
  };

  /**
   * Fetch the current user's rating for this recipe
   */
  const fetchUserRating = async () => {
    if (!isAuthenticated.value || !user.value) {
      userRating.value = 0;
      return;
    }

    try {
      const response = await $fetch(`/api/ratings/${recipeId}/user`, {
        headers: {
          'x-user-id': user.value.id,
        },
      });
      if (response.success && response.data) {
        userRating.value = response.data.score;
      }
    } catch (err) {
      console.error('[useRecipeRating] Error fetching user rating:', err);
    }
  };

  /**
   * Submit a rating for the recipe
   */
  const submitRating = async (score: number): Promise<boolean> => {
    if (!isAuthenticated.value) {
      error.value = 'Please login to rate recipes';
      return false;
    }

    submitting.value = true;
    error.value = null;

    try {
      const response = await $fetch('/api/ratings', {
        method: 'POST',
        body: {
          recipeId,
          score,
        },
      });

      if (response.success && response.data) {
        userRating.value = response.data.score;
        averageRating.value = response.data.averageRating;
        ratingCount.value = response.data.ratingCount;
        return true;
      } else {
        error.value = response.error?.message || 'Failed to submit rating';
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit rating';
      error.value = message;
      return false;
    } finally {
      submitting.value = false;
    }
  };

  /**
   * Initialize rating data
   */
  const init = async () => {
    loading.value = true;
    try {
      await Promise.all([fetchRatingStats(), fetchUserRating()]);
    } finally {
      loading.value = false;
    }
  };

  return {
    averageRating,
    ratingCount,
    userRating,
    loading,
    submitting,
    error,
    fetchRatingStats,
    fetchUserRating,
    submitRating,
    init,
  };
};
