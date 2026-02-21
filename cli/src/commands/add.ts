import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { Config } from '../config';
import { RecipeService } from '@recipe-app/recipe-service';
import { CreateRecipeDTO, CreateRecipeDTO as CreateRecipeDTOType } from '@recipe-app/shared-types';

export function addCommand(config: Config): Command {
  return new Command('add')
    .description('Create a new recipe interactively')
    .action(async () => {
      const service = new RecipeService(config.supabaseUrl, config.supabaseServiceKey);

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Recipe title:',
          validate: (input) => input.length > 0 || 'Title is required',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description (optional):',
        },
        {
          type: 'list',
          name: 'category',
          message: 'Category:',
          choices: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage', 'Other'],
        },
        {
          type: 'input',
          name: 'cuisine',
          message: 'Cuisine (optional):',
        },
        {
          type: 'number',
          name: 'servings',
          message: 'Servings:',
          default: 4,
          validate: (input) => input > 0 || 'Must be positive',
        },
        {
          type: 'number',
          name: 'prepTimeMinutes',
          message: 'Prep time (minutes):',
          default: 15,
          validate: (input) => input >= 0 || 'Must be non-negative',
        },
        {
          type: 'number',
          name: 'cookTimeMinutes',
          message: 'Cook time (minutes):',
          default: 30,
          validate: (input) => input >= 0 || 'Must be non-negative',
        },
        {
          type: 'list',
          name: 'difficulty',
          message: 'Difficulty:',
          choices: ['easy', 'medium', 'hard'],
          default: 'medium',
        },
        {
          type: 'confirm',
          name: 'addIngredients',
          message: 'Add ingredients?',
          default: true,
        },
      ]);

      const ingredients: any[] = [];

      if (answers.addIngredients) {
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

          const shouldContinue = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'more',
              message: 'Add another ingredient?',
              default: false,
            },
          ]);

          addMore = shouldContinue.more;
        }
      }

      const { addSteps } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addSteps',
          message: 'Add cooking steps?',
          default: true,
        },
      ]);

      const steps: any[] = [];

      if (addSteps) {
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
              message: 'Duration in minutes (optional, 0 to skip):',
              default: 0,
            },
          ]);

          steps.push({
            stepNumber: steps.length + 1,
            instruction: step.instruction,
            durationMinutes: step.durationMinutes || undefined,
          });

          const shouldContinue = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'more',
              message: 'Add another step?',
              default: false,
            },
          ]);

          addMore = shouldContinue.more;
        }
      }

      const { addTags } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addTags',
          message: 'Add tags?',
          default: false,
        },
      ]);

      const tags: string[] = [];

      if (addTags) {
        const tagsInput = await inquirer.prompt([
          {
            type: 'input',
            name: 'tags',
            message: 'Tags (comma-separated):',
          },
        ]);
        tags.push(...tagsInput.tags.split(',').map((t: string) => t.trim()).filter(Boolean));
      }

      const dto: CreateRecipeDTOType = {
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

      const spinner = ora('Creating recipe...').start();

      const result = await service.create(dto);

      spinner.stop();

      if (result.success) {
        console.log(chalk.green('✓ Recipe created successfully!'));
        console.log(chalk.dim(`ID: ${result.data?.id}`));
      } else {
        console.error(chalk.red('✗ Failed to create recipe'));
        console.error(chalk.red(result.error?.message || 'Unknown error'));
        process.exit(1);
      }
    });
}
