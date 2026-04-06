/**
 * Search command for CLI
 */
import { Command } from 'commander';
import { SearchService } from '@recipe-app/search-service';
import { getDb, getGlobalOptions } from '../index.js';
import {
  printOutput,
  printInfo,
  createSpinner,
  validateSearchQuery,
  createError,
} from '../utils/index.js';
import { ErrorCode } from '../types/index.js';

export interface SearchOptions {
  scope?: string;
  limit?: string;
}

export async function searchAction(query: string, options: SearchOptions): Promise<void> {
  const globalOptions = getGlobalOptions();
  const db = getDb();
  const service = new SearchService(db);

  // Validate search query
  validateSearchQuery(query);

  // Validate and parse limit
  const limit = parseInt(options.limit || '20', 10);
  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw createError(
      'Invalid limit. Must be a number between 1 and 100.',
      ErrorCode.INVALID_INPUT
    );
  }

  // Validate scope
  const validScopes = ['recipes', 'ingredients', 'all'];
  const scope = options.scope || 'all';
  if (!validScopes.includes(scope)) {
    throw createError(
      `Invalid scope: ${scope}. Valid scopes: ${validScopes.join(', ')}`,
      ErrorCode.INVALID_INPUT
    );
  }

  printInfo(`Searching for "${query}"...`, globalOptions.noColor);

  const spinner = createSpinner('Searching...', { noColor: globalOptions.noColor });
  spinner.start();

  const searchOptions = {
    scope: scope as 'recipes' | 'ingredients' | 'all',
    limit,
  };

  const result = await service.search(query, searchOptions);

  spinner.stop();

  if (!result.success) {
    throw createError(
      result.error?.message || 'Search failed',
      ErrorCode.SEARCH_FAILED,
      result.error
    );
  }

  const results = result.data || [];

  if (results.length === 0) {
    printInfo('No results found.', globalOptions.noColor);
    return;
  }

  // Format output based on format option
  if (globalOptions.format === 'json') {
    printOutput({ query, scope, results }, 'json', globalOptions);
    return;
  }

  if (globalOptions.format === 'csv') {
    printOutput(results, 'csv', globalOptions);
    return;
  }

  // Table format (default)
  console.log(`\nFound ${results.length} result${results.length !== 1 ? 's' : ''}\n`);

  const tableData = results.map((item, idx) => ({
    '#': idx + 1,
    Type: item.type === 'recipe' ? '📖 Recipe' : '🥗 Ingredient',
    Title: item.title,
    Snippet: item.snippet || '-',
  }));

  printOutput(tableData, 'table', globalOptions);
}

export function searchCommand(): Command {
  return new Command('search')
    .description('Search recipes and ingredients')
    .argument('<query>', 'Search query')
    .option('--scope <scope>', 'Search scope (recipes/ingredients/all)', 'all')
    .option('--limit <limit>', 'Max results', '20')
    .action(async (query, options) => {
      await searchAction(query, options);
    });
}
