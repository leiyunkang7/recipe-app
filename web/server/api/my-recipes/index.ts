import { defineEventHandler, getQuery, type H3Event } from 'h3';
import { eq, desc, count } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { getCurrentUser } from '../../utils/session';
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
} from '@recipe-app/database';

type RecipeRow = typeof recipes.$inferSelect;
type IngredientRow = typeof recipeIngredients.$inferSelect;
type StepRow = typeof recipeSteps.$inferSelect;
type TagRow = typeof recipeTags.$inferSelect;

export default defineEventHandler(async (event: H3Event) => {
  const user = await getCurrentUser(event);

  if (!user) {
    return { error: 'Unauthorized', data: [], count: 0 };
  }

  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;

  const db = useDb();

  // Get total count for user's recipes
  const [totalResult] = await db
    .select({ count: count() })
    .from(recipes)
    .where(eq(recipes.authorId, user.id));

  const total = totalResult?.count ?? 0;
  const offset = (page - 1) * limit;

  // Get user's recipes with pagination
  const recipeRows = await db
    .select()
    .from(recipes)
    .where(eq(recipes.authorId, user.id))
    .orderBy(desc(recipes.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch related data for each recipe
  const result = await Promise.all(
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
        video_url: row.videoUrl ?? null,
        source_url: row.sourceUrl ?? null,
        nutrition_info: row.nutritionInfo ?? null,
        views: row.views ?? 0,
        author_id: row.authorId ?? null,
        created_at: row.createdAt?.toISOString() ?? null,
        updated_at: row.updatedAt?.toISOString() ?? null,
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
        average_rating: 0,
        rating_count: 0,
      };
    })
  );

  return {
    data: result,
    count: total,
  };
});
