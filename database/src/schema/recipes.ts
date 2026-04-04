import { pgTable, uuid, varchar, integer, text, jsonb, timestamp, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { uuidPk, timestamps } from './common';

/**
 * Main recipes table.
 * Includes both direct title/description columns (for CLI/simple usage)
 * and recipe_translations FK (for i18n via Web).
 */
export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  cuisine: varchar('cuisine', { length: 100 }),
  servings: integer('servings').notNull(),
  prepTimeMinutes: integer('prep_time_minutes').notNull(),
  cookTimeMinutes: integer('cook_time_minutes').notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  imageUrl: text('image_url'),
  source: text('source'),
  videoUrl: text('video_url'),
  sourceUrl: text('source_url'),
  nutritionInfo: jsonb('nutrition_info').$type<Record<string, number>>(),
  views: integer('views').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  steps: many(recipeSteps),
  tags: many(recipeTags),
}));

/**
 * Recipe ingredients - one recipe has many ingredients.
 */
export const recipeIngredients = pgTable('recipe_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeIngredients.recipeId], references: [recipes.id] }),
}));

/**
 * Recipe steps - ordered cooking steps.
 */
export const recipeSteps = pgTable('recipe_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(),
  instruction: text('instruction').notNull(),
  durationMinutes: integer('duration_minutes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const recipeStepsRelations = relations(recipeSteps, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeSteps.recipeId], references: [recipes.id] }),
}));

/**
 * Recipe tags - many-to-many via join table.
 */
export const recipeTags = pgTable('recipe_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  tag: varchar('tag', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const recipeTagsRelations = relations(recipeTags, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeTags.recipeId], references: [recipes.id] }),
}));
