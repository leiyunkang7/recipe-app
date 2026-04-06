/**
 * Delete command for CLI
 */
import { Command } from 'commander';
import inquirer from 'inquirer';
import { RecipeService } from '@recipe-app/recipe-service';
import { getDb, getGlobalOptions } from '../index.js';
import {
  printSuccess,
  printInfo,
  createSpinner,
  validateUuid,
  createError,
} from '../utils/index.js';
import { ErrorCode } from '../types/index.js';

export async function deleteAction(id: string): Promise<void> {
  const options = getGlobalOptions();
  const db = getDb();
  const service = new RecipeService(db);

  // Validate UUID
  validateUuid(id);

  // First fetch to show what will be deleted
  const spinner = createSpinner('Fetching recipe...', { noColor: options.noColor });
  spinner.start();

  const existing = await service.findById(id);

  spinner.stop();

  if (!existing.success || !existing.data) {
    throw createError(
      existing.error?.message || 'Recipe not found',
      ErrorCode.RECIPE_NOT_FOUND,
      existing.error
    );
  }

  const recipe = existing.data;

  console.log(`\n${recipe.title}`);
  printInfo(`ID: ${recipe.id}`, options.noColor);
  printInfo(`Category: ${recipe.category}`, options.noColor);
  printInfo(`Difficulty: ${recipe.difficulty}\n`, options.noColor);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to delete this recipe?',
      default: false,
    },
  ]);

  if (!confirm) {
    printInfo('Delete cancelled.', options.noColor);
    return;
  }

  const deleteSpinner = createSpinner('Deleting recipe...', { noColor: options.noColor });
  deleteSpinner.start();

  const result = await service.delete(id);

  deleteSpinner.stop();

  if (!result.success) {
    throw createError(
      result.error?.message || 'Failed to delete recipe',
      ErrorCode.RECIPE_DELETE_FAILED,
      result.error
    );
  }

  printSuccess('Recipe deleted successfully!', options.noColor);
}

export function deleteCommand(): Command {
  return new Command('delete')
    .description('Delete a recipe')
    .argument('<id>', 'Recipe ID')
    .action(async (id) => {
      await deleteAction(id);
    });
}
