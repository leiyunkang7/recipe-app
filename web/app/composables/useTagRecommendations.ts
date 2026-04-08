import type { TagSuggestion } from "@recipe-app/recipe-service";

export interface TagRecommendRequest {
  title?: string;
  description?: string;
  category?: string;
  cuisine?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: "easy" | "medium" | "hard";
  ingredients?: Array<{ name: string; amount?: number; unit?: string }>;
  existingTags?: string[];
  maxSuggestions?: number;
}

export function useTagRecommendations() {
  const recommendedTags = ref<TagSuggestion[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const showRecommendations = ref(false);

  async function fetchRecommendations(params: TagRecommendRequest) {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await $fetch("/api/tags/recommend", {
        method: "POST",
        body: params,
      });

      if (response.success && response.data) {
        recommendedTags.value = response.data.tags;
      } else {
        error.value = "Failed to fetch recommendations";
      }
    } catch (e) {
      error.value = "Failed to fetch recommendations";
      console.error("Tag recommendation error:", e);
    } finally {
      isLoading.value = false;
    }
  }

  function toggleRecommendation(tag: string, existingTags: string[], setTags: (tags: string[]) => void) {
    if (existingTags.includes(tag)) {
      setTags(existingTags.filter(t => t !== tag));
    } else {
      setTags([...existingTags, tag]);
    }
  }

  return {
    recommendedTags,
    isLoading,
    error,
    showRecommendations,
    fetchRecommendations,
    toggleRecommendation,
  };
}
