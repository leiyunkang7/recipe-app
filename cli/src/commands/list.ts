/**
 * List command for CLI
 */
import { Command } from 'commander';
import { RecipeService } from '@recipe-app/recipe-service';
import type { RecipeFilters } from '@recipe-app/shared-types';
import { getDb, getGlobalOptions } from '../index.js';
import {
  printOutput,
  printInfo,
  createSpinner,
  validatePagination,
  createError,
} from '../utils/index.js';
import { ErrorCode } from '../types/index.js';

export interface ListOptions {
  category?: string;
  cuisine?: string;
  difficulty?: string;
  tag?: string;
  ingredient?: string;
  page?: string;
  limit?: string;
}

export async function listAction(options: ListOptions): Promise<void> {
  const globalOptions = getGlobalOptions();
  const db = getDb();
  const service = new RecipeService(db);

  // Build filters
  const filters: Partial<RecipeFilters> = {};
  if (options.category) filters.category = options.category;
  if (options.cuisine) filters.cuisine = options.cuisine;
  if (options.difficulty) filters.difficulty = options.difficulty as RecipeFilters['difficulty'];
  if (options.tag) filters.tags = [options.tag];
  if (options.ingredient) filters.ingredient = options.ingredient;

  // Validate and parse pagination
  const pagination = validatePagination({
    page: options.page,
    limit: options.limit,
  });

  printInfo('Fetching recipes...', globalOptions.noColor);

  const spinner = createSpinner('Loading...', { noColor: globalOptions.noColor });
  spinner.start();

  const result = await service.findAll(filters, pagination);

  spinner.stop();

  if (!result.success || !result.data) {
    throw createError(
      result.error?.message || 'Failed to fetch recipes',
      ErrorCode.DB_QUERY_FAILED,
      result.error
    );
  }

  const { recipes, total, page, limit } = result.data;

  if (recipes.length === 0) {
    printInfo('No recipes found.', globalOptions.noColor);
    return;
  }

  // Format output based on format option
  if (globalOptions.format === 'json') {
    printOutput({ recipes, total, page, limit }, 'json', globalOptions);
    return;
  }

  if (globalOptions.format === 'csv') {
    printOutput(recipes, 'csv', globalOptions);
    return;
  }

  // Table format (default)
  console.log(`\nFound ${total} recipe${total !== 1 ? 's' : ''} (Page ${page})\n`);

  // Prepare data for table output
  const tableData = recipes.map((recipe) => ({
    ID: recipe.id?.substring(0, 8) + '...',
    Title: recipe.title,
    Category: recipe.category,
    Difficulty: recipe.difficulty,
    Time: `${recipe.prepTimeMinutes + recipe.cookTimeMinutes}m`,
  }));

  printOutput(tableData, 'table', globalOptions);

  const totalPages = Math.ceil(total / limit);
  if (totalPages > 1) {
    printInfo(`\nPage ${page} of ${totalPages}`, globalOptions.noColor);
  }
}

export function listCommand(): Command {
  return new Command('list')
    .description('List all recipes')
    .option('--category <category>', 'Filter by category')
    .option('--cuisine <cuisine>', 'Filter by cuisine')
    .option('--difficulty <difficulty>', 'Filter by difficulty (easy/medium/hard)')
    .option('--tag <tag>', 'Filter by tag')
    .option('--ingredient <ingredient>', 'Filter by ingredient')
    .option('--page <page>', 'Page number', '1')
    .option('--limit <limit>', 'Items per page', '20')
    .action(async (options) => {
      await listAction(options);
    });
}
