import { defineEventHandler, readBody, getRouterParam, type H3Event } from 'h3';
import { eq, sql } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { mockRecipes, shouldUseMockData } from '../../utils/mockData';
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
  recipeTranslations,
} from '@recipe-app/database';
import { rateLimiters } from '../../utils/rateLimit';

// Type definitions for database rows - using inferred types
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
  const id = getRouterParam(event, 'id');

  if (!id) {
    return { error: 'Recipe ID is required' };
  }

  // Rate limiting for write operations
  if (method === 'PATCH' || method === 'DELETE') {
    await rateLimiters.userAction(event);
  }

  if (method === 'GET') {
    return handleGet(event, id);
  } else if (method === 'PATCH') {
    return handleUpdate(event, id);
  } else if (method === 'DELETE') {
    return handleDelete(event, id);
  }

  return { error: 'Method not allowed' };
});

async function handleGet(_event: H3Event, id: string) {
  // Use mock data for E2E tests
  if (shouldUseMockData()) {
    const recipe = mockRecipes.find(r => r.id === id);
    if (!recipe) {
      return { error: 'Recipe not found' };
    }
    return { data: recipe };
  }

  const db = useDb();

  const [recipeRow] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);

  if (!recipeRow) {
    return { error: 'Recipe not found' };
  }

  const [ingredients, steps, tags, translations] = await Promise.all([
    db.select().from(recipeIngredients).where(eq(recipeIngredients.recipeId, id)),
    db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, id)),
    db.select().from(recipeTags).where(eq(recipeTags.recipeId, id)),
    db.select().from(recipeTranslations).where(eq(recipeTranslations.recipeId, id)),
  ]);

  return {
    data: {
      id: recipeRow.id,
      title: recipeRow.title ?? '',
      description: recipeRow.description ?? '',
      category: recipeRow.category,
      cuisine: recipeRow.cuisine ?? '',
      servings: recipeRow.servings,
      prep_time_minutes: recipeRow.prepTimeMinutes,
      cook_time_minutes: recipeRow.cookTimeMinutes,
      difficulty: recipeRow.difficulty,
      image_url: recipeRow.imageUrl ?? null,
      source: recipeRow.source ?? null,
      video_url: recipeRow.videoUrl ?? null,
      source_url: recipeRow.sourceUrl ?? null,
      nutrition_info: recipeRow.nutritionInfo ?? null,
      views: recipeRow.views ?? 0,
      cooking_count: recipeRow.cookingCount ?? 0,
      created_at: recipeRow.createdAt?.toISOString() ?? null,
      updated_at: recipeRow.updatedAt?.toISOString() ?? null,
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
    },
  };
}

