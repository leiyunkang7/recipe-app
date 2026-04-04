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
import { loadConfig } from '../config';
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

  describe('config and database initialization', () => {
    it('should load config on module import', async () => {
      await import('../index');

      expect(loadConfig).toHaveBeenCalledTimes(1);
      expect(loadConfig).toHaveBeenCalledWith();
    });

    it('should create database connection with config databaseUrl', async () => {
      await import('../index');

      expect(createDb).toHaveBeenCalledTimes(1);
      expect(createDb).toHaveBeenCalledWith(mockConfig.databaseUrl);
    });
  });

  describe('recipe commands registration', () => {
    it('should add addCommand with database instance', async () => {
      await import('../index');

      expect(addCommand).toHaveBeenCalledTimes(1);
      expect(addCommand).toHaveBeenCalledWith(mockDb);
    });

    it('should add listCommand with database instance', async () => {
      await import('../index');

      expect(listCommand).toHaveBeenCalledTimes(1);
      expect(listCommand).toHaveBeenCalledWith(mockDb);
    });

    it('should add getCommand with database instance', async () => {
      await import('../index');

      expect(getCommand).toHaveBeenCalledTimes(1);
      expect(getCommand).toHaveBeenCalledWith(mockDb);
    });

    it('should add updateCommand with database instance', async () => {
      await import('../index');

      expect(updateCommand).toHaveBeenCalledTimes(1);
      expect(updateCommand).toHaveBeenCalledWith(mockDb);
    });

    it('should add deleteCommand with database instance', async () => {
      await import('../index');

      expect(deleteCommand).toHaveBeenCalledTimes(1);
      expect(deleteCommand).toHaveBeenCalledWith(mockDb);
    });

    it('should add searchCommand with database instance', async () => {
      await import('../index');

      expect(searchCommand).toHaveBeenCalledTimes(1);
      expect(searchCommand).toHaveBeenCalledWith(mockDb);
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
    it('should add importCommand with database instance', async () => {
      await import('../index');

      expect(importCommand).toHaveBeenCalledTimes(1);
      expect(importCommand).toHaveBeenCalledWith(mockDb);
    });

    it('should add exportCommand with database instance', async () => {
      await import('../index');

      expect(exportCommand).toHaveBeenCalledTimes(1);
      expect(exportCommand).toHaveBeenCalledWith(mockDb);
    });

    it('should add deleteManyCommand with database instance', async () => {
      await import('../index');

      expect(deleteManyCommand).toHaveBeenCalledTimes(1);
      expect(deleteManyCommand).toHaveBeenCalledWith(mockDb);
    });

    it('should add batch commands after recipe commands', async () => {
      await import('../index');

      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(7, 'import-command-mock');
      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(8, 'export-command-mock');
      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(9, 'deleteMany-command-mock');
    });
  });

  describe('image command registration', () => {
    it('should add imageUploadCommand with config', async () => {
      await import('../index');

      expect(imageUploadCommand).toHaveBeenCalledTimes(1);
      expect(imageUploadCommand).toHaveBeenCalledWith(mockConfig);
    });

    it('should add image command as the last command', async () => {
      await import('../index');

      expect(mockCommandInstance.addCommand).toHaveBeenNthCalledWith(10, 'imageUpload-command-mock');
    });
  });

  describe('program execution', () => {
    it('should call parse to start command processing', async () => {
      await import('../index');

      expect(mockCommandInstance.parse).toHaveBeenCalledTimes(1);
      expect(mockCommandInstance.parse).toHaveBeenCalledWith();
    });

    it('should parse after all commands are added', async () => {
      await import('../index');

      const parseCallOrder = mockCommandInstance.parse.mock.invocationCallOrder[0];

      // All addCommand calls should happen before parse
      const addCommandCalls = [
        ...mockCommandInstance.addCommand.mock.invocationCallOrder,
      ];
      const maxAddCommandCallOrder = Math.max(...addCommandCalls);

      expect(parseCallOrder).toBeGreaterThan(maxAddCommandCallOrder);
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
    it('should parse with default process.argv when no argument provided', async () => {
      await import('../index');

      expect(mockCommandInstance.parse).toHaveBeenCalledWith();
    });

    it('should work with custom argv', async () => {
      process.argv = ['node', 'recipe', 'add'];

      await import('../index');

      expect(mockCommandInstance.parse).toHaveBeenCalledWith();
    });
  });

  describe('complete integration flow', () => {
    it('should execute complete initialization flow in correct order', async () => {
      await import('../index');

      // Verify the complete flow
      expect(loadConfig).toHaveBeenCalled();
      expect(createDb).toHaveBeenCalledWith(mockConfig.databaseUrl);

      // All commands should be created with correct dependencies
      expect(addCommand).toHaveBeenCalledWith(mockDb);
      expect(listCommand).toHaveBeenCalledWith(mockDb);
      expect(getCommand).toHaveBeenCalledWith(mockDb);
      expect(updateCommand).toHaveBeenCalledWith(mockDb);
      expect(deleteCommand).toHaveBeenCalledWith(mockDb);
      expect(searchCommand).toHaveBeenCalledWith(mockDb);
      expect(importCommand).toHaveBeenCalledWith(mockDb);
      expect(exportCommand).toHaveBeenCalledWith(mockDb);
      expect(deleteManyCommand).toHaveBeenCalledWith(mockDb);
      expect(imageUploadCommand).toHaveBeenCalledWith(mockConfig);

      // All commands should be added to program
      expect(mockCommandInstance.addCommand).toHaveBeenCalledTimes(10);

      // Parse should be called last
      expect(mockCommandInstance.parse).toHaveBeenCalled();
    });

    it('should handle different config values correctly', async () => {
      const customConfig = {
        databaseUrl: 'postgresql://custom:5432/custom_db',
        uploadDir: '/custom/path',
      };
      vi.mocked(loadConfig).mockReturnValue(customConfig);

      await import('../index');

      expect(createDb).toHaveBeenCalledWith(customConfig.databaseUrl);
      expect(imageUploadCommand).toHaveBeenCalledWith(customConfig);
    });
  });
});
