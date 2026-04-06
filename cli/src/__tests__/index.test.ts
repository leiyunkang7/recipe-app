import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock command instance
const createMockCommand = () => ({
  name: vi.fn().mockReturnThis(),
  description: vi.fn().mockReturnThis(),
  version: vi.fn().mockReturnThis(),
  addCommand: vi.fn().mockReturnThis(),
  parse: vi.fn().mockReturnThis(),
});

let mockCommandInstance = createMockCommand();

// Mock all dependencies before importing the module under test
vi.mock('commander', () => ({
  Command: vi.fn(function() {
    return mockCommandInstance;
  }),
}));

vi.mock('../config', () => ({
  loadConfig: vi.fn(),
  printConfigError: vi.fn(() => {
    throw new Error('process.exit(1)');
  }),
}));

vi.mock('@recipe-app/database', () => ({
  createDb: vi.fn(),
}));

vi.mock('../commands/add', () => ({
  addCommand: vi.fn(() => 'add-command-mock'),
}));

vi.mock('../commands/list', () => ({
  listCommand: vi.fn(() => 'list-command-mock'),
}));

vi.mock('../commands/get', () => ({
  getCommand: vi.fn(() => 'get-command-mock'),
}));

vi.mock('../commands/update', () => ({
  updateCommand: vi.fn(() => 'update-command-mock'),
}));

vi.mock('../commands/delete', () => ({
  deleteCommand: vi.fn(() => 'delete-command-mock'),
}));

vi.mock('../commands/search', () => ({
  searchCommand: vi.fn(() => 'search-command-mock'),
}));

vi.mock('../commands/import', () => ({
  importCommand: vi.fn(() => 'import-command-mock'),
}));

vi.mock('../commands/export', () => ({
  exportCommand: vi.fn(() => 'export-command-mock'),
}));

vi.mock('../commands/deleteMany', () => ({
  deleteManyCommand: vi.fn(() => 'deleteMany-command-mock'),
}));

vi.mock('../commands/image', () => ({
  imageUploadCommand: vi.fn(() => 'imageUpload-command-mock'),
}));

// Import mocked modules
import { Command } from 'commander';
import { loadConfig, printConfigError } from '../config';
import { createDb } from '@recipe-app/database';
import { addCommand } from '../commands/add';
import { listCommand } from '../commands/list';
import { getCommand } from '../commands/get';
import { updateCommand } from '../commands/update';
import { deleteCommand } from '../commands/delete';
import { searchCommand } from '../commands/search';
import { importCommand } from '../commands/import';
import { exportCommand } from '../commands/export';
import { deleteManyCommand } from '../commands/deleteMany';
import { imageUploadCommand } from '../commands/image';

