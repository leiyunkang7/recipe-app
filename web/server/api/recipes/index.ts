import { defineEventHandler, getQuery, readBody, type H3Event } from 'h3';
import { eq, ilike, or, and, desc, count } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
  recipeTranslations,
} from '@recipe-app/database';

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

interface TranslationInput {
  locale: string;
  title: string;
  description?: string;
}

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    return handleList(event);
  } else if (method === 'POST') {
    return handleCreate(event);
  }

  return { error: 'Method not allowed' };
});

async function handleList(event: H3Event) {
  const db = useDb();
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const category = query.category as string | undefined;
  const cuisine = query.cuisine as string | undefined;
  const difficulty = query.difficulty as string | undefined;
  const search = query.search as string | undefined;
  const locale = query.locale as string | undefined;

  const conditions = [];

  if (category) conditions.push(eq(recipes.category, category));
  if (cuisine) conditions.push(eq(recipes.cuisine, cuisine));
  if (difficulty) conditions.push(eq(recipes.difficulty, difficulty));
  if (search) {
    const escaped = search.replace(/[%_\\]/g, '\\$&');
    conditions.push(
      or(
        ilike(recipes.title, `%${escaped}%`),
        ilike(recipes.description, `%${escaped}%`)
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: count() })
    .from(recipes)
    .where(whereClause);

  const total = totalResult?.count ?? 0;
  const offset = (page - 1) * limit;

  const recipeRows = await db
    .select()
    .from(recipes)
    .where(whereClause)
    .orderBy(desc(recipes.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch related data for each recipe
  const result = await Promise.all(
    recipeRows.map(async (row) => {
      const [ingredients, steps, tags, translations] = await Promise.all([
        db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, row.id)),
        db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, row.id)),
        db.select().from(recipeTags).where(eq(recipeTags.recipeId, row.id)),
        locale
          ? db.select().from(recipeTranslations).where(eq(recipeTranslations.recipeId, row.id))
          : Promise.resolve([]),
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
        created_at: row.createdAt?.toISOString() ?? null,
        updated_at: row.updatedAt?.toISOString() ?? null,
        ingredients: ingredients.map((ing) => ({
          id: ing.id,
          name: ing.name,
          amount: Number(ing.amount),
          unit: ing.unit,
        })),
        steps: steps
          .sort((a, b) => a.stepNumber - b.stepNumber)
          .map((step) => ({
            id: step.id,
            step_number: step.stepNumber,
            instruction: step.instruction,
            duration_minutes: step.durationMinutes ?? null,
          })),
        tags: tags.map((t) => t.tag),
        recipe_translations: translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          description: t.description ?? null,
        })),
      };
    })
  );

  return {
    data: result,
    count: total,
  };
}

async function handleCreate(event: H3Event) {
  const db = useDb();
  const body = await readBody(event);

  try {
    return await db.transaction(async (tx) => {
      const [recipeRow] = await tx
        .insert(recipes)
        .values({
          title: body.title,
          description: body.description,
          category: body.category,
          cuisine: body.cuisine,
          servings: body.servings,
          prepTimeMinutes: body.prep_time_minutes,
          cookTimeMinutes: body.cook_time_minutes,
          difficulty: body.difficulty,
          imageUrl: body.image_url,
          source: body.source,
          nutritionInfo: body.nutrition_info,
        })
        .returning();

      if (!recipeRow) {
        throw new Error('Failed to create recipe: no row returned');
      }

      const recipeId = recipeRow.id;

      if (body.ingredients?.length > 0) {
        await tx.insert(recipeIngredients).values(
          body.ingredients.map((ing: IngredientInput) => ({
            recipeId,
            name: ing.name,
            amount: String(ing.amount),
            unit: ing.unit,
          }))
        );
      }

      if (body.steps?.length > 0) {
        await tx.insert(recipeSteps).values(
          body.steps.map((step: StepInput) => ({
            recipeId,
            stepNumber: step.step_number,
            instruction: step.instruction,
            durationMinutes: step.duration_minutes,
          }))
        );
      }

      if (body.tags?.length > 0) {
        await tx.insert(recipeTags).values(
          body.tags.map((tag: string) => ({ recipeId, tag }))
        );
      }

      if (body.translations?.length > 0) {
        await tx.insert(recipeTranslations).values(
          body.translations.map((t: TranslationInput) => ({
            recipeId,
            locale: t.locale,
            title: t.title,
            description: t.description,
          }))
        );
      }

      return { data: recipeRow };
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create recipe';
    return { error: message };
  }
}
