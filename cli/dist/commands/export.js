"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCommand = exportCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const fs_1 = require("fs");
const recipe_service_1 = require("@recipe-app/recipe-service");
function exportCommand(config) {
    return new commander_1.Command('export')
        .description('Export all recipes to JSON file')
        .option('--output <file>', 'Output file path', 'recipes-export.json')
        .action(async (options) => {
        const service = new recipe_service_1.RecipeService(config.supabaseUrl, config.supabaseAnonKey);
        console.log(chalk_1.default.gray('Exporting all recipes...'));
        const spinner = (0, ora_1.default)('Fetching recipes...').start();
        // Fetch all recipes by using a high limit
        const result = await service.findAll({}, { page: 1, limit: 1000 });
        spinner.stop();
        if (!result.success || !result.data) {
            console.error(chalk_1.default.red('✗ Export failed'));
            console.error(chalk_1.default.red(result.error?.message || 'Unknown error'));
            process.exit(1);
        }
        const { recipes, total } = result.data;
        console.log(chalk_1.default.gray(`Found ${total} recipe${total !== 1 ? 's' : ''}`));
        const writeSpinner = (0, ora_1.default)(`Writing to ${options.output}...`).start();
        try {
            (0, fs_1.writeFileSync)(options.output, JSON.stringify(recipes, null, 2));
            writeSpinner.stop();
            console.log(chalk_1.default.green(`✓ Exported ${total} recipe${total !== 1 ? 's' : ''} to ${options.output}`));
        }
        catch (error) {
            writeSpinner.stop();
            console.error(chalk_1.default.red('✗ Failed to write file'));
            console.error(chalk_1.default.red(error.message));
            process.exit(1);
        }
    });
}
