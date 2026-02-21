"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteManyCommand = deleteManyCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const recipe_service_1 = require("@recipe-app/recipe-service");
function deleteManyCommand(config) {
    return new commander_1.Command('delete-many')
        .description('Delete multiple recipes by pattern')
        .argument('<pattern>', 'Search pattern for recipe titles')
        .action(async (pattern) => {
        const service = new recipe_service_1.RecipeService(config.supabaseUrl, config.supabaseServiceKey);
        console.log(chalk_1.default.gray(`Searching for recipes matching "${pattern}"...`));
        const spinner = (0, ora_1.default)('Fetching recipes...').start();
        const result = await service.findAll({ search: pattern }, { page: 1, limit: 100 });
        spinner.stop();
        if (!result.success || !result.data) {
            console.error(chalk_1.default.red('✗ Failed to search recipes'));
            console.error(chalk_1.default.red(result.error?.message || 'Unknown error'));
            process.exit(1);
        }
        const { recipes } = result.data;
        if (recipes.length === 0) {
            console.log(chalk_1.default.yellow('No matching recipes found.'));
            return;
        }
        console.log(chalk_1.default.bold(`\nFound ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}:\n`));
        recipes.forEach((recipe, idx) => {
            console.log(`  ${idx + 1}. ${recipe.title}`);
            console.log(chalk_1.default.dim(`     ID: ${recipe.id} | ${recipe.category} | ${recipe.difficulty}`));
        });
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Are you sure you want to delete all ${recipes.length} recipes?`,
                default: false,
            },
        ]);
        if (!confirm) {
            console.log(chalk_1.default.yellow('Delete cancelled.'));
            return;
        }
        const deleteSpinner = (0, ora_1.default)('Deleting recipes...').start();
        let succeeded = 0;
        let failed = 0;
        for (const recipe of recipes) {
            const result = await service.delete(recipe.id);
            if (result.success) {
                succeeded++;
            }
            else {
                failed++;
            }
        }
        deleteSpinner.stop();
        console.log(chalk_1.default.green(`✓ Deleted ${succeeded} recipe${succeeded !== 1 ? 's' : ''}`));
        if (failed > 0) {
            console.log(chalk_1.default.red(`✗ Failed to delete ${failed} recipe${failed !== 1 ? 's' : ''}`));
        }
    });
}
