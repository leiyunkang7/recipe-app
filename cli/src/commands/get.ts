import { Command } from 'commander';
import chalk from 'chalk';
import { RecipeService } from '@recipe-app/recipe-service';
import { getDb } from '../index';

export async function getAction(id: string): Promise<void> {
  const db = getDb();
  const service = new RecipeService(db);

  console.log(chalk.gray('Fetching recipe...'));

  const result = await service.findById(id);

  if (!result.success || !result.data) {
    console.error(chalk.red('✗ Failed to fetch recipe'));
    console.error(chalk.red(result.error?.message || 'Unknown error'));
    process.exit(1);
    return;
  }

  const recipe = result.data;

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
