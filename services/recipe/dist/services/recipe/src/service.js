"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const shared_types_1 = require("@recipe-app/shared-types");
class RecipeService {
    constructor(supabaseUrl, supabaseKey) {
        this.client = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    /**
     * Create a new recipe
     */
    async create(dto) {
        try {
            // Insert recipe main data
            const { data: recipeData, error: recipeError } = await this.client
                .from('recipes')
                .insert({
                title: dto.title,
                description: dto.description,
                category: dto.category,
                cuisine: dto.cuisine,
                servings: dto.servings,
                prep_time_minutes: dto.prepTimeMinutes,
                cook_time_minutes: dto.cookTimeMinutes,
                difficulty: dto.difficulty,
                image_url: dto.imageUrl,
                source: dto.source,
                nutrition_info: dto.nutritionInfo,
            })
                .select()
                .single();
            if (recipeError) {
                return (0, shared_types_1.errorResponse)('DB_ERROR', 'Failed to create recipe', recipeError);
            }
            const recipeId = recipeData.id;
            // Insert ingredients
            if (dto.ingredients && dto.ingredients.length > 0) {
                const ingredients = dto.ingredients.map((ing) => ({
                    recipe_id: recipeId,
                    name: ing.name,
                    amount: ing.amount,
                    unit: ing.unit,
                }));
                const { error: ingredientsError } = await this.client
                    .from('recipe_ingredients')
                    .insert(ingredients);
                if (ingredientsError) {
                    return (0, shared_types_1.errorResponse)('DB_ERROR', 'Failed to create ingredients', ingredientsError);
                }
            }
            // Insert steps
            if (dto.steps && dto.steps.length > 0) {
                const steps = dto.steps.map((step) => ({
                    recipe_id: recipeId,
                    step_number: step.stepNumber,
                    instruction: step.instruction,
                    duration_minutes: step.durationMinutes,
                }));
                const { error: stepsError } = await this.client
                    .from('recipe_steps')
                    .insert(steps);
                if (stepsError) {
                    return (0, shared_types_1.errorResponse)('DB_ERROR', 'Failed to create steps', stepsError);
                }
            }
            // Insert tags
            if (dto.tags && dto.tags.length > 0) {
                const tags = dto.tags.map((tag) => ({
                    recipe_id: recipeId,
                    tag,
                }));
                const { error: tagsError } = await this.client
                    .from('recipe_tags')
                    .insert(tags);
                if (tagsError) {
                    return (0, shared_types_1.errorResponse)('DB_ERROR', 'Failed to create tags', tagsError);
                }
            }
            // Fetch complete recipe
            const recipe = await this.findById(recipeId);
            return recipe;
        }
        catch (error) {
            return (0, shared_types_1.errorResponse)('UNKNOWN_ERROR', 'An unexpected error occurred', error);
        }
    }
    /**
     * Find a recipe by ID
     */
    async findById(id) {
        try {
            const { data: recipe, error } = await this.client
                .from('recipes')
                .select(`
          *,
          recipe_ingredients(*),
          recipe_steps(*),
          recipe_tags(*)
        `)
                .eq('id', id)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return (0, shared_types_1.errorResponse)('NOT_FOUND', `Recipe with ID ${id} not found`);
                }
                return (0, shared_types_1.errorResponse)('DB_ERROR', 'Failed to fetch recipe', error);
            }
            return (0, shared_types_1.successResponse)(this.mapToRecipe(recipe));
        }
        catch (error) {
            return (0, shared_types_1.errorResponse)('UNKNOWN_ERROR', 'An unexpected error occurred', error);
        }
    }
    /**
     * Find all recipes with filters and pagination
     */
    async findAll(filters, pagination) {
        try {
            let query = this.client
                .from('recipes')
                .select(`
          *,
          recipe_ingredients(*),
          recipe_steps(*),
          recipe_tags(*)
        `, { count: 'exact' });
            // Apply filters
            if (filters.category) {
                query = query.eq('category', filters.category);
            }
            if (filters.cuisine) {
                query = query.eq('cuisine', filters.cuisine);
            }
            if (filters.difficulty) {
                query = query.eq('difficulty', filters.difficulty);
            }
            if (filters.maxPrepTime) {
                query = query.lte('prep_time_minutes', filters.maxPrepTime);
            }
            if (filters.maxCookTime) {
                query = query.lte('cook_time_minutes', filters.maxCookTime);
            }
            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }
            // Pagination
            const from = (pagination.page - 1) * pagination.limit;
            const to = from + pagination.limit - 1;
            query = query.range(from, to).order('created_at', { ascending: false });
            const { data: recipes, error, count } = await query;
            if (error) {
                return (0, shared_types_1.errorResponse)('DB_ERROR', 'Failed to fetch recipes', error);
            }
            return (0, shared_types_1.successResponse)({
                recipes: recipes.map((r) => this.mapToRecipe(r)),
                total: count || 0,
                page: pagination.page,
                limit: pagination.limit,
            });
        }
        catch (error) {
            return (0, shared_types_1.errorResponse)('UNKNOWN_ERROR', 'An unexpected error occurred', error);
        }
    }
    /**
     * Update a recipe
     */
    async update(id, dto) {
        try {
            // Check if recipe exists
            const existing = await this.findById(id);
            if (!existing.success || !existing.data) {
                return existing;
            }
            // Update main recipe data
            const updateData = {};
            if (dto.title !== undefined)
                updateData.title = dto.title;
            if (dto.description !== undefined)
                updateData.description = dto.description;
            if (dto.category !== undefined)
                updateData.category = dto.category;
            if (dto.cuisine !== undefined)
                updateData.cuisine = dto.cuisine;
            if (dto.servings !== undefined)
                updateData.servings = dto.servings;
            if (dto.prepTimeMinutes !== undefined)
                updateData.prep_time_minutes = dto.prepTimeMinutes;
            if (dto.cookTimeMinutes !== undefined)
                updateData.cook_time_minutes = dto.cookTimeMinutes;
            if (dto.difficulty !== undefined)
                updateData.difficulty = dto.difficulty;
            if (dto.imageUrl !== undefined)
                updateData.image_url = dto.imageUrl;
            if (dto.source !== undefined)
                updateData.source = dto.source;
            if (dto.nutritionInfo !== undefined)
                updateData.nutrition_info = dto.nutritionInfo;
            const { error: updateError } = await this.client
                .from('recipes')
                .update(updateData)
                .eq('id', id);
            if (updateError) {
                return (0, shared_types_1.errorResponse)('DB_ERROR', 'Failed to update recipe', updateError);
            }
            // Update ingredients if provided
            if (dto.ingredients) {
                // Delete existing ingredients
                await this.client.from('recipe_ingredients').delete().eq('recipe_id', id);
                // Insert new ingredients
                const ingredients = dto.ingredients.map((ing) => ({
                    recipe_id: id,
                    name: ing.name,
                    amount: ing.amount,
                    unit: ing.unit,
                }));
                const { error: ingredientsError } = await this.client
                    .from('recipe_ingredients')
                    .insert(ingredients);
                if (ingredientsError) {
                    return (0, shared_types_1.errorResponse)('DB_ERROR', 'Failed to update ingredients', ingredientsError);
                }
            }
            // Update steps if provided
            if (dto.steps) {
                // Delete existing steps
                await this.client.from('recipe_steps').delete().eq('recipe_id', id);
                // Insert new steps
                const steps = dto.steps.map((step) => ({
                    recipe_id: id,
                    step_number: step.stepNumber,
                    instruction: step.instruction,
                    duration_minutes: step.durationMinutes,
                }));
                const { error: stepsError } = await this.client
                    .from('recipe_steps')
                    .insert(steps);
                if (stepsError) {
                    return (0, shared_types_1.errorResponse)('DB_ERROR', 'Failed to update steps', stepsError);
                }
            }
            // Update tags if provided
            if (dto.tags) {
                // Delete existing tags
                await this.client.from('recipe_tags').delete().eq('recipe_id', id);
                // Insert new tags
                const tags = dto.tags.map((tag) => ({
                    recipe_id: id,
                    tag,
                }));
                const { error: tagsError } = await this.client
                    .from('recipe_tags')
                    .insert(tags);
                if (tagsError) {
                    return (0, shared_types_1.errorResponse)('DB_ERROR', 'Failed to update tags', tagsError);
                }
            }
            // Fetch updated recipe
            return await this.findById(id);
        }
        catch (error) {
            return (0, shared_types_1.errorResponse)('UNKNOWN_ERROR', 'An unexpected error occurred', error);
        }
    }
    /**
     * Delete a recipe
     */
    async delete(id) {
        try {
            const { error } = await this.client
                .from('recipes')
                .delete()
                .eq('id', id);
            if (error) {
                return (0, shared_types_1.errorResponse)('DB_ERROR', 'Failed to delete recipe', error);
            }
            return (0, shared_types_1.successResponse)(undefined);
        }
        catch (error) {
            return (0, shared_types_1.errorResponse)('UNKNOWN_ERROR', 'An unexpected error occurred', error);
        }
    }
    /**
     * Batch import recipes
     */
    async batchImport(recipes) {
        const results = {
            total: recipes.length,
            succeeded: 0,
            failed: 0,
            errors: [],
        };
        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            const result = await this.create(recipe);
            if (result.success) {
                results.succeeded++;
            }
            else {
                results.failed++;
                results.errors.push({
                    index: i,
                    title: recipe.title,
                    error: result.error?.message || 'Unknown error',
                });
            }
        }
        return (0, shared_types_1.successResponse)(results);
    }
    /**
     * Map database record to Recipe type
     */
    mapToRecipe(data) {
        return {
            id: data.id,
            title: data.title,
            description: data.description,
            category: data.category,
            cuisine: data.cuisine,
            servings: data.servings,
            prepTimeMinutes: data.prep_time_minutes,
            cookTimeMinutes: data.cook_time_minutes,
            difficulty: data.difficulty,
            ingredients: (data.recipe_ingredients || []).map((ing) => ({
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
            })),
            steps: (data.recipe_steps || [])
                .sort((a, b) => a.step_number - b.step_number)
                .map((step) => ({
                stepNumber: step.step_number,
                instruction: step.instruction,
                durationMinutes: step.duration_minutes,
            })),
            tags: (data.recipe_tags || []).map((t) => t.tag),
            nutritionInfo: data.nutrition_info,
            imageUrl: data.image_url,
            source: data.source,
            createdAt: data.created_at ? new Date(data.created_at) : undefined,
            updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
        };
    }
}
exports.RecipeService = RecipeService;
