/**
 * Config command for CLI
 */
import { Command } from 'commander';
import chalk from 'chalk';
import {
  loadConfig,
  saveConfig,
  validateConfig,
  getConfigEntries,
  setConfigValue,
  configExists,
  type Config,
  type ConfigKey,
} from '../config.js';
import {
  printSuccess,
  printError,
  printInfo,
  createError,
  printOutput,
} from '../utils/index.js';
import { ErrorCode } from '../types/index.js';
import { getGlobalOptions } from '../index.js';

/**
 * Show all configuration
 */
async function showConfig(): Promise<void> {
  const options = getGlobalOptions();
  const config = loadConfig();

  if (!config) {
    printInfo('No configuration found.', options.noColor);
    printInfo('Run "recipe config set <key> <value>" to create one.', options.noColor);
    return;
  }

  const entries = getConfigEntries(config);

  if (options.format === 'json') {
    printOutput(config, 'json', options);
    return;
  }

  console.log(chalk.bold('\nCurrent Configuration:\n'));

  for (const { key, value } of entries) {
    const displayValue = key === 'databaseUrl'
      ? maskDatabaseUrl(value)
      : value;
    console.log(`  ${chalk.bold(key)}: ${displayValue}`);
  }

  console.log();
}

/**
 * Get specific config value
 */
async function getConfig(key: string): Promise<void> {
  const options = getGlobalOptions();

  if (!isValidConfigKey(key)) {
    throw createError(
      `Invalid config key: ${key}. Valid keys: databaseUrl, uploadDir`,
      ErrorCode.INVALID_INPUT
    );
  }

  const config = loadConfig();

  if (!config) {
    throw createError('No configuration found', ErrorCode.CONFIG_NOT_FOUND);
  }

  const value = config[key as ConfigKey];

  if (options.format === 'json') {
    printOutput({ [key]: value }, 'json', options);
    return;
  }

  const displayValue = key === 'databaseUrl'
    ? maskDatabaseUrl(value)
    : value;

  console.log(displayValue);
}

/**
 * Set config value
 */
async function setConfig(key: string, value: string): Promise<void> {
  const options = getGlobalOptions();

  if (!isValidConfigKey(key)) {
    throw createError(
      `Invalid config key: ${key}. Valid keys: databaseUrl, uploadDir`,
      ErrorCode.INVALID_INPUT
    );
  }

  // Load existing config or create new one
  let config: Config = loadConfig() || {
    databaseUrl: '',
    uploadDir: './uploads',
  };

  // Update config
  config = setConfigValue(config, key as ConfigKey, value);

  // Validate
  validateConfig(config);

  // Save
  saveConfig(config, 'workspace');

  printSuccess(`Configuration updated: ${key}`, options.noColor);
}

/**
 * Validate current configuration
 */
async function validateConfigCmd(): Promise<void> {
  const options = getGlobalOptions();

  if (!configExists()) {
    printError('No configuration found', options.noColor);
    printInfo('Run "recipe config set <key> <value>" to create one.', options.noColor);
    process.exit(1);
  }

  const config = loadConfig();

  if (!config) {
    printError('Failed to load configuration', options.noColor);
    process.exit(1);
  }

  try {
    validateConfig(config);
    printSuccess('Configuration is valid', options.noColor);

    if (options.verbose) {
      const entries = getConfigEntries(config);
      console.log(chalk.bold('\nConfiguration values:\n'));
      for (const { key, value } of entries) {
        const displayValue = key === 'databaseUrl'
          ? maskDatabaseUrl(value)
          : value;
        console.log(`  ${chalk.bold(key)}: ${displayValue}`);
      }
    }
  } catch (error) {
    printError('Configuration is invalid', options.noColor);
    throw error;
  }
}

/**
 * Check if key is valid config key
 */
function isValidConfigKey(key: string): key is ConfigKey {
  return ['databaseUrl', 'uploadDir'].includes(key);
}

/**
 * Mask database URL for display
 */
function maskDatabaseUrl(url: string): string {
  try {
    // Try to parse as URL
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '****';
    }
    return urlObj.toString();
  } catch {
    // If not a valid URL, just return as is
    return url;
  }
}

/**
 * Create config command
 */
export function configCommand(): Command {
  const command = new Command('config')
    .description('Manage CLI configuration')
    .action(async () => {
      await showConfig();
    });

  // config get <key>
  command
    .command('get')
    .description('Get a configuration value')
    .argument('<key>', 'Configuration key (databaseUrl|uploadDir)')
    .action(async (key) => {
      await getConfig(key);
    });

  // config set <key> <value>
  command
    .command('set')
    .description('Set a configuration value')
    .argument('<key>', 'Configuration key (databaseUrl|uploadDir)')
    .argument('<value>', 'Configuration value')
    .action(async (key, value) => {
      await setConfig(key, value);
    });

  // config validate
  command
    .command('validate')
    .description('Validate current configuration')
    .action(async () => {
      await validateConfigCmd();
    });

  return command;
}
