import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the client module before importing seed
const mockExecute = vi.fn();
const mockCreateDb = vi.fn(() => ({
  execute: mockExecute,
}));

vi.mock('../client', () => ({
  createDb: mockCreateDb,
}));

// Mock console methods
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock process.exit
const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

// Store original env
const originalEnv = process.env;

describe('runSeed', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    // Reset environment variables
    process.env = { ...originalEnv };
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
  });

  it('should use DATABASE_URL environment variable when available', async () => {
    // Arrange
    process.env.DATABASE_URL = 'postgresql://custom:pass@localhost:5432/custom_db';
    mockExecute.mockResolvedValue(undefined);

    // Act - re-import to get fresh module with new env
    vi.resetModules();
    await import('../seed');

    // Wait for async operations
    await vi.waitFor(() => {
      expect(mockCreateDb).toHaveBeenCalledWith('postgresql://custom:pass@localhost:5432/custom_db');
    });
  });

  it('should use default connection string when DATABASE_URL is not set', async () => {
    // Arrange
    delete process.env.DATABASE_URL;
    mockExecute.mockResolvedValue(undefined);

    // Act
    vi.resetModules();
    await import('../seed');

    // Assert
    await vi.waitFor(() => {
      expect(mockCreateDb).toHaveBeenCalledWith('postgresql://postgres:postgres@localhost:5432/recipe_app');
    });
  });

  it('should execute all SQL statements in correct order', async () => {
    // Arrange
    mockExecute.mockResolvedValue(undefined);

    // Act
    vi.resetModules();
    await import('../seed');

    // Assert - there are 7 execute calls total
    await vi.waitFor(() => {
      expect(mockExecute).toHaveBeenCalledTimes(7);
    });

    // Verify categories insert (1)
    expect(mockExecute).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO categories")
    );
    expect(mockExecute).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("breakfast")
    );

    // Verify cuisines insert (2)
    expect(mockExecute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO cuisines")
    );
    expect(mockExecute).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("chinese")
    );

    // Verify category translations insert (3)
    expect(mockExecute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("INSERT INTO category_translations")
    );
    expect(mockExecute).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("zh-CN")
    );

    // Verify cuisine translations insert (4)
    expect(mockExecute).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("INSERT INTO cuisine_translations")
    );
    expect(mockExecute).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("Chinese")
    );

    // Verify trigger function creation (5)
    expect(mockExecute).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining("CREATE OR REPLACE FUNCTION update_updated_at_column()")
    );

    // Verify trigger creation (6) - DROP and CREATE in one call
    expect(mockExecute).toHaveBeenNthCalledWith(
      6,
      expect.stringContaining("DROP TRIGGER IF EXISTS update_recipes_updated_at")
    );
    expect(mockExecute).toHaveBeenNthCalledWith(
      6,
      expect.stringContaining("CREATE TRIGGER update_recipes_updated_at")
    );

    // Verify increment_views function creation (7)
    expect(mockExecute).toHaveBeenNthCalledWith(
      7,
      expect.stringContaining("CREATE OR REPLACE FUNCTION increment_views")
    );
  });

  it('should log seeding messages', async () => {
    // Arrange
    mockExecute.mockResolvedValue(undefined);

    // Act
    vi.resetModules();
    await import('../seed');

    // Assert
    await vi.waitFor(() => {
      expect(mockConsoleLog).toHaveBeenCalledWith('Seeding database...');
    });

    await vi.waitFor(() => {
      expect(mockConsoleLog).toHaveBeenCalledWith('Seed completed successfully.');
    });
  });

  it('should exit with code 0 on successful completion', async () => {
    // Arrange
    mockExecute.mockResolvedValue(undefined);

    // Act
    vi.resetModules();
    await import('../seed');

    // Assert
    await vi.waitFor(() => {
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });
  });

  it('should handle errors and exit with code 1', async () => {
    // Arrange
    const error = new Error('Database connection failed');
    mockExecute.mockRejectedValue(error);

    // Act
    vi.resetModules();
    await import('../seed');

    // Assert
    await vi.waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Seed failed:', error);
    });

    await vi.waitFor(() => {
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  it('should log error message when seed fails', async () => {
    // Arrange
    const error = new Error('SQL syntax error');
    mockExecute.mockRejectedValue(error);

    // Act
    vi.resetModules();
    await import('../seed');

    // Assert
    await vi.waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Seed failed:', error);
    });
  });

  it('should include all default categories in SQL', async () => {
    // Arrange
    mockExecute.mockResolvedValue(undefined);

    // Act
    vi.resetModules();
    await import('../seed');

    // Assert
    await vi.waitFor(() => {
      const categoriesCall = mockExecute.mock.calls[0][0] as string;
      expect(categoriesCall).toContain('breakfast');
      expect(categoriesCall).toContain('lunch');
      expect(categoriesCall).toContain('dinner');
      expect(categoriesCall).toContain('dessert');
      expect(categoriesCall).toContain('snack');
      expect(categoriesCall).toContain('beverage');
      expect(categoriesCall).toContain('other');
    });
  });

  it('should include all default cuisines in SQL', async () => {
    // Arrange
    mockExecute.mockResolvedValue(undefined);

    // Act
    vi.resetModules();
    await import('../seed');

    // Assert
    await vi.waitFor(() => {
      const cuisinesCall = mockExecute.mock.calls[1][0] as string;
      expect(cuisinesCall).toContain('chinese');
      expect(cuisinesCall).toContain('italian');
      expect(cuisinesCall).toContain('mexican');
      expect(cuisinesCall).toContain('indian');
      expect(cuisinesCall).toContain('japanese');
      expect(cuisinesCall).toContain('thai');
      expect(cuisinesCall).toContain('french');
      expect(cuisinesCall).toContain('american');
      expect(cuisinesCall).toContain('mediterranean');
      expect(cuisinesCall).toContain('korean');
    });
  });

  it('should use ON CONFLICT DO NOTHING for idempotent inserts', async () => {
    // Arrange
    mockExecute.mockResolvedValue(undefined);

    // Act
    vi.resetModules();
    await import('../seed');

    // Assert
    await vi.waitFor(() => {
      expect(mockExecute).toHaveBeenCalledTimes(7);
    });

    // Check categories
    expect(mockExecute.mock.calls[0][0]).toContain('ON CONFLICT (name) DO NOTHING');
    // Check cuisines
    expect(mockExecute.mock.calls[1][0]).toContain('ON CONFLICT (name) DO NOTHING');
    // Check category translations
    expect(mockExecute.mock.calls[2][0]).toContain('ON CONFLICT (category_id, locale) DO NOTHING');
    // Check cuisine translations
    expect(mockExecute.mock.calls[3][0]).toContain('ON CONFLICT (cuisine_id, locale) DO NOTHING');
  });

  it('should create update_updated_at_column trigger function', async () => {
    // Arrange
    mockExecute.mockResolvedValue(undefined);

    // Act
    vi.resetModules();
    await import('../seed');

    // Assert
    await vi.waitFor(() => {
      const triggerFuncCall = mockExecute.mock.calls[4][0] as string;
      expect(triggerFuncCall).toContain('CREATE OR REPLACE FUNCTION update_updated_at_column()');
      expect(triggerFuncCall).toContain('RETURNS TRIGGER');
      expect(triggerFuncCall).toContain('NEW.updated_at = NOW()');
      expect(triggerFuncCall).toContain('LANGUAGE plpgsql');
    });
  });

  it('should create trigger on recipes table', async () => {
    // Arrange
    mockExecute.mockResolvedValue(undefined);

    // Act
    vi.resetModules();
    await import('../seed');

    // Assert
    await vi.waitFor(() => {
      const triggerCall = mockExecute.mock.calls[5][0] as string;
      expect(triggerCall).toContain('DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes');
      expect(triggerCall).toContain('CREATE TRIGGER update_recipes_updated_at');
      expect(triggerCall).toContain('BEFORE UPDATE ON recipes');
      expect(triggerCall).toContain('EXECUTE FUNCTION update_updated_at_column()');
    });
  });

  it('should create increment_views RPC function', async () => {
    // Arrange
    mockExecute.mockResolvedValue(undefined);

    // Act
    vi.resetModules();
    await import('../seed');

    // Assert
    await vi.waitFor(() => {
      const incrementViewsCall = mockExecute.mock.calls[6][0] as string;
      expect(incrementViewsCall).toContain('CREATE OR REPLACE FUNCTION increment_views(recipe_id UUID)');
      expect(incrementViewsCall).toContain('RETURNS void');
      expect(incrementViewsCall).toContain('UPDATE recipes SET views = COALESCE(views, 0) + 1');
      expect(incrementViewsCall).toContain('LANGUAGE plpgsql');
    });
  });
});
