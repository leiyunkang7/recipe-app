import { eq, ilike, sql } from 'drizzle-orm';
import { recipes, recipeIngredients, recipeTags, Database } from '@recipe-app/database';
import {
  SearchOptions,
  SearchResult,
  SearchSuggestion,
  ServiceResponse,
  successResponse,
  errorResponse,
} from '@recipe-app/shared-types';

export class SearchService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Escape special characters for ILIKE pattern
   */
  private escapeLikePattern(str: string): string {
    return str.replace(/[%_\\]/g, '\\$&');
  }

  /**
   * Full-text search across recipes and ingredients
   */
  async search(
    query: string,
    options: SearchOptions = { scope: 'all', limit: 20, includeNutrition: false }
  ): Promise<ServiceResponse<SearchResult[]>> {
    try {
      if (!query || query.trim().length === 0) {
        return successResponse([]);
      }

      const results: SearchResult[] = [];
      const escapedQuery = this.escapeLikePattern(query.trim());
      const searchTerm = `%${escapedQuery}%`;

      if (options.scope === 'all' || options.scope === 'recipes') {
        const recipeRows = await this.db
          .select({ id: recipes.id, title: recipes.title, description: recipes.description })
          .from(recipes)
          .where(
            sql`(${ilike(recipes.title, searchTerm)} OR ${ilike(recipes.description, searchTerm)})`
          )
          .limit(options.limit);

        results.push(
          ...recipeRows.map((r) => ({
            type: 'recipe' as const,
            id: r.id,
            title: r.title ?? '',
            snippet:
              r.description?.substring(0, 150) + (r.description && r.description.length > 150 ? '...' : ''),
            relevanceScore: this.calculateRelevance(query, r.title ?? '', r.description ?? undefined),
          }))
        );
      }

      if (options.scope === 'all' || options.scope === 'ingredients') {
        const ingredientRows = await this.db
          .select({
            ingredientId: recipeIngredients.id,
            name: recipeIngredients.name,
            recipeId: recipeIngredients.recipeId,
            recipeTitle: recipes.title,
          })
          .from(recipeIngredients)
          .innerJoin(recipes, eq(recipeIngredients.recipeId, recipes.id))
          .where(ilike(recipeIngredients.name, searchTerm))
          .limit(options.limit);

        results.push(
          ...ingredientRows.map((ing) => ({
            type: 'ingredient' as const,
            id: ing.recipeId,
            title: ing.name,
            snippet: `Found in "${ing.recipeTitle}"`,
            relevanceScore: this.calculateRelevance(query, ing.name, ''),
          }))
        );
      }

      if (options.scope === 'all') {
        const tagRows = await this.db
          .select({
            tag: recipeTags.tag,
            recipeId: recipeTags.recipeId,
            recipeTitle: recipes.title,
          })
          .from(recipeTags)
          .innerJoin(recipes, eq(recipeTags.recipeId, recipes.id))
          .where(ilike(recipeTags.tag, searchTerm))
          .limit(options.limit);

        results.push(
          ...tagRows.map((t) => ({
            type: 'recipe' as const,
            id: t.recipeId,
            title: t.tag,
            snippet: `Tag in "${t.recipeTitle}"`,
            relevanceScore: this.calculateRelevance(query, t.tag, ''),
          }))
        );
      }

      const sorted = results
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, options.limit);

      return successResponse(sorted);
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', error);
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async suggestions(query: string): Promise<ServiceResponse<SearchSuggestion[]>> {
    try {
      if (!query || query.trim().length < 2) {
        return successResponse([]);
      }

      const escapedQuery = this.escapeLikePattern(query.trim());
      const searchTerm = `${escapedQuery}%`;
      const suggestions: SearchSuggestion[] = [];

      // Recipe title suggestions
      const recipeRows = await this.db
        .select({ title: recipes.title })
        .from(recipes)
        .where(ilike(recipes.title, searchTerm))
        .limit(5);

      const uniqueTitles = [...new Set(recipeRows.map((r) => r.title).filter(Boolean))];
      suggestions.push(
        ...uniqueTitles.map((title) => ({
          text: title!,
          type: 'recipe' as const,
        }))
      );

      // Ingredient suggestions
      const ingredientRows = await this.db
        .select({ name: recipeIngredients.name })
        .from(recipeIngredients)
        .where(ilike(recipeIngredients.name, searchTerm))
        .limit(5);

      const uniqueIngredients = [...new Set(ingredientRows.map((i) => i.name).filter(Boolean))];
      suggestions.push(
        ...uniqueIngredients.map((name) => ({
          text: name!,
          type: 'ingredient' as const,
        }))
      );

      // Tag suggestions
      const tagRows = await this.db
        .select({ tag: recipeTags.tag })
        .from(recipeTags)
        .where(ilike(recipeTags.tag, searchTerm))
        .limit(5);

      const uniqueTags = [...new Set(tagRows.map((t) => t.tag).filter(Boolean))];
      suggestions.push(
        ...uniqueTags.map((tag) => ({
          text: tag!,
          type: 'tag' as const,
        }))
      );

      // Remove duplicates and limit
      const uniqueSuggestions = Array.from(
        new Map(suggestions.map((s) => [s.text, s])).values()
      ).slice(0, 10);

      return successResponse(uniqueSuggestions);
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', error);
    }
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevance(query: string, title: string, description?: string): number {
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const descLower = description?.toLowerCase() || '';

    let score = 0;

    if (titleLower === queryLower) {
      score += 100;
    } else if (titleLower.startsWith(queryLower)) {
      score += 80;
    } else if (titleLower.includes(queryLower)) {
      score += 60;
    } else if (descLower.includes(queryLower)) {
      score += 20;
    }

    const words = queryLower.split(' ');
    words.forEach((word) => {
      if (titleLower.includes(word)) score += 10;
      if (descLower.includes(word)) score += 5;
    });

    return score;
  }
}
