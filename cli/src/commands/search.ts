import { Command } from 'commander';
import chalk from 'chalk';
import { table } from 'table';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { SearchService } from '@recipe-app/search-service';

export function searchCommand(db: NodePgDatabase): Command {
  return new Command('search')
    .description('Search recipes and ingredients')
    .argument('<query>', 'Search query')
    .option('--scope <scope>', 'Search scope (recipes/ingredients/all)', 'all')
    .option('--limit <limit>', 'Max results', '20')
    .action(async (query, options) => {
      const service = new SearchService(db);

      console.log(chalk.gray(`Searching for "${query}"...\n`));

      const searchOptions = {
        scope: options.scope as 'recipes' | 'ingredients' | 'all',
        limit: parseInt(options.limit),
      };

      const result = await service.search(query, searchOptions);

      if (!result.success || !result.data) {
        console.error(chalk.red('✗ Search failed'));
        console.error(chalk.red(result.error?.message || 'Unknown error'));
        process.exit(1);
      }

      const results = result.data;

      if (results.length === 0) {
        console.log(chalk.yellow('No results found.'));
        return;
      }

      console.log(chalk.bold(`Found ${results.length} result${results.length !== 1 ? 's' : ''}\n`));

      results.forEach((result, idx) => {
        const icon = result.type === 'recipe' ? '📖' : '🥗';
        console.log(`${idx + 1}. ${icon} ${chalk.bold(result.title)}`);
        if (result.snippet) {
          console.log(chalk.dim(`   ${result.snippet}`));
        }
        console.log(chalk.dim(`   ID: ${result.id}`));
        console.log();
      });
    });
}
