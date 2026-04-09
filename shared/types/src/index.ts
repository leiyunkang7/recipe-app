import { z } from 'zod';

// ============ Locale Types ============

export const LocaleSchema = z.enum(['en', 'zh-CN', 'ja']);
export type Locale = z.infer<typeof LocaleSchema>;

export const SUPPORTED_LOCALES: Locale[] = ['en', 'zh-CN', 'ja'];
export const DEFAULT_LOCALE: Locale = 'zh-CN';

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
  temperature: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
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
  temperature: z.number().int().nonnegative().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
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

// Nutrition calculation types
export const NutritionAnalysisSchema = z.object({
  total: NutritionInfoSchema,
  perServing: NutritionInfoSchema,
  servings: z.number().int().positive(),
  analyzedIngredients: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    unit: z.string(),
    grams: z.number(),
    matchedAs: z.string().optional(),
    nutrition: NutritionInfoSchema,
  })),
  unknownIngredients: z.array(z.string()),
});

export type NutritionAnalysis = z.infer<typeof NutritionAnalysisSchema>;

export const RecipeSchema = z.object({
  id: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
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
  imageSrcset: z.object({
    avif: z.string(),
    webp: z.string(),
  }).optional(),
  source: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  translations: z.array(TranslationSchema).optional(),
});

export type Recipe = z.infer<typeof RecipeSchema>;

// ============ DTOs with Translations ============

export const CreateRecipeDTOSchema = z.object({
  authorId: z.string().uuid().optional(),
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
  imageSrcset: z.object({
    avif: z.string(),
    webp: z.string(),
  }).optional(),
  source: z.string().optional(),
  translations: z.array(TranslationSchema).optional(),
});

export type CreateRecipeDTO = z.infer<typeof CreateRecipeDTOSchema>;

export const UpdateRecipeDTOSchema = CreateRecipeDTOSchema.partial();
export type UpdateRecipeDTO = z.infer<typeof UpdateRecipeDTOSchema>;

// ============ Filter Types ============

// Nutrition range for filtering
export const NutritionRangeSchema = z.object({
  minCalories: z.number().int().nonnegative().optional(),
  maxCalories: z.number().int().nonnegative().optional(),
  minProtein: z.number().int().nonnegative().optional(),
  maxProtein: z.number().int().nonnegative().optional(),
  minCarbs: z.number().int().nonnegative().optional(),
  maxCarbs: z.number().int().nonnegative().optional(),
  minFat: z.number().int().nonnegative().optional(),
  maxFat: z.number().int().nonnegative().optional(),
});

export type NutritionRange = z.infer<typeof NutritionRangeSchema>;

// Sort options for recipes
export const RecipeSortSchema = z.enum(['latest', 'popular', 'rating', 'quickest']);
export type RecipeSort = z.infer<typeof RecipeSortSchema>;

export const RecipeFiltersSchema = z.object({
  category: z.string().optional(),
  cuisine: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  authorId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  ingredient: z.string().optional(),
  ingredients: z.array(z.string()).optional(), // multiple ingredients (OR match)
  maxPrepTime: z.number().int().nonnegative().optional(),
  maxCookTime: z.number().int().nonnegative().optional(),
  maxTime: z.number().int().nonnegative().optional(), // total time (prep + cook)
  minTime: z.number().int().nonnegative().optional(), // total time (prep + cook)
  search: z.string().optional(),
  sort: RecipeSortSchema.optional(),
  minRating: z.number().min(0).max(5).optional(),
  nutrition: NutritionRangeSchema.optional(),
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
    details?: unknown;
  };
}

export function successResponse<T>(data: T): ServiceResponse<T> {
  return { success: true, data };
}

export function errorResponse<T>(
  code: string,
  message: string,
  details?: unknown
): ServiceResponse<T> {
  return { success: false, error: { code, message, details } };
}

// ============ Image Upload Options ============

