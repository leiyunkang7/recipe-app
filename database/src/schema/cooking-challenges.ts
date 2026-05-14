import { pgTable, uuid, text, timestamp, type PgTableWithColumns } from 'drizzle-orm/pg-core';
import { relations, type Relations } from 'drizzle-orm';
import { cookingGroups } from './cooking-groups';
import { users } from './users';
import { recipes } from './recipes';

export const cookingChallenges = pgTable('cooking_challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => cookingGroups.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  rules: text('rules'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  status: text('status').notNull().default('upcoming'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cookingChallengeParticipants = pgTable('cooking_challenge_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  challengeId: uuid('challenge_id').notNull().references(() => cookingChallenges.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  score: text('score'),
});

export const cookingChallengesRelations = relations(cookingChallenges, ({ one, many }) => ({
  group: one(cookingGroups, { fields: [cookingChallenges.groupId], references: [cookingGroups.id] }),
  creator: one(users, { fields: [cookingChallenges.createdBy], references: [users.id] }),
  participants: many(cookingChallengeParticipants),
}));

export const cookingChallengeParticipantsRelations = relations(cookingChallengeParticipants, ({ one }) => ({
  challenge: one(cookingChallenges, { fields: [cookingChallengeParticipants.challengeId], references: [cookingChallenges.id] }),
  user: one(users, { fields: [cookingChallengeParticipants.userId], references: [users.id] }),
  recipe: one(recipes, { fields: [cookingChallengeParticipants.recipeId], references: [recipes.id] }),
}));

export type CookingChallenge = typeof cookingChallenges.$inferSelect;
export type NewCookingChallenge = typeof cookingChallenges.$inferInsert;
export type CookingChallengeParticipant = typeof cookingChallengeParticipants.$inferSelect;
export type NewCookingChallengeParticipant = typeof cookingChallengeParticipants.$inferInsert;
