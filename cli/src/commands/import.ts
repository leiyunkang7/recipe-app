/**
 * Import command for CLI
 */
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { RecipeService } from '@recipe-app/recipe-service';
import { CreateRecipeDTO, CreateRecipeDTOSchema } from '@recipe-app/shared-types';
import { getDb, getGlobalOptions } from '../index.js';
import {
  printSuccess,
  printError,
  printInfo,
  createSpinner,
  validateFilePath,
  createError,
} from '../utils/index.js';
import { ErrorCode } from '../types/index.js';

/**
 * Validate that imported recipes have required fields
 * Exported for unit testing
 */
export function validateRecipes(recipes: unknown[]): recipes is CreateRecipeDTO[] {
  if (!Array.isArray(recipes)) {
    throw createError('JSON must be an array of recipes', ErrorCode.VALIDATION_FAILED);
  }

  if (recipes.length === 0) {
    throw createError('Recipe array is empty', ErrorCode.VALIDATION_FAILED);
  }

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];

    if (typeof recipe !== 'object' || recipe === null) {
      throw createError(
        `Recipe at index ${i} is not a valid object`,
        ErrorCode.VALIDATION_FAILED
      );
    }

    // Use Zod schema for validation
    const result = CreateRecipeDTOSchema.safeParse(recipe);
    if (!result.success) {
      const issues = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      throw createError(
        `Recipe at index ${i} is invalid: ${issues}`,
        ErrorCode.VALIDATION_FAILED
      );
    }
  }

  return true;
}

export async function importAction(
  file: string,
  fileReader: (path: string, encoding: BufferEncoding) => string = readFileSync
): Promise<void> {
  const options = getGlobalOptions();
  const db = getDb();
  const service = new RecipeService(db);

  validateFilePath(file);

  printInfo(`Reading ${file}...`, options.noColor);

  let recipes: CreateRecipeDTO[];

  try {
    const content = fileReader(file, 'utf-8');
    const parsed = JSON.parse(content);

    validateRecipes(parsed);
    recipes = parsed;
  } catch (error) {
    if (error instanceof Error && error.name === 'CliError') {
      throw error;
    }
    throw createError(
      `Failed to read JSON file: ${(error as Error).message}`,
      ErrorCode.FILE_READ_FAILED,
      error
    );
  }

  printInfo(
    `Found ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} to import`,
    options.noColor
  );

  const spinner = createSpinner('Importing recipes...', { noColor: options.noColor });
  spinner.start();

  const result = await service.batchImport(recipes);

  spinner.stop();

  if (!result.success || !result.data) {
    throw createError(
      result.error?.message || 'Import failed',
      ErrorCode.IMPORT_FAILED,
      result.error
    );
  }

  const { total, succeeded, failed, errors } = result.data;

  console.log(`\nImport Summary:`);
  printSuccess(`  ✓ Succeeded: ${succeeded}/${total}`, options.noColor);

  if (failed > 0) {
    printError(`  ✗ Failed: ${failed}/${total}`, options.noColor);
    console.log('');
    printError('Failed recipes:', options.noColor);
    errors.forEach((err) => {
      printError(`  - [${err.index}] ${err.title}`, options.noColor);
      printInfo(`    ${err.error}`, options.noColor);
    });

    // Exit with error if any failed
    if (failed === total) {
      process.exit(1);
    }
  }
}

export function importCommand(): Command {
  return new Command('import')
    .description('Import recipes from JSON file')
    .argument('<file>', 'Path to JSON file')
    .action(async (file) => {
      await importAction(file);
    });
}
