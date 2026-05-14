import { pgTable, uuid, timestamp, text, boolean, type PgTableWithColumns } from 'drizzle-orm/pg-core';
import { relations, type Relations } from 'drizzle-orm';
import { users } from './users';

/**
 * Notifications table.
 * Stores user notifications for recipe updates, deletions, and reminders.
 */
export const notifications: PgTableWithColumns<any> = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  recipeId: uuid('recipe_id'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const notificationsRelations: Relations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
