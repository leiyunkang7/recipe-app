import { SearchOptions, SearchResult, SearchSuggestion, ServiceResponse } from '@recipe-app/shared-types';
export declare class SearchService {
    private client;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Full-text search across recipes and ingredients
     */
    search(query: string, options?: SearchOptions): Promise<ServiceResponse<SearchResult[]>>;
    /**
     * Get search suggestions for autocomplete
     */
    suggestions(query: string): Promise<ServiceResponse<SearchSuggestion[]>>;
    /**
     * Calculate relevance score for search results
     */
    private calculateRelevance;
}
