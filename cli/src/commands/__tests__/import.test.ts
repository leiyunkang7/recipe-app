import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RecipeService } from '@recipe-app/recipe-service';

// Set DATABASE_URL to bypass config file loading
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock dependencies
vi.mock('@recipe-app/recipe-service', () => ({
  RecipeService: vi.fn(),
}));

vi.mock('../index', () => ({
  getDb: vi.fn(() => ({})),
  getConfig: vi.fn(() => ({ databaseUrl: 'postgresql://test:test@localhost:5432/test', uploadDir: './uploads' })),
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
    gray: vi.fn((text: string) => text),
    red: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    bold: vi.fn((text: string) => text),
    dim: vi.fn((text: string) => text),
  },
}));

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(() => false),
}));

// Import mocked modules after vi.mock calls
import ora from 'ora';
import { readFileSync } from 'fs';
import { importCommand, importAction } from '../import';

describe('CLI - importCommand', () => {
  let mockService: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let readFileSyncMock: any;

  const mockRecipes = [
    {
      title: 'Recipe 1',
      category: 'Lunch',
      servings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      difficulty: 'easy',
      ingredients: [{ name: 'Ingredient 1', amount: 1, unit: 'piece' }],
      steps: [{ stepNumber: 1, instruction: 'Step 1' }],
    },
    {
      title: 'Recipe 2',
      category: 'Dinner',
      servings: 2,
      prepTimeMinutes: 15,
      cookTimeMinutes: 30,
      difficulty: 'medium',
      ingredients: [{ name: 'Ingredient 2', amount: 2, unit: 'pieces' }],
      steps: [{ stepNumber: 1, instruction: 'Step 1' }],
    },
  ];

  beforeEach(() => {
    mockService = {
      batchImport: vi.fn(),
    };

    vi.mocked(RecipeService).mockImplementation(function () {
      return mockService;
    });

    readFileSyncMock = vi.fn();

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('successful import', () => {
    it('should import all recipes successfully', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockResolvedValue({
        success: true,
        data: {
          total: 2,
          succeeded: 2,
          failed: 0,
          errors: [],
        },
      });

      await importAction('recipes.json', readFileSyncMock);

      expect(mockService.batchImport).toHaveBeenCalledWith(mockRecipes);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Import Summary'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Succeeded: 2/2'));
    });

    it('should display correct message for single recipe', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify([mockRecipes[0]]));

      mockService.batchImport.mockResolvedValue({
        success: true,
        data: {
          total: 1,
          succeeded: 1,
          failed: 0,
          errors: [],
        },
      });

      await importAction('recipe.json', readFileSyncMock);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 recipe'));
    });

    it('should display correct message for multiple recipes', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockResolvedValue({
        success: true,
        data: {
          total: 2,
          succeeded: 2,
          failed: 0,
          errors: [],
        },
      });

      await importAction('recipes.json', readFileSyncMock);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 2 recipes'));
    });
  });

  describe('partial import failure', () => {
    it('should handle partial import failure', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockResolvedValue({
        success: true,
        data: {
          total: 2,
          succeeded: 1,
          failed: 1,
          errors: [
            {
              index: 1,
              title: 'Recipe 2',
              error: 'Validation failed: missing required field',
            },
          ],
        },
      });

      await importAction('recipes.json', readFileSyncMock);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Succeeded: 1/2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Failed: 1/2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Failed recipes'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[1] Recipe 2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Validation failed'));
    });

    it('should display multiple failed recipes', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockResolvedValue({
        success: true,
        data: {
          total: 2,
          succeeded: 0,
          failed: 2,
          errors: [
            {
              index: 0,
              title: 'Recipe 1',
              error: 'Invalid category',
            },
            {
              index: 1,
              title: 'Recipe 2',
              error: 'Invalid servings',
            },
          ],
        },
      });

      await importAction('recipes.json', readFileSyncMock);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Failed: 2/2'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[0] Recipe 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[1] Recipe 2'));
    });
  });

  describe('JSON parsing errors', () => {
    it('should handle JSON parse error', async () => {
      readFileSyncMock.mockReturnValue('invalid json');

      await expect(importAction('recipes.json', readFileSyncMock)).rejects.toThrow('EXIT_ERROR');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to read JSON file'));
    });

    it('should handle empty file', async () => {
      readFileSyncMock.mockReturnValue('');

      await expect(importAction('recipes.json', readFileSyncMock)).rejects.toThrow('EXIT_ERROR');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to read JSON file'));
    });
  });

  describe('JSON format validation', () => {
    it('should handle non-array JSON', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify({ title: 'Not an array' }));

      await expect(importAction('recipes.json', readFileSyncMock)).rejects.toThrow('EXIT_ERROR');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to read JSON file'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('JSON must be an array of recipes'));
    });

    it('should handle empty array', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify([]));

      mockService.batchImport.mockResolvedValue({
        success: true,
        data: {
          total: 0,
          succeeded: 0,
          failed: 0,
          errors: [],
        },
      });

      await importAction('recipes.json', readFileSyncMock);

      expect(mockService.batchImport).toHaveBeenCalledWith([]);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 0 recipes'));
    });

    it('should handle primitive values', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify('string value'));

      await expect(importAction('recipes.json', readFileSyncMock)).rejects.toThrow('EXIT_ERROR');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to read JSON file'));
    });

    it('should handle number value', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify(123));

      await expect(importAction('recipes.json', readFileSyncMock)).rejects.toThrow('EXIT_ERROR');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to read JSON file'));
    });
  });

  describe('file reading errors', () => {
    it('should handle file not found error', async () => {
      readFileSyncMock.mockImplementation(() => {
        const error = new Error('ENOENT: no such file or directory');
        (error as any).code = 'ENOENT';
        throw error;
      });

      await expect(importAction('nonexistent.json', readFileSyncMock)).rejects.toThrow('EXIT_ERROR');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to read JSON file'));
    });

    it('should handle permission denied error', async () => {
      readFileSyncMock.mockImplementation(() => {
        const error = new Error('EACCES: permission denied');
        (error as any).code = 'EACCES';
        throw error;
      });

      await expect(importAction('restricted.json', readFileSyncMock)).rejects.toThrow('EXIT_ERROR');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to read JSON file'));
    });

    it('should handle generic file read error', async () => {
      readFileSyncMock.mockImplementation(() => {
        throw new Error('Unknown file error');
      });

      await expect(importAction('error.json', readFileSyncMock)).rejects.toThrow('EXIT_ERROR');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to read JSON file'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown file error'));
    });
  });

  describe('import service errors', () => {
    it('should handle import service failure', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockResolvedValue({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Database connection failed',
        },
      });

      await expect(importAction('recipes.json', readFileSyncMock)).rejects.toThrow('EXIT_ERROR');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Import failed'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Database connection failed'));
    });

    it('should handle import service error without message', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockResolvedValue({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
        },
      });

      await expect(importAction('recipes.json', readFileSyncMock)).rejects.toThrow('EXIT_ERROR');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Import failed'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
    });

    it('should handle import service throwing exception', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockRejectedValue(new Error('Unexpected error'));

      await expect(importAction('recipes.json', readFileSyncMock)).rejects.toThrow('Unexpected error');
    });

    it('should handle missing data in successful response', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockResolvedValue({
        success: true,
        data: undefined,
      });

      await expect(importAction('recipes.json', readFileSyncMock)).rejects.toThrow('EXIT_ERROR');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Import failed'));
    });
  });

  describe('import summary display', () => {
    it('should display import summary with all details', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockResolvedValue({
        success: true,
        data: {
          total: 2,
          succeeded: 2,
          failed: 0,
          errors: [],
        },
      });

      await importAction('recipes.json', readFileSyncMock);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Import Summary'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Succeeded: 2/2'));
    });

    it('should not show failed section when all succeed', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockResolvedValue({
        success: true,
        data: {
          total: 2,
          succeeded: 2,
          failed: 0,
          errors: [],
        },
      });

      await importAction('recipes.json', readFileSyncMock);

      const failedCalls = consoleLogSpy.mock.calls.filter((call: any[]) =>
        call[0] && typeof call[0] === 'string' && call[0].includes('Failed:')
      );
      expect(failedCalls).toHaveLength(0);
    });
  });

  describe('command configuration', () => {
    it('should have correct command name', () => {
      const command = importCommand();
      expect(command.name()).toBe('import');
    });

    it('should have correct description', () => {
      const command = importCommand();
      expect(command.description()).toContain('Import recipes from JSON file');
    });

    it('should require file argument', () => {
      const command = importCommand();
      const args = command.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].name()).toBe('file');
      expect(args[0].required).toBe(true);
    });
  });

  describe('command action callback', () => {
    it('should execute importAction when command action is called', async () => {
      vi.mocked(readFileSync).mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockResolvedValue({
        success: true,
        data: {
          total: 2,
          succeeded: 2,
          failed: 0,
          errors: [],
        },
      });

      // Use Commander's parseAsync to actually invoke the .action() callback
      const command = importCommand();
      await command.parseAsync(['node', 'import', 'recipes.json']);

      expect(mockService.batchImport).toHaveBeenCalledWith(mockRecipes);
    });
  });

  describe('spinner behavior', () => {
    it('should start spinner during import', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockResolvedValue({
        success: true,
        data: {
          total: 2,
          succeeded: 2,
          failed: 0,
          errors: [],
        },
      });

      await importAction('recipes.json', readFileSyncMock);

      expect(ora).toHaveBeenCalledWith('Importing recipes...');
    });

    it('should stop spinner after import completes', async () => {
      const spinnerMock = {
        start: vi.fn().mockReturnThis(),
        stop: vi.fn().mockReturnThis(),
        succeed: vi.fn().mockReturnThis(),
        fail: vi.fn().mockReturnThis(),
      };
      vi.mocked(ora).mockReturnValue(spinnerMock as any);

      readFileSyncMock.mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockResolvedValue({
        success: true,
        data: {
          total: 2,
          succeeded: 2,
          failed: 0,
          errors: [],
        },
      });

      await importAction('recipes.json', readFileSyncMock);

      expect(spinnerMock.stop).toHaveBeenCalled();
    });
  });

  describe('console output', () => {
    it('should display reading message with filename', async () => {
      readFileSyncMock.mockReturnValue(JSON.stringify(mockRecipes));

      mockService.batchImport.mockResolvedValue({
        success: true,
        data: {
          total: 2,
          succeeded: 2,
          failed: 0,
          errors: [],
        },
      });

      await importAction('my-recipes.json', readFileSyncMock);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Reading my-recipes.json'));
    });
  });
});