export const ImageFormatSchema = z.enum(['jpeg', 'webp', 'avif']);
export type ImageFormat = z.infer<typeof ImageFormatSchema>;

export const ImageUploadOptionsSchema = z.object({
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  quality: z.number().int().min(1).max(100).default(85),
  compress: z.boolean().default(true),
  format: ImageFormatSchema.optional(),
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

// ============ User Authentication Types ============

export const UserRoleSchema = z.enum(['admin', 'editor', 'user']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(20),
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().url().optional().nullable(),
  bio: z.string().optional().nullable(),
  role: UserRoleSchema,
  emailVerified: z.boolean(),
  emailVerifiedAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const RegisterUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  verificationCode: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d{6}$/, 'Verification code must contain only digits'),
});

export type RegisterUserDTO = z.infer<typeof RegisterUserSchema>;

export const SendVerificationCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type SendVerificationCodeDTO = z.infer<typeof SendVerificationCodeSchema>;

export const VerifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

export type VerifyEmailDTO = z.infer<typeof VerifyEmailSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  token: z.string().optional(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const RegisterResponseSchema = z.object({
  success: z.boolean(),
  user: UserSchema.optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;


export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

// ============ Recipe Subscription Types ============

export const RecipeSubscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid(),
  recipeId: z.string().uuid(),
  subscribed: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type RecipeSubscription = z.infer<typeof RecipeSubscriptionSchema>;

export const SubscribeToRecipeSchema = z.object({
  recipeId: z.string().uuid('Invalid recipe ID'),
});

export type SubscribeToRecipeDTO = z.infer<typeof SubscribeToRecipeSchema>;

export const RecipeUpdateNotificationSchema = z.object({
  recipeId: z.string().uuid('Invalid recipe ID'),
  title: z.string(),
  description: z.string().optional(),
  updatedFields: z.array(z.string()).optional(),
});

export type RecipeUpdateNotification = z.infer<typeof RecipeUpdateNotificationSchema>;

// ============ WebSocket Types ============

export interface WSMessage {
  type: 'ping' | 'pong' | 'subscribe' | 'unsubscribe' | 'ack' | 'error' | 'notification';
  payload?: unknown;
  timestamp?: number;
  messageId?: string;
}

export interface WSClient {
  id: string;
  userId: string | null;
  send: (message: WSMessage) => void;
}

export type WSConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface SubscribePayload {
  userId?: string;
  recipeIds?: string[];
}

// ============ Notification Types ============

export const NotificationTypeSchema = z.enum([
  'recipe_updated',
  'recipe_deleted',
  'reminder_due',
  'favorite',     // Someone favorited (收藏) the user's recipe
  'comment',      // Someone commented on the user's recipe
  'follow',      // Someone followed the user
  'system',
]);

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  recipeId?: string;
  read: boolean;
  createdAt: Date;
}
// ============ Breadcrumb Types ============

export interface BreadcrumbItem {
  label: string
  href?: string
  isEllipsis?: boolean
}

// ============ Email Recipe Subscription Types ============

export const EmailRecipeSubscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email('Invalid email address'),
  recipeId: z.string().uuid('Invalid recipe ID'),
  subscribed: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type EmailRecipeSubscription = z.infer<typeof EmailRecipeSubscriptionSchema>;

export const SubscribeByEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  recipeId: z.string().uuid('Invalid recipe ID'),
});

export type SubscribeByEmailDTO = z.infer<typeof SubscribeByEmailSchema>;

export const UnsubscribeByTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type UnsubscribeByTokenDTO = z.infer<typeof UnsubscribeByTokenSchema>;

export const ConfirmEmailSubscriptionSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type ConfirmEmailSubscriptionDTO = z.infer<typeof ConfirmEmailSubscriptionSchema>;

// ============ Recipe Tip Types ============

export const RecipeTipSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  recipeId: z.string().uuid('Invalid recipe ID'),
  amount: z.number().int().positive('Amount must be positive'),
  message: z.string().max(500).optional(),
  displayName: z.string().max(100).optional(),
  createdAt: z.date().optional(),
});

