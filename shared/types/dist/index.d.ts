import { z } from 'zod';
export declare const IngredientSchema: z.ZodObject<{
    name: z.ZodString;
    amount: z.ZodNumber;
    unit: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    amount: number;
    unit: string;
}, {
    name: string;
    amount: number;
    unit: string;
}>;
export type Ingredient = z.infer<typeof IngredientSchema>;
export declare const RecipeStepSchema: z.ZodObject<{
    stepNumber: z.ZodNumber;
    instruction: z.ZodString;
    durationMinutes: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    stepNumber: number;
    instruction: string;
    durationMinutes?: number | undefined;
}, {
    stepNumber: number;
    instruction: string;
    durationMinutes?: number | undefined;
}>;
export type RecipeStep = z.infer<typeof RecipeStepSchema>;
export declare const NutritionInfoSchema: z.ZodObject<{
    calories: z.ZodOptional<z.ZodNumber>;
    protein: z.ZodOptional<z.ZodNumber>;
    carbs: z.ZodOptional<z.ZodNumber>;
    fat: z.ZodOptional<z.ZodNumber>;
    fiber: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    calories?: number | undefined;
    protein?: number | undefined;
    carbs?: number | undefined;
    fat?: number | undefined;
    fiber?: number | undefined;
}, {
    calories?: number | undefined;
    protein?: number | undefined;
    carbs?: number | undefined;
    fat?: number | undefined;
    fiber?: number | undefined;
}>;
export type NutritionInfo = z.infer<typeof NutritionInfoSchema>;
export declare const RecipeSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    cuisine: z.ZodOptional<z.ZodString>;
    servings: z.ZodNumber;
    prepTimeMinutes: z.ZodNumber;
    cookTimeMinutes: z.ZodNumber;
    difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
    ingredients: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        amount: z.ZodNumber;
        unit: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        amount: number;
        unit: string;
    }, {
        name: string;
        amount: number;
        unit: string;
    }>, "many">;
    steps: z.ZodArray<z.ZodObject<{
        stepNumber: z.ZodNumber;
        instruction: z.ZodString;
        durationMinutes: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        stepNumber: number;
        instruction: string;
        durationMinutes?: number | undefined;
    }, {
        stepNumber: number;
        instruction: string;
        durationMinutes?: number | undefined;
    }>, "many">;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    nutritionInfo: z.ZodOptional<z.ZodObject<{
        calories: z.ZodOptional<z.ZodNumber>;
        protein: z.ZodOptional<z.ZodNumber>;
        carbs: z.ZodOptional<z.ZodNumber>;
        fat: z.ZodOptional<z.ZodNumber>;
        fiber: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
        fiber?: number | undefined;
    }, {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
        fiber?: number | undefined;
    }>>;
    imageUrl: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    title: string;
    category: string;
    servings: number;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    difficulty: "easy" | "medium" | "hard";
    ingredients: {
        name: string;
        amount: number;
        unit: string;
    }[];
    steps: {
        stepNumber: number;
        instruction: string;
        durationMinutes?: number | undefined;
    }[];
    id?: string | undefined;
    description?: string | undefined;
    cuisine?: string | undefined;
    tags?: string[] | undefined;
    nutritionInfo?: {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
        fiber?: number | undefined;
    } | undefined;
    imageUrl?: string | undefined;
    source?: string | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}, {
    title: string;
    category: string;
    servings: number;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    difficulty: "easy" | "medium" | "hard";
    ingredients: {
        name: string;
        amount: number;
        unit: string;
    }[];
    steps: {
        stepNumber: number;
        instruction: string;
        durationMinutes?: number | undefined;
    }[];
    id?: string | undefined;
    description?: string | undefined;
    cuisine?: string | undefined;
    tags?: string[] | undefined;
    nutritionInfo?: {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
        fiber?: number | undefined;
    } | undefined;
    imageUrl?: string | undefined;
    source?: string | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}>;
