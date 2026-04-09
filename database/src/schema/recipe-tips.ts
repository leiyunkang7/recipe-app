import { pgTable, uuid, varchar, integer, timestamp, type PgTableWithColumns } from 'drizzle-orm/pg-core';
import { relations, type Relations } from 'drizzle-orm';
import { users } from './users';
import { recipes } from './recipes';

/**
 * Recipe tips table.
 * Stores user tips/support for recipe creators.
 */
export const recipeTips: PgTableWithColumns<any> = pgTable('recipe_tips', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  message: varchar('message', { length: 500 }),
  displayName: varchar('display_name', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const recipeTipsRelations: Relations = relations(recipeTips, ({ one }) => ({
  user: one(users, { fields: [recipeTips.userId], references: [users.id] }),
  recipe: one(recipes, { fields: [recipeTips.recipeId], references: [recipes.id] }),
}));
