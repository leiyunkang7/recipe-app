import { z } from 'zod';

// ============ Locale Types ============

export const LocaleSchema = z.enum(['en', 'zh-CN']);
export type Locale = z.infer<typeof LocaleSchema>;

export const SUPPORTED_LOCALES: Locale[] = ['en', 'zh-CN'];
export const DEFAULT_LOCALE: Locale = 'en';

// ============ Translation Types ============

export const TranslationSchema = z.object({
  locale: LocaleSchema,
  title: z.string().min(1, 'Recipe title is required'),
  description: z.string().optional(),
});

export type Translation = z.infer<typeof TranslationSchema>;

export const IngredientTranslationSchema = z.object({
  locale: LocaleSchema,
  name: z.string().min(1, 'Ingredient name is required'),
});

export type IngredientTranslation = z.infer<typeof IngredientTranslationSchema>;

export const StepTranslationSchema = z.object({
  locale: LocaleSchema,
  instruction: z.string().min(1, 'Instruction is required'),
});

export type StepTranslation = z.infer<typeof StepTranslationSchema>;

// ============ Recipe Schemas ============

export const IngredientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Ingredient name is required'),
  amount: z.number().positive('Amount must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  translations: z.array(IngredientTranslationSchema).optional(),
});

export type Ingredient = z.infer<typeof IngredientSchema>;

export const RecipeStepSchema = z.object({
  id: z.string().uuid().optional(),
  stepNumber: z.number().int().positive(),
  instruction: z.string().min(1, 'Instruction is required'),
  durationMinutes: z.number().int().nonnegative().optional(),
  translations: z.array(StepTranslationSchema).optional(),
});

export type RecipeStep = z.infer<typeof RecipeStepSchema>;

export const NutritionInfoSchema = z.object({
  calories: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  fiber: z.number().nonnegative().optional(),
});

export type NutritionInfo = z.infer<typeof NutritionInfoSchema>;

export const RecipeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Recipe title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  cuisine: z.string().optional(),
  servings: z.number().int().positive('Servings must be positive'),
  prepTimeMinutes: z.number().int().nonnegative(),
  cookTimeMinutes: z.number().int().nonnegative(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  ingredients: z.array(IngredientSchema).min(1, 'At least one ingredient is required'),
  steps: z.array(RecipeStepSchema).min(1, 'At least one step is required'),
  tags: z.array(z.string()).optional(),
  nutritionInfo: NutritionInfoSchema.optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  source: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  translations: z.array(TranslationSchema).optional(),
});

export type Recipe = z.infer<typeof RecipeSchema>;

// ============ DTOs with Translations ============

export const CreateRecipeDTOSchema = z.object({
  title: z.string().min(1, 'Recipe title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  cuisine: z.string().optional(),
  servings: z.number().int().positive('Servings must be positive'),
  prepTimeMinutes: z.number().int().nonnegative(),
  cookTimeMinutes: z.number().int().nonnegative(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  ingredients: z.array(IngredientSchema).min(1, 'At least one ingredient is required'),
  steps: z.array(RecipeStepSchema).min(1, 'At least one step is required'),
  tags: z.array(z.string()).optional(),
  nutritionInfo: NutritionInfoSchema.optional(),
  imageUrl: z.string().optional(),
  source: z.string().optional(),
  translations: z.array(TranslationSchema).optional(),
});

export type CreateRecipeDTO = z.infer<typeof CreateRecipeDTOSchema>;

export const UpdateRecipeDTO = CreateRecipeDTOSchema.partial();
export type UpdateRecipeDTO = z.infer<typeof UpdateRecipeDTO>;

// ============ Filter Types ============

export const RecipeFiltersSchema = z.object({
  category: z.string().optional(),
  cuisine: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(z.string()).optional(),
  ingredient: z.string().optional(),
  maxPrepTime: z.number().int().positive().optional(),
  maxCookTime: z.number().int().positive().optional(),
  search: z.string().optional(),
});

export type RecipeFilters = z.infer<typeof RecipeFiltersSchema>;

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// ============ Service Response ============

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export function successResponse<T>(data: T): ServiceResponse<T> {
  return { success: true, data };
}

export function errorResponse<T>(
  code: string,
  message: string,
  details?: any
): ServiceResponse<T> {
  return { success: false, error: { code, message, details } };
}

// ============ Image Upload Options ============

export const ImageUploadOptionsSchema = z.object({
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  quality: z.number().int().min(1).max(100).default(85),
  compress: z.boolean().default(true),
});

export type ImageUploadOptions = z.infer<typeof ImageUploadOptionsSchema>;

// ============ Search Options ============

export const SearchScopeSchema = z.enum(['recipes', 'ingredients', 'all']);
export type SearchScope = z.infer<typeof SearchScopeSchema>;

export const SearchOptionsSchema = z.object({
  scope: SearchScopeSchema,
  limit: z.number().int().positive().max(100),
  includeNutrition: z.boolean().optional(),
});

export type SearchOptions = z.infer<typeof SearchOptionsSchema>;

// ============ Search Result Types ============

export interface SearchResult {
  type: 'recipe' | 'ingredient';
  id: string;
  title: string;
  snippet?: string;
  relevanceScore?: number;
}

export interface SearchSuggestion {
  text: string;
  type: 'recipe' | 'ingredient' | 'tag';
  count?: number;
}

// ============ Batch Import Types ============

export const BatchImportResultSchema = z.object({
  total: z.number(),
  succeeded: z.number(),
  failed: z.number(),
  errors: z.array(z.object({
    index: z.number(),
    title: z.string(),
    error: z.string(),
  })),
});

export type BatchImportResult = z.infer<typeof BatchImportResultSchema>;
