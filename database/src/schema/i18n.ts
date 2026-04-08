import { pgTable, uuid, varchar, text, timestamp, integer, unique, type PgTableWithColumns } from 'drizzle-orm/pg-core';
import { relations, type Relations } from 'drizzle-orm';
import { recipes, recipeIngredients, recipeSteps } from './recipes';
import { categories, cuisines } from './taxonomy';

/**
 * Recipe translations - stores localized title and description.
 */
export const recipeTranslations: PgTableWithColumns<any> = pgTable('recipe_translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  locale: varchar('locale', { length: 10 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique().on(table.recipeId, table.locale),
]);

export const recipeTranslationsRelations: Relations = relations(recipeTranslations, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeTranslations.recipeId], references: [recipes.id] }),
}));

/**
 * Ingredient translations - localized ingredient names.
 */
export const ingredientTranslations: PgTableWithColumns<any> = pgTable('ingredient_translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  ingredientId: uuid('ingredient_id').notNull().references(() => recipeIngredients.id, { onDelete: 'cascade' }),
  locale: varchar('locale', { length: 10 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique().on(table.ingredientId, table.locale),
]);

export const ingredientTranslationsRelations: Relations = relations(ingredientTranslations, ({ one }) => ({
  ingredient: one(recipeIngredients, { fields: [ingredientTranslations.ingredientId], references: [recipeIngredients.id] }),
}));

/**
 * Step translations - localized step instructions.
 */
export const stepTranslations: PgTableWithColumns<any> = pgTable('step_translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  stepId: uuid('step_id').notNull().references(() => recipeSteps.id, { onDelete: 'cascade' }),
  locale: varchar('locale', { length: 10 }).notNull(),
  instruction: text('instruction').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique().on(table.stepId, table.locale),
]);

export const stepTranslationsRelations: Relations = relations(stepTranslations, ({ one }) => ({
  step: one(recipeSteps, { fields: [stepTranslations.stepId], references: [recipeSteps.id] }),
}));

/**
 * Category translations - localized category names.
 */
export const categoryTranslations: PgTableWithColumns<any> = pgTable('category_translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  locale: varchar('locale', { length: 10 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique().on(table.categoryId, table.locale),
]);

export const categoryTranslationsRelations: Relations = relations(categoryTranslations, ({ one }) => ({
  category: one(categories, { fields: [categoryTranslations.categoryId], references: [categories.id] }),
}));

/**
 * Cuisine translations - localized cuisine names.
 */
export const cuisineTranslations: PgTableWithColumns<any> = pgTable('cuisine_translations', {
  id: uuid('id').primaryKey().defaultRandom(),
  cuisineId: integer('cuisine_id').notNull().references(() => cuisines.id, { onDelete: 'cascade' }),
  locale: varchar('locale', { length: 10 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  unique().on(table.cuisineId, table.locale),
]);

export const cuisineTranslationsRelations: Relations = relations(cuisineTranslations, ({ one }) => ({
  cuisine: one(cuisines, { fields: [cuisineTranslations.cuisineId], references: [cuisines.id] }),
}));

/**
 * Taxonomy relations - defined here to avoid circular imports.
 * taxonomy.ts tables are referenced by i18n.ts, so their relations live here.
 */
export const categoriesRelations: Relations = relations(categories, ({ many }) => ({
  translations: many(categoryTranslations),
}));

export const cuisinesRelations: Relations = relations(cuisines, ({ many }) => ({
  translations: many(cuisineTranslations),
}));