async function handleUpdate(event: H3Event, id: string) {
  const body = await readBody(event);

  // Use mock data for E2E tests
  if (shouldUseMockData()) {
    const index = mockRecipes.findIndex(r => r.id === id);
    if (index === -1) {
      return { error: 'Recipe not found' };
    }

    mockRecipes[index] = {
      ...mockRecipes[index],
      ...body,
      updated_at: new Date().toISOString()
    };
    return { success: true };
  }

  const db = useDb();

  // Track updated fields for notification
  const updatedFields: string[] = [];
  if (body.title !== undefined) updatedFields.push('title');
  if (body.description !== undefined) updatedFields.push('description');
  if (body.category !== undefined) updatedFields.push('category');
  if (body.cuisine !== undefined) updatedFields.push('cuisine');
  if (body.servings !== undefined) updatedFields.push('servings');
  if (body.prep_time_minutes !== undefined) updatedFields.push('prepTimeMinutes');
  if (body.cook_time_minutes !== undefined) updatedFields.push('cookTimeMinutes');
  if (body.difficulty !== undefined) updatedFields.push('difficulty');
  if (body.image_url !== undefined) updatedFields.push('imageUrl');
  if (body.source !== undefined) updatedFields.push('source');
  if (body.nutrition_info !== undefined) updatedFields.push('nutritionInfo');
  if (body.ingredients !== undefined) updatedFields.push('ingredients');
  if (body.steps !== undefined) updatedFields.push('steps');
  if (body.tags !== undefined) updatedFields.push('tags');
  if (body.translations !== undefined) updatedFields.push('translations');

  try {
    const result = await db.transaction(async (tx) => {
      // Update main recipe
      const updateData: Record<string, unknown> = {};
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.cuisine !== undefined) updateData.cuisine = body.cuisine;
      if (body.servings !== undefined) updateData.servings = body.servings;
      if (body.prep_time_minutes !== undefined) updateData.prepTimeMinutes = body.prep_time_minutes;
      if (body.cook_time_minutes !== undefined) updateData.cookTimeMinutes = body.cook_time_minutes;
      if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
      if (body.image_url !== undefined) updateData.imageUrl = body.image_url;
      if (body.source !== undefined) updateData.source = body.source;
      if (body.nutrition_info !== undefined) updateData.nutritionInfo = body.nutrition_info;

      if (Object.keys(updateData).length > 0) {
        await tx.update(recipes).set(updateData).where(eq(recipes.id, id));
      }

      // Replace ingredients
      if (body.ingredients !== undefined) {
        await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
        if (body.ingredients.length > 0) {
          await tx.insert(recipeIngredients).values(
            body.ingredients.map((ing: IngredientInput) => ({
              recipeId: id,
              name: ing.name,
              amount: String(ing.amount),
              unit: ing.unit,
            }))
          );
        }
      }

      // Replace steps
      if (body.steps !== undefined) {
        await tx.delete(recipeSteps).where(eq(recipeSteps.recipeId, id));
        if (body.steps.length > 0) {
          await tx.insert(recipeSteps).values(
            body.steps.map((step: StepInput) => ({
              recipeId: id,
              stepNumber: step.step_number,
              instruction: step.instruction,
              durationMinutes: step.duration_minutes,
            }))
          );
        }
      }

      // Replace tags
      if (body.tags !== undefined) {
        await tx.delete(recipeTags).where(eq(recipeTags.recipeId, id));
        if (body.tags.length > 0) {
          await tx.insert(recipeTags).values(
            body.tags.map((tag: string) => ({ recipeId: id, tag }))
          );
        }
      }

      // Replace translations
      if (body.translations !== undefined) {
        await tx.delete(recipeTranslations).where(eq(recipeTranslations.recipeId, id));
        if (body.translations.length > 0) {
          await tx.insert(recipeTranslations).values(
            body.translations.map((t: TranslationInput) => ({
              recipeId: id,
              locale: t.locale,
              title: t.title,
              description: t.description,
            }))
          );
        }
      }

      // Increment views if requested
      if (body.incrementViews) {
        await tx
          .update(recipes)
          .set({ views: sql`${recipes.views} + 1` })
          .where(eq(recipes.id, id));
      }

      // Increment cooking count if requested
      if (body.incrementCookingCount) {
        await tx
          .update(recipes)
          .set({ cookingCount: sql`${recipes.cookingCount} + 1` })
          .where(eq(recipes.id, id));
      }

      return {
        success: true,
        title: (updateData.title as string) || body.title || 'Recipe',
      };
    });

    // After successful update, notify email subscribers
    // Fire and forget - don't await to avoid blocking the response
    if (updatedFields.length > 0 && result.success) {
      $fetch('/api/subscriptions/email/notify', {
        method: 'POST',
        body: {
          recipeId: id,
          title: result.title,
          description: body.description || `Recipe updated with changes to: ${updatedFields.join(', ')}`,
          updatedFields,
        },
      }).catch((err) => {
        console.error('[handleUpdate] Failed to notify email subscribers:', err);
      });
    }

    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update recipe';
    return { error: message };
  }
}

async function handleDelete(_event: H3Event, id: string) {
  // Use mock data for E2E tests
  if (shouldUseMockData()) {
    const index = mockRecipes.findIndex(r => r.id === id);
    if (index !== -1) {
      mockRecipes.splice(index, 1);
    }
    return { success: true };
  }

  const db = useDb();

  try {
    await db.delete(recipes).where(eq(recipes.id, id));
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete recipe';
    return { error: message };
  }
}
