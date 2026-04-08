/**
 * Database Schema - Unified Exports
 *
 * All table definitions, relations, and types for the recipe-app database.
 * This is the single source of truth consumed by drizzle-orm queries.
 */

// Core recipe tables
export {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
  recipesRelations,
  recipeIngredientsRelations,
  recipeStepsRelations,
  recipeTagsRelations,
} from './recipes';

// i18n translation tables (also includes relations for taxonomy tables)
export {
  recipeTranslations,
  ingredientTranslations,
  stepTranslations,
  categoryTranslations,
  cuisineTranslations,
  recipeTranslationsRelations,
  ingredientTranslationsRelations,
  stepTranslationsRelations,
  categoryTranslationsRelations,
  cuisineTranslationsRelations,
  categoriesRelations,
  cuisinesRelations,
} from './i18n';

// Taxonomy tables
export {
  categories,
  cuisines,
} from './taxonomy';

// Auth-dependent tables (preserved but disabled in API)
export {
  favorites,
  favoriteFolders,
  recipeRatings,
  recipeReviews,
  favoritesRelations,
  favoriteFoldersRelations,
  recipeRatingsRelations,
  recipeReviewsRelations,
} from './favorites';

// Recipe subscriptions table
export {
  recipeSubscriptions,
  recipeSubscriptionsRelations,
} from './recipe-subscriptions';

// Recipe reminders table
export {
  recipeReminders,
  recipeRemindersRelations,
} from './recipe-reminders';

// User authentication tables
export {
  users,
  usersRelations,
  type UserRole,
} from './users';

// Email verification tables
export {
  emailVerifications,
} from './email-verifications';

// Notifications table
export {
  notifications,
  notificationsRelations,
} from './notifications';
