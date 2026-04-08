import { db } from "@recipe-app/database";
import { recipes, recipeIngredients, recipeTags, recipeRatings, type Recipe, type RecipeListItem } from "@recipe-app/database";
import { sql } from "drizzle-orm";
import { ServiceResponse, successResponse, errorResponse } from "@recipe-app/shared-types";

export type RecommendationType = "personalized" | "similar" | "popular" | "seasonal";

export interface RecommendationRequest {
  type: RecommendationType;
  recipeId?: string;
  limit?: number;
  excludeRecipeIds?: string[];
  userId?: string;
}

export interface RecommendationResponse {
  recipes: RecipeListItem[];
  strategy: string;
  reason?: string;
}

export class RecommendationService {
  private defaultLimit = 10;

  async getRecommendations(request: RecommendationRequest): Promise<ServiceResponse<RecommendationResponse>> {
    try {
      const limit = request.limit || this.defaultLimit;
      const excludeIds = request.excludeRecipeIds || [];
      let recipes: Recipe[];
      let strategy = request.type;
      let reason: string | undefined;

      switch (request.type) {
        case "similar":
          if (!request.recipeId) return errorResponse("RECIPE_ID_REQUIRED", "recipeId is required");
          const similarResult = await this.getSimilarRecipes(request.recipeId, limit, excludeIds);
          recipes = similarResult.recipes;
          reason = similarResult.reason;
          break;
        case "popular":
          recipes = await this.getPopularRecipes(limit, excludeIds);
          reason = "近期热门菜谱";
          break;
        case "seasonal":
          recipes = await this.getSeasonalRecipes(limit, excludeIds);
          reason = this.getSeasonalReason();
          break;
        case "personalized":
          if (request.userId) {
            const p = await this.getPersonalizedRecommendations(request.userId, limit, excludeIds);
            recipes = p.recipes;
            reason = p.reason;
          } else {
            recipes = await this.getPopularRecipes(limit, excludeIds);
            reason = "热门推荐";
          }
          break;
        default:
          return errorResponse("INVALID_TYPE", "Unknown type");
      }

      const listItems: RecipeListItem[] = recipes.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        imageUrl: r.imageUrl,
        category: r.category,
        cuisine: r.cuisine,
        prepTimeMinutes: r.prepTimeMinutes,
        cookTimeMinutes: r.cookTimeMinutes,
        difficulty: r.difficulty,
        avgRating: (r as any).avg_rating || 0,
        ratingCount: (r as any).rating_count || 0,
        cookingCount: r.cookingCount,
        createdAt: r.createdAt,
      }));

      return successResponse({ recipes: listItems, strategy, reason });
    } catch (error) {
      console.error("Recommendation error:", error);
      return errorResponse("RECOMMENDATION_ERROR", "Failed to get recommendations");
    }
  }

  private async getSimilarRecipes(recipeId: string, limit: number, excludeIds: string[]) {
    const target = await db.query.recipes.findFirst({ where: sql"id = ${recipeId}" });
    if (!target) return { recipes: [], reason: undefined };

    const ing = await db.select({ name: recipeIngredients.name }).from(recipeIngredients).where(sql"recipe_id = ${recipeId}");
    const tags = await db.select({ tag: recipeTags.tag }).from(recipeTags).where(sql"recipe_id = ${recipeId}");
    const ingNames = ing.map(i => i.name);
    const tagNames = tags.map(t => t.tag);

    const result = await db.execute(sql`
      SELECT r.*,
        (COALESCE((SELECT COUNT(*)::int FROM recipe_ingredients WHERE recipe_id = r.id AND name = ANY(${ingNames})), 0) * 2) +
        (COALESCE((SELECT COUNT(*)::int FROM recipe_tags WHERE recipe_id = r.id AND tag = ANY(${tagNames})), 0) * 1.5) +
        (CASE WHEN r.category = ${target.category} THEN 3 ELSE 0 END) +
        (CASE WHEN r.cuisine = ${target.cuisine} THEN 2 ELSE 0 END) AS similarity_score
      FROM recipes r
      WHERE r.id != ${recipeId} AND r.id != ALL(${excludeIds})
      ORDER BY similarity_score DESC, r.cooking_count DESC
      LIMIT ${limit}
    `);
    return { recipes: result.rows as Recipe[], reason: "与《${target.title}》相似的菜谱" };
  }

  private async getPopularRecipes(limit: number, excludeIds: string[]): Promise<Recipe[]> {
    const result = await db.execute(sql`
      SELECT r.*, COALESCE(AVG(rr.score), 0) AS avg_rating, COUNT(rr.id) AS rating_count,
        (r.cooking_count + r.views * 0.1) AS popularity_score
      FROM recipes r LEFT JOIN recipe_ratings rr ON rr.recipe_id = r.id
      WHERE r.id != ALL(${excludeIds}) GROUP BY r.id
      ORDER BY popularity_score DESC, avg_rating DESC LIMIT ${limit}
    `);
    return result.rows as Recipe[];
  }

  private async getSeasonalRecipes(limit: number, excludeIds: string[]): Promise<Recipe[]> {
    const month = new Date().getMonth() + 1;
    let tags: string[];
    if (month >= 3 && month <= 5) tags = ["spring", "light", "fresh"];
    else if (month >= 6 && month <= 8) tags = ["summer", "cold", "refreshing"];
    else if (month >= 9 && month <= 11) tags = ["autumn", "warm", "comfort"];
    else tags = ["winter", "warming", "hearty"];

    const result = await db.execute(sql`
      SELECT r.* FROM recipes r
      LEFT JOIN recipe_tags rt ON rt.recipe_id = r.id
      WHERE r.id != ALL(${excludeIds}) AND rt.tag = ANY(${tags})
      GROUP BY r.id ORDER BY COUNT(rt.tag) DESC, r.cooking_count DESC LIMIT ${limit}
    `);
    return result.rows as Recipe[];
  }

  private async getPersonalizedRecommendations(userId: string, limit: number, excludeIds: string[]) {
    const userRatings = await db.select({ recipeId: recipeRatings.recipeId, score: recipeRatings.score })
      .from(recipeRatings).where(sql"user_id = ${userId} AND score >= 4");
    if (userRatings.length === 0) {
      const popular = await this.getPopularRecipes(limit, excludeIds);
      return { recipes: popular, reason: "热门推荐" };
    }
    const likedIds = userRatings.map(r => r.recipeId);
    const liked = await db.select({ category: recipes.category, cuisine: recipes.cuisine })
      .from(recipes).where(sql"id = ANY(${likedIds})");
    const categories = [...new Set(liked.map(r => r.category))];
    const cuisines = [...new Set(liked.map(r => r.cuisine))];

    const similarUsers = await db.execute(sql`
      SELECT DISTINCT rr2.user_id FROM recipe_ratings rr1
      JOIN recipe_ratings rr2 ON rr1.recipe_id = rr2.recipe_id AND rr1.user_id != rr2.user_id AND rr1.score >= 4 AND rr2.score >= 4
      WHERE rr1.user_id = ${userId} LIMIT 50
    `);
    const similarUserIds = similarUsers.rows.map((r: any) => r.user_id);

    if (similarUserIds.length === 0) {
      const result = await db.execute(sql`
        SELECT r.* FROM recipes r WHERE r.id != ALL(${likedIds}) AND r.id != ALL(${excludeIds})
          AND (r.category = ANY(${categories}) OR r.cuisine = ANY(${cuisines}))
        ORDER BY r.cooking_count DESC LIMIT ${limit}
      `);
      return { recipes: result.rows as Recipe[], reason: "根据您的偏好推荐" };
    }

    const result = await db.execute(sql`
      SELECT DISTINCT r.*, AVG(rr.score) AS avg_score, COUNT(rr.id) AS rating_count
      FROM recipes r JOIN recipe_ratings rr ON rr.recipe_id = r.id
      WHERE rr.user_id = ANY(${similarUserIds}) AND r.id != ALL(${likedIds}) AND r.id != ALL(${excludeIds})
      GROUP BY r.id ORDER BY avg_score DESC, rating_count DESC LIMIT ${limit}
    `);
    return { recipes: result.rows as Recipe[], reason: "喜欢您口味的用户也在吃" };
  }

  private getSeasonalReason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return "春季精选";
    if (month >= 6 && month <= 8) return "夏日清爽";
    if (month >= 9 && month <= 11) return "秋季滋补";
    return "冬季暖身";
  }
}

export const recommendationService = new RecommendationService();
