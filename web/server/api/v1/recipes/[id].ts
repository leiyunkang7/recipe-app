/**
 * GET|PATCH|DELETE /api/v1/recipes/:id
 *
 * Versioned single recipe endpoint (v1).
 * Handles retrieve, update, and delete of a recipe by ID.
 */

import {
  defineEventHandler,
  readBody,
  getRouterParam,
  createError,
  type H3Event,
} from "h3";
import { eq, sql } from "drizzle-orm";
import { useDb } from "../../../utils/db";
import { mockRecipes, shouldUseMockData } from "../../../utils/mockData";
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
  recipeTranslations,
} from "@recipe-app/database";
import { rateLimiters } from "../../../utils/rateLimit";
import { apiResponse } from "../../../utils/apiVersion";

export default defineEventHandler(async (event) => {
  const method = event.method;
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({ statusCode: 400, message: "Recipe ID is required" });
  }

  if (method === "GET") {
    return apiResponse(await handleGet(id), "v1");
  }

  // Write operations require auth
  if (method === "PATCH" || method === "DELETE") {
    await rateLimiters.userAction(event);
  }

  if (method === "PATCH") {
    return apiResponse(await handleUpdate(event, id), "v1");
  } else if (method === "DELETE") {
    return apiResponse(await handleDelete(event, id), "v1");
  }

  throw createError({ statusCode: 405, message: "Method not allowed" });
});

// ---------------------------------------------------------------------------
// GET /api/v1/recipes/:id
// ---------------------------------------------------------------------------

async function handleGet(id: string) {
  if (shouldUseMockData()) {
    const recipe = mockRecipes.find((r) => r.id === id);
    if (!recipe) {
      throw createError({ statusCode: 404, message: "Recipe not found" });
    }
    return recipe;
  }

  const db = useDb();

  const [recipeRow] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);

  if (!recipeRow) {
    throw createError({ statusCode: 404, message: "Recipe not found" });
  }

  // Fetch related data
  const [dbIngredients, dbSteps, dbTags, dbTranslations] = await Promise.all([
    db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, id)),
    db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, id)).orderBy(recipeSteps.stepNumber),
    db.select().from(recipeTags).where(eq(recipeTags.recipeId, id)),
    db.select().from(recipeTranslations).where(eq(recipeTranslations.recipeId, id)),
  ]);

  return {
    ...recipeRow,
    ingredients: dbIngredients.map((i) => ({
      id: i.id,
      name: i.name,
      amount: Number(i.amount),
      unit: i.unit,
    })),
    steps: dbSteps.map((s) => ({
      id: s.id,
      step_number: s.stepNumber,
      instruction: s.instruction,
      duration_minutes: s.durationMinutes,
      image_url: s.imageUrl,
    })),
    tags: dbTags.map((t) => t.tag),
    translations: dbTranslations.map((t) => ({
      locale: t.locale,
      title: t.title,
      description: t.description,
    })),
  };
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/recipes/:id
// ---------------------------------------------------------------------------

async function handleUpdate(event: H3Event, id: string) {
  if (shouldUseMockData()) {
    throw createError({ statusCode: 501, message: "Update not supported in mock mode" });
  }

  const db = useDb();
  const body = await readBody(event);

  // Verify recipe exists
  const [existing] = await db.select({ id: recipes.id }).from(recipes).where(eq(recipes.id, id)).limit(1);
  if (!existing) {
    throw createError({ statusCode: 404, message: "Recipe not found" });
  }

  // Build partial update
  const updateData: Partial<typeof recipes.$inferInsert> = {};
  if (body.category !== undefined) updateData.category = body.category;
  if (body.cuisine !== undefined) updateData.cuisine = body.cuisine;
  if (body.servings !== undefined) updateData.servings = body.servings;
  if (body.prep_time_minutes !== undefined || body.prepTimeMinutes !== undefined) {
    updateData.prepTimeMinutes = body.prep_time_minutes ?? body.prepTimeMinutes;
  }
  if (body.cook_time_minutes !== undefined || body.cookTimeMinutes !== undefined) {
    updateData.cookTimeMinutes = body.cook_time_minutes ?? body.cookTimeMinutes;
  }
  if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
  if (body.image_url !== undefined || body.imageUrl !== undefined) {
    updateData.imageUrl = body.image_url ?? body.imageUrl;
  }
  if (body.nutrition_info !== undefined || body.nutritionInfo !== undefined) {
    updateData.nutritionInfo = body.nutrition_info ?? body.nutritionInfo;
  }

  updateData.updatedAt = new Date();

  if (Object.keys(updateData).length > 1) {
    await db.update(recipes).set(updateData).where(eq(recipes.id, id));
  }

  // Update ingredients if provided
  if (Array.isArray(body.ingredients)) {
    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
    if (body.ingredients.length > 0) {
      await db.insert(recipeIngredients).values(
        body.ingredients.map((ing: { name: string; amount: number | string; unit: string }) => ({
          recipeId: id,
          name: String(ing.name),
          amount: Number(ing.amount),
          unit: String(ing.unit),
        }))
      );
    }
  }

  // Update steps if provided
  if (Array.isArray(body.steps)) {
    await db.delete(recipeSteps).where(eq(recipeSteps.recipeId, id));
    if (body.steps.length > 0) {
      await db.insert(recipeSteps).values(
        body.steps.map(
          (
            step: { step_number?: number; stepNumber?: number; instruction: string; duration_minutes?: number | null },
            idx: number
          ) => ({
            recipeId: id,
            stepNumber: step.step_number ?? step.stepNumber ?? idx + 1,
            instruction: step.instruction,
            durationMinutes: step.duration_minutes ?? null,
          })
        )
      );
    }
  }

  // Update tags if provided
  if (Array.isArray(body.tags)) {
    await db.delete(recipeTags).where(eq(recipeTags.recipeId, id));
    if (body.tags.length > 0) {
      await db.insert(recipeTags).values(
        body.tags.map((tag: string) => ({ recipeId: id, tag }))
      );
    }
  }

  // Update translations if provided
  if (Array.isArray(body.translations)) {
    for (const t of body.translations) {
      await db
        .insert(recipeTranslations)
        .values({
          recipeId: id,
          locale: t.locale,
          title: t.title,
          description: t.description || null,
        })
        .onConflictDoUpdate({
          target: [recipeTranslations.recipeId, recipeTranslations.locale],
          set: { title: t.title, description: t.description || null },
        });
    }
  }

  // Return updated recipe
  return handleGet(id);
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/recipes/:id
// ---------------------------------------------------------------------------

async function handleDelete(_event: H3Event, id: string) {
  if (shouldUseMockData()) {
    throw createError({ statusCode: 501, message: "Delete not supported in mock mode" });
  }

  const db = useDb();

  const [existing] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);

  if (!existing) {
    throw createError({ statusCode: 404, message: "Recipe not found" });
  }

  // CASCADE deletes will handle related tables (ingredients, steps, tags, translations)
  await db.delete(recipes).where(eq(recipes.id, id));

  return { deleted: true, id };
}
