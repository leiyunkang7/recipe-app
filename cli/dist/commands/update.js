"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCommand = updateCommand;
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const recipe_service_1 = require("@recipe-app/recipe-service");
function updateCommand(config) {
    return new commander_1.Command('update')
        .description('Update a recipe')
        .argument('<id>', 'Recipe ID')
        .action(async (id) => {
        const service = new recipe_service_1.RecipeService(config.supabaseUrl, config.supabaseServiceKey);
        const spinner = (0, ora_1.default)('Fetching recipe...').start();
        const existing = await service.findById(id);
        spinner.stop();
        if (!existing.success || !existing.data) {
            console.error(chalk_1.default.red('✗ Recipe not found'));
            process.exit(1);
        }
        const recipe = existing.data;
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Recipe title:',
                default: recipe.title,
            },
            {
                type: 'input',
                name: 'description',
                message: 'Description:',
                default: recipe.description || '',
            },
            {
                type: 'list',
                name: 'category',
                message: 'Category:',
                choices: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage', 'Other'],
                default: recipe.category,
            },
            {
                type: 'input',
                name: 'cuisine',
                message: 'Cuisine:',
                default: recipe.cuisine || '',
            },
            {
                type: 'number',
                name: 'servings',
                message: 'Servings:',
                default: recipe.servings,
            },
            {
                type: 'number',
                name: 'prepTimeMinutes',
                message: 'Prep time (minutes):',
                default: recipe.prepTimeMinutes,
            },
            {
                type: 'number',
                name: 'cookTimeMinutes',
                message: 'Cook time (minutes):',
                default: recipe.cookTimeMinutes,
            },
            {
                type: 'list',
                name: 'difficulty',
                message: 'Difficulty:',
                choices: ['easy', 'medium', 'hard'],
                default: recipe.difficulty,
            },
            {
                type: 'confirm',
                name: 'updateIngredients',
                message: 'Update ingredients?',
                default: false,
            },
        ]);
        const ingredients = recipe.ingredients;
        if (answers.updateIngredients) {
            const { action } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: ['Keep existing', 'Replace all'],
                },
            ]);
            if (action === 'Replace all') {
                ingredients.length = 0;
                let addMore = true;
                while (addMore) {
                    const ing = await inquirer_1.default.prompt([
                        {
                            type: 'input',
                            name: 'name',
                            message: `Ingredient name #${ingredients.length + 1}:`,
                            validate: (input) => input.length > 0 || 'Name is required',
                        },
                        {
                            type: 'number',
                            name: 'amount',
                            message: 'Amount:',
                            validate: (input) => input > 0 || 'Must be positive',
                        },
                        {
                            type: 'input',
                            name: 'unit',
                            message: 'Unit (e.g., cup, tbsp, gram):',
                            validate: (input) => input.length > 0 || 'Unit is required',
                        },
                    ]);
                    ingredients.push(ing);
                    const { more } = await inquirer_1.default.prompt([
                        {
                            type: 'confirm',
                            name: 'more',
                            message: 'Add another ingredient?',
                            default: false,
                        },
                    ]);
                    addMore = more;
                }
            }
        }
        const { updateSteps } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'updateSteps',
                message: 'Update cooking steps?',
                default: false,
            },
        ]);
        const steps = recipe.steps;
        if (updateSteps) {
            const { action } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: ['Keep existing', 'Replace all'],
                },
            ]);
            if (action === 'Replace all') {
                steps.length = 0;
                let addMore = true;
                while (addMore) {
                    const step = await inquirer_1.default.prompt([
                        {
                            type: 'input',
                            name: 'instruction',
                            message: `Step #${steps.length + 1}:`,
                            validate: (input) => input.length > 0 || 'Instruction is required',
                        },
                        {
                            type: 'number',
                            name: 'durationMinutes',
                            message: 'Duration in minutes (0 to skip):',
                            default: 0,
                        },
                    ]);
                    steps.push({
                        stepNumber: steps.length + 1,
                        instruction: step.instruction,
                        durationMinutes: step.durationMinutes || undefined,
                    });
                    const { more } = await inquirer_1.default.prompt([
                        {
                            type: 'confirm',
                            name: 'more',
                            message: 'Add another step?',
                            default: false,
                        },
                    ]);
                    addMore = more;
                }
            }
        }
        const { updateTags } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'updateTags',
                message: 'Update tags?',
                default: false,
            },
        ]);
        let tags = recipe.tags || [];
        if (updateTags) {
            const { tagsInput } = await inquirer_1.default.prompt([
                {
                    type: 'input',
                    name: 'tagsInput',
                    message: 'Tags (comma-separated, leave empty to clear):',
                    default: tags.join(', '),
                },
            ]);
            tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
        }
        const dto = {
            title: answers.title,
            description: answers.description || undefined,
            category: answers.category,
            cuisine: answers.cuisine || undefined,
            servings: answers.servings,
            prepTimeMinutes: answers.prepTimeMinutes,
            cookTimeMinutes: answers.cookTimeMinutes,
            difficulty: answers.difficulty,
            ingredients,
            steps,
            tags: tags.length > 0 ? tags : undefined,
        };
        const updateSpinner = (0, ora_1.default)('Updating recipe...').start();
        const result = await service.update(id, dto);
        updateSpinner.stop();
        if (result.success) {
            console.log(chalk_1.default.green('✓ Recipe updated successfully!'));
        }
        else {
            console.error(chalk_1.default.red('✗ Failed to update recipe'));
            console.error(chalk_1.default.red(result.error?.message || 'Unknown error'));
            process.exit(1);
        }
    });
}
