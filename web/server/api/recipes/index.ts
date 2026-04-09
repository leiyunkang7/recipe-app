import { defineEventHandler, getQuery, readBody, type H3Event } from 'h3';
import { rateLimiters } from "../../utils/rateLimit";
import { eq, ilike, or, and, desc, asc, count, sql, avg } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { mockRecipes, shouldUseMockData } from '../../utils/mockData';
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
  recipeTranslations,
  recipeRatings,
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
  const authorId = query.author_id as string | undefined;
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
  const authorId = query.author_id as string | undefined;
  const sort = query.sort as string | undefined;
  const minRating = query.min_rating ? parseFloat(query.min_rating as string) : undefined;
  // Nutrition range filters
  const minCalories = query.min_calories ? parseInt(query.min_calories as string) : undefined;
  const maxCalories = query.max_calories ? parseInt(query.max_calories as string) : undefined;
  const minProtein = query.min_protein ? parseInt(query.min_protein as string) : undefined;
  const maxProtein = query.max_protein ? parseInt(query.max_protein as string) : undefined;
  const minCarbs = query.min_carbs ? parseInt(query.min_carbs as string) : undefined;
  const maxCarbs = query.max_carbs ? parseInt(query.max_carbs as string) : undefined;
  const minFat = query.min_fat ? parseInt(query.min_fat as string) : undefined;
  const maxFat = query.max_fat ? parseInt(query.max_fat as string) : undefined;
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
  if (authorId) {
    conditions.push(eq(recipes.authorId, authorId));
  }
  // Nutrition range filters using JSON field extraction
  if (minCalories) {
    conditions.push(sql`(nutrition_info->>'calories')::numeric >= ${minCalories}` as ReturnType<typeof eq>);
  }
  if (maxCalories) {
    conditions.push(sql`(nutrition_info->>'calories')::numeric <= ${maxCalories}` as ReturnType<typeof eq>);
  }
  if (minProtein) {
    conditions.push(sql`(nutrition_info->>'protein')::numeric >= ${minProtein}` as ReturnType<typeof eq>);
  }
  if (maxProtein) {
    conditions.push(sql`(nutrition_info->>'protein')::numeric <= ${maxProtein}` as ReturnType<typeof eq>);
  }
  if (minCarbs) {
    conditions.push(sql`(nutrition_info->>'carbs')::numeric >= ${minCarbs}` as ReturnType<typeof eq>);
  }
  if (maxCarbs) {
    conditions.push(sql`(nutrition_info->>'carbs')::numeric <= ${maxCarbs}` as ReturnType<typeof eq>);
  }
  if (minFat) {
    conditions.push(sql`(nutrition_info->>'fat')::numeric >= ${minFat}` as ReturnType<typeof eq>);
  }
  if (maxFat) {
    conditions.push(sql`(nutrition_info->>'fat')::numeric <= ${maxFat}` as ReturnType<typeof eq>);
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
  
  // Build order by clause based on sort parameter
  let orderByClause = desc(recipes.createdAt); // default: newest
  if (sort === 'popular') {
    orderByClause = desc(recipes.cookingCount);
  } else if (sort === 'rating') {
    // For rating sort, we'll sort in memory after fetching ratings
    orderByClause = desc(recipes.createdAt);
  } else if (sort === 'quickest') {
    orderByClause = asc(recipes.prepTimeMinutes);
  }

  const recipeRows = await recipeQuery
    .orderBy(orderByClause)
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

  // Fetch rating aggregation for recipes in result
  const recipeIds = finalRecipeRows.map(row => row.id);
  let ratingMap: Map<string, { avg: number; count: number }> = new Map();
  if (recipeIds.length > 0) {
    const ratingResults = await db
      .select({
        recipeId: recipeRatings.recipeId,
        avg: sql<number>`round(avg(${recipeRatings.score})::numeric, 1)`,
        count: count(),
      })
      .from(recipeRatings)
      .where(sql`${recipeRatings.recipeId} = ANY(${recipeIds})`)
      .groupBy(recipeRatings.recipeId);
    ratingResults.forEach(r => ratingMap.set(r.recipeId, { avg: r.avg ?? 0, count: Number(r.count) }));
  }

  // Filter by minRating if specified
  if (minRating !== undefined && minRating > 0) {
    finalRecipeRows = finalRecipeRows.filter(row => {
      const recipeRating = ratingMap.get(row.id);
      return recipeRating && recipeRating.avg >= minRating;
    });
  }

  // Sort by rating if sort === 'rating' (after we have all ratings)
  if (sort === 'rating') {
    finalRecipeRows.sort((a, b) => {
      const ratingA = ratingMap.get(a.id)?.avg ?? 0;
      const ratingB = ratingMap.get(b.id)?.avg ?? 0;
      return ratingB - ratingA;
    });
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

      const recipeRating = ratingMap.get(row.id);
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
        image_srcset: row.imageSrcset ?? null,
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
        recipe_translations: translations.map((t: TranslationRow) => ({
          locale: t.locale,
          title: t.title,
          description: t.description ?? null,
        })),
        average_rating: recipeRating?.avg ?? 0,
        rating_count: recipeRating?.count ?? 0,
      };
    })
  );

  return {
    data: result,
    count: total,
  };
}

async function handleCreate(event: H3Event) {
  // Apply rate limiting for recipe creation
  await rateLimiters.userAction(event);
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
      image_srcset: body.image_srcset || null,
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
          authorId: body.author_id,
          title: body.title,
          description: body.description,
          category: body.category,
          cuisine: body.cuisine,
          servings: body.servings,
          prepTimeMinutes: body.prep_time_minutes,
          cookTimeMinutes: body.cook_time_minutes,
          difficulty: body.difficulty,
          imageUrl: body.image_url,
          imageSrcset: body.image_srcset,
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
