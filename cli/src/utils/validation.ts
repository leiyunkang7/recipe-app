/**
 * Validation utility for CLI
 */
import { z } from 'zod';
import { ErrorCode } from '../types/index.js';
import { createError } from './error-handler.js';

/**
 * UUID validation schema
 */
export const UuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Pagination options schema
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Output format schema
 */
export const OutputFormatSchema = z.enum(['table', 'json', 'csv']).default('table');

/**
 * Difficulty schema
 */
export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);

/**
 * Category schema
 */
export const CategorySchema = z.enum([
  'Breakfast',
  'Lunch',
  'Dinner',
  'Dessert',
  'Snack',
  'Beverage',
  'Other',
]);

/**
 * Validate UUID
 */
export function validateUuid(value: string): void {
  const result = UuidSchema.safeParse(value);
  if (!result.success) {
    throw createError(
      `Invalid recipe ID: ${value}. Expected UUID format.`,
      ErrorCode.INVALID_INPUT,
      result.error.issues
    );
  }
}

/**
 * Validate pagination options
 */
export function validatePagination(options: {
  page?: string | number;
  limit?: string | number;
}): { page: number; limit: number } {
  const result = PaginationSchema.safeParse(options);
  if (!result.success) {
    throw createError(
      'Invalid pagination options',
      ErrorCode.INVALID_INPUT,
      result.error.issues
    );
  }
  return result.data;
}

/**
 * Validate output format
 */
export function validateFormat(format: string): OutputFormat {
  const result = OutputFormatSchema.safeParse(format);
  if (!result.success) {
    throw createError(
      `Invalid output format: ${format}. Expected: table, json, or csv.`,
      ErrorCode.INVALID_INPUT,
      result.error.issues
    );
  }
  return result.data;
}

/**
 * Validate file path
 */
export function validateFilePath(path: string): void {
  if (!path || path.trim().length === 0) {
    throw createError('File path is required', ErrorCode.INVALID_INPUT);
  }
}

/**
 * Validate search query
 */
export function validateSearchQuery(query: string): void {
  if (!query || query.trim().length === 0) {
    throw createError('Search query is required', ErrorCode.INVALID_INPUT);
  }
  if (query.trim().length < 2) {
    throw createError(
      'Search query must be at least 2 characters',
      ErrorCode.INVALID_INPUT
    );
  }
}

/**
 * Type for output format
 */
export type OutputFormat = 'table' | 'json' | 'csv';
