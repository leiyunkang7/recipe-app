import { defineEventHandler, readBody } from 'h3';
import { analyzeRecipeNutrition, getDailyValuePercentages, formatNutritionForDisplay, type IngredientInput } from '@recipe-app/nutrition';

interface AnalyzeRequestBody {
  ingredients: IngredientInput[];
  servings?: number;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as AnalyzeRequestBody;

    if (!body.ingredients || !Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Ingredients array is required and must not be empty',
      });
    }

    for (const ing of body.ingredients) {
      if (!ing.name || typeof ing.name !== 'string' || ing.name.trim() === '') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Each ingredient must have a valid name',
        });
      }
      if (typeof ing.amount !== 'number' || ing.amount <= 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Each ingredient must have a positive amount',
        });
      }
      if (!ing.unit || typeof ing.unit !== 'string' || ing.unit.trim() === '') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Each ingredient must have a valid unit',
        });
      }
    }

    const servings = body.servings && body.servings > 0 ? body.servings : 1;

    const result = analyzeRecipeNutrition(body.ingredients, servings);

    return {
      success: true,
      data: {
        total: result.total,
        perServing: result.perServing,
        servings: result.servings,
        analyzedIngredients: result.analyzedIngredients,
        unknownIngredients: result.unknownIngredients,
        display: formatNutritionForDisplay(result.perServing),
        dailyValuePercentages: getDailyValuePercentages(result.perServing),
      },
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    console.error('[Nutrition Analyze API] Error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to analyze nutrition',
    });
  }
});
