import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RecipeService } from '@recipe-app/recipe-service';
import { deleteManyCommand } from '../deleteMany';
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
    gray: vi.fn((text: string) => text),
    red: vi.fn((text: string) => text),
    yellow: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    bold: vi.fn((text: string) => text),
    dim: vi.fn((text: string) => text),
  },
}));

describe('CLI - deleteManyCommand', () => {
  let mockDb: Database;
  let mockService: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    mockDb = {} as Database;

    mockService = {
      findAll: vi.fn(),
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

  const mockRecipes = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Tomato Soup',
      category: 'Lunch',
      difficulty: 'easy',
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      title: 'Tomato Salad',
      category: 'Salad',
      difficulty: 'medium',
    },
    {
      id: '323e4567-e89b-12d3-a456-426614174002',
      title: 'Tomato Pasta',
      category: 'Dinner',
      difficulty: 'hard',
    },
  ];

  describe('successful bulk deletion', () => {
    it('should delete all matching recipes when user confirms', async () => {
      const inquirer = await import('inquirer');

      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 3,
        },
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: true,
      });

      mockService.delete.mockResolvedValue({ success: true });

      const command = deleteManyCommand(mockDb);
      await command.parseAsync(['node', 'test', 'Tomato']);

      expect(mockService.findAll).toHaveBeenCalledWith(
        { search: 'Tomato' },
        { page: 1, limit: 100 }
      );
      expect(mockService.delete).toHaveBeenCalledTimes(3);
      expect(mockService.delete).toHaveBeenNthCalledWith(1, '123e4567-e89b-12d3-a456-426614174000');
      expect(mockService.delete).toHaveBeenNthCalledWith(2, '223e4567-e89b-12d3-a456-426614174001');
      expect(mockService.delete).toHaveBeenNthCalledWith(3, '323e4567-e89b-12d3-a456-426614174002');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deleted 3 recipes'));
    });

    it('should delete single matching recipe when user confirms', async () => {
      const inquirer = await import('inquirer');

      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [mockRecipes[0]],
          total: 1,
        },
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: true,
      });

      mockService.delete.mockResolvedValue({ success: true });

      const command = deleteManyCommand(mockDb);
      await command.parseAsync(['node', 'test', 'Soup']);

      expect(mockService.delete).toHaveBeenCalledTimes(1);
      expect(mockService.delete).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deleted 1 recipe'));
    });
  });

  describe('cancellation', () => {
    it('should cancel deletion when user rejects confirmation', async () => {
      const inquirer = await import('inquirer');

      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 3,
        },
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: false,
      });

      const command = deleteManyCommand(mockDb);
      await command.parseAsync(['node', 'test', 'Tomato']);

      expect(mockService.delete).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Delete cancelled'));
    });
  });

  describe('no matching recipes', () => {
    it('should handle no matching recipes', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [],
          total: 0,
        },
      });

      const command = deleteManyCommand(mockDb);
      await command.parseAsync(['node', 'test', 'NonExistent']);

      expect(mockService.delete).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No matching recipes found'));
    });
  });

  describe('partial deletion failure', () => {
    it('should handle partial deletion failure', async () => {
      const inquirer = await import('inquirer');

      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 3,
        },
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: true,
      });

      mockService.delete
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: false, error: { code: 'DB_ERROR', message: 'Failed' } })
        .mockResolvedValueOnce({ success: true });

      const command = deleteManyCommand(mockDb);
      await command.parseAsync(['node', 'test', 'Tomato']);

      expect(mockService.delete).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deleted 2 recipes'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to delete 1 recipe'));
    });

    it('should handle all deletions failing', async () => {
      const inquirer = await import('inquirer');

      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 3,
        },
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: true,
      });

      mockService.delete.mockResolvedValue({
        success: false,
        error: { code: 'DB_ERROR', message: 'Failed' },
      });

      const command = deleteManyCommand(mockDb);
      await command.parseAsync(['node', 'test', 'Tomato']);

      expect(mockService.delete).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deleted 0 recipes'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to delete 3 recipes'));
    });
  });

  describe('display matching recipes', () => {
    it('should display list of matching recipes', async () => {
      const inquirer = await import('inquirer');

      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 3,
        },
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: false,
      });

      const command = deleteManyCommand(mockDb);
      await command.parseAsync(['node', 'test', 'Tomato']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 3 recipes'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tomato Soup'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tomato Salad'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tomato Pasta'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('123e4567-e89b-12d3-a456-426614174000'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Lunch'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('easy'));
    });

    it('should display correct singular form for single recipe', async () => {
      const inquirer = await import('inquirer');

      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [mockRecipes[0]],
          total: 1,
        },
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: false,
      });

      const command = deleteManyCommand(mockDb);
      await command.parseAsync(['node', 'test', 'Soup']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 recipe'));
    });

    it('should display correct plural form for multiple recipes', async () => {
      const inquirer = await import('inquirer');

      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 3,
        },
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: true,
      });

      mockService.delete.mockResolvedValue({ success: true });

      const command = deleteManyCommand(mockDb);
      await command.parseAsync(['node', 'test', 'Tomato']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 3 recipes'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deleted 3 recipes'));
    });
  });

  describe('search failure', () => {
    it('should handle search failure with error message', async () => {
      mockService.findAll.mockResolvedValue({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Database connection failed',
        },
      });

      const command = deleteManyCommand(mockDb);
      await expect(
        command.parseAsync(['node', 'test', 'Tomato'])
      ).rejects.toThrow('Process exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to search recipes'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Database connection failed'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle search failure with missing data', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const command = deleteManyCommand(mockDb);
      await expect(
        command.parseAsync(['node', 'test', 'Tomato'])
      ).rejects.toThrow('Process exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to search recipes'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle search failure with unknown error', async () => {
      mockService.findAll.mockResolvedValue({
        success: false,
        error: undefined,
      });

      const command = deleteManyCommand(mockDb);
      await expect(
        command.parseAsync(['node', 'test', 'Tomato'])
      ).rejects.toThrow('Process exit');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to search recipes'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('command configuration', () => {
    it('should have correct command name', () => {
      const command = deleteManyCommand(mockDb);
      expect(command.name()).toBe('delete-many');
    });

    it('should have correct description', () => {
      const command = deleteManyCommand(mockDb);
      expect(command.description()).toContain('Delete multiple recipes by pattern');
    });

    it('should require pattern argument', () => {
      const command = deleteManyCommand(mockDb);
      const args = command.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].name()).toBe('pattern');
      expect(args[0].required).toBe(true);
    });

    it('should have correct argument description', () => {
      const command = deleteManyCommand(mockDb);
      const args = command.registeredArguments;
      expect(args[0].description).toBe('Search pattern for recipe titles');
    });
  });
});
