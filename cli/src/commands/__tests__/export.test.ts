import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RecipeService } from '@recipe-app/recipe-service';
import { exportCommand } from '../export';
import * as fs from 'fs';

// Set DATABASE_URL to bypass config file loading
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

vi.mock('@recipe-app/recipe-service', () => ({
  RecipeService: vi.fn(),
}));

vi.mock('../index', () => ({
  getDb: vi.fn(() => ({})),
  getConfig: vi.fn(() => ({ databaseUrl: 'postgresql://test:test@localhost:5432/test', uploadDir: './uploads' })),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn(function () {
      return this;
    }),
    stop: vi.fn(),
  })),
}));

vi.mock('chalk', () => ({
  default: {
    gray: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    red: vi.fn((text: string) => text),
  },
}));

vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => false),
}));

describe('CLI - exportCommand', () => {
  let mockService: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    mockService = {
      findAll: vi.fn(),
    };

    vi.mocked(RecipeService).mockImplementation(function () {
      return mockService;
    });

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock process.exit to throw an error so we can catch it in tests
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`PROCESS_EXIT_${code}`);
    }) as any;

    // Reset fs mock to default behavior
    vi.mocked(fs.writeFileSync).mockReset();
    vi.mocked(fs.writeFileSync).mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    vi.clearAllMocks();
  });

  const mockRecipes = [
    {
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
      ],
      steps: [
        { stepNumber: 1, instruction: 'Chop vegetables', durationMinutes: 5 },
      ],
      tags: ['vegetarian'],
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      title: 'Pasta Carbonara',
      description: 'Classic Italian pasta',
      category: 'Dinner',
      cuisine: 'Italian',
      servings: 2,
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      difficulty: 'medium',
      ingredients: [
        { name: 'Pasta', amount: 200, unit: 'g' },
        { name: 'Eggs', amount: 2, unit: 'pieces' },
      ],
      steps: [
        { stepNumber: 1, instruction: 'Boil pasta', durationMinutes: 10 },
        { stepNumber: 2, instruction: 'Mix with eggs', durationMinutes: 5 },
      ],
      tags: ['italian', 'quick'],
    },
  ];

  describe('successful export', () => {
    it('should export all recipes to default file', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 2,
        },
      });

      const command = exportCommand();
      await command.parseAsync(['node', 'test']);

      expect(mockService.findAll).toHaveBeenCalledWith({}, { page: 1, limit: 1000 });
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'recipes-export.json',
        JSON.stringify(mockRecipes, null, 2)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Exported 2 recipes'));
    });

    it('should export to custom file path', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 2,
        },
      });

      const command = exportCommand();
      // Commander requires option values to be passed as separate array elements
      await command.parseAsync(['node', 'test', '--output', 'my-recipes.json']);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'my-recipes.json',
        JSON.stringify(mockRecipes, null, 2)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('my-recipes.json'));
    });

    it('should handle single recipe export', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [mockRecipes[0]],
          total: 1,
        },
      });

      const command = exportCommand();
      await command.parseAsync(['node', 'test']);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'recipes-export.json',
        JSON.stringify([mockRecipes[0]], null, 2)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Exported 1 recipe'));
    });
  });

  describe('empty recipes export', () => {
    it('should handle empty recipes list', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: [],
          total: 0,
        },
      });

      const command = exportCommand();
      await command.parseAsync(['node', 'test']);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'recipes-export.json',
        JSON.stringify([], null, 2)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 0 recipes'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Exported 0 recipes'));
    });
  });

  describe('error handling', () => {
    it('should handle export failure from service', async () => {
      mockService.findAll.mockResolvedValue({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Database connection failed',
        },
      });

      const command = exportCommand();
      await expect(command.parseAsync(['node', 'test'])).rejects.toThrow('PROCESS_EXIT_1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Export failed'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Database connection failed'));
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle missing data in response', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const command = exportCommand();
      await expect(command.parseAsync(['node', 'test'])).rejects.toThrow('PROCESS_EXIT_1');

      // The code checks !result.data before destructuring, so it should exit
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Export failed'));
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle file write error', async () => {
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 2,
        },
      });

      const command = exportCommand();
      await expect(command.parseAsync(['node', 'test'])).rejects.toThrow('PROCESS_EXIT_1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to write file'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Permission denied'));
    });

    it('should handle unknown error message', async () => {
      mockService.findAll.mockResolvedValue({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          // No message provided
        },
      });

      const command = exportCommand();
      await expect(command.parseAsync(['node', 'test'])).rejects.toThrow('PROCESS_EXIT_1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Export failed'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('command configuration', () => {
    it('should have correct command name', () => {
      const command = exportCommand();
      expect(command.name()).toBe('export');
    });

    it('should have correct description', () => {
      const command = exportCommand();
      expect(command.description()).toBe('Export all recipes to JSON file');
    });

    it('should have output option with default value', () => {
      const command = exportCommand();
      const options = command.options;

      const outputOption = options.find((opt: any) => opt.long === '--output');
      expect(outputOption).toBeDefined();
      expect(outputOption?.defaultValue).toBe('recipes-export.json');
    });

    it('should allow custom output file path', async () => {
      mockService.findAll.mockResolvedValue({
        success: true,
        data: {
          recipes: mockRecipes,
          total: 2,
        },
      });

      const command = exportCommand();
      await command.parseAsync(['node', 'test', '--output', '/path/to/custom-export.json']);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/path/to/custom-export.json',
        expect.any(String)
      );
    });
  });
});
