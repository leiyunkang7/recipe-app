import { Recipe, CreateRecipeDTO, UpdateRecipeDTO, RecipeFilters, Pagination, ServiceResponse, BatchImportResult } from '@recipe-app/shared-types';
export declare class RecipeService {
    private client;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Create a new recipe
     */
    create(dto: CreateRecipeDTO): Promise<ServiceResponse<Recipe>>;
    /**
     * Find a recipe by ID
     */
    findById(id: string): Promise<ServiceResponse<Recipe>>;
    /**
     * Find all recipes with filters and pagination
     */
    findAll(filters: RecipeFilters, pagination: Pagination): Promise<ServiceResponse<{
        recipes: Recipe[];
        total: number;
        page: number;
        limit: number;
    }>>;
    /**
     * Update a recipe
     */
    update(id: string, dto: UpdateRecipeDTO): Promise<ServiceResponse<Recipe>>;
    /**
     * Delete a recipe
     */
    delete(id: string): Promise<ServiceResponse<void>>;
    /**
     * Batch import recipes
     */
    batchImport(recipes: CreateRecipeDTO[]): Promise<ServiceResponse<BatchImportResult>>;
    /**
     * Map database record to Recipe type
     */
    private mapToRecipe;
}
