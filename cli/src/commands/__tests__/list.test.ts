import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RecipeService } from '@recipe-app/recipe-service';
import { listCommand, listAction, ListOptions } from '../list';
import { Config } from '../../config';

vi.mock('@recipe-app/recipe-service', () => ({
  RecipeService: vi.fn(),
}));

describe('CLI - listCommand', () => {
  let config: Config;
  let mockService: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    config = {
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-anon-key',
      supabaseServiceKey: 'test-service-key',
    };

    mockService = {
      findAll: vi.fn(),
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

  describe('successful listing', () => {
    it('should list recipes with default pagination', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              title: 'Recipe 1',
              category: 'Lunch',
              difficulty: 'easy',
              prepTimeMinutes: 10,
              cookTimeMinutes: 20,
            },
          ],
          total: 1,
          page: 1,
          limit: 20,
        },
      });

      const options: ListOptions = {};
      await listAction(config, options);

      expect(mockService.findAll).toHaveBeenCalledWith({}, { page: 1, limit: 20 });
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should list recipes with custom pagination', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [],
          total: 0,
          page: 2,
          limit: 10,
        },
      });

      const options: ListOptions = { page: '2', limit: '10' };
      await listAction(config, options);

      expect(mockService.findAll).toHaveBeenCalledWith({}, { page: 2, limit: 10 });
    });

    it('should apply category filter', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [],
          total: 0,
          page: 1,
          limit: 20,
        },
      });

      const options: ListOptions = { category: 'Dinner' };
      await listAction(config, options);

      expect(mockService.findAll).toHaveBeenCalledWith(
        { category: 'Dinner' },
        { page: 1, limit: 20 }
      );
    });

    it('should apply cuisine filter', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [],
          total: 0,
          page: 1,
          limit: 20,
        },
      });

      const options: ListOptions = { cuisine: 'Italian' };
      await listAction(config, options);

      expect(mockService.findAll).toHaveBeenCalledWith(
        { cuisine: 'Italian' },
        { page: 1, limit: 20 }
      );
    });

    it('should apply difficulty filter', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [],
          total: 0,
          page: 1,
          limit: 20,
        },
      });

      const options: ListOptions = { difficulty: 'easy' };
      await listAction(config, options);

      expect(mockService.findAll).toHaveBeenCalledWith(
        { difficulty: 'easy' },
        { page: 1, limit: 20 }
      );
    });

    it('should apply tag filter', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [],
          total: 0,
          page: 1,
          limit: 20,
        },
      });

      const options: ListOptions = { tag: 'vegetarian' };
      await listAction(config, options);

      expect(mockService.findAll).toHaveBeenCalledWith(
        { tags: ['vegetarian'] },
        { page: 1, limit: 20 }
      );
    });

    it('should apply ingredient filter', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [],
          total: 0,
          page: 1,
          limit: 20,
        },
      });

      const options: ListOptions = { ingredient: 'tomato' };
      await listAction(config, options);

      expect(mockService.findAll).toHaveBeenCalledWith(
        { ingredient: 'tomato' },
        { page: 1, limit: 20 }
      );
    });

    it('should apply multiple filters', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [],
          total: 0,
          page: 1,
          limit: 20,
        },
      });

      const options: ListOptions = {
        category: 'Dinner',
        cuisine: 'Italian',
        difficulty: 'medium',
      };
      await listAction(config, options);

      expect(mockService.findAll).toHaveBeenCalledWith(
        {
          category: 'Dinner',
          cuisine: 'Italian',
          difficulty: 'medium',
        },
        { page: 1, limit: 20 }
      );
    });

    it('should handle empty results', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [],
          total: 0,
          page: 1,
          limit: 20,
        },
      });

      const options: ListOptions = {};
      await listAction(config, options);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No recipes found'));
    });

    it('should display pagination info for multiple pages', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [
            {
              id: '123',
              title: 'Recipe',
              category: 'Lunch',
              difficulty: 'easy',
              prepTimeMinutes: 10,
              cookTimeMinutes: 20,
            },
          ],
          total: 50,
          page: 2,
          limit: 20,
        },
      });

      const options: ListOptions = {};
      await listAction(config, options);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Page 2 of 3'));
    });
  });

  describe('error handling', () => {
    it('should handle service errors', async () => {
      mockService.findAll.mockResolvedValue({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Database error',
        },
      });

      const options: ListOptions = {};
      await listAction(config, options);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle missing data', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const options: ListOptions = {};
      await listAction(config, options);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('command configuration', () => {
    it('should have correct command name', () => {
      const command = listCommand(config);
      expect(command.name()).toBe('list');
    });

    it('should have correct description', () => {
      const command = listCommand(config);
      expect(command.description()).toContain('List all recipes');
    });

    it('should have category option', () => {
      const command = listCommand(config);
      const options = command.options;
      const categoryOption = options.find((opt: any) => opt.long === '--category');
      expect(categoryOption).toBeDefined();
    });

    it('should have cuisine option', () => {
      const command = listCommand(config);
      const options = command.options;
      const cuisineOption = options.find((opt: any) => opt.long === '--cuisine');
      expect(cuisineOption).toBeDefined();
    });

    it('should have difficulty option', () => {
      const command = listCommand(config);
      const options = command.options;
      const difficultyOption = options.find((opt: any) => opt.long === '--difficulty');
      expect(difficultyOption).toBeDefined();
    });

    it('should have page option with default', () => {
      const command = listCommand(config);
      const options = command.options;
      const pageOption = options.find((opt: any) => opt.long === '--page');
      expect(pageOption).toBeDefined();
      expect(pageOption!.defaultValue).toBe('1');
    });

    it('should have limit option with default', () => {
      const command = listCommand(config);
      const options = command.options;
      const limitOption = options.find((opt: any) => opt.long === '--limit');
      expect(limitOption).toBeDefined();
      expect(limitOption!.defaultValue).toBe('20');
    });
  });
});
