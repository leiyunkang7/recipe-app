"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCommand = searchCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const search_service_1 = require("@recipe-app/search-service");
function searchCommand(config) {
    return new commander_1.Command('search')
        .description('Search recipes and ingredients')
        .argument('<query>', 'Search query')
        .option('--scope <scope>', 'Search scope (recipes/ingredients/all)', 'all')
        .option('--limit <limit>', 'Max results', '20')
        .action(async (query, options) => {
        const service = new search_service_1.SearchService(config.supabaseUrl, config.supabaseAnonKey);
        console.log(chalk_1.default.gray(`Searching for "${query}"...\n`));
        const searchOptions = {
            scope: options.scope,
            limit: parseInt(options.limit),
        };
        const result = await service.search(query, searchOptions);
        if (!result.success || !result.data) {
            console.error(chalk_1.default.red('✗ Search failed'));
            console.error(chalk_1.default.red(result.error?.message || 'Unknown error'));
            process.exit(1);
        }
        const results = result.data;
        if (results.length === 0) {
            console.log(chalk_1.default.yellow('No results found.'));
            return;
        }
        console.log(chalk_1.default.bold(`Found ${results.length} result${results.length !== 1 ? 's' : ''}\n`));
        results.forEach((result, idx) => {
            const icon = result.type === 'recipe' ? '📖' : '🥗';
            console.log(`${idx + 1}. ${icon} ${chalk_1.default.bold(result.title)}`);
            if (result.snippet) {
                console.log(chalk_1.default.dim(`   ${result.snippet}`));
            }
            console.log(chalk_1.default.dim(`   ID: ${result.id}`));
            console.log();
        });
    });
}
