"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCommand = listCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const table_1 = require("table");
const recipe_service_1 = require("@recipe-app/recipe-service");
function listCommand(config) {
    return new commander_1.Command('list')
        .description('List all recipes')
        .option('--category <category>', 'Filter by category')
        .option('--cuisine <cuisine>', 'Filter by cuisine')
        .option('--difficulty <difficulty>', 'Filter by difficulty (easy/medium/hard)')
        .option('--tag <tag>', 'Filter by tag')
        .option('--ingredient <ingredient>', 'Filter by ingredient')
        .option('--page <page>', 'Page number', '1')
        .option('--limit <limit>', 'Items per page', '20')
        .action(async (options) => {
        const service = new recipe_service_1.RecipeService(config.supabaseUrl, config.supabaseAnonKey);
        const filters = {};
        if (options.category)
            filters.category = options.category;
        if (options.cuisine)
            filters.cuisine = options.cuisine;
        if (options.difficulty)
            filters.difficulty = options.difficulty;
        if (options.tag)
            filters.tags = [options.tag];
        if (options.ingredient)
            filters.ingredient = options.ingredient;
        const pagination = {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
        };
        console.log(chalk_1.default.gray('Fetching recipes...'));
        const result = await service.findAll(filters, pagination);
        if (!result.success || !result.data) {
            console.error(chalk_1.default.red('✗ Failed to fetch recipes'));
            console.error(chalk_1.default.red(result.error?.message || 'Unknown error'));
            process.exit(1);
        }
        const { recipes, total, page, limit } = result.data;
        if (recipes.length === 0) {
            console.log(chalk_1.default.yellow('No recipes found.'));
            return;
        }
        console.log(chalk_1.default.bold(`\nFound ${total} recipe${total !== 1 ? 's' : ''} (Page ${page})\n`));
        // Create table
        const data = [
            [
                chalk_1.default.bold('ID'),
                chalk_1.default.bold('Title'),
                chalk_1.default.bold('Category'),
                chalk_1.default.bold('Difficulty'),
                chalk_1.default.bold('Time'),
            ],
            ...recipes.map((recipe) => [
                recipe.id?.substring(0, 8) + '...',
                recipe.title,
                recipe.category,
                recipe.difficulty,
                `${recipe.prepTimeMinutes + recipe.cookTimeMinutes}m`,
            ]),
        ];
        console.log((0, table_1.table)(data, {
            border: {
                topBody: '─',
                topJoin: '┬',
                topLeft: '┌',
                topRight: '┐',
                bottomBody: '─',
                bottomJoin: '┴',
                bottomLeft: '└',
                bottomRight: '┘',
                bodyLeft: '│',
                bodyRight: '│',
                bodyJoin: '│',
                joinBody: '─',
                joinLeft: '├',
                joinRight: '┤',
                joinJoin: '┼',
            },
        }));
        // Show pagination info
        const totalPages = Math.ceil(total / limit);
        if (totalPages > 1) {
            console.log(chalk_1.default.dim(`\nPage ${page} of ${totalPages}`));
        }
    });
}
