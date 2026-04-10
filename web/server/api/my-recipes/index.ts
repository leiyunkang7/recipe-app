import { defineEventHandler, getQuery, readBody, type H3Event } from 'h3';
import { rateLimiters } from "../../utils/rateLimit";
import { eq, desc, count, inArray } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { getCurrentUser } from '../../utils/session';
import { batchFetchRecipeRelatedData } from '../../utils/queryOptimizer';
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
  favorites,
  favoriteFolders,
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

  // Handle POST requests for favorites actions (apply rate limiting)
  await rateLimiters.userAction(event);
  if (event.method === 'POST') {
    return handleFavoritesActions(event, user.id);
  }

  const query = getQuery(event);

  // Handle GET requests for favorites
  if (query.type === 'favorites') {
    return handleGetFavorites(event, user.id);
  }

  // Handle GET requests for favorite folders
  if (query.type === 'favorite-folders') {
    return handleGetFavoriteFolders(event, user.id);
  }

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

  // Batch fetch all related data for all recipes at once (eliminates N+1 queries)
  const recipeIds = recipeRows.map(row => row.id);
  const relatedDataMap = await batchFetchRecipeRelatedData(db, recipeIds);

  // Map results using pre-fetched data
  const result = recipeRows.map((row: RecipeRow) => {
    const relatedData = relatedDataMap.get(row.id) || { ingredients: [], steps: [], tags: [], translations: [] };
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
        ingredients: relatedData.ingredients.map((ing: any) => ({
          id: ing.id,
          name: ing.name,
          amount: Number(ing.amount),
          unit: ing.unit,
        })),
        steps: relatedData.steps
          .sort((a: any, b: any) => a.stepNumber - b.stepNumber)
          .map((step: any) => ({
            id: step.id,
            step_number: step.stepNumber,
            instruction: step.instruction,
            duration_minutes: step.durationMinutes ?? null,
          })),
        tags: relatedData.tags.map((t: any) => t.tag),
        average_rating: 0,
        rating_count: 0,
      };
  });

  return {
    data: result,
    count: total,
  };
});

// Handle GET requests for favorites
async function handleGetFavorites(event: H3Event, userId: string) {
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 20;

  const db = useDb();

  // Get total count of favorites
  const [totalResult] = await db
    .select({ count: count() })
    .from(favorites)
    .where(eq(favorites.userId, userId));

  const total = totalResult?.count ?? 0;
  const offset = (page - 1) * limit;

  // Get favorite recipe IDs
  const favoriteRows = await db
    .select({ recipeId: favorites.recipeId })
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt))
    .limit(limit)
    .offset(offset);

  if (favoriteRows.length === 0) {
    return { data: [], count: 0 };
  }

  const recipeIds = favoriteRows.map((f) => f.recipeId);

  // Fetch full recipe data for each favorite
  const recipeRows = await db
    .select()
    .from(recipes)
    .where(inArray(recipes.id, recipeIds));

  // Create a map for ordering
  const recipeMap = new Map(recipeRows.map((r) => [r.id, r]));

  // Batch fetch all related data for all recipes at once (eliminates N+1 queries)
  const favRelatedDataMap = await batchFetchRecipeRelatedData(db, recipeIds);

  // Map results using pre-fetched data and maintain order
  const result = recipeIds
    .map((recipeId) => {
      const row = recipeMap.get(recipeId);
      if (!row) return null;

      const relatedData = favRelatedDataMap.get(recipeId) || { ingredients: [], steps: [], tags: [], translations: [] };

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
        ingredients: relatedData.ingredients.map((ing: any) => ({
          id: ing.id,
          name: ing.name,
          amount: Number(ing.amount),
          unit: ing.unit,
        })),
        steps: relatedData.steps
          .sort((a: any, b: any) => a.stepNumber - b.stepNumber)
          .map((step: any) => ({
            id: step.id,
            step_number: step.stepNumber,
            instruction: step.instruction,
            duration_minutes: step.durationMinutes ?? null,
          })),
        tags: relatedData.tags.map((t: any) => t.tag),
        average_rating: 0,
        rating_count: 0,
      };
    })
    .filter(Boolean);

  return {
    data: result.filter(Boolean),
    count: total,
  };
}

