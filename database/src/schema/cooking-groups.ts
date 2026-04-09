import { pgTable, uuid, text, boolean, timestamp, unique, type PgTableWithColumns } from 'drizzle-orm/pg-core';
import { relations, type Relations } from 'drizzle-orm';
import { users } from './users';

export const cookingGroups = pgTable('cooking_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'set null' }),
  imageUrl: text('image_url'),
  isPublic: boolean('is_public').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cookingGroupMembers = pgTable('cooking_group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => cookingGroups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique().on(table.groupId, table.userId),
]);

export const cookingGroupsRelations = relations(cookingGroups, ({ one, many }) => ({
  creator: one(users, { fields: [cookingGroups.creatorId], references: [users.id] }),
  members: many(cookingGroupMembers),
}));

export const cookingGroupMembersRelations = relations(cookingGroupMembers, ({ one }) => ({
  group: one(cookingGroups, { fields: [cookingGroupMembers.groupId], references: [cookingGroups.id] }),
  user: one(users, { fields: [cookingGroupMembers.userId], references: [users.id] }),
}));

export type CookingGroup = typeof cookingGroups.$inferSelect;
export type NewCookingGroup = typeof cookingGroups.$inferInsert;
export type CookingGroupMember = typeof cookingGroupMembers.$inferSelect;
export type NewCookingGroupMember = typeof cookingGroupMembers.$inferInsert;
