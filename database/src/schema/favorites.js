"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipeRatings = exports.favoriteFolders = exports.favoritesRelations = exports.favorites = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const recipes_1 = require("./recipes");
/**
 * User favorite recipes.
 * Note: auth-dependent, temporarily disabled in API layer but table structure preserved.
 */
exports.favorites = (0, pg_core_1.pgTable)('favorites', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull(),
    recipeId: (0, pg_core_1.uuid)('recipe_id').notNull().references(() => recipes_1.recipes.id, { onDelete: 'cascade' }),
    folderId: (0, pg_core_1.uuid)('folder_id'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.unique)().on(table.userId, table.recipeId),
]);
exports.favoritesRelations = (0, drizzle_orm_1.relations)(exports.favorites, ({ one }) => ({
    recipe: one(recipes_1.recipes, { fields: [exports.favorites.recipeId], references: [recipes_1.recipes.id] }),
}));
/**
 * Favorite folders for organizing saved recipes.
 */
exports.favoriteFolders = (0, pg_core_1.pgTable)('favorite_folders', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull(),
    name: (0, pg_core_1.text)('name').notNull(),
    color: (0, pg_core_1.text)('color').notNull().default('#F97316'),
    sortOrder: (0, pg_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
/**
 * User ratings for recipes (1-5 stars).
 * Note: auth-dependent, temporarily disabled in API layer but table structure preserved.
 */
exports.recipeRatings = (0, pg_core_1.pgTable)('recipe_ratings', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').notNull(),
    recipeId: (0, pg_core_1.uuid)('recipe_id').notNull().references(() => recipes_1.recipes.id, { onDelete: 'cascade' }),
    score: (0, pg_core_1.integer)('score').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.unique)().on(table.userId, table.recipeId),
]);
