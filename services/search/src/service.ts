import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SearchOptions,
  SearchResult,
  SearchSuggestion,
  ServiceResponse,
  successResponse,
  errorResponse,
} from '@recipe-app/shared-types';

export class SearchService {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
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
        const { data: recipes, error: recipeError } = await this.client
          .from('recipes')
          .select('id, title, description')
          .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
          .limit(options.limit);

        if (!recipeError && recipes) {
          results.push(
            ...recipes.map((r) => ({
              type: 'recipe' as const,
              id: r.id,
              title: r.title,
              snippet: r.description?.substring(0, 150) + (r.description?.length > 150 ? '...' : ''),
              relevanceScore: this.calculateRelevance(query, r.title, r.description),
            }))
          );
        }
      }

      if (options.scope === 'all' || options.scope === 'ingredients') {
        const { data: ingredients, error: ingredientError } = await this.client
          .from('recipe_ingredients')
          .select('id, name, recipe_id, recipes!inner(id, title)')
          .ilike('name', searchTerm)
          .limit(options.limit);

        if (!ingredientError && ingredients) {
          results.push(
            ...ingredients.map((ing: any) => ({
              type: 'ingredient' as const,
              id: ing.recipe_id,
              title: ing.name,
              snippet: `Found in "${ing.recipes.title}"`,
              relevanceScore: this.calculateRelevance(query, ing.name, ''),
            }))
          );
        }
      }

      if (options.scope === 'all') {
        const { data: tags, error: tagError } = await this.client
          .from('recipe_tags')
          .select('tag, recipe_id, recipes!inner(id, title)')
          .ilike('tag', searchTerm)
          .limit(options.limit);

        if (!tagError && tags) {
          results.push(
            ...tags.map((t: any) => ({
              type: 'recipe' as const,
              id: t.recipe_id,
              title: t.tag,
              snippet: `Tag in "${t.recipes.title}"`,
              relevanceScore: this.calculateRelevance(query, t.tag, ''),
            }))
          );
        }
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
      const { data: recipes } = await this.client
        .from('recipes')
        .select('title')
        .ilike('title', searchTerm)
        .limit(5);

      if (recipes) {
        const uniqueTitles = [...new Set(recipes.map((r) => r.title))];
        suggestions.push(
          ...uniqueTitles.map((title) => ({
            text: title,
            type: 'recipe' as const,
          }))
        );
      }

      // Ingredient suggestions
      const { data: ingredients } = await this.client
        .from('recipe_ingredients')
        .select('name')
        .ilike('name', searchTerm)
        .limit(5);

      if (ingredients) {
        const uniqueIngredients = [...new Set(ingredients.map((i) => i.name))];
        suggestions.push(
          ...uniqueIngredients.map((name) => ({
            text: name,
            type: 'ingredient' as const,
          }))
        );
      }

      // Tag suggestions
      const { data: tags } = await this.client
        .from('recipe_tags')
        .select('tag')
        .ilike('tag', searchTerm)
        .limit(5);

      if (tags) {
        const uniqueTags = [...new Set(tags.map((t) => t.tag))];
        suggestions.push(
          ...uniqueTags.map((tag) => ({
            text: tag,
            type: 'tag' as const,
          }))
        );
      }

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

    // Exact match in title
    if (titleLower === queryLower) {
      score += 100;
    }
    // Title starts with query
    else if (titleLower.startsWith(queryLower)) {
      score += 80;
    }
    // Query is contained in title
    else if (titleLower.includes(queryLower)) {
      score += 60;
    }
    // Query is contained in description
    else if (descLower.includes(queryLower)) {
      score += 20;
    }

    // Word boundary matches
    const words = queryLower.split(' ');
    words.forEach((word) => {
      if (titleLower.includes(word)) {
        score += 10;
      }
      if (descLower.includes(word)) {
        score += 5;
      }
    });

    return score;
  }
}
