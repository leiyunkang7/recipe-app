import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RecipeService } from '@recipe-app/recipe-service';
import { deleteManyCommand } from '../deleteMany';

// Set DATABASE_URL to bypass config file loading
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

vi.mock('@recipe-app/recipe-service', () => ({
  RecipeService: vi.fn(),
}));

vi.mock('../index', () => ({
  getDb: vi.fn(() => ({})),
  getConfig: vi.fn(() => ({ databaseUrl: 'postgresql://test:test@localhost:5432/test', uploadDir: './uploads' })),
}));

vi.mock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

vi.mock('chalk', () => ({
  default: {
    red: vi.fn((text: string) => text),
    yellow: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    gray: vi.fn((text: string) => text),
    bold: vi.fn((text: string) => text),
    dim: vi.fn((text: string) => text),
  },
}));

describe('CLI - deleteManyCommand', () => {
  let mockService: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  const mockRecipes = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Recipe 1',
      category: 'Lunch',
      difficulty: 'easy',
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      title: 'Recipe 2',
      category: 'Dinner',
      difficulty: 'medium',
    },
  ];

  beforeEach(() => {
    mockService = {
      findAll: vi.fn(),
      delete: vi.fn(),
    };

    vi.mocked(RecipeService).mockImplementation(function () {
      return mockService;
    });

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`PROCESS_EXIT_${code}`);
    }) as any;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('successful deletion', () => {
    it('should delete all recipes when user confirms', async () => {
      const inquirer = await import('inquirer');

      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 2,
        },
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: true,
      });

      mockService.delete.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const command = deleteManyCommand();
      await command.parseAsync(['node', 'test', 'recipe']);

      expect(mockService.findAll).toHaveBeenCalledWith({ search: 'recipe' }, { page: 1, limit: 100 });
      expect(mockService.delete).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deleted 2 recipes'));
    });

    it('should display recipe list before confirmation', async () => {
      const inquirer = await import('inquirer');

      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 2,
        },
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: true,
      });

      mockService.delete.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const command = deleteManyCommand();
      await command.parseAsync(['node', 'test', 'recipe']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 2 recipes'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Recipe 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Recipe 2'));
    });
  });

  describe('cancellation', () => {
    it('should cancel deletion when user refuses confirmation', async () => {
      const inquirer = await import('inquirer');

      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 2,
        },
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: false,
      });

      const command = deleteManyCommand();
      await command.parseAsync(['node', 'test', 'recipe']);

      expect(mockService.delete).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Delete cancelled'));
    });
  });

  describe('empty recipes', () => {
    it('should handle empty recipes list', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [],
          total: 0,
        },
      });

      const command = deleteManyCommand();
      await command.parseAsync(['node', 'test', 'nonexistent']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No matching recipes found'));
      expect(mockService.delete).not.toHaveBeenCalled();
    });
  });

  describe('partial deletion', () => {
    it('should handle partial deletion failure', async () => {
      const inquirer = await import('inquirer');

      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 2,
        },
      });

      vi.mocked(inquirer.default.prompt).mockResolvedValue({
        confirm: true,
      });

      mockService.delete
        .mockResolvedValueOnce({ success: true, data: undefined })
        .mockResolvedValueOnce({ success: false, error: { code: 'DB_ERROR', message: 'Failed' } });

      const command = deleteManyCommand();
      await command.parseAsync(['node', 'test', 'recipe']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deleted 1 recipe'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to delete 1 recipe'));
    });
  });

  describe('error handling', () => {
    it('should handle findAll failure', async () => {
      mockService.findAll.mockResolvedValue({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Database connection failed',
        },
      });

      const command = deleteManyCommand();
      await expect(command.parseAsync(['node', 'test', 'recipe'])).rejects.toThrow('PROCESS_EXIT_1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to search recipes'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Database connection failed'));
    });

    it('should handle missing data from findAll', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const command = deleteManyCommand();
      await expect(command.parseAsync(['node', 'test', 'recipe'])).rejects.toThrow('PROCESS_EXIT_1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to search recipes'));
    });
  });

  describe('command configuration', () => {
    it('should have correct command name', () => {
      const command = deleteManyCommand();
      expect(command.name()).toBe('delete-many');
    });

    it('should have correct description', () => {
      const command = deleteManyCommand();
      expect(command.description()).toBe('Delete multiple recipes by pattern');
    });
  });
});
