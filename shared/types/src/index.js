"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchImportResultSchema = exports.SearchOptionsSchema = exports.SearchScopeSchema = exports.ImageUploadOptionsSchema = exports.PaginationSchema = exports.RecipeFiltersSchema = exports.UpdateRecipeDTOSchema = exports.CreateRecipeDTOSchema = exports.RecipeSchema = exports.NutritionInfoSchema = exports.RecipeStepSchema = exports.IngredientSchema = exports.StepTranslationSchema = exports.IngredientTranslationSchema = exports.TranslationSchema = exports.DEFAULT_LOCALE = exports.SUPPORTED_LOCALES = exports.LocaleSchema = void 0;
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
const zod_1 = require("zod");
// ============ Locale Types ============
exports.LocaleSchema = zod_1.z.enum(['en', 'zh-CN']);
exports.SUPPORTED_LOCALES = ['en', 'zh-CN'];
exports.DEFAULT_LOCALE = 'en';
// ============ Translation Types ============
exports.TranslationSchema = zod_1.z.object({
    locale: exports.LocaleSchema,
    title: zod_1.z.string().min(1, 'Recipe title is required'),
    description: zod_1.z.string().optional(),
});
exports.IngredientTranslationSchema = zod_1.z.object({
    locale: exports.LocaleSchema,
    name: zod_1.z.string().min(1, 'Ingredient name is required'),
});
exports.StepTranslationSchema = zod_1.z.object({
    locale: exports.LocaleSchema,
    instruction: zod_1.z.string().min(1, 'Instruction is required'),
});
// ============ Recipe Schemas ============
exports.IngredientSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(1, 'Ingredient name is required'),
    amount: zod_1.z.number().positive('Amount must be positive'),
    unit: zod_1.z.string().min(1, 'Unit is required'),
    translations: zod_1.z.array(exports.IngredientTranslationSchema).optional(),
});
exports.RecipeStepSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    stepNumber: zod_1.z.number().int().positive(),
    instruction: zod_1.z.string().min(1, 'Instruction is required'),
    durationMinutes: zod_1.z.number().int().nonnegative().optional(),
    translations: zod_1.z.array(exports.StepTranslationSchema).optional(),
});
exports.NutritionInfoSchema = zod_1.z.object({
    calories: zod_1.z.number().nonnegative().optional(),
    protein: zod_1.z.number().nonnegative().optional(),
    carbs: zod_1.z.number().nonnegative().optional(),
    fat: zod_1.z.number().nonnegative().optional(),
    fiber: zod_1.z.number().nonnegative().optional(),
});
exports.RecipeSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().min(1, 'Recipe title is required'),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().min(1, 'Category is required'),
    cuisine: zod_1.z.string().optional(),
    servings: zod_1.z.number().int().positive('Servings must be positive'),
    prepTimeMinutes: zod_1.z.number().int().nonnegative(),
    cookTimeMinutes: zod_1.z.number().int().nonnegative(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']),
    ingredients: zod_1.z.array(exports.IngredientSchema).min(1, 'At least one ingredient is required'),
    steps: zod_1.z.array(exports.RecipeStepSchema).min(1, 'At least one step is required'),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    nutritionInfo: exports.NutritionInfoSchema.optional(),
    imageUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    source: zod_1.z.string().optional(),
    createdAt: zod_1.z.date().optional(),
    updatedAt: zod_1.z.date().optional(),
    translations: zod_1.z.array(exports.TranslationSchema).optional(),
});
// ============ DTOs with Translations ============
exports.CreateRecipeDTOSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Recipe title is required'),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().min(1, 'Category is required'),
    cuisine: zod_1.z.string().optional(),
    servings: zod_1.z.number().int().positive('Servings must be positive'),
    prepTimeMinutes: zod_1.z.number().int().nonnegative(),
    cookTimeMinutes: zod_1.z.number().int().nonnegative(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']),
    ingredients: zod_1.z.array(exports.IngredientSchema).min(1, 'At least one ingredient is required'),
    steps: zod_1.z.array(exports.RecipeStepSchema).min(1, 'At least one step is required'),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    nutritionInfo: exports.NutritionInfoSchema.optional(),
    imageUrl: zod_1.z.string().optional(),
    source: zod_1.z.string().optional(),
    translations: zod_1.z.array(exports.TranslationSchema).optional(),
});
exports.UpdateRecipeDTOSchema = exports.CreateRecipeDTOSchema.partial();
// ============ Filter Types ============
exports.RecipeFiltersSchema = zod_1.z.object({
    category: zod_1.z.string().optional(),
    cuisine: zod_1.z.string().optional(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    ingredient: zod_1.z.string().optional(),
    maxPrepTime: zod_1.z.number().int().positive().optional(),
    maxCookTime: zod_1.z.number().int().positive().optional(),
    search: zod_1.z.string().optional(),
});
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().positive().max(100).default(20),
});
function successResponse(data) {
    return { success: true, data };
}
function errorResponse(code, message, details) {
    return { success: false, error: { code, message, details } };
}
// ============ Image Upload Options ============
exports.ImageUploadOptionsSchema = zod_1.z.object({
    width: zod_1.z.number().int().positive().optional(),
    height: zod_1.z.number().int().positive().optional(),
    quality: zod_1.z.number().int().min(1).max(100).default(85),
    compress: zod_1.z.boolean().default(true),
});
// ============ Search Options ============
exports.SearchScopeSchema = zod_1.z.enum(['recipes', 'ingredients', 'all']);
exports.SearchOptionsSchema = zod_1.z.object({
    scope: exports.SearchScopeSchema,
    limit: zod_1.z.number().int().positive().max(100),
    includeNutrition: zod_1.z.boolean().optional(),
});
// ============ Batch Import Types ============
exports.BatchImportResultSchema = zod_1.z.object({
    total: zod_1.z.number(),
    succeeded: zod_1.z.number(),
    failed: zod_1.z.number(),
    errors: zod_1.z.array(zod_1.z.object({
        index: zod_1.z.number(),
        title: zod_1.z.string(),
        error: zod_1.z.string(),
    })),
});
