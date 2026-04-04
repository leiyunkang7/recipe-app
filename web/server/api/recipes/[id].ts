import { defineEventHandler, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
  recipeTranslations,
} from '@recipe-app/database';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const id = getRouterParam(event, 'id');

  if (!id) {
    return { error: 'Recipe ID is required' };
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

async function handleGet(_event: any, id: string) {
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
      created_at: recipeRow.createdAt?.toISOString() ?? null,
      updated_at: recipeRow.updatedAt?.toISOString() ?? null,
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
    },
  };
}

async function handleUpdate(event: any, id: string) {
  const db = useDb();
  const body = await readBody(event);

  try {
    return await db.transaction(async (tx) => {
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
            body.ingredients.map((ing: any) => ({
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
            body.steps.map((step: any) => ({
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
            body.translations.map((t: any) => ({
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

      return { success: true };
    });
  } catch (error: any) {
    return { error: error.message || 'Failed to update recipe' };
  }
}

async function handleDelete(_event: any, id: string) {
  const db = useDb();

  try {
    await db.delete(recipes).where(eq(recipes.id, id));
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to delete recipe' };
  }
}
