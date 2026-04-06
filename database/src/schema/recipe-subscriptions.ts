import { pgTable, uuid, boolean, timestamp, unique, type PgTableWithColumns } from 'drizzle-orm/pg-core';
import { relations, type Relations } from 'drizzle-orm';
import { recipes } from './recipes';
import { users } from './users';

/**
 * Recipe subscriptions table.
 * Users can subscribe to receive email notifications when specific recipes are updated.
 */
export const recipeSubscriptions: PgTableWithColumns<any> = pgTable('recipe_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  subscribed: boolean('subscribed').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.recipeId),
]);

export const recipeSubscriptionsRelations: Relations = relations(recipeSubscriptions, ({ one }) => ({
  user: one(users, { fields: [recipeSubscriptions.userId], references: [users.id] }),
  recipe: one(recipes, { fields: [recipeSubscriptions.recipeId], references: [recipes.id] }),
}));
