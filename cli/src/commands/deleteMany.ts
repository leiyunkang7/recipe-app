/**
 * DeleteMany command for CLI
 */
import { Command } from 'commander';
import inquirer from 'inquirer';
import { RecipeService } from '@recipe-app/recipe-service';
import { getDb, getGlobalOptions } from '../index.js';
import {
  printSuccess,
  printError,
  printInfo,
  createSpinner,
  createError,
} from '../utils/index.js';
import { ErrorCode } from '../types/index.js';

export async function deleteManyAction(pattern: string): Promise<void> {
  const options = getGlobalOptions();
  const db = getDb();
  const service = new RecipeService(db);

  printInfo(`Searching for recipes matching "${pattern}"...`, options.noColor);

  const spinner = createSpinner('Fetching recipes...', { noColor: options.noColor });
  spinner.start();

  const result = await service.findAll(
    { search: pattern },
    { page: 1, limit: 100 }
  );

  spinner.stop();

  if (!result.success || !result.data) {
    throw createError(
      result.error?.message || 'Failed to search recipes',
      ErrorCode.SEARCH_FAILED,
      result.error
    );
  }

  const { recipes } = result.data;

  if (recipes.length === 0) {
    printInfo('No matching recipes found.', options.noColor);
    return;
  }

  console.log(`\nFound ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}:\n`);

  recipes.forEach((recipe, idx) => {
    console.log(`  ${idx + 1}. ${recipe.title}`);
    printInfo(
      `     ID: ${recipe.id} | ${recipe.category} | ${recipe.difficulty}`,
      options.noColor
    );
  });

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to delete all ${recipes.length} recipes?`,
      default: false,
    },
  ]);

  if (!confirm) {
    printInfo('Delete cancelled.', options.noColor);
    return;
  }

  const deleteSpinner = createSpinner('Deleting recipes...', { noColor: options.noColor });
  deleteSpinner.start();

  let succeeded = 0;
  let failed = 0;

  for (const recipe of recipes) {
    const result = await service.delete(recipe.id!);
    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
  }

  deleteSpinner.stop();

  printSuccess(
    `Deleted ${succeeded} recipe${succeeded !== 1 ? 's' : ''}`,
    options.noColor
  );

  if (failed > 0) {
    printError(
      `Failed to delete ${failed} recipe${failed !== 1 ? 's' : ''}`,
      options.noColor
    );
  }
}

export function deleteManyCommand(): Command {
  return new Command('delete-many')
    .description('Delete multiple recipes by pattern')
    .argument('<pattern>', 'Search pattern for recipe titles')
    .action(async (pattern) => {
      await deleteManyAction(pattern);
    });
}
