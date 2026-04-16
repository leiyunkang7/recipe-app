/**
 * GET|POST /api/v1/recipes
 *
 * Versioned recipe list (v1) and create endpoint.
 * Wraps the core recipe logic with API versioning response format.
 */

import { defineEventHandler, getQuery, readBody, type H3Event, createError } from "h3";
import { rateLimiters } from "../../../utils/rateLimit";
import { eq, ilike, or, and, desc, asc, count, sql } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { mockRecipes, shouldUseMockData } from "../../../utils/mockData";
import { batchFetchRecipeRelatedData } from "../../../utils/queryOptimizer";
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
  recipeTranslations,
  recipeRatings,
} from "@recipe-app/database";
import { apiResponse, paginatedResponse } from "../../../utils/apiVersion";

// ---------------------------------------------------------------------------
// Shared helpers (reused from the non-versioned recipes API)
// ---------------------------------------------------------------------------

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

// Re-export types for consumers
export type { IngredientInput, StepInput, TranslationInput };

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    return handleList(event);
  } else if (method === "POST") {
    await rateLimiters.userAction(event);
    return handleCreate(event);
  }

  throw createError({ statusCode: 405, message: "Method not allowed" });
});

// ---------------------------------------------------------------------------
// GET /api/v1/recipes — list recipes with pagination & filters
// ---------------------------------------------------------------------------

async function handleList(event: H3Event) {
  if (shouldUseMockData()) {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = Math.min(parseInt(query.limit as string) || 20, 100);
    const category = query.category as string | undefined;
    const search = query.search as string | undefined;

    let result = [...mockRecipes];

    if (category) result = result.filter((r) => r.category === category);
    if (search) {
      const sl = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(sl) ||
          (r.description && r.description.toLowerCase().includes(sl))
      );
    }

    const total = result.length;
    const offset = (page - 1) * limit;
    const data = result.slice(offset, offset + limit);

    return paginatedResponse(data, page, limit, total, "v1");
  }

  const db = useDb();
  const query = getQuery(event);
  const page = Math.max(parseInt(query.page as string) || 1, 1);
  const limit = Math.min(parseInt(query.limit as string) || 20, 100);
  const category = query.category as string | undefined;
  const cuisine = query.cuisine as string | undefined;
  const difficulty = query.difficulty as string | undefined;
  const search = query.search as string | undefined;
  const locale = query.locale as string | undefined;
  const ingredients = query.ingredients
    ? (Array.isArray(query.ingredients) ? query.ingredients : [query.ingredients])
    : undefined;
  const maxTime = query.max_time ? parseInt(query.max_time as string) : undefined;
  const minTime = query.min_time ? parseInt(query.min_time as string) : undefined;
  const authorId = query.author_id as string | undefined;
  const sort = query.sort as string | undefined;
  const minRating = query.min_rating ? parseFloat(query.min_rating as string) : undefined;

  const conditions: ReturnType<typeof eq>[] = [];
  if (category) conditions.push(eq(recipes.category, category));
  if (cuisine) conditions.push(eq(recipes.cuisine, cuisine));
  if (difficulty) conditions.push(eq(recipes.difficulty, difficulty));
  if (authorId) conditions.push(eq(recipes.authorId, authorId));

  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(recipes.category, searchPattern),
        ilike(recipes.cuisine, searchPattern),
        ilike(recipes.source, searchPattern)
      )!
    );
  }

  if (maxTime) {
    conditions.push(
      sql`${recipes.prepTimeMinutes} + ${recipes.cookTimeMinutes} <= ${maxTime}`
    );
  }
  if (minTime) {
    conditions.push(
      sql`${recipes.prepTimeMinutes} + ${recipes.cookTimeMinutes} >= ${minTime}`
    );
  }

  // Build order
  let orderBy: ReturnType<typeof desc> = desc(recipes.createdAt);
  if (sort === "rating") orderBy = desc(recipes.avgRating);
  else if (sort === "popular") orderBy = desc(recipes.cookingCount);
  else if (sort === "time_asc") orderBy = asc(recipes.prepTimeMinutes);
  else if (sort === "time_desc") orderBy = desc(recipes.cookTimeMinutes);

  // Count total
  const [{ count: total }] = await db
    .select({ count: count() })
    .from(recipes)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Fetch recipes
  const rows = await db
    .select()
    .from(recipes)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit);

  // Fetch related data in batch
  const enriched = await batchFetchRecipeRelatedData(rows, locale ?? "zh");

  return paginatedResponse(enriched, page, limit, Number(total), "v1");
}

// ---------------------------------------------------------------------------
// POST /api/v1/recipes — create a new recipe
// ---------------------------------------------------------------------------

async function handleCreate(event: H3Event) {
  if (shouldUseMockData()) {
    throw createError({ statusCode: 501, message: "Create not supported in mock mode" });
  }

  const db = useDb();
  const body = await readBody(event);

  // Validate required fields
  if (!body.category) throw createError({ statusCode: 400, message: "category is required" });
  if (!body.servings || body.servings <= 0) throw createError({ statusCode: 400, message: "servings must be > 0" });
  if (!body.ingredients || !Array.isArray(body.ingredients) || body.ingredients.length === 0) {
    throw createError({ statusCode: 400, message: "ingredients array is required" });
  }

  // Auto-detect locale from body or default
  const locale = body.locale || "zh";

  // Build translation record
  const translationData: TranslationInput[] = Array.isArray(body.translations)
    ? body.translations
    : [{ locale, title: body.title || "Untitled", description: body.description || "" }];

  // Insert recipe
  const [inserted] = await db
    .insert(recipes)
    .values({
      category: body.category,
      cuisine: body.cuisine || null,
      servings: body.servings,
      prepTimeMinutes: body.prep_time_minutes ?? body.prepTimeMinutes ?? 0,
      cookTimeMinutes: body.cook_time_minutes ?? body.cookTimeMinutes ?? 0,
      difficulty: body.difficulty || "medium",
      imageUrl: body.image_url || body.imageUrl || null,
      imageSrcset: body.image_srcset || null,
      source: body.source || null,
      nutritionInfo: body.nutrition_info || null,
      authorId: body.author_id || body.authorId || null,
    })
    .returning();

  const recipeId = inserted.id;

  // Insert ingredients
  const ingredientRows: IngredientInput[] = body.ingredients;
  if (ingredientRows.length > 0) {
    await db.insert(recipeIngredients).values(
      ingredientRows.map((ing) => ({
        recipeId,
        name: String(ing.name),
        amount: Number(ing.amount),
        unit: String(ing.unit),
      }))
    );
  }

  // Insert steps
  const stepRows: StepInput[] = body.steps || [];
  if (stepRows.length > 0) {
    await db.insert(recipeSteps).values(
      stepRows.map((step, idx) => ({
        recipeId,
        stepNumber: step.step_number ?? step.stepNumber ?? idx + 1,
        instruction: step.instruction,
        durationMinutes: step.duration_minutes ?? step.durationMinutes ?? null,
        imageUrl: step.image_url || step.imageUrl || null,
      }))
    );
  }

  // Insert tags
  const tagRows: string[] = body.tags || [];
  if (tagRows.length > 0) {
    await db.insert(recipeTags).values(tagRows.map((tag) => ({ recipeId, tag })));
  }

  // Insert translations
  for (const t of translationData) {
    await db.insert(recipeTranslations).values({
      recipeId,
      locale: t.locale,
      title: t.title,
      description: t.description || null,
    });
  }

  // Return the created recipe (v1 format)
  return apiResponse(
    { id: recipeId, ...inserted },
    "v1",
    { created: true }
  );
}
