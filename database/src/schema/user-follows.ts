import { pgTable, uuid, timestamp, unique, check, type PgTableWithColumns } from 'drizzle-orm/pg-core';
import { relations, type Relations } from 'drizzle-orm';
import { users } from './users';

/**
 * User follows table - users can follow other users
 */
export const userFollows: PgTableWithColumns<any> = pgTable('user_follows', {
  id: uuid('id').primaryKey().defaultRandom(),
  followerId: uuid('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: uuid('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique().on(table.followerId, table.followingId),
]);

export const userFollowsRelations: Relations = relations(userFollows, ({ one }) => ({
  follower: one(users, { fields: [userFollows.followerId], references: [users.id], relationName: 'follower' }),
  following: one(users, { fields: [userFollows.followingId], references: [users.id], relationName: 'following' }),
}));