export type RecipeTip = z.infer<typeof RecipeTipSchema>;

export const CreateTipSchema = z.object({
  recipeId: z.string().uuid('Invalid recipe ID'),
  amount: z.number().int().positive('Amount must be positive'),
  message: z.string().max(500).optional(),
  displayName: z.string().max(100).optional(),
});

export type CreateTipDTO = z.infer<typeof CreateTipSchema>;

// ============ Cooking Group Types ============

export const CookingGroupRoleSchema = z.enum(['owner', 'admin', 'member']);
export type CookingGroupRole = z.infer<typeof CookingGroupRoleSchema>;

export const CookingGroupSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Group name is required').max(100),
  description: z.string().max(500).optional(),
  creatorId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isPublic: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  memberCount: z.number().int().nonnegative().optional(),
  challengeCount: z.number().int().nonnegative().optional(),
});

export type CookingGroup = z.infer<typeof CookingGroupSchema>;

export const CreateCookingGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isPublic: z.boolean().default(true),
});

export type CreateCookingGroupDTO = z.infer<typeof CreateCookingGroupSchema>;

export const UpdateCookingGroupSchema = CreateCookingGroupSchema.partial();
export type UpdateCookingGroupDTO = z.infer<typeof UpdateCookingGroupSchema>;

export const CookingGroupMemberSchema = z.object({
  id: z.string().uuid().optional(),
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
  role: CookingGroupRoleSchema,
  joinedAt: z.date().optional(),
  user: UserSchema.optional(),
});

export type CookingGroupMember = z.infer<typeof CookingGroupMemberSchema>;

export const JoinCookingGroupSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
});

export type JoinCookingGroupDTO = z.infer<typeof JoinCookingGroupSchema>;

// ============ Cooking Challenge Types ============

export const ChallengeStatusSchema = z.enum(['upcoming', 'active', 'completed']);
export type ChallengeStatus = z.infer<typeof ChallengeStatusSchema>;

export const CookingChallengeSchema = z.object({
  id: z.string().uuid().optional(),
  groupId: z.string().uuid(),
  title: z.string().min(1, 'Challenge title is required').max(200),
  description: z.string().max(1000).optional(),
  rules: z.string().max(2000).optional(),
  startDate: z.date(),
  endDate: z.date(),
  status: ChallengeStatusSchema,
  createdBy: z.string().uuid().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  participantCount: z.number().int().nonnegative().optional(),
});

export type CookingChallenge = z.infer<typeof CookingChallengeSchema>;

export const CreateCookingChallengeSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  title: z.string().min(1, 'Challenge title is required').max(200),
  description: z.string().max(1000).optional(),
  rules: z.string().max(2000).optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
});

export type CreateCookingChallengeDTO = z.infer<typeof CreateCookingChallengeSchema>;

export const UpdateCookingChallengeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  rules: z.string().max(2000).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  status: ChallengeStatusSchema.optional(),
});

export type UpdateCookingChallengeDTO = z.infer<typeof UpdateCookingChallengeSchema>;

export const CookingChallengeParticipantSchema = z.object({
  id: z.string().uuid().optional(),
  challengeId: z.string().uuid(),
  userId: z.string().uuid(),
  recipeId: z.string().uuid().optional(),
  submittedAt: z.date().optional(),
  score: z.string().optional(),
  user: UserSchema.optional(),
  recipe: RecipeSchema.optional(),
});

export type CookingChallengeParticipant = z.infer<typeof CookingChallengeParticipantSchema>;

export const JoinCookingChallengeSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID'),
});

export type JoinCookingChallengeDTO = z.infer<typeof JoinCookingChallengeSchema>;

export const SubmitToChallengeSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID'),
  recipeId: z.string().uuid('Invalid recipe ID'),
});

export type SubmitToChallengeDTO = z.infer<typeof SubmitToChallengeSchema>;
