import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SearchService } from '@recipe-app/search-service';
import { searchCommand } from '../search';
import { Database } from '@recipe-app/database';

vi.mock('@recipe-app/search-service', () => ({
  SearchService: vi.fn(),
}));

vi.mock('chalk', () => ({
  default: {
    gray: vi.fn((text: string) => text),
    red: vi.fn((text: string) => text),
    yellow: vi.fn((text: string) => text),
    bold: vi.fn((text: string) => text),
    dim: vi.fn((text: string) => text),
  },
}));

vi.mock('table', () => ({
  table: vi.fn(() => 'mocked table output'),
}));

describe('CLI - searchCommand', () => {
  let mockDb: Database;
  let mockService: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    mockDb = {} as Database;

    mockService = {
      search: vi.fn(),
    };

    vi.mocked(SearchService).mockImplementation(function () {
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

  const mockRecipeResults = [
    {
      type: 'recipe' as const,
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Tomato Soup',
      snippet: 'A delicious tomato soup recipe',
    },
    {
      type: 'recipe' as const,
      id: '223e4567-e89b-12d3-a456-426614174001',
      title: 'Tomato Pasta',
      snippet: 'Classic Italian pasta with tomato sauce',
    },
  ];

  const mockIngredientResults = [
    {
      type: 'ingredient' as const,
      id: '323e4567-e89b-12d3-a456-426614174002',
      title: 'Tomato',
      snippet: 'Found in "Tomato Soup"',
    },
  ];

  describe('successful search', () => {
    it('should search and display recipe results', async () => {
      mockService.search.mockResolvedValue({
        success: true,
        data: mockRecipeResults,
      });

      const command = searchCommand(mockDb);
      await command.parseAsync(['node', 'test', 'tomato']);

      expect(mockService.search).toHaveBeenCalledWith(
        'tomato',
        expect.objectContaining({
          scope: 'all',
          limit: 20,
        })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 2 results'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tomato Soup'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tomato Pasta'));
    });

    it('should display single result with correct grammar', async () => {
      mockService.search.mockResolvedValue({
        success: true,
        data: [mockRecipeResults[0]],
      });

      const command = searchCommand(mockDb);
      await command.parseAsync(['node', 'test', 'soup']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 result'));
    });

    it('should display result with snippet', async () => {
      mockService.search.mockResolvedValue({
        success: true,
        data: [mockRecipeResults[0]],
      });

      const command = searchCommand(mockDb);
      await command.parseAsync(['node', 'test', 'soup']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('A delicious tomato soup recipe'));
    });

    it('should display result ID', async () => {
      mockService.search.mockResolvedValue({
        success: true,
        data: [mockRecipeResults[0]],
      });

      const command = searchCommand(mockDb);
      await command.parseAsync(['node', 'test', 'soup']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('123e4567-e89b-12d3-a456-426614174000'));
    });
  });

  describe('search with no results', () => {
    it('should display no results message when search returns empty array', async () => {
      mockService.search.mockResolvedValue({
        success: true,
        data: [],
      });

      const command = searchCommand(mockDb);
      await command.parseAsync(['node', 'test', 'nonexistent']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No results found'));
    });
  });

  describe('different scope options', () => {
    it('should search with recipes scope', async () => {
      mockService.search.mockResolvedValue({
        success: true,
        data: mockRecipeResults,
      });

      const command = searchCommand(mockDb);
      await command.parseAsync(['node', 'test', 'tomato', '--scope', 'recipes']);

      expect(mockService.search).toHaveBeenCalledWith(
        'tomato',
        expect.objectContaining({
          scope: 'recipes',
          limit: 20,
        })
      );
    });

    it('should search with ingredients scope', async () => {
      mockService.search.mockResolvedValue({
        success: true,
        data: mockIngredientResults,
      });

      const command = searchCommand(mockDb);
      await command.parseAsync(['node', 'test', 'tomato', '--scope', 'ingredients']);

      expect(mockService.search).toHaveBeenCalledWith(
        'tomato',
        expect.objectContaining({
          scope: 'ingredients',
          limit: 20,
        })
      );
    });

    it('should search with all scope (default)', async () => {
      mockService.search.mockResolvedValue({
        success: true,
        data: [...mockRecipeResults, ...mockIngredientResults],
      });

      const command = searchCommand(mockDb);
      await command.parseAsync(['node', 'test', 'tomato']);

      expect(mockService.search).toHaveBeenCalledWith(
        'tomato',
        expect.objectContaining({
          scope: 'all',
          limit: 20,
        })
      );
    });

    it('should handle ingredient type results', async () => {
      mockService.search.mockResolvedValue({
        success: true,
        data: mockIngredientResults,
      });

      const command = searchCommand(mockDb);
      await command.parseAsync(['node', 'test', 'tomato', '--scope', 'ingredients']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Tomato'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found in'));
    });
  });

  describe('limit option', () => {
    it('should use custom limit', async () => {
      mockService.search.mockResolvedValue({
        success: true,
        data: mockRecipeResults,
      });

      const command = searchCommand(mockDb);
      await command.parseAsync(['node', 'test', 'tomato', '--limit', '10']);

      expect(mockService.search).toHaveBeenCalledWith(
        'tomato',
        expect.objectContaining({
          limit: 10,
        })
      );
    });

    it('should parse limit as integer', async () => {
      mockService.search.mockResolvedValue({
        success: true,
        data: mockRecipeResults,
      });

      const command = searchCommand(mockDb);
      await command.parseAsync(['node', 'test', 'tomato', '--limit', '5']);

      expect(mockService.search).toHaveBeenCalledWith(
        'tomato',
        expect.objectContaining({
          limit: 5,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle search failure', async () => {
      mockService.search.mockResolvedValue({
        success: false,
        error: {
          code: 'DB_ERROR',
          message: 'Database connection failed',
        },
      });

      const command = searchCommand(mockDb);
      await command.parseAsync(['node', 'test', 'tomato']);

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Search failed'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Database connection failed'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should display unknown error when message is not provided', async () => {
      mockService.search.mockResolvedValue({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
        },
      });

      const command = searchCommand(mockDb);
      await command.parseAsync(['node', 'test', 'tomato']);

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('command configuration', () => {
    it('should have correct command name', () => {
      const command = searchCommand(mockDb);
      expect(command.name()).toBe('search');
    });

    it('should have correct description', () => {
      const command = searchCommand(mockDb);
      expect(command.description()).toContain('Search recipes and ingredients');
    });

    it('should require query argument', () => {
      const command = searchCommand(mockDb);
      const args = command.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].name()).toBe('query');
      expect(args[0].required).toBe(true);
    });

    it('should have scope option with default value', () => {
      const command = searchCommand(mockDb);
      const options = command.options;
      const scopeOption = options.find((opt: any) => opt.long === '--scope');
      expect(scopeOption).toBeDefined();
      expect(scopeOption.defaultValue).toBe('all');
    });

    it('should have limit option with default value', () => {
      const command = searchCommand(mockDb);
      const options = command.options;
      const limitOption = options.find((opt: any) => opt.long === '--limit');
      expect(limitOption).toBeDefined();
      expect(limitOption.defaultValue).toBe('20');
    });
  });
});
