#!/usr/bin/env node

import { Command, type OptionValues } from 'commander';
import { loadConfig, printConfigError, type Config } from './config.js';
import { createDb } from '@recipe-app/database';
import type { Database } from '@recipe-app/database';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { getCommand } from './commands/get.js';
import { updateCommand } from './commands/update.js';
import { deleteCommand } from './commands/delete.js';
import { searchCommand } from './commands/search.js';
import { importCommand } from './commands/import.js';
import { exportCommand } from './commands/export.js';
import { deleteManyCommand } from './commands/deleteMany.js';
import { imageUploadCommand } from './commands/image.js';
import { configCommand } from './commands/config.js';
import { devCommand } from './commands/dev.js';
import {
  setupGlobalErrorHandlers,
  createLogger,
  type Logger,
} from './utils/index.js';
import type { GlobalOptions } from './types/index.js';

const program = new Command();

// Global options storage
let globalOptions: GlobalOptions = {
  verbose: false,
  debug: false,
  noColor: false,
  format: 'table',
};

let logger: Logger = createLogger(globalOptions);

// Load config (may be null if not configured)
let config: Config | null = null;
let db: Database | null = null;

/**
 * Parse global options from commander options
 */
function parseGlobalOptions(options: OptionValues): GlobalOptions {
  return {
    verbose: options.verbose || false,
    debug: options.debug || false,
    noColor: options.noColor || false,
    format: options.format || 'table',
  };
}

/**
 * Update global context based on options
 */
export function updateGlobalContext(options: GlobalOptions): void {
  globalOptions = options;
  logger = createLogger(options);

  // Setup global error handlers with current options
  setupGlobalErrorHandlers(options);
}

/**
 * Get current global options
 */
export function getGlobalOptions(): GlobalOptions {
  return globalOptions;
}

/**
 * Get logger instance
 */
export function getLogger(): Logger {
  return logger;
}

/**
 * Get or create database connection lazily.
 * Exits with error if config is not available.
 */
export function getDb(): Database {
  if (!config) {
    config = loadConfig();
    if (!config) {
      printConfigError();
    }
  }
  if (!db) {
    logger.debug(`Connecting to database...`);
    db = createDb(config.databaseUrl);
    logger.debug(`Database connected successfully`);
  }
  return db;
}

/**
 * Get config lazily.
 * Exits with error if config is not available.
 */
export function getConfig(): Config {
  if (!config) {
    config = loadConfig();
    if (!config) {
      printConfigError();
    }
  }
  return config;
}

// Configure program
program
  .name('recipe')
  .description('Recipe Management CLI')
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--debug', 'Enable debug mode with detailed output')
  .option('--no-color', 'Disable colored output')
  .option('-f, --format <format>', 'Output format (table|json|csv)', 'table')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    const parsedOptions = parseGlobalOptions(opts);
    updateGlobalContext(parsedOptions);
    logger.debug(`Global options: ${JSON.stringify(parsedOptions)}`);
  });

// Recipe commands
program.addCommand(addCommand());
program.addCommand(listCommand());
program.addCommand(getCommand());
program.addCommand(updateCommand());
program.addCommand(deleteCommand());
program.addCommand(searchCommand());

// Batch operations
program.addCommand(importCommand());
program.addCommand(exportCommand());
program.addCommand(deleteManyCommand());

// Image commands
program.addCommand(imageUploadCommand());

// Config commands
program.addCommand(configCommand());
program.addCommand(devCommand());

// Only parse if this file is being run directly (not imported in tests)
// Check if we're in a test environment by looking for vitest
const isTestEnvironment =
  process.env.VITEST !== undefined ||
  process.argv.some((arg) => arg.includes('vitest'));

if (!isTestEnvironment) {
  program.parse();
}

export { program };
