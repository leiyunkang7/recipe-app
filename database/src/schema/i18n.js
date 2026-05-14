"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cuisinesRelations = exports.categoriesRelations = exports.cuisineTranslationsRelations = exports.cuisineTranslations = exports.categoryTranslationsRelations = exports.categoryTranslations = exports.stepTranslationsRelations = exports.stepTranslations = exports.ingredientTranslationsRelations = exports.ingredientTranslations = exports.recipeTranslationsRelations = exports.recipeTranslations = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const recipes_1 = require("./recipes");
const taxonomy_1 = require("./taxonomy");
/**
 * Recipe translations - stores localized title and description.
 */
exports.recipeTranslations = (0, pg_core_1.pgTable)('recipe_translations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    recipeId: (0, pg_core_1.uuid)('recipe_id').notNull().references(() => recipes_1.recipes.id, { onDelete: 'cascade' }),
    locale: (0, pg_core_1.varchar)('locale', { length: 10 }).notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)().on(table.recipeId, table.locale),
]);
exports.recipeTranslationsRelations = (0, drizzle_orm_1.relations)(exports.recipeTranslations, ({ one }) => ({
    recipe: one(recipes_1.recipes, { fields: [exports.recipeTranslations.recipeId], references: [recipes_1.recipes.id] }),
}));
/**
 * Ingredient translations - localized ingredient names.
 */
exports.ingredientTranslations = (0, pg_core_1.pgTable)('ingredient_translations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    ingredientId: (0, pg_core_1.uuid)('ingredient_id').notNull().references(() => recipes_1.recipeIngredients.id, { onDelete: 'cascade' }),
    locale: (0, pg_core_1.varchar)('locale', { length: 10 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)().on(table.ingredientId, table.locale),
]);
exports.ingredientTranslationsRelations = (0, drizzle_orm_1.relations)(exports.ingredientTranslations, ({ one }) => ({
    ingredient: one(recipes_1.recipeIngredients, { fields: [exports.ingredientTranslations.ingredientId], references: [recipes_1.recipeIngredients.id] }),
}));
/**
 * Step translations - localized step instructions.
 */
exports.stepTranslations = (0, pg_core_1.pgTable)('step_translations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    stepId: (0, pg_core_1.uuid)('step_id').notNull().references(() => recipes_1.recipeSteps.id, { onDelete: 'cascade' }),
    locale: (0, pg_core_1.varchar)('locale', { length: 10 }).notNull(),
    instruction: (0, pg_core_1.text)('instruction').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)().on(table.stepId, table.locale),
]);
exports.stepTranslationsRelations = (0, drizzle_orm_1.relations)(exports.stepTranslations, ({ one }) => ({
    step: one(recipes_1.recipeSteps, { fields: [exports.stepTranslations.stepId], references: [recipes_1.recipeSteps.id] }),
}));
/**
 * Category translations - localized category names.
 */
exports.categoryTranslations = (0, pg_core_1.pgTable)('category_translations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    categoryId: (0, pg_core_1.integer)('category_id').notNull().references(() => taxonomy_1.categories.id, { onDelete: 'cascade' }),
    locale: (0, pg_core_1.varchar)('locale', { length: 10 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)().on(table.categoryId, table.locale),
]);
exports.categoryTranslationsRelations = (0, drizzle_orm_1.relations)(exports.categoryTranslations, ({ one }) => ({
    category: one(taxonomy_1.categories, { fields: [exports.categoryTranslations.categoryId], references: [taxonomy_1.categories.id] }),
}));
/**
 * Cuisine translations - localized cuisine names.
 */
exports.cuisineTranslations = (0, pg_core_1.pgTable)('cuisine_translations', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    cuisineId: (0, pg_core_1.integer)('cuisine_id').notNull().references(() => taxonomy_1.cuisines.id, { onDelete: 'cascade' }),
    locale: (0, pg_core_1.varchar)('locale', { length: 10 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)().on(table.cuisineId, table.locale),
]);
exports.cuisineTranslationsRelations = (0, drizzle_orm_1.relations)(exports.cuisineTranslations, ({ one }) => ({
    cuisine: one(taxonomy_1.cuisines, { fields: [exports.cuisineTranslations.cuisineId], references: [taxonomy_1.cuisines.id] }),
}));
/**
 * Taxonomy relations - defined here to avoid circular imports.
 * taxonomy.ts tables are referenced by i18n.ts, so their relations live here.
 */
exports.categoriesRelations = (0, drizzle_orm_1.relations)(taxonomy_1.categories, ({ many }) => ({
    translations: many(exports.categoryTranslations),
}));
exports.cuisinesRelations = (0, drizzle_orm_1.relations)(taxonomy_1.cuisines, ({ many }) => ({
    translations: many(exports.cuisineTranslations),
}));
