import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RecipeService } from '@recipe-app/recipe-service';
import { getCommand, getAction } from '../get';

vi.mock('@recipe-app/recipe-service', () => ({
  RecipeService: vi.fn(),
}));

vi.mock('../index', () => ({
  getDb: vi.fn(() => ({})),
  getConfig: vi.fn(() => ({})),
}));

describe('CLI - getCommand', () => {
  let mockService: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    mockService = {
      findById: vi.fn(),
    };

    vi.mocked(RecipeService).mockImplementation(function () {
      return mockService;
    });

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  const mockRecipe = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Tomato Soup',
    description: 'A delicious soup',
    category: 'Lunch',
    cuisine: 'Italian',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    difficulty: 'easy',
    ingredients: [
      { name: 'Tomato', amount: 5, unit: 'pieces' },
      { name: 'Onion', amount: 1, unit: 'piece' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Chop vegetables', durationMinutes: 5 },
      { stepNumber: 2, instruction: 'Cook soup', durationMinutes: 30 },
    ],
    tags: ['vegetarian', 'quick'],
    nutritionInfo: {
      calories: 200,
      protein: 8,
      carbs: 30,
      fat: 5,
      fiber: 4,
    },
    imageUrl: 'https://example.com/image.jpg',
    source: 'Grandma',
  };

  describe('successful retrieval', () => {
    it('should display recipe details', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      await getAction('123e4567-e89b-12d3-a456-426614174000');

      expect(mockService.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tomato Soup'));
    });

    it('should display title and ID', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      await getAction('123e4567-e89b-12d3-a456-426614174000');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tomato Soup'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('123e4567'));
    });

    it('should display description', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      await getAction('123e4567-e89b-12d3-a456-426614174000');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('A delicious soup'));
    });

    it('should display details', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      await getAction('123e4567-e89b-12d3-a456-426614174000');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Category'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Lunch'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cuisine'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Italian'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Servings'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('4'));
    });

    it('should display time information', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      await getAction('123e4567-e89b-12d3-a456-426614174000');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Prep Time'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('15m'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cook Time'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('30m'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Total Time'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('45m'));
    });

    it('should display tags', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      await getAction('123e4567-e89b-12d3-a456-426614174000');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('vegetarian, quick'));
    });

    it('should display ingredients', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      await getAction('123e4567-e89b-12d3-a456-426614174000');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Ingredients'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tomato'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Onion'));
    });

    it('should display steps', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      await getAction('123e4567-e89b-12d3-a456-426614174000');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Instructions'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Chop vegetables'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Cook soup'));
    });

    it('should display nutrition info', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      await getAction('123e4567-e89b-12d3-a456-426614174000');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Nutrition'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Calories'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('200'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Protein'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('8g'));
    });

    it('should display partial nutrition info when some fields are missing', async () => {
      const recipeWithPartialNutrition = {
        ...mockRecipe,
        nutritionInfo: {
          calories: 200,
          protein: 8,
          // carbs, fat, fiber are missing
        },
      };

      mockService.findById.mockResolvedValue({
        success: true,
        data: recipeWithPartialNutrition,
      });

      await getAction('123e4567-e89b-12d3-a456-426614174000');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Nutrition'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Calories'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('200'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Protein'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('8g'));
      // Verify missing fields are not printed
      const logCalls = consoleLogSpy.mock.calls.map(c => c[0]);
      const carbsCall = logCalls.find((c: string) => typeof c === 'string' && c.includes('Carbs'));
      const fatCall = logCalls.find((c: string) => typeof c === 'string' && c.includes('Fat'));
      const fiberCall = logCalls.find((c: string) => typeof c === 'string' && c.includes('Fiber'));
      expect(carbsCall).toBeUndefined();
      expect(fatCall).toBeUndefined();
      expect(fiberCall).toBeUndefined();
    });

    it('should not display nutrition fields when value is 0', async () => {
      const recipeWithZeroValues = {
        ...mockRecipe,
        nutritionInfo: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
        },
      };

      mockService.findById.mockResolvedValue({
        success: true,
        data: recipeWithZeroValues,
      });

      await getAction('123e4567-e89b-12d3-a456-426614174000');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Nutrition'));
      // Verify zero values are not printed
      const logCalls = consoleLogSpy.mock.calls.map(c => c[0]);
      const caloriesCall = logCalls.find((c: string) => typeof c === 'string' && c.includes('Calories'));
      const proteinCall = logCalls.find((c: string) => typeof c === 'string' && c.includes('Protein'));
      expect(caloriesCall).toBeUndefined();
      expect(proteinCall).toBeUndefined();
    });

    it('should display all nutrition fields when all values are truthy', async () => {
      const recipeWithAllNutrition = {
        ...mockRecipe,
        nutritionInfo: {
          calories: 200,
          protein: 8,
          carbs: 30,
          fat: 5,
          fiber: 4,
        },
      };

      mockService.findById.mockResolvedValue({
        success: true,
        data: recipeWithAllNutrition,
      });

      await getAction('123e4567-e89b-12d3-a456-426614174000');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Nutrition'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Calories'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('200'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Protein'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('8g'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Carbs'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('30'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Fat'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('5'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Fiber'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('4'));
    });

    it('should display source', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      await getAction('123e4567-e89b-12d3-a456-426614174000');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Grandma'));
    });

    it('should handle recipe without optional fields', async () => {
      const minimalRecipe = {
        id: '123',
        title: 'Simple Recipe',
        category: 'Lunch',
        servings: 2,
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        difficulty: 'medium',
        ingredients: [{ name: 'Egg', amount: 2, unit: 'pieces' }],
        steps: [{ stepNumber: 1, instruction: 'Cook egg' }],
      };

      mockService.findById.mockResolvedValue({
        success: true,
        data: minimalRecipe,
      });

      await getAction('123');

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Simple Recipe'));
    });

    it('should handle steps without duration', async () => {
      const recipeWithoutDuration = {
        ...mockRecipe,
        steps: [
          { stepNumber: 1, instruction: 'Prepare ingredients' },
          { stepNumber: 2, instruction: 'Cook', durationMinutes: 10 },
        ],
      };

      mockService.findById.mockResolvedValue({
        success: true,
        data: recipeWithoutDuration,
      });

      await getAction('123');

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle NOT_FOUND error', async () => {
      mockService.findById.mockResolvedValue({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Recipe not found',
        },
      });

      await getAction('non-existent-id');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle database errors', async () => {
      mockService.findById.mockResolvedValue({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Database error',
        },
      });

      await getAction('some-id');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle missing data', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: undefined,
      });

      await getAction('some-id');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('command configuration', () => {
    it('should have correct command name', () => {
      const command = getCommand();
      expect(command.name()).toBe('get');
    });

    it('should have correct description', () => {
      const command = getCommand();
      expect(command.description()).toContain('Get recipe details');
    });

    it('should require ID argument', () => {
      const command = getCommand();
      const args = command.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].name()).toBe('id');
      expect(args[0].required).toBe(true);
    });
  });

  describe('command action callback', () => {
    it('should execute getAction when command action is called', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      // Use Commander's parseAsync to actually invoke the .action() callback
      const command = getCommand();
      // Pass only the command name and argument, not full process.argv
      await command.parseAsync(['node', 'get', '123e4567-e89b-12d3-a456-426614174000']);

      expect(mockService.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });
  });
});