// Handle GET requests for favorite folders
async function handleGetFavoriteFolders(event: H3Event, userId: string) {
  const db = useDb();

  const folderRows = await db
    .select()
    .from(favoriteFolders)
    .where(eq(favoriteFolders.userId, userId))
    .orderBy(desc(favoriteFolders.createdAt));

  return {
    data: folderRows.map((folder) => ({
      id: folder.id,
      name: folder.name,
      color: folder.color,
      created_at: folder.createdAt?.toISOString() ?? null,
      updated_at: folder.updatedAt?.toISOString() ?? null,
    })),
    count: folderRows.length,
  };
}

// Handle POST requests for favorites actions
async function handleFavoritesActions(event: H3Event, userId: string) {
  const body = await readBody(event);
  const { action } = body;

  const db = useDb();

  switch (action) {
    case 'add-favorite': {
      const { recipeId, folderId } = body;
      try {
        await db.insert(favorites).values({
          userId,
          recipeId,
          folderId: folderId || null,
        }).onConflictDoNothing();
        return { success: true };
      } catch (err) {
        console.error('[my-recipes] Error adding favorite:', err);
        return { success: false, error: 'Failed to add favorite' };
      }
    }

    case 'remove-favorite': {
      const { recipeId } = body;
      try {
        await db.delete(favorites).where(
          eq(favorites.userId, userId) && eq(favorites.recipeId, recipeId)
        );
        return { success: true };
      } catch (err) {
        console.error('[my-recipes] Error removing favorite:', err);
        return { success: false, error: 'Failed to remove favorite' };
      }
    }

    case 'batch-remove-favorites': {
      const { recipeIds } = body;
      try {
        await db.delete(favorites).where(
          eq(favorites.userId, userId) && inArray(favorites.recipeId, recipeIds)
        );
        return { success: true, removed: recipeIds.length };
      } catch (err) {
        console.error('[my-recipes] Error batch removing favorites:', err);
        return { success: false, error: 'Failed to remove favorites' };
      }
    }

    case 'move-favorite-to-folder':
    case 'batch-move-to-folder': {
      const { recipeIds, folderId } = body;
      const idsToUpdate = Array.isArray(recipeIds) ? recipeIds : [recipeIds];
      try {
        await db.update(favorites)
          .set({ folderId: folderId || null })
          .where(
            eq(favorites.userId, userId) && inArray(favorites.recipeId, idsToUpdate)
          );
        return { success: true, moved: idsToUpdate.length };
      } catch (err) {
        console.error('[my-recipes] Error moving favorite to folder:', err);
        return { success: false, error: 'Failed to move favorite' };
      }
    }

    case 'create-favorite-folder': {
      const { name, color } = body;
      try {
        const [newFolder] = await db.insert(favoriteFolders).values({
          userId,
          name,
          color: color || '#F97316',
        }).returning();
        return { success: true, data: newFolder };
      } catch (err) {
        console.error('[my-recipes] Error creating folder:', err);
        return { success: false, error: 'Failed to create folder' };
      }
    }

    case 'rename-favorite-folder': {
      const { folderId, name } = body;
      try {
        await db.update(favoriteFolders)
          .set({ name, updatedAt: new Date() })
          .where(eq(favoriteFolders.id, folderId) && eq(favoriteFolders.userId, userId));
        return { success: true };
      } catch (err) {
        console.error('[my-recipes] Error renaming folder:', err);
        return { success: false, error: 'Failed to rename folder' };
      }
    }

    case 'delete-favorite-folder': {
      const { folderId } = body;
      try {
        await db.delete(favoriteFolders).where(
          eq(favoriteFolders.id, folderId) && eq(favoriteFolders.userId, userId)
        );
        return { success: true };
      } catch (err) {
        console.error('[my-recipes] Error deleting folder:', err);
        return { success: false, error: 'Failed to delete folder' };
      }
    }

    default:
      return { success: false, error: 'Unknown action' };
  }
}
