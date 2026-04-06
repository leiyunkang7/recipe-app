/**
 * Configuration management for CLI
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { z } from 'zod';
import { ErrorCode } from './types/index.js';
import { createError } from './utils/error-handler.js';

/**
 * Configuration schema
 */
export const ConfigSchema = z.object({
  databaseUrl: z.string().min(1, 'Database URL is required'),
  uploadDir: z.string().min(1, 'Upload directory is required'),
});

/**
 * Configuration type
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Config keys type
 */
export type ConfigKey = keyof Config;

/**
 * Config file paths
 */
const CONFIG_PATHS = {
  workspace: join(process.cwd(), '.credentials', 'recipe-app-db.txt'),
  home: join(homedir(), '.recipe-app', 'config.json'),
};

/**
 * Load configuration from environment variables or config files.
 * Returns null if no configuration is found.
 */
export function loadConfig(): Config | null {
  // Priority: env var > config file
  if (process.env.DATABASE_URL) {
    return {
      databaseUrl: process.env.DATABASE_URL,
      uploadDir: process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'),
    };
  }

  // Check for config file
  const configPath = findConfigFile();

  if (!configPath) {
    return null;
  }

  const config = parseConfigFile(configPath);
  return config;
}

/**
 * Find config file
 */
function findConfigFile(): string | null {
  if (existsSync(CONFIG_PATHS.workspace)) {
    return CONFIG_PATHS.workspace;
  }
  if (existsSync(CONFIG_PATHS.home)) {
    return CONFIG_PATHS.home;
  }
  return null;
}

/**
 * Parse config file
 */
function parseConfigFile(configPath: string): Config | null {
  try {
    const content = readFileSync(configPath, 'utf-8');

    // Try JSON format first
    if (configPath.endsWith('.json')) {
      const parsed = JSON.parse(content);
      return {
        databaseUrl: parsed.DATABASE_URL || parsed.databaseUrl,
        uploadDir: parsed.UPLOAD_DIR || parsed.uploadDir || join(process.cwd(), 'uploads'),
      };
    }

    // Parse key=value format
    const lines = content.split('\n');
    const config: Record<string, string> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        config[key.trim()] = valueParts.join('=').trim();
      }
    }

    if (!config.DATABASE_URL) {
      return null;
    }

    return {
      databaseUrl: config.DATABASE_URL,
      uploadDir: config.UPLOAD_DIR || join(process.cwd(), 'uploads'),
    };
  } catch {
    return null;
  }
}

/**
 * Validate configuration
 */
export function validateConfig(config: unknown): Config {
  const result = ConfigSchema.safeParse(config);
  if (!result.success) {
    throw createError(
      'Invalid configuration',
      ErrorCode.CONFIG_INVALID,
      result.error.issues
    );
  }
  return result.data;
}

/**
 * Save configuration to file
 */
export function saveConfig(config: Config, location: 'workspace' | 'home' = 'workspace'): void {
  const configPath = location === 'workspace' ? CONFIG_PATHS.workspace : CONFIG_PATHS.home;

  // Ensure directory exists
  const dir = dirname(configPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Format content based on file extension
  let content: string;
  if (configPath.endsWith('.json')) {
    content = JSON.stringify(
      {
        DATABASE_URL: config.databaseUrl,
        UPLOAD_DIR: config.uploadDir,
      },
      null,
      2
    );
  } else {
    content = `# Recipe App Configuration
# Generated automatically
DATABASE_URL=${config.databaseUrl}
UPLOAD_DIR=${config.uploadDir}
`;
  }

  writeFileSync(configPath, content, 'utf-8');
}

/**
 * Get config value by key
 */
export function getConfigValue(config: Config, key: ConfigKey): string {
  return config[key];
}

/**
 * Set config value
 */
export function setConfigValue(
  config: Config,
  key: ConfigKey,
  value: string
): Config {
  return {
    ...config,
    [key]: value,
  };
}

/**
 * Get all config entries
 */
export function getConfigEntries(config: Config): Array<{ key: ConfigKey; value: string }> {
  return Object.entries(config).map(([key, value]) => ({
    key: key as ConfigKey,
    value: String(value),
  }));
}

/**
 * Check if config exists
 */
export function configExists(): boolean {
  return findConfigFile() !== null;
}

/**
 * Print configuration error message and exit.
 */
export function printConfigError(): never {
  console.error('Configuration not found. Please set up your configuration:');
  console.error('');
  console.error('Option 1: Set environment variable');
  console.error('  export DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app');
  console.error('');
  console.error('Option 2: Create config file');
  console.error(`  mkdir -p .credentials`);
  console.error(`  echo "DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app" > .credentials/recipe-app-db.txt`);
  console.error('');
  console.error('Option 3: Use the config command');
  console.error('  recipe config set databaseUrl <your-database-url>');
  console.error('');
  process.exit(1);
}
