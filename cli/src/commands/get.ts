/**
 * Get command for CLI
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { RecipeService } from '@recipe-app/recipe-service';
import { getDb, getGlobalOptions } from '../index.js';
import {
  printOutput,
  printInfo,
  createSpinner,
  validateUuid,
  createError,
} from '../utils/index.js';
import { ErrorCode } from '../types/index.js';

export async function getAction(id: string): Promise<void> {
  const options = getGlobalOptions();
  const db = getDb();
  const service = new RecipeService(db);

  // Validate UUID
  validateUuid(id);

  printInfo('Fetching recipe...', options.noColor);

  const spinner = createSpinner('Loading...', { noColor: options.noColor });
  spinner.start();

  const result = await service.findById(id);

  spinner.stop();

  if (!result.success || !result.data) {
    throw createError(
      result.error?.message || 'Recipe not found',
      ErrorCode.RECIPE_NOT_FOUND,
      result.error
    );
  }

  const recipe = result.data;

  // Format output based on format option
  if (options.format === 'json') {
    printOutput(recipe, 'json', options);
    return;
  }

  if (options.format === 'csv') {
    printOutput(recipe, 'csv', options);
    return;
  }

  // Table format (default) - detailed view
  console.log(chalk.bold(`\n${recipe.title}`));
  console.log(chalk.dim(`ID: ${recipe.id}\n`));

  if (recipe.description) {
    console.log(chalk.gray('Description:'));
    console.log(`  ${recipe.description}\n`);
  }

  console.log(chalk.gray('Details:'));
  console.log(`  Category:   ${recipe.category}`);
  if (recipe.cuisine) console.log(`  Cuisine:    ${recipe.cuisine}`);
  console.log(`  Servings:   ${recipe.servings}`);
  console.log(`  Prep Time:  ${recipe.prepTimeMinutes}m`);
  console.log(`  Cook Time:  ${recipe.cookTimeMinutes}m`);
  console.log(`  Total Time: ${recipe.prepTimeMinutes + recipe.cookTimeMinutes}m`);
  console.log(`  Difficulty: ${recipe.difficulty}\n`);

  if (recipe.tags && recipe.tags.length > 0) {
    console.log(chalk.gray('Tags:'));
    console.log(`  ${recipe.tags.join(', ')}\n`);
  }

  console.log(chalk.bold('Ingredients:'));
  recipe.ingredients.forEach((ing, idx) => {
    console.log(`  ${idx + 1}. ${ing.name} - ${ing.amount} ${ing.unit}`);
  });
  console.log();

  console.log(chalk.bold('Instructions:'));
  recipe.steps.forEach((step) => {
    const duration = step.durationMinutes ? ` (${step.durationMinutes}m)` : '';
    console.log(`  ${step.stepNumber}. ${step.instruction}${duration}`);
  });
  console.log();

  if (recipe.nutritionInfo) {
    console.log(chalk.bold('Nutrition (per serving):'));
    const nutrition = recipe.nutritionInfo;
    if (nutrition.calories) console.log(`  Calories: ${nutrition.calories}`);
    if (nutrition.protein) console.log(`  Protein:  ${nutrition.protein}g`);
    if (nutrition.carbs) console.log(`  Carbs:    ${nutrition.carbs}g`);
    if (nutrition.fat) console.log(`  Fat:      ${nutrition.fat}g`);
    if (nutrition.fiber) console.log(`  Fiber:    ${nutrition.fiber}g`);
    console.log();
  }

  if (recipe.source) {
    console.log(chalk.gray(`Source: ${recipe.source}\n`));
  }
}

export function getCommand(): Command {
  return new Command('get')
    .description('Get recipe details by ID')
    .argument('<id>', 'Recipe ID')
    .action(async (id) => {
      await getAction(id);
    });
}
