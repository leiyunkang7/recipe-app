import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RecipeService } from '@recipe-app/recipe-service';
import { updateCommand, updateAction, validateIngredientAmount, validateStepInstruction, validateIngredientName, validateIngredientUnit } from '../update';
import { Database } from '@recipe-app/database';

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

vi.mock('chalk', () => ({
  default: {
    green: vi.fn((text: string) => text),
    red: vi.fn((text: string) => text),
  },
}));

describe('CLI - updateCommand', () => {
  let mockDb: Database;
  let mockService: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  const mockRecipe = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Original Recipe',
    description: 'Original description',
    category: 'Lunch',
    cuisine: 'Italian',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    difficulty: 'medium',
    ingredients: [
      { name: 'Tomato', amount: 5, unit: 'pieces' },
      { name: 'Onion', amount: 1, unit: 'piece' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Chop vegetables', durationMinutes: 5 },
      { stepNumber: 2, instruction: 'Cook soup', durationMinutes: 30 },
    ],
    tags: ['vegetarian', 'quick'],
  };

  beforeEach(() => {
    mockDb = {} as Database;

    mockService = {
      findById: vi.fn(),
      update: vi.fn(),
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

  describe('successful recipe update', () => {
    it('should update all fields successfully', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Updated Recipe',
          description: 'Updated description',
          category: 'Dinner',
          cuisine: 'French',
          servings: 6,
          prepTimeMinutes: 20,
          cookTimeMinutes: 45,
          difficulty: 'hard',
          updateIngredients: false,
        })
        .mockResolvedValueOnce({ updateSteps: false })
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id, title: 'Updated Recipe' },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(mockService.update).toHaveBeenCalledWith(
        mockRecipe.id,
        expect.objectContaining({
          title: 'Updated Recipe',
          description: 'Updated description',
          category: 'Dinner',
          cuisine: 'French',
          servings: 6,
          prepTimeMinutes: 20,
          cookTimeMinutes: 45,
          difficulty: 'hard',
          ingredients: mockRecipe.ingredients,
          steps: mockRecipe.steps,
          tags: mockRecipe.tags,
        })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Recipe updated successfully'));
    });

    it('should update only title (partial update)', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'New Title Only',
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: false,
        })
        .mockResolvedValueOnce({ updateSteps: false })
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id, title: 'New Title Only' },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(mockService.update).toHaveBeenCalledWith(
        mockRecipe.id,
        expect.objectContaining({
          title: 'New Title Only',
          category: mockRecipe.category,
          servings: mockRecipe.servings,
        })
      );
    });

    it('should replace all ingredients', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: mockRecipe.title,
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: true,
        })
        .mockResolvedValueOnce({ action: 'Replace all' })
        .mockResolvedValueOnce({
          name: 'New Ingredient',
          amount: 100,
          unit: 'grams',
        })
        .mockResolvedValueOnce({ more: false })
        .mockResolvedValueOnce({ updateSteps: false })
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(mockService.update).toHaveBeenCalledWith(
        mockRecipe.id,
        expect.objectContaining({
          ingredients: [{ name: 'New Ingredient', amount: 100, unit: 'grams' }],
        })
      );
    });

    it('should replace all steps', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: mockRecipe.title,
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: false,
        })
        .mockResolvedValueOnce({ updateSteps: true })
        .mockResolvedValueOnce({ action: 'Replace all' })
        .mockResolvedValueOnce({
          instruction: 'New Step 1',
          durationMinutes: 10,
        })
        .mockResolvedValueOnce({ more: false })
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(mockService.update).toHaveBeenCalledWith(
        mockRecipe.id,
        expect.objectContaining({
          steps: [{ stepNumber: 1, instruction: 'New Step 1', durationMinutes: 10 }],
        })
      );
    });

    it('should update tags', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: mockRecipe.title,
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: false,
        })
        .mockResolvedValueOnce({ updateSteps: false })
        .mockResolvedValueOnce({ updateTags: true })
        .mockResolvedValueOnce({ tagsInput: 'new-tag1, new-tag2' });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(mockService.update).toHaveBeenCalledWith(
        mockRecipe.id,
        expect.objectContaining({
          tags: ['new-tag1', 'new-tag2'],
        })
      );
    });

    it('should keep existing ingredients when choosing Keep existing', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: mockRecipe.title,
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: true,
        })
        .mockResolvedValueOnce({ action: 'Keep existing' })
        .mockResolvedValueOnce({ updateSteps: false })
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(mockService.update).toHaveBeenCalledWith(
        mockRecipe.id,
        expect.objectContaining({
          ingredients: mockRecipe.ingredients,
        })
      );
    });

    it('should keep existing steps when choosing Keep existing', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: mockRecipe.title,
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: false,
        })
        .mockResolvedValueOnce({ updateSteps: true })
        .mockResolvedValueOnce({ action: 'Keep existing' })
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(mockService.update).toHaveBeenCalledWith(
        mockRecipe.id,
        expect.objectContaining({
          steps: mockRecipe.steps,
        })
      );
    });

    it('should handle multiple new ingredients', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: mockRecipe.title,
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: true,
        })
        .mockResolvedValueOnce({ action: 'Replace all' })
        .mockResolvedValueOnce({
          name: 'Ingredient 1',
          amount: 100,
          unit: 'g',
        })
        .mockResolvedValueOnce({ more: true })
        .mockResolvedValueOnce({
          name: 'Ingredient 2',
          amount: 200,
          unit: 'ml',
        })
        .mockResolvedValueOnce({ more: false })
        .mockResolvedValueOnce({ updateSteps: false })
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(mockService.update).toHaveBeenCalledWith(
        mockRecipe.id,
        expect.objectContaining({
          ingredients: [
            { name: 'Ingredient 1', amount: 100, unit: 'g' },
            { name: 'Ingredient 2', amount: 200, unit: 'ml' },
          ],
        })
      );
    });

    it('should handle multiple new steps', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: mockRecipe.title,
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: false,
        })
        .mockResolvedValueOnce({ updateSteps: true })
        .mockResolvedValueOnce({ action: 'Replace all' })
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
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(mockService.update).toHaveBeenCalledWith(
        mockRecipe.id,
        expect.objectContaining({
          steps: [
            { stepNumber: 1, instruction: 'Step 1', durationMinutes: 5 },
            { stepNumber: 2, instruction: 'Step 2', durationMinutes: 10 },
          ],
        })
      );
    });

    it('should handle step with zero duration (undefined)', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: mockRecipe.title,
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: false,
        })
        .mockResolvedValueOnce({ updateSteps: true })
        .mockResolvedValueOnce({ action: 'Replace all' })
        .mockResolvedValueOnce({
          instruction: 'Simple step',
          durationMinutes: 0,
        })
        .mockResolvedValueOnce({ more: false })
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(mockService.update).toHaveBeenCalledWith(
        mockRecipe.id,
        expect.objectContaining({
          steps: [{ stepNumber: 1, instruction: 'Simple step', durationMinutes: undefined }],
        })
      );
    });

    it('should clear tags when empty input provided', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: mockRecipe.title,
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: false,
        })
        .mockResolvedValueOnce({ updateSteps: false })
        .mockResolvedValueOnce({ updateTags: true })
        .mockResolvedValueOnce({ tagsInput: '' });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(mockService.update).toHaveBeenCalledWith(
        mockRecipe.id,
        expect.objectContaining({
          tags: undefined,
        })
      );
    });

    it('should handle recipe without optional fields', async () => {
      const inquirer = await import('inquirer');

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

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Updated Simple Recipe',
          description: '',
          category: 'Dinner',
          cuisine: '',
          servings: 4,
          prepTimeMinutes: 15,
          cookTimeMinutes: 25,
          difficulty: 'easy',
          updateIngredients: false,
        })
        .mockResolvedValueOnce({ updateSteps: false })
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: '123', title: 'Updated Simple Recipe' },
      });

      await updateAction(mockDb, '123');

      expect(mockService.update).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({
          title: 'Updated Simple Recipe',
          description: undefined,
          cuisine: undefined,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle NOT_FOUND error when fetching recipe', async () => {
      mockService.findById.mockResolvedValue({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Recipe not found',
        },
      });

      await updateAction(mockDb, 'non-existent-id');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Recipe not found'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle missing data when fetching recipe', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: undefined,
      });

      await updateAction(mockDb, 'some-id');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Recipe not found'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle update failure error', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Updated Title',
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: false,
        })
        .mockResolvedValueOnce({ updateSteps: false })
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Database connection failed',
        },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to update recipe'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Database connection failed'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle update error without message', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: 'Updated Title',
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: false,
        })
        .mockResolvedValueOnce({ updateSteps: false })
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
        },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('ingredient amount validation', () => {
    it('should validate ingredient amount is positive (covers lines 108-109)', () => {
      // Test the exported validate function directly
      // Line 109: validate: (input) => input > 0 || 'Must be positive'

      // Invalid values should return error message
      expect(validateIngredientAmount(0)).toBe('Must be positive');
      expect(validateIngredientAmount(-5)).toBe('Must be positive');
      expect(validateIngredientAmount(-100)).toBe('Must be positive');

      // Valid values should return true
      expect(validateIngredientAmount(1)).toBe(true);
      expect(validateIngredientAmount(100)).toBe(true);
      expect(validateIngredientAmount(0.5)).toBe(true);
    });

    it('should update recipe with valid ingredient amounts', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      vi.mocked(inquirer.default.prompt)
        // Basic info
        .mockResolvedValueOnce({
          title: mockRecipe.title,
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: true,
        })
        // Replace all
        .mockResolvedValueOnce({ action: 'Replace all' })
        // Ingredient with valid amount
        .mockResolvedValueOnce({
          name: 'Valid Ingredient',
          amount: 100,
          unit: 'grams',
        })
        // No more ingredients
        .mockResolvedValueOnce({ more: false })
        // Update steps?
        .mockResolvedValueOnce({ updateSteps: false })
        // Update tags?
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(mockService.update).toHaveBeenCalledWith(
        mockRecipe.id,
        expect.objectContaining({
          ingredients: [{ name: 'Valid Ingredient', amount: 100, unit: 'grams' }],
        })
      );
    });
  });

  describe('ingredient name validation', () => {
    it('should validate ingredient name is not empty (covers line 112)', () => {
      // Test the exported validate function directly
      // Line 112: validate: validateIngredientName

      // Invalid values should return error message
      expect(validateIngredientName('')).toBe('Name is required');

      // Valid values should return true
      expect(validateIngredientName('Tomato')).toBe(true);
      expect(validateIngredientName('a')).toBe(true);
      expect(validateIngredientName('Ingredient with special chars !@#$%')).toBe(true);
    });
  });

  describe('ingredient unit validation', () => {
    it('should validate ingredient unit is not empty (covers line 124)', () => {
      // Test the exported validate function directly
      // Line 124: validate: validateIngredientUnit

      // Invalid values should return error message
      expect(validateIngredientUnit('')).toBe('Unit is required');

      // Valid values should return true
      expect(validateIngredientUnit('cups')).toBe(true);
      expect(validateIngredientUnit('g')).toBe(true);
      expect(validateIngredientUnit('tablespoons')).toBe(true);
    });
  });

  describe('step instruction validation', () => {
    it('should validate step instruction is not empty (covers line 165)', () => {
      // Test the exported validate function directly
      // Line 165: validate: (input) => input.length > 0 || 'Instruction is required'

      // Invalid values should return error message
      expect(validateStepInstruction('')).toBe('Instruction is required');

      // Valid values should return true
      expect(validateStepInstruction('Chop vegetables')).toBe(true);
      expect(validateStepInstruction('a')).toBe(true);
      expect(validateStepInstruction('Step with special chars !@#$%')).toBe(true);
    });

    it('should update recipe with valid step instructions', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      // Mock order follows inquirer prompt execution
      vi.mocked(inquirer.default.prompt)
        // 1. Basic info
        .mockResolvedValueOnce({
          title: mockRecipe.title,
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: false,
        })
        // 2. Update steps?
        .mockResolvedValueOnce({ updateSteps: true })
        // 3. Action selection
        .mockResolvedValueOnce({ action: 'Replace all' })
        // 4. Step data (instruction, duration in one prompt)
        .mockResolvedValueOnce({ instruction: 'Cook pasta', durationMinutes: 15 })
        // 5. More steps?
        .mockResolvedValueOnce({ more: false })
        // 6. Update tags?
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id },
      });

      await updateAction(mockDb, mockRecipe.id);

      expect(mockService.update).toHaveBeenCalledWith(
        mockRecipe.id,
        expect.objectContaining({
          steps: [{ stepNumber: 1, instruction: 'Cook pasta', durationMinutes: 15 }],
        })
      );
    });
  });

  describe('updateCommand action', () => {
    it('should call updateAction with correct parameters from command', async () => {
      // Set up mock before creating command
      mockService.findById.mockResolvedValue({
        success: true,
        data: { ...mockRecipe },
      });

      const inquirer = await import('inquirer');
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          title: mockRecipe.title,
          description: mockRecipe.description,
          category: mockRecipe.category,
          cuisine: mockRecipe.cuisine,
          servings: mockRecipe.servings,
          prepTimeMinutes: mockRecipe.prepTimeMinutes,
          cookTimeMinutes: mockRecipe.cookTimeMinutes,
          difficulty: mockRecipe.difficulty,
          updateIngredients: false,
        })
        .mockResolvedValueOnce({ updateSteps: false })
        .mockResolvedValueOnce({ updateTags: false });

      mockService.update.mockResolvedValue({
        success: true,
        data: { id: mockRecipe.id },
      });

      const command = updateCommand(mockDb);

      // Simulate executing the command action
      // This tests line 253: await updateAction(db, id);
      await command.parseAsync(['node', 'test', 'test-recipe-id']);

      expect(mockService.findById).toHaveBeenCalledWith('test-recipe-id');
    });
  });

  describe('command configuration', () => {
    it('should have correct command name', () => {
      const command = updateCommand(mockDb);
      expect(command.name()).toBe('update');
    });

    it('should have correct description', () => {
      const command = updateCommand(mockDb);
      expect(command.description()).toContain('Update a recipe');
    });

    it('should require ID argument', () => {
      const command = updateCommand(mockDb);
      const args = command.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].name()).toBe('id');
      expect(args[0].required).toBe(true);
    });
  });
});
