import { pgTable, uuid, varchar, boolean, timestamp, unique, type PgTableWithColumns } from "drizzle-orm/pg-core";
import { relations, type Relations } from "drizzle-orm";
import { users } from "./users";

/**
 * Category subscriptions table.
 * Users can subscribe to receive email notifications when new recipes are published in specific categories.
 */
export const categorySubscriptions: PgTableWithColumns<any> = pgTable("category_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 100 }).notNull(),
  subscribed: boolean("subscribed").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.category),
]);

export const categorySubscriptionsRelations: Relations = relations(categorySubscriptions, ({ one }) => ({
  user: one(users, { fields: [categorySubscriptions.userId], references: [users.id] }),
}));
