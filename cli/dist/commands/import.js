"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importCommand = importCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs_1 = require("fs");
const recipe_service_1 = require("@recipe-app/recipe-service");
function importCommand(config) {
    return new commander_1.Command('import')
        .description('Import recipes from JSON file')
        .argument('<file>', 'Path to JSON file')
        .action(async (file) => {
        const service = new recipe_service_1.RecipeService(config.supabaseUrl, config.supabaseServiceKey);
        console.log(chalk_1.default.gray(`Reading ${file}...`));
        let recipes;
        try {
            const content = (0, fs_1.readFileSync)(file, 'utf-8');
            recipes = JSON.parse(content);
            if (!Array.isArray(recipes)) {
                throw new Error('JSON must be an array of recipes');
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('✗ Failed to read JSON file'));
            console.error(chalk_1.default.red(error.message));
            process.exit(1);
        }
        console.log(chalk_1.default.gray(`Found ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} to import\n`));
        const spinner = (0, ora_1.default)('Importing recipes...').start();
        const result = await service.batchImport(recipes);
        spinner.stop();
        if (!result.success || !result.data) {
            console.error(chalk_1.default.red('✗ Import failed'));
            console.error(chalk_1.default.red(result.error?.message || 'Unknown error'));
            process.exit(1);
        }
        const { total, succeeded, failed, errors } = result.data;
        console.log(chalk_1.default.bold(`\nImport Summary:`));
        console.log(chalk_1.default.green(`  ✓ Succeeded: ${succeeded}/${total}`));
        if (failed > 0) {
            console.log(chalk_1.default.red(`  ✗ Failed: ${failed}/${total}`));
            console.log(chalk_1.default.red('\nFailed recipes:'));
            errors.forEach((err) => {
                console.log(chalk_1.default.red(`  - [${err.index}] ${err.title}`));
                console.log(chalk_1.default.dim(`    ${err.error}`));
            });
        }
    });
}