describe('CLI Index', () => {
  const mockConfig = {
    databaseUrl: 'postgresql://test:5432/recipe_app',
    uploadDir: '/test/uploads',
  };
  const mockDb = { query: vi.fn() };
  const originalArgv = process.argv;

  beforeEach(() => {
    // Reset modules cache to allow re-importing
    vi.resetModules();
    // Reset mock command instance for each test
    mockCommandInstance = createMockCommand();
    vi.clearAllMocks();
    vi.mocked(loadConfig).mockReturnValue(mockConfig);
    vi.mocked(createDb).mockReturnValue(mockDb as any);
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  describe('program configuration', () => {
    it('should create a new Command instance', async () => {
      await import('../index');

      expect(Command).toHaveBeenCalledTimes(1);
    });

    it('should configure program with correct name', async () => {
      await import('../index');

      expect(mockCommandInstance.name).toHaveBeenCalledWith('recipe');
    });

    it('should configure program with correct description', async () => {
      await import('../index');

      expect(mockCommandInstance.description).toHaveBeenCalledWith('Recipe Management CLI');
    });

    it('should configure program with correct version', async () => {
      await import('../index');

      expect(mockCommandInstance.version).toHaveBeenCalledWith('1.0.0');
    });
  });

  describe('lazy config and database initialization', () => {
    it('should not load config on module import', async () => {
      await import('../index');

      expect(loadConfig).not.toHaveBeenCalled();
    });

    it('should not create database connection on module import', async () => {
      await import('../index');

      expect(createDb).not.toHaveBeenCalled();
    });

    it('should export getDb and getConfig functions', async () => {
      const indexModule = await import('../index');

      expect(typeof indexModule.getDb).toBe('function');
      expect(typeof indexModule.getConfig).toBe('function');
    });
  });

  describe('recipe commands registration', () => {
    it('should add addCommand without database instance', async () => {
      await import('../index');

      expect(addCommand).toHaveBeenCalledTimes(1);
      expect(addCommand).toHaveBeenCalledWith();
    });

    it('should add listCommand without database instance', async () => {
      await import('../index');

      expect(listCommand).toHaveBeenCalledTimes(1);
      expect(listCommand).toHaveBeenCalledWith();
    });

    it('should add getCommand without database instance', async () => {
      await import('../index');

      expect(getCommand).toHaveBeenCalledTimes(1);
      expect(getCommand).toHaveBeenCalledWith();
    });

    it('should add updateCommand without database instance', async () => {
      await import('../index');

      expect(updateCommand).toHaveBeenCalledTimes(1);
      expect(updateCommand).toHaveBeenCalledWith();
    });

    it('should add deleteCommand without database instance', async () => {
      await import('../index');

      expect(deleteCommand).toHaveBeenCalledTimes(1);
      expect(deleteCommand).toHaveBeenCalledWith();
    });

    it('should add searchCommand without database instance', async () => {
      await import('../index');

      expect(searchCommand).toHaveBeenCalledTimes(1);
      expect(searchCommand).toHaveBeenCalledWith();
    });

    it('should add all recipe commands to program in correct order', async () => {
      await import('../index');

      expect(mockCommandInstance.addCommand).toHaveBeenCalledTimes(10);
      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(1, 'add-command-mock');
      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(2, 'list-command-mock');
      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(3, 'get-command-mock');
      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(4, 'update-command-mock');
      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(5, 'delete-command-mock');
      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(6, 'search-command-mock');
    });
  });

  describe('batch operation commands registration', () => {
    it('should add importCommand without database instance', async () => {
      await import('../index');

      expect(importCommand).toHaveBeenCalledTimes(1);
      expect(importCommand).toHaveBeenCalledWith();
    });

    it('should add exportCommand without database instance', async () => {
      await import('../index');

      expect(exportCommand).toHaveBeenCalledTimes(1);
      expect(exportCommand).toHaveBeenCalledWith();
    });

    it('should add deleteManyCommand without database instance', async () => {
      await import('../index');

      expect(deleteManyCommand).toHaveBeenCalledTimes(1);
      expect(deleteManyCommand).toHaveBeenCalledWith();
    });

    it('should add batch commands after recipe commands', async () => {
      await import('../index');

      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(7, 'import-command-mock');
      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(8, 'export-command-mock');
      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(9, 'deleteMany-command-mock');
    });
  });

  describe('image command registration', () => {
    it('should add imageUploadCommand without config', async () => {
      await import('../index');

      expect(imageUploadCommand).toHaveBeenCalledTimes(1);
      expect(imageUploadCommand).toHaveBeenCalledWith();
    });

    it('should add image command as the last command', async () => {
      await import('../index');

      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(10, 'imageUpload-command-mock');
    });
  });

  describe('program execution', () => {
    it('should not call parse in test environment', async () => {
      // VITEST is set in test environment
      await import('../index');

      expect(mockCommandInstance.parse).not.toHaveBeenCalled();
    });

    it('should add all commands before parse would be called', async () => {
      // This test verifies the order logic without actually calling parse
      await import('../index');

      // All commands should be added
      expect(mockCommandInstance.addCommand).toHaveBeenCalledTimes(10);
    });
  });

  describe('chained method calls', () => {
    it('should chain configuration methods correctly', async () => {
      await import('../index');

      // Verify all methods return `this` for chaining
      expect(mockCommandInstance.name).toHaveReturnedWith(mockCommandInstance);
      expect(mockCommandInstance.description).toHaveReturnedWith(mockCommandInstance);
      expect(mockCommandInstance.version).toHaveReturnedWith(mockCommandInstance);
      expect(mockCommandInstance.addCommand).toHaveReturnedWith(mockCommandInstance);
    });

    it('should maintain correct method call order for configuration', async () => {
      await import('../index');

      const nameCallOrder = mockCommandInstance.name.mock.invocationCallOrder[0];
      const descriptionCallOrder = mockCommandInstance.description.mock.invocationCallOrder[0];
      const versionCallOrder = mockCommandInstance.version.mock.invocationCallOrder[0];

      expect(nameCallOrder).toBeLessThan(descriptionCallOrder);
      expect(descriptionCallOrder).toBeLessThan(versionCallOrder);
    });
  });

  describe('process.argv handling', () => {
    it('should not parse in test environment regardless of argv', async () => {
      process.argv = ['node', 'recipe', 'add'];

      await import('../index');

      // Parse should not be called in test environment
      expect(mockCommandInstance.parse).not.toHaveBeenCalled();
    });
  });

  describe('complete integration flow', () => {
    it('should not initialize config or db on module import', async () => {
      await import('../index');

      // Config and DB should not be loaded on import
      expect(loadConfig).not.toHaveBeenCalled();
      expect(createDb).not.toHaveBeenCalled();

      // All commands should be created without dependencies
      expect(addCommand).toHaveBeenCalledWith();
      expect(listCommand).toHaveBeenCalledWith();
      expect(getCommand).toHaveBeenCalledWith();
      expect(updateCommand).toHaveBeenCalledWith();
      expect(deleteCommand).toHaveBeenCalledWith();
      expect(searchCommand).toHaveBeenCalledWith();
      expect(importCommand).toHaveBeenCalledWith();
      expect(exportCommand).toHaveBeenCalledWith();
      expect(deleteManyCommand).toHaveBeenCalledWith();
      expect(imageUploadCommand).toHaveBeenCalledWith();

      // All commands should be added to program
      expect(mockCommandInstance.addCommand).toHaveBeenCalledTimes(10);

      // Parse should not be called in test environment
      expect(mockCommandInstance.parse).not.toHaveBeenCalled();
    });

    it('getDb should load config and create db when called', async () => {
      const indexModule = await import('../index');

      // Reset mocks to clear any calls from import
      vi.clearAllMocks();

      // Call getDb
      const db = indexModule.getDb();

      expect(loadConfig).toHaveBeenCalledTimes(1);
      expect(createDb).toHaveBeenCalledWith(mockConfig.databaseUrl);
      expect(db).toBe(mockDb);
    });

    it('getConfig should load config when called', async () => {
      const indexModule = await import('../index');

      // Reset mocks to clear any calls from import
      vi.clearAllMocks();

      // Call getConfig
      const config = indexModule.getConfig();

      expect(loadConfig).toHaveBeenCalledTimes(1);
      expect(config).toBe(mockConfig);
    });

    it('getDb should cache config and db after first call', async () => {
      const indexModule = await import('../index');

      // Reset module to get fresh state
      vi.resetModules();
      const freshModule = await import('../index');

      // First call
      freshModule.getDb();
      expect(loadConfig).toHaveBeenCalledTimes(1);
      expect(createDb).toHaveBeenCalledTimes(1);

      // Second call should use cached values
      freshModule.getDb();
      expect(loadConfig).toHaveBeenCalledTimes(1); // Should not be called again
      expect(createDb).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('getDb should call printConfigError when config is null', async () => {
      vi.mocked(loadConfig).mockReturnValue(null);

      const indexModule = await import('../index');

      expect(() => indexModule.getDb()).toThrow('process.exit(1)');
      expect(printConfigError).toHaveBeenCalled();
    });

    it('getConfig should call printConfigError when config is null', async () => {
      vi.mocked(loadConfig).mockReturnValue(null);

      const indexModule = await import('../index');

      expect(() => indexModule.getConfig()).toThrow('process.exit(1)');
      expect(printConfigError).toHaveBeenCalled();
    });
  });
});
