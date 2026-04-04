import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { Database } from '@recipe-app/database';
import { RecipeService } from '@recipe-app/recipe-service';

export function updateCommand(db: Database): Command {
  return new Command('update')
    .description('Update a recipe')
    .argument('<id>', 'Recipe ID')
    .action(async (id) => {
      const service = new RecipeService(db);

      const spinner = ora('Fetching recipe...').start();
      const existing = await service.findById(id);
      spinner.stop();

      if (!existing.success || !existing.data) {
        console.error(chalk.red('✗ Recipe not found'));
        process.exit(1);
      }

      const recipe = existing.data;

      const answers = await inquirer.prompt([
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
        const { action } = await inquirer.prompt([
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
            const ing = await inquirer.prompt([
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

            const { more } = await inquirer.prompt([
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

      const { updateSteps } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'updateSteps',
          message: 'Update cooking steps?',
          default: false,
        },
      ]);

      const steps = recipe.steps;

      if (updateSteps) {
        const { action } = await inquirer.prompt([
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
            const step = await inquirer.prompt([
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

            const { more } = await inquirer.prompt([
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

      const { updateTags } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'updateTags',
          message: 'Update tags?',
          default: false,
        },
      ]);

      let tags = recipe.tags || [];

      if (updateTags) {
        const { tagsInput } = await inquirer.prompt([
          {
            type: 'input',
            name: 'tagsInput',
            message: 'Tags (comma-separated, leave empty to clear):',
            default: tags.join(', '),
          },
        ]);

        tags = tagsInput.split(',').map((t: string) => t.trim()).filter(Boolean);
      }

      const dto: any = {
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

      const updateSpinner = ora('Updating recipe...').start();

      const result = await service.update(id, dto);

      updateSpinner.stop();

      if (result.success) {
        console.log(chalk.green('✓ Recipe updated successfully!'));
      } else {
        console.error(chalk.red('✗ Failed to update recipe'));
        console.error(chalk.red(result.error?.message || 'Unknown error'));
        process.exit(1);
      }
    });
}
