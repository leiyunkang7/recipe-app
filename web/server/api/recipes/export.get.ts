import { defineEventHandler, getQuery } from 'h3';
import { rateLimiters } from "../../utils/rateLimit";
import { eq } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
} from '@recipe-app/database';
import {
  recipesToExportFormat,
  generateCSV,
  type ExportedRecipe,
} from '../../utils/recipeExport';

type RecipeRow = typeof recipes.$inferSelect;
type IngredientRow = typeof recipeIngredients.$inferSelect;
type StepRow = typeof recipeSteps.$inferSelect;
type TagRow = typeof recipeTags.$inferSelect;

export default defineEventHandler(async (event) => {
  // Apply rate limiting for export (expensive operation)
  await rateLimiters.search(event);
  const query = getQuery(event);
  const format = (query.format as string) || 'json';
  const authorId = query.author_id as string | undefined;

  const db = useDb();

  // Build query conditions
  const conditions = [];
  if (authorId) {
    conditions.push(eq(recipes.authorId, authorId));
  }

  // Fetch all recipes (with optional author filter)
  const recipeRows = conditions.length > 0
    ? await db.select().from(recipes).where(conditions[0])
    : await db.select().from(recipes);

  // Fetch related data for each recipe
  const recipesWithRelations = await Promise.all(
    recipeRows.map(async (row: RecipeRow) => {
      const [ingredients, steps, tags] = await Promise.all([
        db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, row.id)),
        db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, row.id)),
        db.select().from(recipeTags).where(eq(recipeTags.recipeId, row.id)),
      ]);

      return {
        id: row.id,
        title: row.title ?? '',
        description: row.description ?? '',
        category: row.category,
        cuisine: row.cuisine ?? '',
        servings: row.servings,
        prep_time_minutes: row.prepTimeMinutes,
        cook_time_minutes: row.cookTimeMinutes,
        difficulty: row.difficulty,
        image_url: row.imageUrl ?? null,
        source: row.source ?? null,
        nutrition_info: row.nutritionInfo ?? null,
        views: row.views ?? 0,
        author_id: row.authorId ?? null,
        created_at: row.createdAt?.toISOString() ?? null,
        ingredients: ingredients.map((ing: IngredientRow) => ({
          id: ing.id,
          name: ing.name,
          amount: Number(ing.amount),
          unit: ing.unit,
        })),
        steps: steps
          .sort((a: StepRow, b: StepRow) => a.stepNumber - b.stepNumber)
          .map((step: StepRow) => ({
            id: step.id,
            step_number: step.stepNumber,
            instruction: step.instruction,
            duration_minutes: step.durationMinutes ?? null,
          })),
        tags: tags.map((t: TagRow) => t.tag),
      };
    })
  );

  // Convert to export format
  const exportedRecipes = recipesToExportFormat(recipesWithRelations);

  if (format === 'csv') {
    const csv = generateCSV(exportedRecipes as ExportedRecipe[]);
    setHeader(event, 'Content-Type', 'text/csv; charset=utf-8');
    setHeader(event, 'Content-Disposition', 'attachment; filename="recipes-export.csv"');
    return csv;
  }

  // Default: JSON format
  return {
    data: exportedRecipes,
    count: exportedRecipes.length,
    exported_at: new Date().toISOString(),
  };
});
