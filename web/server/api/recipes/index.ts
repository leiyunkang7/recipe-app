import { defineEventHandler, getQuery, readBody, type H3Event } from 'h3';
import { eq, ilike, or, and, desc, count, sql } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { mockRecipes, shouldUseMockData } from '../../utils/mockData';
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
  recipeTranslations,
} from '@recipe-app/database';

// Type definitions for database rows - using inferred types
type RecipeRow = typeof recipes.$inferSelect;
type IngredientRow = typeof recipeIngredients.$inferSelect;
type StepRow = typeof recipeSteps.$inferSelect;
type TagRow = typeof recipeTags.$inferSelect;
type TranslationRow = typeof recipeTranslations.$inferSelect;

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
  // Use mock data for E2E tests
  if (shouldUseMockData()) {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const category = query.category as string | undefined;
    const search = query.search as string | undefined;
    const ingredients = query.ingredients ? (Array.isArray(query.ingredients) ? query.ingredients as string[] : [query.ingredients as string]) : undefined;
    const maxTime = query.max_time ? parseInt(query.max_time as string) : undefined;
    const minTime = query.min_time ? parseInt(query.min_time as string) : undefined;
    const taste = query.taste ? (Array.isArray(query.taste) ? query.taste as string[] : [query.taste as string]) : undefined;

    let result = [...mockRecipes];

    // Filter by category
    if (category) {
      result = result.filter(r => r.category === category);
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower)
      );
    }

    // Filter by ingredients
    if (ingredients && ingredients.length > 0) {
      const ingredientLower = ingredients.map(i => i.toLowerCase());
      result = result.filter(r => 
        r.ingredients && r.ingredients.some(ing => 
          ingredientLower.some(searchIng => ing.name.toLowerCase().includes(searchIng))
        )
      );
    }

    // Filter by maxTime (total time in minutes)
    if (maxTime) {
      result = result.filter(r => (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0) <= maxTime);
    }

    // Filter by minTime (total time in minutes)
    if (minTime) {
      result = result.filter(r => (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0) >= minTime);
    }

    // Filter by taste (tags)
    if (taste && taste.length > 0) {
      const tasteLower = taste.map(t => t.toLowerCase());
      result = result.filter(r => 
        r.tags && r.tags.some(tag => tasteLower.includes(tag.toLowerCase()))
      );
    }

    const total = result.length;
    const offset = (page - 1) * limit;
    const paginatedResult = result.slice(offset, offset + limit);

    return {
      data: paginatedResult,
      count: total,
    };
  }

  const db = useDb();
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;
  const category = query.category as string | undefined;
  const cuisine = query.cuisine as string | undefined;
  const difficulty = query.difficulty as string | undefined;
  const search = query.search as string | undefined;
  const locale = query.locale as string | undefined;
  const ingredients = query.ingredients ? (Array.isArray(query.ingredients) ? query.ingredients as string[] : [query.ingredients as string]) : undefined;
  const maxTime = query.max_time ? parseInt(query.max_time as string) : undefined;
  const minTime = query.min_time ? parseInt(query.min_time as string) : undefined;
  const taste = query.taste ? (Array.isArray(query.taste) ? query.taste as string[] : [query.taste as string]) : undefined;

  const conditions: ReturnType<typeof eq>[] = [];

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
  if (maxTime) {
    conditions.push(sql`(${recipes.prepTimeMinutes} + ${recipes.cookTimeMinutes}) <= ${maxTime}` as ReturnType<typeof eq>);
  }
  if (minTime) {
    conditions.push(sql`(${recipes.prepTimeMinutes} + ${recipes.cookTimeMinutes}) >= ${minTime}` as ReturnType<typeof eq>);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Handle ingredient filtering - requires a subquery approach
  let recipeIdsWithIngredients: string[] | undefined;
  if (ingredients && ingredients.length > 0) {
    // Get recipe IDs where any ingredient name matches
    const ingredientMatches = await db
      .select({ recipeId: recipeIngredients.recipeId })
      .from(recipeIngredients)
      .where(
        or(
          ...ingredients.map(ing => 
            ilike(recipeIngredients.name, `%${ing}%`)
          )
        )!
      );
    recipeIdsWithIngredients = [...new Set(ingredientMatches.map(m => m.recipeId))];
  }

  // Handle taste/tag filtering
  let recipeIdsWithTags: string[] | undefined;
  if (taste && taste.length > 0) {
    const tagMatches = await db
      .select({ recipeId: recipeTags.recipeId })
      .from(recipeTags)
      .where(
        or(
          ...taste.map(t => 
            ilike(recipeTags.tag, `%${t}%`)
          )
        )!
      );
    recipeIdsWithTags = [...new Set(tagMatches.map(m => m.recipeId))];
  }

  const [totalResult] = await db
    .select({ count: count() })
    .from(recipes)
    .where(whereClause);

  const total = totalResult?.count ?? 0;
  const offset = (page - 1) * limit;

  // Build final recipe query with ingredient and tag filters
  let recipeQuery = db.select().from(recipes).where(whereClause);
  
  const recipeRows = await recipeQuery
    .orderBy(desc(recipes.createdAt))
    .limit(limit)
    .offset(offset);

  // Post-filter by ingredients if needed (since we couldn't do it in SQL easily)
  let finalRecipeRows = recipeRows;
  if (recipeIdsWithIngredients && recipeIdsWithIngredients.length > 0) {
    finalRecipeRows = finalRecipeRows.filter(row => recipeIdsWithIngredients.includes(row.id));
  }
  if (recipeIdsWithTags && recipeIdsWithTags.length > 0) {
    finalRecipeRows = finalRecipeRows.filter(row => recipeIdsWithTags.includes(row.id));
  }

  // Fetch related data for each recipe
  const result = await Promise.all(
    finalRecipeRows.map(async (row: RecipeRow) => {
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
        recipe_translations: translations.map((t: TranslationRow) => ({
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
  const body = await readBody(event);

  // Use mock data for E2E tests
  if (shouldUseMockData()) {
    const newRecipe = {
      id: String(mockRecipes.length + 1),
      title: body.title || 'New Recipe',
      description: body.description || '',
      category: body.category || '主菜',
      cuisine: body.cuisine || '中餐',
      servings: body.servings || 2,
      prep_time_minutes: body.prep_time_minutes || 10,
      cook_time_minutes: body.cook_time_minutes || 20,
      difficulty: body.difficulty || 'medium',
      image_url: body.image_url || null,
      source: body.source || null,
      video_url: null,
      source_url: null,
      nutrition_info: body.nutrition_info || null,
      views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: body.ingredients || [],
      steps: body.steps || [],
      tags: body.tags || [],
      recipe_translations: body.translations || []
    };
    mockRecipes.unshift(newRecipe);
    return { data: newRecipe };
  }

  const db = useDb();

  try {
    return await db.transaction(async (tx: typeof db) => {
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
