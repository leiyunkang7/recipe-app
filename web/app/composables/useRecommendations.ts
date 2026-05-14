import { ref } from "vue";
import type { RecipeListItem, RecipeFilters } from "@/types";

export type RecommendationType = "personalized" | "similar" | "popular" | "seasonal";

export interface RecommendationOptions {
  recipeId?: string;
  limit?: number;
  excludeIds?: string[];
  userId?: string;
  filters?: RecipeFilters;
}

export function useRecommendations() {
  const recommendations = ref<RecipeListItem[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentReason = ref<string | null>(null);
  const currentStrategy = ref<string | null>(null);

  async function fetchRecommendations(
    type: RecommendationType,
    options: RecommendationOptions = {}
  ) {
    isLoading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams({ type });
      if (options.recipeId) params.set("recipeId", options.recipeId);
      if (options.limit) params.set("limit", String(options.limit));
      if (options.excludeIds?.length) {
        params.set("exclude", options.excludeIds.join(","));
      }
      if (options.userId) params.set("userId", options.userId);

      const response = await $fetch(`/api/recommendations?${params}`);

      if (response.success && response.data) {
        recommendations.value = response.data.recipes;
        currentReason.value = response.data.reason || null;
        currentStrategy.value = response.data.strategy || null;
      } else {
        error.value = response.error?.message || "Failed to load recommendations";
      }
    } catch (e: unknown) {
      error.value = e.message || "Failed to load recommendations";
      console.error("useRecommendations error:", e);
    } finally {
      isLoading.value = false;
    }
  }

  function clearRecommendations() {
    recommendations.value = [];
    currentReason.value = null;
    currentStrategy.value = null;
    error.value = null;
  }

  return {
    recommendations,
    isLoading,
    error,
    currentReason,
    currentStrategy,
    fetchRecommendations,
    clearRecommendations,
  };
}
