"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommand = getCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const recipe_service_1 = require("@recipe-app/recipe-service");
function getCommand(config) {
    return new commander_1.Command('get')
        .description('Get recipe details by ID')
        .argument('<id>', 'Recipe ID')
        .action(async (id) => {
        const service = new recipe_service_1.RecipeService(config.supabaseUrl, config.supabaseAnonKey);
        console.log(chalk_1.default.gray('Fetching recipe...'));
        const result = await service.findById(id);
        if (!result.success || !result.data) {
            console.error(chalk_1.default.red('✗ Failed to fetch recipe'));
            console.error(chalk_1.default.red(result.error?.message || 'Unknown error'));
            process.exit(1);
        }
        const recipe = result.data;
        console.log(chalk_1.default.bold(`\n${recipe.title}`));
        console.log(chalk_1.default.dim(`ID: ${recipe.id}\n`));
        if (recipe.description) {
            console.log(chalk_1.default.gray('Description:'));
            console.log(`  ${recipe.description}\n`);
        }
        console.log(chalk_1.default.gray('Details:'));
        console.log(`  Category:   ${recipe.category}`);
        if (recipe.cuisine)
            console.log(`  Cuisine:    ${recipe.cuisine}`);
        console.log(`  Servings:   ${recipe.servings}`);
        console.log(`  Prep Time:  ${recipe.prepTimeMinutes}m`);
        console.log(`  Cook Time:  ${recipe.cookTimeMinutes}m`);
        console.log(`  Total Time: ${recipe.prepTimeMinutes + recipe.cookTimeMinutes}m`);
        console.log(`  Difficulty: ${recipe.difficulty}\n`);
        if (recipe.tags && recipe.tags.length > 0) {
            console.log(chalk_1.default.gray('Tags:'));
            console.log(`  ${recipe.tags.join(', ')}\n`);
        }
        console.log(chalk_1.default.bold('Ingredients:'));
        recipe.ingredients.forEach((ing, idx) => {
            console.log(`  ${idx + 1}. ${ing.name} - ${ing.amount} ${ing.unit}`);
        });
        console.log();
        console.log(chalk_1.default.bold('Instructions:'));
        recipe.steps.forEach((step) => {
            const duration = step.durationMinutes ? ` (${step.durationMinutes}m)` : '';
            console.log(`  ${step.stepNumber}. ${step.instruction}${duration}`);
        });
        console.log();
        if (recipe.nutritionInfo) {
            console.log(chalk_1.default.bold('Nutrition (per serving):'));
            const nutrition = recipe.nutritionInfo;
            if (nutrition.calories)
                console.log(`  Calories: ${nutrition.calories}`);
            if (nutrition.protein)
                console.log(`  Protein:  ${nutrition.protein}g`);
            if (nutrition.carbs)
                console.log(`  Carbs:    ${nutrition.carbs}g`);
            if (nutrition.fat)
                console.log(`  Fat:      ${nutrition.fat}g`);
            if (nutrition.fiber)
                console.log(`  Fiber:    ${nutrition.fiber}g`);
            console.log();
        }
        if (recipe.source) {
            console.log(chalk_1.default.gray(`Source: ${recipe.source}\n`));
        }
    });
}
