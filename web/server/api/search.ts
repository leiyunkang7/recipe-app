import { defineEventHandler, getQuery } from 'h3';
import { eq, ilike, sql, desc, or, and } from 'drizzle-orm';
import { useDb } from '../utils/db';
import { recipes, recipeIngredients, recipeTags } from '@recipe-app/database';
import { rateLimiters } from '../utils/rateLimit';
import { performanceTracker } from '@recipe-app/database';

// Query analysis helper
function logQuery(label: string, startMs: number, success: boolean, error?: string) {
  const duration = performance.now() - startMs;
  performanceTracker.record({
    query: `[SEARCH] ${label}`,
    durationMs: duration,
    success,
    error,
  });
  if (duration > 100) {
    console.warn(`[SEARCH QUERY] ${label}: ${duration.toFixed(1)}ms`);
  }
}

interface SearchResultItem {
  type: 'recipe' | 'ingredient';
  id: string;
  title: string;
  snippet?: string;
}

export default defineEventHandler(async (event) => {
  // Apply search rate limiting (30 requests per minute)
  await rateLimiters.search(event);

  const db = useDb();
  const query = getQuery(event);
  const q = (query.q as string) || '';
  const scope = (query.scope as string) || 'all';
  const limit = parseInt(query.limit as string) || 20;
  const suggest = query.suggest === 'true';

  // Advanced filter params
  const difficulty = query.difficulty as string | undefined;
  const cuisine = query.cuisine as string | undefined;
  const _ingredients = query.ingredients
    ? (Array.isArray(query.ingredients) ? query.ingredients as string[] : [query.ingredients as string])
    : undefined;
  const maxTime = query.max_time ? parseInt(query.max_time as string) : undefined;
  const minTime = query.min_time ? parseInt(query.min_time as string) : undefined;
  const taste = query.taste
    ? (Array.isArray(query.taste) ? query.taste as string[] : [query.taste as string])
    : undefined;

  if (!q || q.trim().length === 0) {
    return { data: [] };
  }

  const escaped = q.trim().replace(/[%_\\]/g, '\\$&');
  const searchTerm = "%" + escaped + "%";
  const results: SearchResultItem[] = [];

  // Build filter conditions for recipes
  const recipeConditions: ReturnType<typeof eq>[] = [];

  if (difficulty) {
    recipeConditions.push(eq(recipes.difficulty, difficulty as 'easy' | 'medium' | 'hard'));
  }
  if (cuisine) {
    recipeConditions.push(eq(recipes.cuisine, cuisine));
  }
  if (maxTime) {
    recipeConditions.push(sql`(${recipes.prepTimeMinutes} + ${recipes.cookTimeMinutes}) <= ${maxTime}` as ReturnType<typeof eq>);
  }
  if (minTime) {
    recipeConditions.push(sql`(${recipes.prepTimeMinutes} + ${recipes.cookTimeMinutes}) >= ${minTime}` as ReturnType<typeof eq>);
  }

  // Handle taste/tag filtering - get recipe IDs that have matching tags
  let recipeIdsWithTags: string[] | undefined;
  if (taste && taste.length > 0) {
    const startMs = performance.now();
    try {
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
      logQuery('tag filtering', startMs, true);
    } catch (error) {
      logQuery('tag filtering', startMs, false, 'Tag filtering query failed');
      // Re-throw the error to be handled by the main error handler
      throw error;
    }
  }

  if (scope === 'all' || scope === 'recipes') {
    // Text search condition
    const textCondition = sql`(${ilike(recipes.title, searchTerm)} OR ${ilike(recipes.description, searchTerm)})`;

    // Combine text search with filters
    const whereClause = recipeConditions.length > 0
      ? and(textCondition, ...recipeConditions)
      : textCondition;

    const startMs = performance.now();
    try {
      const recipeRows = await db
        .select({ id: recipes.id, title: recipes.title, description: recipes.description })
        .from(recipes)
        .where(whereClause)
        .limit(limit);
      // Filter by taste/tags if applicable
      let filteredRows = recipeRows;
      if (recipeIdsWithTags && recipeIdsWithTags.length > 0) {
        filteredRows = recipeRows.filter(row => recipeIdsWithTags.includes(row.id));
      }

      results.push(
        ...filteredRows.map((r) => ({
          type: 'recipe' as const,
          id: String(r.id),
          title: r.title ?? '',
          snippet: r.description?.substring(0, 150) || '',
        }))
      );
      logQuery('recipe search', startMs, true);
    } catch (error) {
      logQuery('recipe search', startMs, false, 'Recipe search query failed');
      // Re-throw the error to be handled by the main error handler
      throw error;
    }
  }

  if (scope === 'all' || scope === 'ingredients') {
    // For ingredient scope search, also apply the same filters
    const ingredientConditions: ReturnType<typeof eq>[] = [];

    if (difficulty) {
      ingredientConditions.push(eq(recipes.difficulty, difficulty as 'easy' | 'medium' | 'hard'));
    }
    if (cuisine) {
      ingredientConditions.push(eq(recipes.cuisine, cuisine));
    }
    if (maxTime) {
      ingredientConditions.push(sql`(${recipes.prepTimeMinutes} + ${recipes.cookTimeMinutes}) <= ${maxTime}` as ReturnType<typeof eq>);
    }
    if (minTime) {
      ingredientConditions.push(sql`(${recipes.prepTimeMinutes} + ${recipes.cookTimeMinutes}) >= ${minTime}` as ReturnType<typeof eq>);
    }

    const textCondition = ilike(recipeIngredients.name, searchTerm);
    const whereClause = ingredientConditions.length > 0
      ? and(textCondition, ...ingredientConditions)
      : textCondition;

    const startMs = performance.now();
    try {
      const ingredientRows = await db
        .select({
          name: recipeIngredients.name,
          recipeId: recipeIngredients.recipeId,
          recipeTitle: recipes.title,
        })
        .from(recipeIngredients)
        .innerJoin(recipes, eq(recipeIngredients.recipeId, recipes.id))
        .where(whereClause)
        .limit(limit);

      // Filter by taste/tags if applicable
      let filteredIngredientRows = ingredientRows;
      if (recipeIdsWithTags && recipeIdsWithTags.length > 0) {
        filteredIngredientRows = ingredientRows.filter(ing => recipeIdsWithTags.includes(ing.recipeId));
      }

      results.push(
        ...filteredIngredientRows.map((ing) => ({
          type: 'ingredient' as const,
          id: String(ing.recipeId),
          title: ing.name ?? '',
          snippet: `Found in "${ing.recipeTitle ?? ''}"`,
        }))
      );
      logQuery('ingredient search', startMs, true);
    } catch (error) {
      logQuery('ingredient search', startMs, false, 'Ingredient search query failed');
      // Re-throw the error to be handled by the main error handler
      throw error;
    }
  }

  // If no results and suggest is enabled, try to find similar titles, ingredients, or tags
  let suggestion: string | undefined;
  if (results.length === 0 && suggest && q.trim().length >= 3) {
    const trimmedQ = q.trim();
    try {
      // Use pg_trgm similarity function to find similar recipe titles
      const startMs = performance.now();
      const similarRecipes = await db
        .select({
          id: recipes.id,
          title: recipes.title,
          similarity: sql`similarity(${recipes.title}, ${trimmedQ})`,
        })
        .from(recipes)
        .where(sql`similarity(${recipes.title}, ${trimmedQ}) > 0.3`)
        .orderBy(desc(sql`similarity(${recipes.title}, ${trimmedQ})`))
        .limit(1);
      logQuery('similar recipe titles', startMs, true);

      if (similarRecipes.length > 0 && similarRecipes[0]) {
        suggestion = similarRecipes[0].title ?? undefined;
      }

      // If no title match, try ingredient names
      if (!suggestion) {
        const startMs2 = performance.now();
        const similarIngredients = await db
          .select({
            name: recipeIngredients.name,
            similarity: sql`similarity(${recipeIngredients.name}, ${trimmedQ})`,
          })
          .from(recipeIngredients)
          .where(sql`similarity(${recipeIngredients.name}, ${trimmedQ}) > 0.4`)
          .orderBy(desc(sql`similarity(${recipeIngredients.name}, ${trimmedQ})`))
          .limit(1);
        logQuery('similar ingredients', startMs2, true);

        if (similarIngredients.length > 0 && similarIngredients[0]) {
          suggestion = similarIngredients[0].name ?? undefined;
        }
      }

      // If no ingredient match, try tags
      if (!suggestion) {
        const startMs3 = performance.now();
        const similarTags = await db
          .select({
            tag: recipeTags.tag,
            similarity: sql`similarity(${recipeTags.tag}, ${trimmedQ})`,
          })
          .from(recipeTags)
          .where(sql`similarity(${recipeTags.tag}, ${trimmedQ}) > 0.4`)
          .orderBy(desc(sql`similarity(${recipeTags.tag}, ${trimmedQ})`))
          .limit(1);
        logQuery('similar tags', startMs3, true);

        if (similarTags.length > 0 && similarTags[0]) {
          suggestion = similarTags[0].tag ?? undefined;
        }
      }
    } catch {
      // pg_trgm might not be installed, fall back silently
      // The similarity search is best-effort
    }
  }

  return {
    data: results.slice(0, limit),
    ...(suggestion && { suggestion }),
  };
});
