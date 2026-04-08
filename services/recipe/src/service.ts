import { eq, ilike, or, and, lte, desc, count } from 'drizzle-orm';
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
  Database,
} from '@recipe-app/database';
import {
  Recipe,
  CreateRecipeDTO,
  UpdateRecipeDTO,
  RecipeFilters,
  Pagination,
  ServiceResponse,
  successResponse,
  errorResponse,
  BatchImportResult,
} from '@recipe-app/shared-types';
import { recommendTags, getQuickTags, TagSuggestion } from './smart-tags';

export class RecipeService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Create a new recipe with transaction support
   */
  async create(dto: CreateRecipeDTO): Promise<ServiceResponse<Recipe>> {
    try {
      return await this.db.transaction(async (tx) => {
        const [recipeRow] = await tx
          .insert(recipes)
          .values({
            title: dto.title,
            description: dto.description,
            category: dto.category,
            cuisine: dto.cuisine,
            servings: dto.servings,
            prepTimeMinutes: dto.prepTimeMinutes,
            cookTimeMinutes: dto.cookTimeMinutes,
            difficulty: dto.difficulty,
            imageUrl: dto.imageUrl,
            source: dto.source,
            nutritionInfo: dto.nutritionInfo,
          })
          .returning();

        const recipeId = recipeRow.id;

        if (dto.ingredients && dto.ingredients.length > 0) {
          await tx.insert(recipeIngredients).values(
            dto.ingredients.map((ing) => ({
              recipeId,
              name: ing.name,
              amount: String(ing.amount),
              unit: ing.unit,
            }))
          );
        }

        if (dto.steps && dto.steps.length > 0) {
          await tx.insert(recipeSteps).values(
            dto.steps.map((step) => ({
              recipeId,
              stepNumber: step.stepNumber,
              instruction: step.instruction,
              durationMinutes: step.durationMinutes,
            }))
          );
        }

        if (dto.tags && dto.tags.length > 0) {
          await tx.insert(recipeTags).values(
            dto.tags.map((tag) => ({
              recipeId,
              tag,
            }))
          );
        }

        const recipe = await this.findByIdFromTx(tx, recipeId);
        return recipe;
      });
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', error);
    }
  }

  /**
   * Find a recipe by ID
   */
  async findById(id: string): Promise<ServiceResponse<Recipe>> {
    try {
      const recipeRows = await this.db
        .select()
        .from(recipes)
        .where(eq(recipes.id, id))
        .limit(1);

      if (recipeRows.length === 0) {
        return errorResponse('NOT_FOUND', `Recipe with ID ${id} not found`);
      }

      return successResponse(await this.mapToRecipe(this.db, recipeRows[0]));
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', error);
    }
  }

  /**
   * Find all recipes with filters and pagination
   */
  async findAll(
    filters: RecipeFilters,
    pagination: Pagination
  ): Promise<ServiceResponse<{ recipes: Recipe[]; total: number; page: number; limit: number }>> {
    try {
      const conditions = [];

      if (filters.category) {
        conditions.push(eq(recipes.category, filters.category));
      }

      if (filters.cuisine) {
        conditions.push(eq(recipes.cuisine, filters.cuisine));
      }

      if (filters.difficulty) {
        conditions.push(eq(recipes.difficulty, filters.difficulty));
      }

      if (filters.maxPrepTime) {
        conditions.push(lte(recipes.prepTimeMinutes, filters.maxPrepTime));
      }

      if (filters.maxCookTime) {
        conditions.push(lte(recipes.cookTimeMinutes, filters.maxCookTime));
      }

      if (filters.search) {
        const escapedSearch = filters.search.replace(/[%_\\]/g, '\\$&');
        conditions.push(
          or(
            ilike(recipes.title, `%${escapedSearch}%`),
            ilike(recipes.description, `%${escapedSearch}%`)
          )!
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult] = await this.db
        .select({ count: count() })
        .from(recipes)
        .where(whereClause);

      const total = totalResult?.count ?? 0;

      const offset = (pagination.page - 1) * pagination.limit;

      const recipeRows = await this.db
        .select()
        .from(recipes)
        .where(whereClause)
        .orderBy(desc(recipes.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      const mappedRecipes = await Promise.all(
        recipeRows.map((row) => this.mapToRecipe(this.db, row))
      );

      return successResponse({
        recipes: mappedRecipes,
        total,
        page: pagination.page,
        limit: pagination.limit,
      });
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', error);
    }
  }

  /**
   * Update a recipe
   */
  async update(id: string, dto: UpdateRecipeDTO): Promise<ServiceResponse<Recipe>> {
    try {
      return await this.db.transaction(async (tx) => {
        const existing = await this.findByIdFromTx(tx, id);
        if (!existing.success || !existing.data) {
          return existing;
        }

        const updateData: Record<string, unknown> = {};
        if (dto.title !== undefined) updateData.title = dto.title;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.category !== undefined) updateData.category = dto.category;
        if (dto.cuisine !== undefined) updateData.cuisine = dto.cuisine;
        if (dto.servings !== undefined) updateData.servings = dto.servings;
        if (dto.prepTimeMinutes !== undefined) updateData.prepTimeMinutes = dto.prepTimeMinutes;
        if (dto.cookTimeMinutes !== undefined) updateData.cookTimeMinutes = dto.cookTimeMinutes;
        if (dto.difficulty !== undefined) updateData.difficulty = dto.difficulty;
        if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
        if (dto.source !== undefined) updateData.source = dto.source;
        if (dto.nutritionInfo !== undefined) updateData.nutritionInfo = dto.nutritionInfo;

        if (Object.keys(updateData).length > 0) {
          await tx.update(recipes).set(updateData).where(eq(recipes.id, id));
        }

        if (dto.ingredients) {
          await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));

          if (dto.ingredients.length > 0) {
            await tx.insert(recipeIngredients).values(
              dto.ingredients.map((ing) => ({
                recipeId: id,
                name: ing.name,
                amount: String(ing.amount),
                unit: ing.unit,
              }))
            );
          }
        }

        if (dto.steps) {
          await tx.delete(recipeSteps).where(eq(recipeSteps.recipeId, id));

          if (dto.steps.length > 0) {
            await tx.insert(recipeSteps).values(
              dto.steps.map((step) => ({
                recipeId: id,
                stepNumber: step.stepNumber,
                instruction: step.instruction,
                durationMinutes: step.durationMinutes,
              }))
            );
          }
        }

        if (dto.tags) {
          await tx.delete(recipeTags).where(eq(recipeTags.recipeId, id));

          if (dto.tags.length > 0) {
            await tx.insert(recipeTags).values(
              dto.tags.map((tag) => ({
                recipeId: id,
                tag,
              }))
            );
          }
        }

        return await this.findByIdFromTx(tx, id);
      });
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', error);
    }
  }

  /**
   * Delete a recipe
   */
  async delete(id: string): Promise<ServiceResponse<void>> {
    try {
      await this.db.delete(recipes).where(eq(recipes.id, id));
      return successResponse(undefined);
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', error);
    }
  }

  /**
   * Batch import recipes
   */
  async batchImport(recipes: CreateRecipeDTO[]): Promise<ServiceResponse<BatchImportResult>> {
    const results: BatchImportResult = {
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
      } else {
        results.failed++;
        results.errors.push({
          index: i,
          title: recipe.title,
          error: result.error?.message || 'Unknown error',
        });
      }
    }

    return successResponse(results);
  }

  /**
   * Find by ID using a specific transaction
   */
  private async findByIdFromTx(
    tx: Database,
    id: string
  ): Promise<ServiceResponse<Recipe>> {
    const recipeRows = await tx
      .select()
      .from(recipes)
      .where(eq(recipes.id, id))
      .limit(1);

    if (recipeRows.length === 0) {
      return errorResponse('NOT_FOUND', `Recipe with ID ${id} not found`);
    }

    return successResponse(await this.mapToRecipe(tx, recipeRows[0]));
  }

  /**
   * Map database row to Recipe type with related data
   */
  private async mapToRecipe(
    db: Database,
    row: typeof recipes.$inferSelect
  ): Promise<Recipe> {
    const ingredientsRows = await db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, row.id));

    const stepsRows = await db
      .select()
      .from(recipeSteps)
      .where(eq(recipeSteps.recipeId, row.id));

    const tagsRows = await db
      .select()
      .from(recipeTags)
      .where(eq(recipeTags.recipeId, row.id));

    return {
      id: row.id,
      title: row.title ?? '',
      description: row.description ?? '',
      category: row.category,
      cuisine: row.cuisine ?? '',
      servings: row.servings,
      prepTimeMinutes: row.prepTimeMinutes,
      cookTimeMinutes: row.cookTimeMinutes,
      difficulty: row.difficulty as Recipe['difficulty'],
      ingredients: ingredientsRows.map((ing) => ({
        name: ing.name,
        amount: Number(ing.amount),
        unit: ing.unit,
      })),
      steps: stepsRows
        .sort((a, b) => a.stepNumber - b.stepNumber)
        .map((step) => ({
          stepNumber: step.stepNumber,
          instruction: step.instruction,
          durationMinutes: step.durationMinutes ?? undefined,
        })),
      tags: tagsRows.map((t) => t.tag),
      nutritionInfo: row.nutritionInfo ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      source: row.source ?? undefined,
      createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
    };
  }


  /**
   * Get smart tag suggestions for a recipe based on its attributes
   */
  getTagSuggestions(dto: Partial<CreateRecipeDTO>): TagSuggestion[] {
    return recommendTags(dto as CreateRecipeDTO);
  }

  /**
   * Get autocomplete suggestions for tag input
   */
  getTagAutocomplete(partial: string): string[] {
    return getQuickTags(partial);
  }
}
