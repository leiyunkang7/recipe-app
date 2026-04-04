import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RecipeService } from '@recipe-app/recipe-service';
import { deleteCommand } from '../delete';
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
    red: vi.fn((text: string) => text),
    yellow: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    bold: vi.fn((text: string) => text),
    dim: vi.fn((text: string) => text),
  },
}));

describe('CLI - deleteCommand', () => {
  let mockDb: Database;
  let mockService: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  const mockRecipe = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Tomato Soup',
    category: 'Lunch',
    difficulty: 'easy',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    ingredients: [{ name: 'Tomato', amount: 5, unit: 'pieces' }],
    steps: [{ stepNumber: 1, instruction: 'Cook soup' }],
  };

  beforeEach(() => {
    mockDb = {} as Database;

    mockService = {
      findById: vi.fn(),
      delete: vi.fn(),
    };

    vi.mocked(RecipeService).mockImplementation(function () {
      return mockService;
    });

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('Process exit');
    }) as any);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('successful deletion', () => {
    it('should delete recipe when user confirms', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: true,
      });

      mockService.delete.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const command = deleteCommand(mockDb);
      await command.parseAsync(['node', 'test', '123e4567-e89b-12d3-a456-426614174000']);

      expect(mockService.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(mockService.delete).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Recipe deleted successfully'));
    });

    it('should display recipe information before deletion', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: true,
      });

      mockService.delete.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const command = deleteCommand(mockDb);
      await command.parseAsync(['node', 'test', '123e4567-e89b-12d3-a456-426614174000']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tomato Soup'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('123e4567-e89b-12d3-a456-426614174000'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Lunch'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('easy'));
    });
  });

  describe('cancellation', () => {
    it('should cancel deletion when user refuses confirmation', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: false,
      });

      const command = deleteCommand(mockDb);
      await command.parseAsync(['node', 'test', '123e4567-e89b-12d3-a456-426614174000']);

      expect(mockService.delete).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Delete cancelled'));
    });
  });

  describe('error handling', () => {
    it('should handle NOT_FOUND error when recipe does not exist', async () => {
      mockService.findById.mockResolvedValue({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Recipe not found',
        },
      });

      const command = deleteCommand(mockDb);
      await expect(
        command.parseAsync(['node', 'test', 'non-existent-id'])
      ).rejects.toThrow('Process exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Recipe not found'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(mockService.delete).not.toHaveBeenCalled();
    });

    it('should handle missing data from findById response', async () => {
      mockService.findById.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const command = deleteCommand(mockDb);
      await expect(
        command.parseAsync(['node', 'test', 'some-id'])
      ).rejects.toThrow('Process exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Recipe not found'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle deletion failure error', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: true,
      });

      mockService.delete.mockResolvedValue({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Database connection failed',
        },
      });

      const command = deleteCommand(mockDb);
      await expect(
        command.parseAsync(['node', 'test', '123e4567-e89b-12d3-a456-426614174000'])
      ).rejects.toThrow('Process exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to delete recipe'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Database connection failed'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle deletion failure with unknown error', async () => {
      const inquirer = await import('inquirer');

      mockService.findById.mockResolvedValue({
        success: true,
        data: mockRecipe,
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: true,
      });

      mockService.delete.mockResolvedValue({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: '',
        },
      });

      const command = deleteCommand(mockDb);
      await expect(
        command.parseAsync(['node', 'test', '123e4567-e89b-12d3-a456-426614174000'])
      ).rejects.toThrow('Process exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to delete recipe'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('command configuration', () => {
    it('should have correct command name', () => {
      const command = deleteCommand(mockDb);
      expect(command.name()).toBe('delete');
    });

    it('should have correct description', () => {
      const command = deleteCommand(mockDb);
      expect(command.description()).toBe('Delete a recipe');
    });

    it('should require ID argument', () => {
      const command = deleteCommand(mockDb);
      const args = command.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].name()).toBe('id');
      expect(args[0].required).toBe(true);
    });
  });
});
