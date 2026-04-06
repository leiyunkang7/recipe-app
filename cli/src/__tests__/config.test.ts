import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { homedir } from 'os';

// Mock fs module before importing config
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

// Import mocked fs and config after mocking
import { readFileSync, existsSync } from 'fs';
import { loadConfig, printConfigError, type Config } from '../config';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.DATABASE_URL;
    delete process.env.UPLOAD_DIR;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('environment variable priority', () => {
    it('should return config from environment variables when DATABASE_URL is set', () => {
      process.env.DATABASE_URL = 'postgresql://env:5432/recipe_app';

      const result: Config = loadConfig();

      expect(result.databaseUrl).toBe('postgresql://env:5432/recipe_app');
      expect(result.uploadDir).toBe(join(process.cwd(), 'uploads'));
      expect(existsSync).not.toHaveBeenCalled();
      expect(readFileSync).not.toHaveBeenCalled();
    });

    it('should use UPLOAD_DIR from environment variable when provided', () => {
      process.env.DATABASE_URL = 'postgresql://env:5432/recipe_app';
      process.env.UPLOAD_DIR = '/custom/uploads';

      const result: Config = loadConfig();

      expect(result.databaseUrl).toBe('postgresql://env:5432/recipe_app');
      expect(result.uploadDir).toBe('/custom/uploads');
    });
  });

  describe('workspace config file', () => {
    it('should load config from workspace config file when env var is not set', () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');
      const configContent = `DATABASE_URL=postgresql://workspace:5432/recipe_app
UPLOAD_DIR=./workspace-uploads`;

      vi.mocked(existsSync).mockImplementation((path) => path === workspaceConfig);
      vi.mocked(readFileSync).mockReturnValue(configContent);

      const result: Config = loadConfig();

      expect(result.databaseUrl).toBe('postgresql://workspace:5432/recipe_app');
      expect(result.uploadDir).toBe('./workspace-uploads');
      expect(existsSync).toHaveBeenCalledWith(workspaceConfig);
      expect(readFileSync).toHaveBeenCalledWith(workspaceConfig, 'utf-8');
    });

    it('should use default uploadDir when not specified in workspace config', () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');
      const configContent = `DATABASE_URL=postgresql://workspace:5432/recipe_app`;

      vi.mocked(existsSync).mockImplementation((path) => path === workspaceConfig);
      vi.mocked(readFileSync).mockReturnValue(configContent);

      const result: Config = loadConfig();

      expect(result.databaseUrl).toBe('postgresql://workspace:5432/recipe_app');
      expect(result.uploadDir).toBe(join(process.cwd(), 'uploads'));
    });

    it('should handle config with extra whitespace', () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');
      const configContent = `  DATABASE_URL  =  postgresql://workspace:5432/recipe_app  
  UPLOAD_DIR  =  ./uploads  `;

      vi.mocked(existsSync).mockImplementation((path) => path === workspaceConfig);
      vi.mocked(readFileSync).mockReturnValue(configContent);

      const result: Config = loadConfig();

      expect(result.databaseUrl).toBe('postgresql://workspace:5432/recipe_app');
      expect(result.uploadDir).toBe('./uploads');
    });

    it('should handle config with equals sign in value', () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');
      const configContent = `DATABASE_URL=postgresql://user:pass=word@localhost:5432/recipe_app`;

      vi.mocked(existsSync).mockImplementation((path) => path === workspaceConfig);
      vi.mocked(readFileSync).mockReturnValue(configContent);

      const result: Config = loadConfig();

      expect(result.databaseUrl).toBe('postgresql://user:pass=word@localhost:5432/recipe_app');
    });
  });

  describe('home directory config file', () => {
    it('should load config from home directory when workspace config does not exist', () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');
      const homeConfig = join(homedir(), '.recipe-app', 'config.json');
      const configContent = `DATABASE_URL=postgresql://home:5432/recipe_app
UPLOAD_DIR=./home-uploads`;

      vi.mocked(existsSync).mockImplementation((path) => path === homeConfig);
      vi.mocked(readFileSync).mockReturnValue(configContent);

      const result: Config = loadConfig();

      expect(result.databaseUrl).toBe('postgresql://home:5432/recipe_app');
      expect(result.uploadDir).toBe('./home-uploads');
      expect(existsSync).toHaveBeenCalledWith(workspaceConfig);
      expect(existsSync).toHaveBeenCalledWith(homeConfig);
      expect(readFileSync).toHaveBeenCalledWith(homeConfig, 'utf-8');
    });

    it('should prefer workspace config over home config when both exist', () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');
      const homeConfig = join(homedir(), '.recipe-app', 'config.json');
      const workspaceContent = `DATABASE_URL=postgresql://workspace:5432/recipe_app`;

      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValue(workspaceContent);

      const result: Config = loadConfig();

      expect(result.databaseUrl).toBe('postgresql://workspace:5432/recipe_app');
      expect(readFileSync).toHaveBeenCalledWith(workspaceConfig, 'utf-8');
      expect(readFileSync).not.toHaveBeenCalledWith(homeConfig, 'utf-8');
    });

    it('should use default uploadDir when not specified in home config', () => {
      const homeConfig = join(homedir(), '.recipe-app', 'config.json');
      const configContent = `DATABASE_URL=postgresql://home:5432/recipe_app`;

      vi.mocked(existsSync).mockImplementation((path) => path === homeConfig);
      vi.mocked(readFileSync).mockReturnValue(configContent);

      const result: Config = loadConfig();

      expect(result.databaseUrl).toBe('postgresql://home:5432/recipe_app');
      expect(result.uploadDir).toBe(join(process.cwd(), 'uploads'));
    });
  });

  describe('null handling', () => {
    it('should return null when no config file exists and no env var is set', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = loadConfig();

      expect(result).toBeNull();
    });

    it('should return null when config file exists but DATABASE_URL is missing', () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');
      const configContent = `UPLOAD_DIR=./uploads`;

      vi.mocked(existsSync).mockImplementation((path) => path === workspaceConfig);
      vi.mocked(readFileSync).mockReturnValue(configContent);

      const result = loadConfig();

      expect(result).toBeNull();
    });

    it('should return null when config file is empty', () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');

      vi.mocked(existsSync).mockImplementation((path) => path === workspaceConfig);
      vi.mocked(readFileSync).mockReturnValue('');

      const result = loadConfig();

      expect(result).toBeNull();
    });

    it('should return null when config file contains only comments or invalid lines', () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');
      const configContent = `# This is a comment

SOME_OTHER_KEY=value`;

      vi.mocked(existsSync).mockImplementation((path) => path === workspaceConfig);
      vi.mocked(readFileSync).mockReturnValue(configContent);

      const result = loadConfig();

      expect(result).toBeNull();
    });

    it('should handle config file with lines without equals sign', () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');
      const configContent = `DATABASE_URL=postgresql://localhost:5432/recipe_app
INVALID_LINE_WITHOUT_EQUALS
UPLOAD_DIR=./uploads`;

      vi.mocked(existsSync).mockImplementation((path) => path === workspaceConfig);
      vi.mocked(readFileSync).mockReturnValue(configContent);

      const result: Config = loadConfig()!;

      expect(result.databaseUrl).toBe('postgresql://localhost:5432/recipe_app');
      expect(result.uploadDir).toBe('./uploads');
    });

    it('should handle config file with empty lines', () => {
      const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');
      const configContent = `DATABASE_URL=postgresql://localhost:5432/recipe_app

UPLOAD_DIR=./uploads
`;

      vi.mocked(existsSync).mockImplementation((path) => path === workspaceConfig);
      vi.mocked(readFileSync).mockReturnValue(configContent);

      const result: Config = loadConfig()!;

      expect(result.databaseUrl).toBe('postgresql://localhost:5432/recipe_app');
      expect(result.uploadDir).toBe('./uploads');
    });
  });
});

describe('printConfigError', () => {
  const mockExit = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null) => {
    throw new Error(`process.exit(${code})`);
  });
  const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should print error message and exit', () => {
    expect(() => printConfigError()).toThrow('process.exit(1)');
    expect(mockConsoleError).toHaveBeenCalledWith('Config file not found. Please create .credentials/recipe-app-db.txt');
    expect(mockConsoleError).toHaveBeenCalledWith('Expected format:');
    expect(mockConsoleError).toHaveBeenCalledWith('DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app');
    expect(mockConsoleError).toHaveBeenCalledWith('UPLOAD_DIR=./uploads');
    expect(mockConsoleError).toHaveBeenCalledWith('');
    expect(mockConsoleError).toHaveBeenCalledWith('Or set the DATABASE_URL environment variable.');
  });
});
