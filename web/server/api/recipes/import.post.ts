import { defineEventHandler, readBody } from 'h3';
import { rateLimiters } from "../../utils/rateLimit";
import { useDb } from '../../utils/db';
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
} from '@recipe-app/database';
import {
  parseCSV,
  importRecipeToDTO,
  type ExportedRecipe,
} from '../../utils/recipeExport';
import { getCurrentUser } from '../../utils/session';

interface IngredientInput {
  name: string;
  amount: number | string;
  unit: string;
}

interface StepInput {
  step_number: number;
  instruction: string;
  duration_minutes?: number | null;
}

export default defineEventHandler(async (event) => {
  // Apply strict rate limiting for import (expensive operation)
  await rateLimiters.upload(event);
  const user = await getCurrentUser(event);
  const body = await readBody(event);

  const format = body.format || 'json';
  let recipesToImport: Partial<ExportedRecipe>[] = [];

  if (format === 'csv') {
    // Parse CSV content
    const csvContent = body.content;
    if (typeof csvContent !== 'string') {
      return { error: 'CSV content is required when format is csv' };
    }
    recipesToImport = parseCSV(csvContent);
  } else {
    // Parse JSON content
    const data = body.recipes || body.data;
    if (!Array.isArray(data)) {
      return { error: 'recipes array is required' };
    }
    recipesToImport = data;
  }

  if (recipesToImport.length === 0) {
    return { error: 'No recipes to import' };
  }

  const db = useDb();
  const results: { success: boolean; title?: string; id?: string; error?: string }[] = [];

  for (const exported of recipesToImport) {
    try {
      const recipeData = importRecipeToDTO(exported);

      const [recipeRow] = await db.insert(recipes).values({
        authorId: user?.id,
        title: recipeData.title,
        description: recipeData.description,
        category: recipeData.category,
        cuisine: recipeData.cuisine,
        servings: recipeData.servings,
        prepTimeMinutes: recipeData.prep_time_minutes,
        cookTimeMinutes: recipeData.cook_time_minutes,
        difficulty: recipeData.difficulty,
        source: recipeData.source,
        nutritionInfo: recipeData.nutrition_info,
      }).returning();

      if (!recipeRow) {
        results.push({ success: false, title: recipeData.title, error: 'Failed to create recipe' });
        continue;
      }

      const recipeId = recipeRow.id;

      // Insert ingredients
      if (recipeData.ingredients?.length > 0) {
        await db.insert(recipeIngredients).values(
          recipeData.ingredients.map((ing: IngredientInput) => ({
            recipeId,
            name: ing.name,
            amount: String(ing.amount),
            unit: ing.unit,
          }))
        );
      }

      // Insert steps
      if (recipeData.steps?.length > 0) {
        await db.insert(recipeSteps).values(
          recipeData.steps.map((step: StepInput) => ({
            recipeId,
            stepNumber: step.step_number,
            instruction: step.instruction,
            durationMinutes: step.duration_minutes,
          }))
        );
      }

      // Insert tags
      if (recipeData.tags?.length > 0) {
        await db.insert(recipeTags).values(
          recipeData.tags.map((tag: string) => ({ recipeId, tag }))
        );
      }

      results.push({ success: true, title: recipeData.title, id: recipeId });
    } catch (err) {
      console.error('[import] Error importing recipe:', err);
      results.push({
        success: false,
        title: exported.title || 'Unknown',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return {
    imported: successCount,
    failed: failCount,
    total: recipesToImport.length,
    results,
    imported_at: new Date().toISOString(),
  };
});
