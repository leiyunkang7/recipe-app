import { Command } from 'commander';
import chalk from 'chalk';
import { table } from 'table';
import { RecipeService } from '@recipe-app/recipe-service';
import type { RecipeFilters } from '@recipe-app/shared-types';
import { getDb } from '../index';

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
  const db = getDb();
  const service = new RecipeService(db);

  const filters: Partial<RecipeFilters> = {};
  if (options.category) filters.category = options.category;
  if (options.cuisine) filters.cuisine = options.cuisine;
  if (options.difficulty) filters.difficulty = options.difficulty as RecipeFilters['difficulty'];
  if (options.tag) filters.tags = [options.tag];
  if (options.ingredient) filters.ingredient = options.ingredient;

  const pagination = {
    page: parseInt(options.page || '1'),
    limit: parseInt(options.limit || '20'),
  };

  console.log(chalk.gray('Fetching recipes...'));

  const result = await service.findAll(filters, pagination);

  if (!result.success || !result.data) {
    console.error(chalk.red('✗ Failed to fetch recipes'));
    console.error(chalk.red(result.error?.message || 'Unknown error'));
    process.exit(1);
    return;
  }

  const { recipes, total, page, limit } = result.data;

  if (recipes.length === 0) {
    console.log(chalk.yellow('No recipes found.'));
    return;
  }

  console.log(chalk.bold(`\nFound ${total} recipe${total !== 1 ? 's' : ''} (Page ${page})\n`));

  const data = [
    [
      chalk.bold('ID'),
      chalk.bold('Title'),
      chalk.bold('Category'),
      chalk.bold('Difficulty'),
      chalk.bold('Time'),
    ],
    ...recipes.map((recipe) => [
      recipe.id?.substring(0, 8) + '...',
      recipe.title,
      recipe.category,
      recipe.difficulty,
      `${recipe.prepTimeMinutes + recipe.cookTimeMinutes}m`,
    ]),
  ];

  console.log(table(data, {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼',
    },
  }));

  const totalPages = Math.ceil(total / limit);
  if (totalPages > 1) {
    console.log(chalk.dim(`\nPage ${page} of ${totalPages}`));
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
