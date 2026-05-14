export type RecommendationType = 
  | 'similar'
  | 'trending'
  | 'personalized'
  | 'category'
  | 'seasonal';

export interface RecommendationOptions {
  type: RecommendationType;
  recipeId?: string;
  limit?: number;
  excludeRecipeIds?: string[];
}

export interface RecipeRecommendation {
  id: string;
  title: string;
  image?: string;
  score: number;
}

class RecommendationService {
  async getRecommendations(options: RecommendationOptions): Promise<{
    success: boolean;
    data?: RecipeRecommendation[];
    error?: { code: string; message: string };
  }> {
    // Stub implementation - returns empty recommendations
    return {
      success: true,
      data: []
    };
  }
}

export const recommendationService = new RecommendationService();
