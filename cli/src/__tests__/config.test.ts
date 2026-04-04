import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

// Mock os module
vi.mock('os', () => ({
  homedir: vi.fn(),
}));

import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

describe('loadConfig', () => {
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Clear environment variables
    delete process.env.DATABASE_URL;
    delete process.env.UPLOAD_DIR;

    // Setup spies
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    // Reset mocks
    vi.mocked(existsSync).mockReset();
    vi.mocked(readFileSync).mockReset();
    vi.mocked(homedir).mockReturnValue('/home/testuser');
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;

    // Restore spies
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();

    // Clear module cache to reload loadConfig
    vi.resetModules();
  });

  describe('loading from environment variables', () => {
    it('should load config from environment variables when DATABASE_URL is set', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';

      const { loadConfig } = await import('../config');
      const config = loadConfig();

      expect(config.databaseUrl).toBe('postgresql://user:pass@localhost:5432/testdb');
      expect(config.uploadDir).toBe(join(process.cwd(), 'uploads'));
    });

    it('should use UPLOAD_DIR from environment when provided', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
      process.env.UPLOAD_DIR = '/custom/uploads';

      const { loadConfig } = await import('../config');
      const config = loadConfig();

      expect(config.databaseUrl).toBe('postgresql://user:pass@localhost:5432/testdb');
      expect(config.uploadDir).toBe('/custom/uploads');
    });
  });

  describe('loading from workspace config file', () => {
    it('should load config from workspace config file when env var is not set', async () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');

      vi.mocked(existsSync).mockImplementation((path) => {
        return path === workspaceConfig;
      });

      vi.mocked(readFileSync).mockReturnValue(
        'DATABASE_URL=postgresql://workspace:pass@localhost:5432/recipe_app\nUPLOAD_DIR=./workspace-uploads'
      );

      const { loadConfig } = await import('../config');
      const config = loadConfig();

      expect(existsSync).toHaveBeenCalledWith(workspaceConfig);
      expect(readFileSync).toHaveBeenCalledWith(workspaceConfig, 'utf-8');
      expect(config.databaseUrl).toBe('postgresql://workspace:pass@localhost:5432/recipe_app');
      expect(config.uploadDir).toBe('./workspace-uploads');
    });

    it('should use default UPLOAD_DIR when not specified in workspace config', async () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');

      vi.mocked(existsSync).mockImplementation((path) => {
        return path === workspaceConfig;
      });

      vi.mocked(readFileSync).mockReturnValue(
        'DATABASE_URL=postgresql://workspace:pass@localhost:5432/recipe_app'
      );

      const { loadConfig } = await import('../config');
      const config = loadConfig();

      expect(config.databaseUrl).toBe('postgresql://workspace:pass@localhost:5432/recipe_app');
      expect(config.uploadDir).toBe(join(process.cwd(), 'uploads'));
    });
  });

  describe('loading from home directory config file', () => {
    it('should load config from home directory when workspace config does not exist', async () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');
      const homeConfig = join('/home/testuser', '.recipe-app', 'config.json');

      vi.mocked(existsSync).mockImplementation((path) => {
        return path === homeConfig;
      });

      vi.mocked(readFileSync).mockReturnValue(
        'DATABASE_URL=postgresql://home:pass@localhost:5432/recipe_app\nUPLOAD_DIR=./home-uploads'
      );

      const { loadConfig } = await import('../config');
      const config = loadConfig();

      expect(existsSync).toHaveBeenCalledWith(workspaceConfig);
      expect(existsSync).toHaveBeenCalledWith(homeConfig);
      expect(readFileSync).toHaveBeenCalledWith(homeConfig, 'utf-8');
      expect(config.databaseUrl).toBe('postgresql://home:pass@localhost:5432/recipe_app');
      expect(config.uploadDir).toBe('./home-uploads');
    });

    it('should prefer workspace config over home config when both exist', async () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');
      const homeConfig = join('/home/testuser', '.recipe-app', 'config.json');

      vi.mocked(existsSync).mockReturnValue(true);

      vi.mocked(readFileSync).mockImplementation((path) => {
        if (path === workspaceConfig) {
          return 'DATABASE_URL=postgresql://workspace:pass@localhost:5432/recipe_app\nUPLOAD_DIR=./workspace-uploads';
        }
        return 'DATABASE_URL=postgresql://home:pass@localhost:5432/recipe_app\nUPLOAD_DIR=./home-uploads';
      });

      const { loadConfig } = await import('../config');
      const config = loadConfig();

      expect(readFileSync).toHaveBeenCalledWith(workspaceConfig, 'utf-8');
      expect(readFileSync).not.toHaveBeenCalledWith(homeConfig, 'utf-8');
      expect(config.databaseUrl).toBe('postgresql://workspace:pass@localhost:5432/recipe_app');
    });
  });

  describe('error handling', () => {
    it('should exit when no config file exists', async () => {
      vi.mocked(existsSync).mockReturnValue(false);
      // Make process.exit throw to stop execution
      processExitSpy.mockImplementationOnce((() => {
        throw new Error('process.exit called');
      }) as any);

      const { loadConfig } = await import('../config');
      
      expect(() => loadConfig()).toThrow('process.exit called');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Config file not found. Please create .credentials/recipe-app-db.txt');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Expected format:');
      expect(consoleErrorSpy).toHaveBeenCalledWith('DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app');
      expect(consoleErrorSpy).toHaveBeenCalledWith('UPLOAD_DIR=./uploads');
      expect(consoleErrorSpy).toHaveBeenCalledWith('');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Or set the DATABASE_URL environment variable.');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit when config file exists but DATABASE_URL is missing', async () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');

      vi.mocked(existsSync).mockImplementation((path) => {
        return path === workspaceConfig;
      });

      vi.mocked(readFileSync).mockReturnValue('UPLOAD_DIR=./uploads\nSOME_OTHER_KEY=value');

      // Make process.exit throw to stop execution
      processExitSpy.mockImplementationOnce((() => {
        throw new Error('process.exit called');
      }) as any);

      const { loadConfig } = await import('../config');
      
      expect(() => loadConfig()).toThrow('process.exit called');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid config file. Missing DATABASE_URL.');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit when config file is empty', async () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');

      vi.mocked(existsSync).mockImplementation((path) => {
        return path === workspaceConfig;
      });

      vi.mocked(readFileSync).mockReturnValue('');

      // Make process.exit throw to stop execution
      processExitSpy.mockImplementationOnce((() => {
        throw new Error('process.exit called');
      }) as any);

      const { loadConfig } = await import('../config');
      
      expect(() => loadConfig()).toThrow('process.exit called');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid config file. Missing DATABASE_URL.');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('parsing config file', () => {
    it('should correctly parse key-value pairs from config file', async () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');

      vi.mocked(existsSync).mockImplementation((path) => {
        return path === workspaceConfig;
      });

      vi.mocked(readFileSync).mockReturnValue(
        'DATABASE_URL=postgresql://user:pass@localhost:5432/recipe_app\n' +
        'UPLOAD_DIR=/path/to/uploads\n' +
        'EXTRA_KEY=extra_value'
      );

      const { loadConfig } = await import('../config');
      const config = loadConfig();

      expect(config.databaseUrl).toBe('postgresql://user:pass@localhost:5432/recipe_app');
      expect(config.uploadDir).toBe('/path/to/uploads');
    });

    it('should handle values containing equals signs', async () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');

      vi.mocked(existsSync).mockImplementation((path) => {
        return path === workspaceConfig;
      });

      vi.mocked(readFileSync).mockReturnValue(
        'DATABASE_URL=postgresql://user:pass=word@localhost:5432/recipe_app?sslmode=require'
      );

      const { loadConfig } = await import('../config');
      const config = loadConfig();

      expect(config.databaseUrl).toBe('postgresql://user:pass=word@localhost:5432/recipe_app?sslmode=require');
    });

    it('should trim whitespace from keys and values', async () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');

      vi.mocked(existsSync).mockImplementation((path) => {
        return path === workspaceConfig;
      });

      vi.mocked(readFileSync).mockReturnValue(
        '  DATABASE_URL  =  postgresql://user:pass@localhost:5432/recipe_app  \n' +
        '  UPLOAD_DIR  =  /path/to/uploads  '
      );

      const { loadConfig } = await import('../config');
      const config = loadConfig();

      expect(config.databaseUrl).toBe('postgresql://user:pass@localhost:5432/recipe_app');
      expect(config.uploadDir).toBe('/path/to/uploads');
    });

    it('should ignore lines without equals sign', async () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');

      vi.mocked(existsSync).mockImplementation((path) => {
        return path === workspaceConfig;
      });

      vi.mocked(readFileSync).mockReturnValue(
        '# This is a comment\n' +
        'DATABASE_URL=postgresql://user:pass@localhost:5432/recipe_app\n' +
        'empty line below\n' +
        '\n' +
        'UPLOAD_DIR=/path/to/uploads'
      );

      const { loadConfig } = await import('../config');
      const config = loadConfig();

      expect(config.databaseUrl).toBe('postgresql://user:pass@localhost:5432/recipe_app');
      expect(config.uploadDir).toBe('/path/to/uploads');
    });

    it('should ignore lines with only key and no value', async () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');

      vi.mocked(existsSync).mockImplementation((path) => {
        return path === workspaceConfig;
      });

      vi.mocked(readFileSync).mockReturnValue(
        'DATABASE_URL=postgresql://user:pass@localhost:5432/recipe_app\n' +
        'EMPTY_KEY='  // This line has no value after =
      );

      const { loadConfig } = await import('../config');
      const config = loadConfig();

      expect(config.databaseUrl).toBe('postgresql://user:pass@localhost:5432/recipe_app');
      expect(config.uploadDir).toBe(join(process.cwd(), 'uploads'));
    });
  });

  describe('default values', () => {
    it('should use default UPLOAD_DIR when not specified anywhere', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';

      const { loadConfig } = await import('../config');
      const config = loadConfig();

      expect(config.uploadDir).toBe(join(process.cwd(), 'uploads'));
    });
  });
});
