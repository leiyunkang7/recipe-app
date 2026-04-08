import { recommendTags, type TagSuggestion, type SmartTagOptions } from "@recipe-app/recipe-service";
import { successResponse, errorResponse } from "@recipe-app/shared-types";
import { z } from "zod";

const TagRecommendSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  cuisine: z.string().optional(),
  servings: z.number().int().positive().optional(),
  prepTimeMinutes: z.number().int().nonnegative().optional(),
  cookTimeMinutes: z.number().int().nonnegative().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.number().optional(),
    unit: z.string().optional(),
  })).optional(),
  existingTags: z.array(z.string()).optional(),
  maxSuggestions: z.number().int().positive().max(20).default(10),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    const validated = TagRecommendSchema.parse(body);

    // Extract recipe data for recommendTags function
    const recipeData = {
      title: validated.title || "",
      description: validated.description,
      category: validated.category || "",
      cuisine: validated.cuisine,
      servings: validated.servings || 4,
      prepTimeMinutes: validated.prepTimeMinutes || 0,
      cookTimeMinutes: validated.cookTimeMinutes || 0,
      difficulty: validated.difficulty || "medium",
      ingredients: validated.ingredients || [],
      tags: validated.existingTags || [],
    };

    const options: SmartTagOptions = {
      maxSuggestions: validated.maxSuggestions,
      includeTimeTags: true,
      includeDifficultyTags: true,
      includeCuisineTags: true,
      includeIngredientTags: true,
      includeKeywordTags: true,
    };

    const suggestions: TagSuggestion[] = recommendTags(recipeData, options);

    // Filter out existing tags if provided
    const filteredSuggestions = validated.existingTags && validated.existingTags.length > 0
      ? suggestions.filter(s => !validated.existingTags!.includes(s.tag))
      : suggestions;

    return successResponse({
      tags: filteredSuggestions.slice(0, validated.maxSuggestions),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("VALIDATION_ERROR", "Invalid request data", error.errors);
    }
    console.error("Tag recommendation error:", error);
    return errorResponse("RECOMMENDATION_ERROR", "Failed to generate tag recommendations");
  }
});
