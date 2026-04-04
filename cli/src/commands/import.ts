import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { readFileSync } from 'fs';
import { Database } from '@recipe-app/database';
import { RecipeService } from '@recipe-app/recipe-service';
import { CreateRecipeDTO } from '@recipe-app/shared-types';

export function importCommand(db: Database): Command {
  return new Command('import')
    .description('Import recipes from JSON file')
    .argument('<file>', 'Path to JSON file')
    .action(async (file) => {
      const service = new RecipeService(db);

      console.log(chalk.gray(`Reading ${file}...`));

      let recipes: CreateRecipeDTO[];

      try {
        const content = readFileSync(file, 'utf-8');
        recipes = JSON.parse(content);

        if (!Array.isArray(recipes)) {
          throw new Error('JSON must be an array of recipes');
        }
      } catch (error) {
        console.error(chalk.red('✗ Failed to read JSON file'));
        console.error(chalk.red((error as Error).message));
        process.exit(1);
      }

      console.log(chalk.gray(`Found ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} to import\n`));

      const spinner = ora('Importing recipes...').start();

      const result = await service.batchImport(recipes);

      spinner.stop();

      if (!result.success || !result.data) {
        console.error(chalk.red('✗ Import failed'));
        console.error(chalk.red(result.error?.message || 'Unknown error'));
        process.exit(1);
      }

      const { total, succeeded, failed, errors } = result.data;

      console.log(chalk.bold(`\nImport Summary:`));
      console.log(chalk.green(`  ✓ Succeeded: ${succeeded}/${total}`));

      if (failed > 0) {
        console.log(chalk.red(`  ✗ Failed: ${failed}/${total}`));
        console.log(chalk.red('\nFailed recipes:'));
        errors.forEach((err) => {
          console.log(chalk.red(`  - [${err.index}] ${err.title}`));
          console.log(chalk.dim(`    ${err.error}`));
        });
      }
    });
}
