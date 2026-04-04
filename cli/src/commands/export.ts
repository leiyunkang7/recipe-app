import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync } from 'fs';
import { Database } from '@recipe-app/database';
import { RecipeService } from '@recipe-app/recipe-service';

export function exportCommand(db: Database): Command {
  return new Command('export')
    .description('Export all recipes to JSON file')
    .option('--output <file>', 'Output file path', 'recipes-export.json')
    .action(async (options) => {
      const service = new RecipeService(db);

      console.log(chalk.gray('Exporting all recipes...'));

      const spinner = ora('Fetching recipes...').start();

      // Fetch all recipes by using a high limit
      const result = await service.findAll({}, { page: 1, limit: 1000 });

      spinner.stop();

      if (!result.success || !result.data) {
        console.error(chalk.red('✗ Export failed'));
        console.error(chalk.red(result.error?.message || 'Unknown error'));
        process.exit(1);
      }

      const { recipes, total } = result.data;

      console.log(chalk.gray(`Found ${total} recipe${total !== 1 ? 's' : ''}`));

      const writeSpinner = ora(`Writing to ${options.output}...`).start();

      try {
        writeFileSync(options.output, JSON.stringify(recipes, null, 2));
        writeSpinner.stop();

        console.log(chalk.green(`✓ Exported ${total} recipe${total !== 1 ? 's' : ''} to ${options.output}`));
      } catch (error) {
        writeSpinner.stop();
        console.error(chalk.red('✗ Failed to write file'));
        console.error(chalk.red((error as Error).message));
        process.exit(1);
      }
    });
}
