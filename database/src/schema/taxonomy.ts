import { pgTable, serial, integer, varchar } from 'drizzle-orm/pg-core';

/**
 * Predefined categories for recipe classification.
 */
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
});

/**
 * Predefined cuisines for recipe classification.
 */
export const cuisines = pgTable('cuisines', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  region: varchar('region', { length: 100 }),
});
