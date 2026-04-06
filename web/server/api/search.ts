import { defineEventHandler, getQuery } from 'h3';
import { eq, ilike, sql, desc, similarity, or, and } from 'drizzle-orm';
import { useDb } from '../utils/db';
import { recipes, recipeIngredients, recipeTags } from '@recipe-app/database';

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
  const suggest = query.suggest === 'true';

  // Advanced filter params
  const difficulty = query.difficulty as string | undefined;
  const cuisine = query.cuisine as string | undefined;
  const ingredients = query.ingredients
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

  if (scope === 'all' || scope === 'recipes') {
    // Text search condition
    const textCondition = sql`(${ilike(recipes.title, searchTerm)} OR ${ilike(recipes.description, searchTerm)})`;

    // Combine text search with filters
    const whereClause = recipeConditions.length > 0
      ? and(textCondition, ...recipeConditions)
      : textCondition;

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
  }

  // If no results and suggest is enabled, try to find similar titles
  let suggestion: string | undefined;
  if (results.length === 0 && suggest && q.trim().length >= 3) {
    try {
      // Use pg_trgm similarity function to find similar recipe titles
      const similarRecipes = await db
        .select({
          id: recipes.id,
          title: recipes.title,
          similarity: sql`similarity(${recipes.title}, ${q.trim()})`,
        })
        .from(recipes)
        .where(sql`similarity(${recipes.title}, ${q.trim()}) > 0.3`)
        .orderBy(desc(sql`similarity(${recipes.title}, ${q.trim()})`))
        .limit(1);

      if (similarRecipes.length > 0 && similarRecipes[0]) {
        suggestion = similarRecipes[0].title ?? undefined;
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
