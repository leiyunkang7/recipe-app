"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCommand = deleteCommand;
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const recipe_service_1 = require("@recipe-app/recipe-service");
function deleteCommand(config) {
    return new commander_1.Command('delete')
        .description('Delete a recipe')
        .argument('<id>', 'Recipe ID')
        .action(async (id) => {
        const service = new recipe_service_1.RecipeService(config.supabaseUrl, config.supabaseServiceKey);
        // First fetch to show what will be deleted
        const spinner = (0, ora_1.default)('Fetching recipe...').start();
        const existing = await service.findById(id);
        spinner.stop();
        if (!existing.success || !existing.data) {
            console.error(chalk_1.default.red('✗ Recipe not found'));
            process.exit(1);
        }
        const recipe = existing.data;
        console.log(chalk_1.default.bold(`\n${recipe.title}`));
        console.log(chalk_1.default.dim(`ID: ${recipe.id}`));
        console.log(chalk_1.default.dim(`Category: ${recipe.category}`));
        console.log(chalk_1.default.dim(`Difficulty: ${recipe.difficulty}\n`));
        const { confirm } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to delete this recipe?',
                default: false,
            },
        ]);
        if (!confirm) {
            console.log(chalk_1.default.yellow('Delete cancelled.'));
            return;
        }
        const deleteSpinner = (0, ora_1.default)('Deleting recipe...').start();
        const result = await service.delete(id);
        deleteSpinner.stop();
        if (result.success) {
            console.log(chalk_1.default.green('✓ Recipe deleted successfully!'));
        }
        else {
            console.error(chalk_1.default.red('✗ Failed to delete recipe'));
            console.error(chalk_1.default.red(result.error?.message || 'Unknown error'));
            process.exit(1);
        }
    });
}
