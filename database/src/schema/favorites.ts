import { pgTable, uuid, integer, text, timestamp, unique, type PgTableWithColumns } from 'drizzle-orm/pg-core';
import { relations, type Relations } from 'drizzle-orm';
import { recipes } from './recipes';
import { users } from './users';

export const favorites: PgTableWithColumns<any> = pgTable('favorites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.recipeId),
]);

export const favoritesRelations: Relations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  recipe: one(recipes, { fields: [favorites.recipeId], references: [recipes.id] }),
}));

export const favoriteFolders: PgTableWithColumns<any> = pgTable('favorite_folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#F97316'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const favoriteFoldersRelations: Relations = relations(favoriteFolders, ({ one }) => ({
  user: one(users, { fields: [favoriteFolders.userId], references: [users.id] }),
}));

export const recipeRatings: PgTableWithColumns<any> = pgTable('recipe_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.recipeId),
]);

export const recipeRatingsRelations: Relations = relations(recipeRatings, ({ one }) => ({
  user: one(users, { fields: [recipeRatings.userId], references: [users.id] }),
  recipe: one(recipes, { fields: [recipeRatings.recipeId], references: [recipes.id] }),
}));


export const recipeReviews: PgTableWithColumns<any> = pgTable("recipe_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipeId: uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.recipeId),
]);

export const recipeReviewsRelations: Relations = relations(recipeReviews, ({ one }) => ({
  user: one(users, { fields: [recipeReviews.userId], references: [users.id] }),
  recipe: one(recipes, { fields: [recipeReviews.recipeId], references: [recipes.id] }),
}));
