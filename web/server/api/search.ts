import { defineEventHandler, getQuery } from 'h3';
import { eq, ilike, sql } from 'drizzle-orm';
import { useDb } from '../utils/db';
import { recipes, recipeIngredients } from '@recipe-app/database';

interface SearchResultItem {
  type: 'recipe' | 'ingredient';
  id: string;
  title: string;
  snippet?: string;
}

export default defineEventHandler(async (event) => {
  const db = useDb();
  const query = getQuery(event);
  const q = (query.q as string) || '';
  const scope = (query.scope as string) || 'all';
  const limit = parseInt(query.limit as string) || 20;

  if (!q || q.trim().length === 0) {
    return { data: [] };
  }

  const escaped = q.trim().replace(/[%_\\]/g, '\\$&');
  const searchTerm = `%${escaped}%`;
  const results: SearchResultItem[] = [];

  if (scope === 'all' || scope === 'recipes') {
    const recipeRows = await db
      .select({ id: recipes.id, title: recipes.title, description: recipes.description })
      .from(recipes)
      .where(
        sql`(${ilike(recipes.title, searchTerm)} OR ${ilike(recipes.description, searchTerm)})`
      )
      .limit(limit);

    results.push(
      ...recipeRows.map((r) => ({
        type: 'recipe',
        id: r.id,
        title: r.title ?? '',
        snippet: r.description?.substring(0, 150) || '',
      }))
    );
  }

  if (scope === 'all' || scope === 'ingredients') {
    const ingredientRows = await db
      .select({
        name: recipeIngredients.name,
        recipeId: recipeIngredients.recipeId,
        recipeTitle: recipes.title,
      })
      .from(recipeIngredients)
      .innerJoin(recipes, eq(recipeIngredients.recipeId, recipes.id))
      .where(ilike(recipeIngredients.name, searchTerm))
      .limit(limit);

    results.push(
      ...ingredientRows.map((ing) => ({
        type: 'ingredient',
        id: ing.recipeId,
        title: ing.name,
        snippet: `Found in "${ing.recipeTitle}"`,
      }))
    );
  }

  return { data: results.slice(0, limit) };
});
