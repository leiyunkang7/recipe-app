import { recommendationService, type RecommendationType } from "@recipe-app/recommendation";
import { successResponse } from "@recipe-app/shared-types";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const type = query.type as RecommendationType;
  const recipeId = query.recipeId as string | undefined;
  const limit = query.limit ? parseInt(query.limit as string) : undefined;
  const excludeStr = query.exclude as string;
  const excludeRecipeIds = excludeStr ? excludeStr.split(",") : undefined;

  const result = await recommendationService.getRecommendations({
    type,
    recipeId,
    limit,
    excludeRecipeIds,
  });

  return result;
});
