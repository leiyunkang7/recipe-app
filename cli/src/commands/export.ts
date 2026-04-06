/**
 * Export command for CLI
 */
import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { RecipeService } from '@recipe-app/recipe-service';
import type { Recipe } from '@recipe-app/shared-types';
import { getDb, getGlobalOptions } from '../index.js';
import {
  printSuccess,
  printInfo,
  createSpinner,
  validateFilePath,
  createError,
} from '../utils/index.js';
import { ErrorCode } from '../types/index.js';

/**
 * Convert recipes array to CSV format
 */
export function recipesToCSV(recipes: Recipe[]): string {
  const headers = [
    'title',
    'description',
    'category',
    'cuisine',
    'servings',
    'prepTimeMinutes',
    'cookTimeMinutes',
    'difficulty',
    'ingredients',
    'steps',
    'tags',
    'calories',
    'protein',
    'carbs',
    'fat',
    'fiber',
    'imageUrl',
    'source',
  ];

  const escapeCSV = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const rows = recipes.map((recipe) => {
    const ingredients = recipe.ingredients
      ? recipe.ingredients
          .map((ing) => ing.amount + ' ' + ing.unit + ' ' + ing.name)
          .join('; ')
      : '';

    const steps = recipe.steps
      ? recipe.steps
          .sort((a, b) => a.stepNumber - b.stepNumber)
          .map((step) => step.stepNumber + '. ' + step.instruction)
          .join('; ')
      : '';

    const tags = recipe.tags ? recipe.tags.join('; ') : '';

    const nutrition = recipe.nutritionInfo || {};

    return [
      escapeCSV(recipe.title),
      escapeCSV(recipe.description),
      escapeCSV(recipe.category),
      escapeCSV(recipe.cuisine),
      escapeCSV(recipe.servings),
      escapeCSV(recipe.prepTimeMinutes),
      escapeCSV(recipe.cookTimeMinutes),
      escapeCSV(recipe.difficulty),
      escapeCSV(ingredients),
      escapeCSV(steps),
      escapeCSV(tags),
      escapeCSV(nutrition.calories),
      escapeCSV(nutrition.protein),
      escapeCSV(nutrition.carbs),
      escapeCSV(nutrition.fat),
      escapeCSV(nutrition.fiber),
      escapeCSV(recipe.imageUrl),
      escapeCSV(recipe.source),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Detect output format from file extension
 */
function getFormatFromFile(filePath: string): 'json' | 'csv' {
  const ext = filePath.toLowerCase().split('.').pop();
  if (ext === 'csv') return 'csv';
  return 'json';
}

export interface ExportOptions {
  output: string;
  format?: string;
}

export async function exportAction(options: ExportOptions): Promise<void> {
  const globalOptions = getGlobalOptions();
  const db = getDb();
  const service = new RecipeService(db);

  validateFilePath(options.output);

  printInfo('Exporting all recipes...', globalOptions.noColor);

  const spinner = createSpinner('Fetching recipes...', { noColor: globalOptions.noColor });
  spinner.start();

  // Fetch all recipes by using a high limit
  const result = await service.findAll({}, { page: 1, limit: 10000 });

  spinner.stop();

  if (!result.success || !result.data) {
    throw createError(
      result.error?.message || 'Export failed',
      ErrorCode.EXPORT_FAILED,
      result.error
    );
  }

  const { recipes, total } = result.data;

  printInfo(`Found ${total} recipe${total !== 1 ? 's' : ''}`, globalOptions.noColor);

  // Determine format
  let format: 'json' | 'csv';
  if (options.format && ['json', 'csv'].includes(options.format)) {
    format = options.format as 'json' | 'csv';
  } else {
    format = getFormatFromFile(options.output);
  }

  const writeSpinner = createSpinner(
    `Writing ${format.toUpperCase()} to ${options.output}...`,
    { noColor: globalOptions.noColor }
  );
  writeSpinner.start();

  try {
    let content: string;
    if (format === 'csv') {
      content = recipesToCSV(recipes);
    } else {
      content = JSON.stringify(recipes, null, 2);
    }
    writeFileSync(options.output, content);
    writeSpinner.stop();

    printSuccess(
      `Exported ${total} recipe${total !== 1 ? 's' : ''} to ${options.output}`,
      globalOptions.noColor
    );
  } catch (error) {
    writeSpinner.stop();
    throw createError(
      `Failed to write file: ${(error as Error).message}`,
      ErrorCode.FILE_WRITE_FAILED,
      error
    );
  }
}

export function exportCommand(): Command {
  return new Command('export')
    .description('Export all recipes to JSON or CSV file')
    .option('--output <file>', 'Output file path', 'recipes-export.json')
    .option('--format <format>', 'Output format: json or csv (auto-detected from extension if not specified)')
    .action(async (options) => {
      await exportAction(options);
    });
}
