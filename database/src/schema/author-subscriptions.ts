import { pgTable, uuid, varchar, boolean, timestamp, unique, type PgTableWithColumns } from "drizzle-orm/pg-core";
import { relations, type Relations } from "drizzle-orm";
import { users } from "./users";

/**
 * Author subscriptions table.
 * Users can subscribe to receive email notifications when specific authors publish new recipes.
 * Note: "author" is identified by display_name since recipes don't have a direct author field.
 * In the future, if a recipe_author table is added, this can reference it.
 */
export const authorSubscriptions: PgTableWithColumns<any> = pgTable("author_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  /** Author's display name to match against recipe authorship */
  authorName: varchar("author_name", { length: 100 }).notNull(),
  subscribed: boolean("subscribed").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.authorName),
]);

export const authorSubscriptionsRelations: Relations = relations(authorSubscriptions, ({ one }) => ({
  user: one(users, { fields: [authorSubscriptions.userId], references: [users.id] }),
}));
