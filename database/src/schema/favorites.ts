import { pgTable, uuid, integer, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { recipes } from './recipes';

/**
 * User favorite recipes.
 * Note: auth-dependent, temporarily disabled in API layer but table structure preserved.
 */
export const favorites = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.recipeId),
]);

export const favoritesRelations = relations(favorites, ({ one }) => ({
  recipe: one(recipes, { fields: [favorites.recipeId], references: [recipes.id] }),
}));

/**
 * Favorite folders for organizing saved recipes.
 */
export const favoriteFolders = pgTable('favorite_folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#F97316'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * User ratings for recipes (1-5 stars).
 * Note: auth-dependent, temporarily disabled in API layer but table structure preserved.
 */
export const recipeRatings = pgTable('recipe_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.recipeId),
]);
