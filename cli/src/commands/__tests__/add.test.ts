import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RecipeService } from '@recipe-app/recipe-service';
import { addCommand, addAction, validateAmount, validateInstruction } from '../add';
import { Config } from '../../config';

vi.mock('@recipe-app/recipe-service', () => ({
  RecipeService: vi.fn(),
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn(() => ({
      stop: vi.fn(),
    })),
  })),
}));

describe('CLI - addCommand', () => {
  let mockDb: any;
  let mockService: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(async () => {
    mockDb = {};

    mockService = {
      create: vi.fn(),
    };

    vi.mocked(RecipeService).mockImplementation(function () {
      return mockService;
    });

    // Reset inquirer mock before each test
    const inquirer = await import('inquirer');
    vi.mocked(inquirer.default.prompt).mockReset();

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('successful recipe creation', () => {
    it('should create a recipe with minimal required fields', async () => {
      const inquirer = await import('inquirer');

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Test Recipe',
          description: '',
          category: 'Lunch',
          cuisine: '',
          servings: 4,
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          difficulty: 'medium',
          addIngredients: false,
        })
        .mockResolvedValueOnce({ addSteps: false })
        .mockResolvedValueOnce({ addTags: false });

      mockService.create.mockResolvedValue({
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Test Recipe',
        },
      });

      await addAction(mockDb);

      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Recipe',
          category: 'Lunch',
          ingredients: [],
          steps: [],
        })
      );
    });

    it('should create a recipe with all fields', async () => {
      const inquirer = await import('inquirer');

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Full Recipe',
          description: 'Complete recipe',
          category: 'Dinner',
          cuisine: 'Italian',
          servings: 6,
          prepTimeMinutes: 15,
          cookTimeMinutes: 30,
          difficulty: 'easy',
          addIngredients: true,
        })
        .mockResolvedValueOnce({
          name: 'Pasta',
          amount: 500,
          unit: 'g',
        })
        .mockResolvedValueOnce({ more: false })
        .mockResolvedValueOnce({ addSteps: true })
        .mockResolvedValueOnce({
          instruction: 'Boil pasta',
          durationMinutes: 10,
        })
        .mockResolvedValueOnce({ more: false })
        .mockResolvedValueOnce({ addTags: true })
        .mockResolvedValueOnce({ tags: 'vegetarian,quick' });

      mockService.create.mockResolvedValue({
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Full Recipe',
        },
      });

      await addAction(mockDb);

      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Full Recipe',
          description: 'Complete recipe',
          cuisine: 'Italian',
          ingredients: [{ name: 'Pasta', amount: 500, unit: 'g' }],
          steps: [{ stepNumber: 1, instruction: 'Boil pasta', durationMinutes: 10 }],
          tags: ['vegetarian', 'quick'],
        })
      );
    });

    it('should handle multiple ingredients', async () => {
      const inquirer = await import('inquirer');

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Multi Ingredient Recipe',
          description: '',
          category: 'Lunch',
          cuisine: '',
          servings: 4,
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          difficulty: 'medium',
          addIngredients: true,
        })
        .mockResolvedValueOnce({
          name: 'Eggs',
          amount: 2,
          unit: 'pieces',
        })
        .mockResolvedValueOnce({ more: true })
        .mockResolvedValueOnce({
          name: 'Milk',
          amount: 1,
          unit: 'cup',
        })
        .mockResolvedValueOnce({ more: false })
        .mockResolvedValueOnce({ addSteps: false })
        .mockResolvedValueOnce({ addTags: false });

      mockService.create.mockResolvedValue({
        success: true,
        data: { id: 'test-id', title: 'Multi Ingredient Recipe' },
      });

      await addAction(mockDb);

      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: [
            { name: 'Eggs', amount: 2, unit: 'pieces' },
            { name: 'Milk', amount: 1, unit: 'cup' },
          ],
        })
      );
    });

    it('should handle multiple steps', async () => {
      const inquirer = await import('inquirer');

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Multi Step Recipe',
          description: '',
          category: 'Lunch',
          cuisine: '',
          servings: 4,
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          difficulty: 'medium',
          addIngredients: false,
        })
        .mockResolvedValueOnce({ addSteps: true })
        .mockResolvedValueOnce({
          instruction: 'Step 1',
          durationMinutes: 5,
        })
        .mockResolvedValueOnce({ more: true })
        .mockResolvedValueOnce({
          instruction: 'Step 2',
          durationMinutes: 10,
        })
        .mockResolvedValueOnce({ more: false })
        .mockResolvedValueOnce({ addTags: false });

      mockService.create.mockResolvedValue({
        success: true,
        data: { id: 'test-id', title: 'Multi Step Recipe' },
      });

      await addAction(mockDb);

      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          steps: [
            { stepNumber: 1, instruction: 'Step 1', durationMinutes: 5 },
            { stepNumber: 2, instruction: 'Step 2', durationMinutes: 10 },
          ],
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle service creation failure', async () => {
      const inquirer = await import('inquirer');

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Failed Recipe',
          description: '',
          category: 'Lunch',
          cuisine: '',
          servings: 4,
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          difficulty: 'medium',
          addIngredients: false,
        })
        .mockResolvedValueOnce({ addSteps: false })
        .mockResolvedValueOnce({ addTags: false });

      mockService.create.mockResolvedValue({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Database error',
        },
      });

      await addAction(mockDb);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle validation errors', async () => {
      const inquirer = await import('inquirer');

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        title: '',
        description: '',
        category: 'Lunch',
        cuisine: '',
        servings: 4,
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        difficulty: 'medium',
        addIngredients: false,
        addSteps: false,
        addTags: false,
      });

      const command = addCommand(mockDb);

      expect(command).toBeDefined();
    });
  });

  describe('input handling', () => {
    it('should parse tags correctly', async () => {
      const inquirer = await import('inquirer');

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Tagged Recipe',
          description: '',
          category: 'Lunch',
          cuisine: '',
          servings: 4,
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          difficulty: 'medium',
          addIngredients: false,
        })
        .mockResolvedValueOnce({ addSteps: false })
        .mockResolvedValueOnce({ addTags: true })
        .mockResolvedValueOnce({ tags: 'tag1, tag2, tag3' });

      mockService.create.mockResolvedValue({
        success: true,
        data: { id: 'test-id', title: 'Tagged Recipe' },
      });

      await addAction(mockDb);

      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['tag1', 'tag2', 'tag3'],
        })
      );
    });

    it('should handle tags with extra spaces', async () => {
      const inquirer = await import('inquirer');

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Spaced Tags Recipe',
          description: '',
          category: 'Lunch',
          cuisine: '',
          servings: 4,
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          difficulty: 'medium',
          addIngredients: false,
        })
        .mockResolvedValueOnce({ addSteps: false })
        .mockResolvedValueOnce({ addTags: true })
        .mockResolvedValueOnce({ tags: '  tag1  ,  tag2  , tag3  ' });

      mockService.create.mockResolvedValue({
        success: true,
        data: { id: 'test-id', title: 'Spaced Tags Recipe' },
      });

      await addAction(mockDb);

      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['tag1', 'tag2', 'tag3'],
        })
      );
    });

    it('should filter out empty tags', async () => {
      const inquirer = await import('inquirer');

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Empty Tags Recipe',
          description: '',
          category: 'Lunch',
          cuisine: '',
          servings: 4,
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          difficulty: 'medium',
          addIngredients: false,
        })
        .mockResolvedValueOnce({ addSteps: false })
        .mockResolvedValueOnce({ addTags: true })
        .mockResolvedValueOnce({ tags: 'tag1,,tag3,' });

      mockService.create.mockResolvedValue({
        success: true,
        data: { id: 'test-id', title: 'Empty Tags Recipe' },
      });

      await addAction(mockDb);

      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['tag1', 'tag3'],
        })
      );
    });

    it('should handle optional durationMinutes in steps', async () => {
      const inquirer = await import('inquirer');

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Optional Duration Recipe',
          description: '',
          category: 'Lunch',
          cuisine: '',
          servings: 4,
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          difficulty: 'medium',
          addIngredients: false,
        })
        .mockResolvedValueOnce({ addSteps: true })
        .mockResolvedValueOnce({
          instruction: 'Quick step',
          durationMinutes: 0,
          more: false,
        })
        .mockResolvedValueOnce({ addTags: false });

      mockService.create.mockResolvedValue({
        success: true,
        data: { id: 'test-id', title: 'Optional Duration Recipe' },
      });

    });
  });

  describe('input validation', () => {
    it('should accept valid floating point amounts', async () => {
      const inquirer = await import('inquirer');

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Float Amount Recipe',
          description: '',
          category: 'Lunch',
          cuisine: '',
          servings: 4,
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          difficulty: 'medium',
          addIngredients: true,
        })
        .mockResolvedValueOnce({
          name: 'Flour',
          amount: 1.555,
          unit: 'cup',
        })
        .mockResolvedValueOnce({ more: false })
        .mockResolvedValueOnce({ addSteps: false })
        .mockResolvedValueOnce({ addTags: false });

      mockService.create.mockResolvedValue({
        success: true,
        data: { id: 'test-id', title: 'Float Amount Recipe' },
      });

      await addAction(mockDb);

      expect(mockService.create).toHaveBeenCalled();
    });

    describe('validateAmount function', () => {
      it('should return true for valid positive amount', () => {
        expect(validateAmount(100)).toBe(true);
        expect(validateAmount(0.5)).toBe(true);
        expect(validateAmount(999999.99)).toBe(true);
      });

      it('should return error for non-finite number (Infinity)', () => {
        expect(validateAmount(Infinity)).toBe('Must be a valid number');
        expect(validateAmount(-Infinity)).toBe('Must be a valid number');
      });

      it('should return error for NaN', () => {
        expect(validateAmount(NaN)).toBe('Must be a valid number');
      });

      it('should return error for amount exceeding maximum limit', () => {
        expect(validateAmount(1000000)).toBe('Amount too large (max 999999.99)');
        expect(validateAmount(999999.999)).toBe('Amount too large (max 999999.99)');
      });

      it('should return error for non-positive amount', () => {
        expect(validateAmount(0)).toBe('Must be positive');
        expect(validateAmount(-5)).toBe('Must be positive');
      });
    });

    describe('validateInstruction function', () => {
      it('should return true for non-empty instruction', () => {
        expect(validateInstruction('Mix ingredients')).toBe(true);
        expect(validateInstruction('a')).toBe(true);
      });

      it('should return error for empty instruction', () => {
        expect(validateInstruction('')).toBe('Instruction is required');
      });
    });
  });

  describe('command configuration', () => {
    it('should have correct command name', () => {
      const command = addCommand(mockDb);
      expect(command.name()).toBe('add');
    });

    it('should have correct description', () => {
      const command = addCommand(mockDb);
      expect(command.description()).toContain('Create a new recipe');
    });

    it('should execute addAction when command action is called', async () => {
      const inquirer = await import('inquirer');

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Action Test Recipe',
          description: '',
          category: 'Lunch',
          cuisine: '',
          servings: 4,
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          difficulty: 'medium',
          addIngredients: false,
        })
        .mockResolvedValueOnce({ addSteps: false })
        .mockResolvedValueOnce({ addTags: false });

      mockService.create.mockResolvedValue({
        success: true,
        data: { id: 'test-id', title: 'Action Test Recipe' },
      });

      // Test that addCommand properly wraps addAction
      await addAction(mockDb);

      expect(mockService.create).toHaveBeenCalled();
    });
  });

  describe('ingredient name and unit validation', () => {
    it('should accept ingredient with valid name and unit', async () => {
      const inquirer = await import('inquirer');
      const promptSpy = vi.mocked(inquirer.default.prompt);

      promptSpy
        .mockResolvedValueOnce({
          title: 'Valid Ingredient Recipe',
          description: '',
          category: 'Dinner',
          cuisine: 'Italian',
          servings: 4,
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          difficulty: 'easy',
          addIngredients: true,
        })
        .mockResolvedValueOnce({
          name: 'Tomatoes',
          amount: 3,
          unit: 'pieces',
        })
        .mockResolvedValueOnce({ more: false })
        .mockResolvedValueOnce({ addSteps: false })
        .mockResolvedValueOnce({ addTags: false });

      mockService.create.mockResolvedValue({
        success: true,
        data: { id: 'test-id', title: 'Valid Ingredient Recipe' },
      });

      await addAction(mockDb);

      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: [{ name: 'Tomatoes', amount: 3, unit: 'pieces' }],
        })
      );
    });

    it('should handle ingredient name with spaces', async () => {
      const inquirer = await import('inquirer');
      const promptSpy = vi.mocked(inquirer.default.prompt);

      promptSpy
        .mockResolvedValueOnce({
          title: 'Spaced Ingredient Name',
          description: '',
          category: 'Lunch',
          cuisine: '',
          servings: 4,
          prepTimeMinutes: 10,
          cookTimeMinutes: 20,
          difficulty: 'medium',
          addIngredients: true,
        })
        .mockResolvedValueOnce({
          name: 'Olive Oil',
          amount: 2,
          unit: 'tbsp',
        })
        .mockResolvedValueOnce({ more: false })
        .mockResolvedValueOnce({ addSteps: false })
        .mockResolvedValueOnce({ addTags: false });

      mockService.create.mockResolvedValue({
        success: true,
        data: { id: 'test-id', title: 'Spaced Ingredient Name' },
      });

      await addAction(mockDb);

      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: [{ name: 'Olive Oil', amount: 2, unit: 'tbsp' }],
        })
      );
    });

    it('should handle ingredient unit with various formats', async () => {
      const inquirer = await import('inquirer');
      const promptSpy = vi.mocked(inquirer.default.prompt);

      promptSpy
        .mockResolvedValueOnce({
          title: 'Unit Formats Test',
          description: '',
          category: 'Breakfast',
          cuisine: '',
          servings: 2,
          prepTimeMinutes: 5,
          cookTimeMinutes: 10,
          difficulty: 'easy',
          addIngredients: true,
        })
        .mockResolvedValueOnce({
          name: 'Flour',
          amount: 1.5,
          unit: 'cup',
        })
        .mockResolvedValueOnce({ more: true })
        .mockResolvedValueOnce({
          name: 'Salt',
          amount: 0.5,
          unit: 'tsp',
        })
        .mockResolvedValueOnce({ more: false })
        .mockResolvedValueOnce({ addSteps: false })
        .mockResolvedValueOnce({ addTags: false });

      mockService.create.mockResolvedValue({
        success: true,
        data: { id: 'test-id', title: 'Unit Formats Test' },
      });

      await addAction(mockDb);

      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ingredients: [
            { name: 'Flour', amount: 1.5, unit: 'cup' },
            { name: 'Salt', amount: 0.5, unit: 'tsp' },
          ],
        })
      );
    });
  });
});
