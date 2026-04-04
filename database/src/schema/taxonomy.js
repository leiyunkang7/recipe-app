"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cuisines = exports.categories = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
/**
 * Predefined categories for recipe classification.
 */
exports.categories = (0, pg_core_1.pgTable)('categories', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull().unique(),
});
/**
 * Predefined cuisines for recipe classification.
 */
exports.cuisines = (0, pg_core_1.pgTable)('cuisines', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull().unique(),
    region: (0, pg_core_1.varchar)('region', { length: 100 }),
});
