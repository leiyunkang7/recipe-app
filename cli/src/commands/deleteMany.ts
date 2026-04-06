import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { RecipeService } from '@recipe-app/recipe-service';
import { getDb } from '../index';

export function deleteManyCommand(): Command {
  return new Command('delete-many')
    .description('Delete multiple recipes by pattern')
    .argument('<pattern>', 'Search pattern for recipe titles')
    .action(async (pattern) => {
      const db = getDb();
      const service = new RecipeService(db);

      console.log(chalk.gray(`Searching for recipes matching "${pattern}"...`));

      const spinner = ora('Fetching recipes...').start();

      const result = await service.findAll(
        { search: pattern },
        { page: 1, limit: 100 }
      );

      spinner.stop();

      if (!result.success || !result.data) {
        console.error(chalk.red('✗ Failed to search recipes'));
        console.error(chalk.red(result.error?.message || 'Unknown error'));
        process.exit(1);
      }

      const { recipes } = result.data;

      if (recipes.length === 0) {
        console.log(chalk.yellow('No matching recipes found.'));
        return;
      }

      console.log(chalk.bold(`\nFound ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}:\n`));

      recipes.forEach((recipe, idx) => {
        console.log(`  ${idx + 1}. ${recipe.title}`);
        console.log(chalk.dim(`     ID: ${recipe.id} | ${recipe.category} | ${recipe.difficulty}`));
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
        console.log(chalk.yellow('Delete cancelled.'));
        return;
      }

      const deleteSpinner = ora('Deleting recipes...').start();

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

      console.log(chalk.green(`✓ Deleted ${succeeded} recipe${succeeded !== 1 ? 's' : ''}`));
      if (failed > 0) {
        console.log(chalk.red(`✗ Failed to delete ${failed} recipe${failed !== 1 ? 's' : ''}`));
      }
    });
}
