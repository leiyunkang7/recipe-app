import { pgTable, uuid, timestamp, text, boolean, type PgTableWithColumns } from 'drizzle-orm/pg-core';
import { relations, type Relations } from 'drizzle-orm';
import { recipes } from './recipes';
import { users } from './users';

/**
 * Recipe reminders table.
 * Users can set reminders to cook specific recipes at scheduled times.
 */
export const recipeReminders: PgTableWithColumns<any> = pgTable('recipe_reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  reminderTime: timestamp('reminder_time', { withTimezone: true }).notNull(),
  note: text('note'),
  notified: boolean('notified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const recipeRemindersRelations: Relations = relations(recipeReminders, ({ one }) => ({
  user: one(users, { fields: [recipeReminders.userId], references: [users.id] }),
  recipe: one(recipes, { fields: [recipeReminders.recipeId], references: [recipes.id] }),
}));
