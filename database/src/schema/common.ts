import { timestamp, uuid, PgColumnBuilder } from 'drizzle-orm/pg-core';

/**
 * Helper for UUID primary key column.
 * Uses pg-native gen_random_uuid() via defaultRandom().
 */
export const uuidPk: { id: PgColumnBuilder<any, any, any> } = {
  id: uuid('id').primaryKey().defaultRandom(),
};

/**
 * Common timestamp columns shared across most tables.
 */
export const timestamps: {
  createdAt: PgColumnBuilder<any, any, any>;
  updatedAt: PgColumnBuilder<any, any, any>;
} = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

/**
 * Single createdAt timestamp column for tables without updated_at.
 */
export const createdAt: { createdAt: PgColumnBuilder<any, any, any> } = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
};
