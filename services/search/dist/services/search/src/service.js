"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const shared_types_1 = require("@recipe-app/shared-types");
class SearchService {
    constructor(supabaseUrl, supabaseKey) {
        this.client = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    /**
     * Full-text search across recipes and ingredients
     */
    async search(query, options = { scope: 'all', limit: 20, includeNutrition: false }) {
        try {
            if (!query || query.trim().length === 0) {
                return (0, shared_types_1.successResponse)([]);
            }
            const results = [];
            const searchTerm = `%${query.trim()}%`;
            // Search recipes
            if (options.scope === 'all' || options.scope === 'recipes') {
                const { data: recipes, error: recipeError } = await this.client
                    .from('recipes')
                    .select('id, title, description')
                    .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
                    .limit(options.limit);
                if (!recipeError && recipes) {
                    results.push(...recipes.map((r) => ({
                        type: 'recipe',
                        id: r.id,
                        title: r.title,
                        snippet: r.description?.substring(0, 150) + (r.description?.length > 150 ? '...' : ''),
                        relevanceScore: this.calculateRelevance(query, r.title, r.description),
                    })));
                }
            }
            // Search ingredients
            if (options.scope === 'all' || options.scope === 'ingredients') {
                const { data: ingredients, error: ingredientError } = await this.client
                    .from('recipe_ingredients')
                    .select('id, name, recipe_id, recipes!inner(id, title)')
                    .ilike('name', searchTerm)
                    .limit(options.limit);
                if (!ingredientError && ingredients) {
                    results.push(...ingredients.map((ing) => ({
                        type: 'ingredient',
                        id: ing.recipe_id,
                        title: ing.name,
                        snippet: `Found in "${ing.recipes.title}"`,
                        relevanceScore: this.calculateRelevance(query, ing.name, ''),
                    })));
                }
            }
            // Search tags
            if (options.scope === 'all') {
                const { data: tags, error: tagError } = await this.client
                    .from('recipe_tags')
                    .select('tag, recipe_id, recipes!inner(id, title)')
                    .ilike('tag', searchTerm)
                    .limit(options.limit);
                if (!tagError && tags) {
                    results.push(...tags.map((t) => ({
                        type: 'recipe',
                        id: t.recipe_id,
                        title: t.tag,
                        snippet: `Tag in "${t.recipes.title}"`,
                        relevanceScore: this.calculateRelevance(query, t.tag, ''),
                    })));
                }
            }
            // Sort by relevance score and limit results
            const sorted = results
                .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
                .slice(0, options.limit);
            return (0, shared_types_1.successResponse)(sorted);
        }
        catch (error) {
            return (0, shared_types_1.errorResponse)('UNKNOWN_ERROR', 'An unexpected error occurred', error);
        }
    }
    /**
     * Get search suggestions for autocomplete
     */
    async suggestions(query) {
        try {
            if (!query || query.trim().length < 2) {
                return (0, shared_types_1.successResponse)([]);
            }
            const searchTerm = `${query.trim()}%`;
            const suggestions = [];
            // Recipe title suggestions
            const { data: recipes } = await this.client
                .from('recipes')
                .select('title')
                .ilike('title', searchTerm)
                .limit(5);
            if (recipes) {
                const uniqueTitles = [...new Set(recipes.map((r) => r.title))];
                suggestions.push(...uniqueTitles.map((title) => ({
                    text: title,
                    type: 'recipe',
                })));
            }
            // Ingredient suggestions
            const { data: ingredients } = await this.client
                .from('recipe_ingredients')
                .select('name')
                .ilike('name', searchTerm)
                .limit(5);
            if (ingredients) {
                const uniqueIngredients = [...new Set(ingredients.map((i) => i.name))];
                suggestions.push(...uniqueIngredients.map((name) => ({
                    text: name,
                    type: 'ingredient',
                })));
            }
            // Tag suggestions
            const { data: tags } = await this.client
                .from('recipe_tags')
                .select('tag')
                .ilike('tag', searchTerm)
                .limit(5);
            if (tags) {
                const uniqueTags = [...new Set(tags.map((t) => t.tag))];
                suggestions.push(...uniqueTags.map((tag) => ({
                    text: tag,
                    type: 'tag',
                })));
            }
            // Remove duplicates and limit
            const uniqueSuggestions = Array.from(new Map(suggestions.map((s) => [s.text, s])).values()).slice(0, 10);
            return (0, shared_types_1.successResponse)(uniqueSuggestions);
        }
        catch (error) {
            return (0, shared_types_1.errorResponse)('UNKNOWN_ERROR', 'An unexpected error occurred', error);
        }
    }
    /**
     * Calculate relevance score for search results
     */
    calculateRelevance(query, title, description) {
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
exports.SearchService = SearchService;
