import { defineEventHandler, getRouterParam, createError } from 'h3';
import { eq, count, sql } from 'drizzle-orm';
import { useDb } from '../../../../utils/db';
import { mockRecipes, shouldUseMockData } from '../../../../utils/mockData';
import { recipes, favorites } from '@recipe-app/database';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const method = event.method;

  if (!id) {
    throw createError({ statusCode: 400, message: 'Recipe ID is required' });
  }

  // POST: Increment view count
  if (method === 'POST') {
    return handleIncrement(event, id);
  }

  // GET: Return current stats
  return handleGetStats(event, id);
});

async function handleIncrement(event: any, id: string) {
  // Use mock data for E2E tests
  if (shouldUseMockData()) {
    const recipe = mockRecipes.find(r => r.id === id);
    if (!recipe) {
      throw createError({ statusCode: 404, message: 'Recipe not found' });
    }
    return {
      api_version: 'v1',
      data: {
        views: (recipe.views || 0) + 1,
        favoritesCount: 0,
        cookingCount: recipe.cookingCount || 0,
      },
    };
  }

  const db = useDb();

  // Increment view count
  await db
    .update(recipes)
    .set({ views: sql`${recipes.views} + 1` })
    .where(eq(recipes.id, id));

  // Return updated stats
  return handleGetStats(event, id);
}

async function handleGetStats(event: any, id: string) {
  // Use mock data for E2E tests
  if (shouldUseMockData()) {
    const recipe = mockRecipes.find(r => r.id === id);
    if (!recipe) {
      throw createError({ statusCode: 404, message: 'Recipe not found' });
    }
    return {
      api_version: 'v1',
      data: {
        views: recipe.views || 0,
        favoritesCount: 0,
        cookingCount: recipe.cookingCount || 0,
      },
    };
  }

  const db = useDb();

  // Get recipe views and cooking count
  const [recipeRow] = await db
    .select({
      views: recipes.views,
      cookingCount: recipes.cookingCount,
    })
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);

  if (!recipeRow) {
    throw createError({ statusCode: 404, message: 'Recipe not found' });
  }

  // Get favorites count for this recipe
  const [favoritesCountResult] = await db
    .select({ count: count() })
    .from(favorites)
    .where(eq(favorites.recipeId, id));

  return {
    api_version: 'v1',
    data: {
      views: recipeRow.views || 0,
      favoritesCount: favoritesCountResult?.count || 0,
      cookingCount: recipeRow.cookingCount || 0,
    },
  };
}
