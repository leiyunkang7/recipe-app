import { pgTable, uuid, varchar, integer, timestamp, type PgTableWithColumns } from 'drizzle-orm/pg-core';

export const emailVerifications: PgTableWithColumns<any> = pgTable('email_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
