"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipeTagsRelations = exports.recipeTags = exports.recipeStepsRelations = exports.recipeSteps = exports.recipeIngredientsRelations = exports.recipeIngredients = exports.recipesRelations = exports.recipes = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Main recipes table.
 * Includes both direct title/description columns (for CLI/simple usage)
 * and recipe_translations FK (for i18n via Web).
 */
exports.recipes = (0, pg_core_1.pgTable)('recipes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }),
    description: (0, pg_core_1.text)('description'),
    category: (0, pg_core_1.varchar)('category', { length: 100 }).notNull(),
    cuisine: (0, pg_core_1.varchar)('cuisine', { length: 100 }),
    servings: (0, pg_core_1.integer)('servings').notNull(),
    prepTimeMinutes: (0, pg_core_1.integer)('prep_time_minutes').notNull(),
    cookTimeMinutes: (0, pg_core_1.integer)('cook_time_minutes').notNull(),
    difficulty: (0, pg_core_1.varchar)('difficulty', { length: 20 }).notNull(),
    imageUrl: (0, pg_core_1.text)('image_url'),
    source: (0, pg_core_1.text)('source'),
    videoUrl: (0, pg_core_1.text)('video_url'),
    sourceUrl: (0, pg_core_1.text)('source_url'),
    nutritionInfo: (0, pg_core_1.jsonb)('nutrition_info').$type(),
    views: (0, pg_core_1.integer)('views').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow(),
});
exports.recipesRelations = (0, drizzle_orm_1.relations)(exports.recipes, ({ many }) => ({
    ingredients: many(exports.recipeIngredients),
    steps: many(exports.recipeSteps),
    tags: many(exports.recipeTags),
}));
/**
 * Recipe ingredients - one recipe has many ingredients.
 */
exports.recipeIngredients = (0, pg_core_1.pgTable)('recipe_ingredients', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    recipeId: (0, pg_core_1.uuid)('recipe_id').notNull().references(() => exports.recipes.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    amount: (0, pg_core_1.numeric)('amount', { precision: 10, scale: 2 }).notNull(),
    unit: (0, pg_core_1.varchar)('unit', { length: 50 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
exports.recipeIngredientsRelations = (0, drizzle_orm_1.relations)(exports.recipeIngredients, ({ one }) => ({
    recipe: one(exports.recipes, { fields: [exports.recipeIngredients.recipeId], references: [exports.recipes.id] }),
}));
/**
 * Recipe steps - ordered cooking steps.
 */
exports.recipeSteps = (0, pg_core_1.pgTable)('recipe_steps', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    recipeId: (0, pg_core_1.uuid)('recipe_id').notNull().references(() => exports.recipes.id, { onDelete: 'cascade' }),
    stepNumber: (0, pg_core_1.integer)('step_number').notNull(),
    instruction: (0, pg_core_1.text)('instruction').notNull(),
    durationMinutes: (0, pg_core_1.integer)('duration_minutes'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
exports.recipeStepsRelations = (0, drizzle_orm_1.relations)(exports.recipeSteps, ({ one }) => ({
    recipe: one(exports.recipes, { fields: [exports.recipeSteps.recipeId], references: [exports.recipes.id] }),
}));
/**
 * Recipe tags - many-to-many via join table.
 */
exports.recipeTags = (0, pg_core_1.pgTable)('recipe_tags', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    recipeId: (0, pg_core_1.uuid)('recipe_id').notNull().references(() => exports.recipes.id, { onDelete: 'cascade' }),
    tag: (0, pg_core_1.varchar)('tag', { length: 100 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow(),
});
exports.recipeTagsRelations = (0, drizzle_orm_1.relations)(exports.recipeTags, ({ one }) => ({
    recipe: one(exports.recipes, { fields: [exports.recipeTags.recipeId], references: [exports.recipes.id] }),
}));