export type Recipe = z.infer<typeof RecipeSchema>;
export declare const CreateRecipeDTO: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodString;
    cuisine: z.ZodOptional<z.ZodString>;
    servings: z.ZodNumber;
    prepTimeMinutes: z.ZodNumber;
    cookTimeMinutes: z.ZodNumber;
    difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
    ingredients: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        amount: z.ZodNumber;
        unit: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        amount: number;
        unit: string;
    }, {
        name: string;
        amount: number;
        unit: string;
    }>, "many">;
    steps: z.ZodArray<z.ZodObject<{
        stepNumber: z.ZodNumber;
        instruction: z.ZodString;
        durationMinutes: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        stepNumber: number;
        instruction: string;
        durationMinutes?: number | undefined;
    }, {
        stepNumber: number;
        instruction: string;
        durationMinutes?: number | undefined;
    }>, "many">;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    nutritionInfo: z.ZodOptional<z.ZodObject<{
        calories: z.ZodOptional<z.ZodNumber>;
        protein: z.ZodOptional<z.ZodNumber>;
        carbs: z.ZodOptional<z.ZodNumber>;
        fat: z.ZodOptional<z.ZodNumber>;
        fiber: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
        fiber?: number | undefined;
    }, {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
        fiber?: number | undefined;
    }>>;
    imageUrl: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "id" | "createdAt" | "updatedAt">, "strict", z.ZodTypeAny, {
    title: string;
    category: string;
    servings: number;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    difficulty: "easy" | "medium" | "hard";
    ingredients: {
        name: string;
        amount: number;
        unit: string;
    }[];
    steps: {
        stepNumber: number;
        instruction: string;
        durationMinutes?: number | undefined;
    }[];
    description?: string | undefined;
    cuisine?: string | undefined;
    tags?: string[] | undefined;
    nutritionInfo?: {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
        fiber?: number | undefined;
    } | undefined;
    imageUrl?: string | undefined;
    source?: string | undefined;
}, {
    title: string;
    category: string;
    servings: number;
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    difficulty: "easy" | "medium" | "hard";
    ingredients: {
        name: string;
        amount: number;
        unit: string;
    }[];
    steps: {
        stepNumber: number;
        instruction: string;
        durationMinutes?: number | undefined;
    }[];
    description?: string | undefined;
    cuisine?: string | undefined;
    tags?: string[] | undefined;
    nutritionInfo?: {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
        fiber?: number | undefined;
    } | undefined;
    imageUrl?: string | undefined;
    source?: string | undefined;
}>;
export type CreateRecipeDTO = z.infer<typeof CreateRecipeDTO>;
export declare const UpdateRecipeDTO: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
    cuisine: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    servings: z.ZodOptional<z.ZodNumber>;
    prepTimeMinutes: z.ZodOptional<z.ZodNumber>;
    cookTimeMinutes: z.ZodOptional<z.ZodNumber>;
    difficulty: z.ZodOptional<z.ZodEnum<["easy", "medium", "hard"]>>;
    ingredients: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        amount: z.ZodNumber;
        unit: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        amount: number;
        unit: string;
    }, {
        name: string;
        amount: number;
        unit: string;
    }>, "many">>;
    steps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        stepNumber: z.ZodNumber;
        instruction: z.ZodString;
        durationMinutes: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        stepNumber: number;
        instruction: string;
        durationMinutes?: number | undefined;
    }, {
        stepNumber: number;
        instruction: string;
        durationMinutes?: number | undefined;
    }>, "many">>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    nutritionInfo: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        calories: z.ZodOptional<z.ZodNumber>;
        protein: z.ZodOptional<z.ZodNumber>;
        carbs: z.ZodOptional<z.ZodNumber>;
        fat: z.ZodOptional<z.ZodNumber>;
        fiber: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
        fiber?: number | undefined;
    }, {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
        fiber?: number | undefined;
    }>>>;
    imageUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    source: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    cuisine?: string | undefined;
    servings?: number | undefined;
    prepTimeMinutes?: number | undefined;
    cookTimeMinutes?: number | undefined;
    difficulty?: "easy" | "medium" | "hard" | undefined;
    ingredients?: {
        name: string;
        amount: number;
        unit: string;
    }[] | undefined;
    steps?: {
        stepNumber: number;
        instruction: string;
        durationMinutes?: number | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    nutritionInfo?: {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
        fiber?: number | undefined;
    } | undefined;
    imageUrl?: string | undefined;
    source?: string | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    cuisine?: string | undefined;
    servings?: number | undefined;
    prepTimeMinutes?: number | undefined;
    cookTimeMinutes?: number | undefined;
    difficulty?: "easy" | "medium" | "hard" | undefined;
    ingredients?: {
        name: string;
        amount: number;
        unit: string;
    }[] | undefined;
    steps?: {
        stepNumber: number;
        instruction: string;
        durationMinutes?: number | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    nutritionInfo?: {
        calories?: number | undefined;
        protein?: number | undefined;
        carbs?: number | undefined;
        fat?: number | undefined;
        fiber?: number | undefined;
    } | undefined;
    imageUrl?: string | undefined;
    source?: string | undefined;
}>;
export type UpdateRecipeDTO = z.infer<typeof UpdateRecipeDTO>;
export declare const RecipeFiltersSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodString>;
    cuisine: z.ZodOptional<z.ZodString>;
    difficulty: z.ZodOptional<z.ZodEnum<["easy", "medium", "hard"]>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    ingredient: z.ZodOptional<z.ZodString>;
    maxPrepTime: z.ZodOptional<z.ZodNumber>;
    maxCookTime: z.ZodOptional<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    category?: string | undefined;
    cuisine?: string | undefined;
    difficulty?: "easy" | "medium" | "hard" | undefined;
    tags?: string[] | undefined;
    ingredient?: string | undefined;
    maxPrepTime?: number | undefined;
    maxCookTime?: number | undefined;
    search?: string | undefined;
}, {
    category?: string | undefined;
    cuisine?: string | undefined;
    difficulty?: "easy" | "medium" | "hard" | undefined;
    tags?: string[] | undefined;
    ingredient?: string | undefined;
    maxPrepTime?: number | undefined;
    maxCookTime?: number | undefined;
    search?: string | undefined;
}>;
export type RecipeFilters = z.infer<typeof RecipeFiltersSchema>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type Pagination = z.infer<typeof PaginationSchema>;
export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export declare function successResponse<T>(data: T): ServiceResponse<T>;
export declare function errorResponse<T>(code: string, message: string, details?: any): ServiceResponse<T>;
export declare const ImageUploadOptionsSchema: z.ZodObject<{
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    quality: z.ZodDefault<z.ZodNumber>;
    compress: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    quality: number;
    compress: boolean;
    width?: number | undefined;
    height?: number | undefined;
}, {
    width?: number | undefined;
    height?: number | undefined;
    quality?: number | undefined;
    compress?: boolean | undefined;
}>;
export type ImageUploadOptions = z.infer<typeof ImageUploadOptionsSchema>;
export declare const SearchScopeSchema: z.ZodEnum<["recipes", "ingredients", "all"]>;
export type SearchScope = z.infer<typeof SearchScopeSchema>;
export declare const SearchOptionsSchema: z.ZodObject<{
    scope: z.ZodEnum<["recipes", "ingredients", "all"]>;
    limit: z.ZodNumber;
    includeNutrition: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    scope: "ingredients" | "recipes" | "all";
    includeNutrition?: boolean | undefined;
}, {
    limit: number;
    scope: "ingredients" | "recipes" | "all";
    includeNutrition?: boolean | undefined;
}>;
export type SearchOptions = z.infer<typeof SearchOptionsSchema>;
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
export declare const BatchImportResultSchema: z.ZodObject<{
    total: z.ZodNumber;
    succeeded: z.ZodNumber;
    failed: z.ZodNumber;
    errors: z.ZodArray<z.ZodObject<{
        index: z.ZodNumber;
        title: z.ZodString;
        error: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        title: string;
        index: number;
        error: string;
    }, {
        title: string;
        index: number;
        error: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    total: number;
    succeeded: number;
    failed: number;
    errors: {
        title: string;
        index: number;
        error: string;
    }[];
}, {
    total: number;
    succeeded: number;
    failed: number;
    errors: {
        title: string;
        index: number;
        error: string;
    }[];
}>;
export type BatchImportResult = z.infer<typeof BatchImportResultSchema>;
