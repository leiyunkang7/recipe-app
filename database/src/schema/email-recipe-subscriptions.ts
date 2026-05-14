import { pgTable, uuid, varchar, boolean, timestamp, unique, type PgTableWithColumns } from "drizzle-orm/pg-core";
import { relations, type Relations } from "drizzle-orm";
import { recipes } from "./recipes";

/**
 * Email Recipe Subscriptions table.
 * Allows anonymous users to subscribe to recipe update notifications via email.
 * Uses a verification token for email confirmation and unsubscribe links.
 */
export const emailRecipeSubscriptions: PgTableWithColumns<any> = pgTable("email_recipe_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  recipeId: uuid("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  verificationToken: varchar("verification_token", { length: 64 }).notNull().unique(),
  subscribed: boolean("subscribed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [
  unique().on(table.email, table.recipeId),
]);

export const emailRecipeSubscriptionsRelations: Relations = relations(emailRecipeSubscriptions, ({ one }) => ({
  recipe: one(recipes, { fields: [emailRecipeSubscriptions.recipeId], references: [recipes.id] }),
}));
