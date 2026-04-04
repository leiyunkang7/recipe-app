import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { Database } from '@recipe-app/database';
import { RecipeService } from '@recipe-app/recipe-service';

export function deleteCommand(db: Database): Command {
  return new Command('delete')
    .description('Delete a recipe')
    .argument('<id>', 'Recipe ID')
    .action(async (id) => {
      const service = new RecipeService(db);

      // First fetch to show what will be deleted
      const spinner = ora('Fetching recipe...').start();
      const existing = await service.findById(id);
      spinner.stop();

      if (!existing.success || !existing.data) {
        console.error(chalk.red('✗ Recipe not found'));
        process.exit(1);
      }

      const recipe = existing.data;

      console.log(chalk.bold(`\n${recipe.title}`));
      console.log(chalk.dim(`ID: ${recipe.id}`));
      console.log(chalk.dim(`Category: ${recipe.category}`));
      console.log(chalk.dim(`Difficulty: ${recipe.difficulty}\n`));

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to delete this recipe?',
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('Delete cancelled.'));
        return;
      }

      const deleteSpinner = ora('Deleting recipe...').start();

      const result = await service.delete(id);

      deleteSpinner.stop();

      if (result.success) {
        console.log(chalk.green('✓ Recipe deleted successfully!'));
      } else {
        console.error(chalk.red('✗ Failed to delete recipe'));
        console.error(chalk.red(result.error?.message || 'Unknown error'));
        process.exit(1);
      }
    });
}
