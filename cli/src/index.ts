#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig, printConfigError, type Config } from './config';
import { createDb } from '@recipe-app/database';
import type { Database } from '@recipe-app/database';
import { addCommand } from './commands/add';
import { listCommand } from './commands/list';
import { getCommand } from './commands/get';
import { updateCommand } from './commands/update';
import { deleteCommand } from './commands/delete';
import { searchCommand } from './commands/search';
import { importCommand } from './commands/import';
import { exportCommand } from './commands/export';
import { deleteManyCommand } from './commands/deleteMany';
import { imageUploadCommand } from './commands/image';

const program = new Command();

program
  .name('recipe')
  .description('Recipe Management CLI')
  .version('1.0.0');

// Load config (may be null if not configured)
let config: Config | null = null;
let db: Database | null = null;

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
    db = createDb(config.databaseUrl);
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

// Only parse if this file is being run directly (not imported in tests)
// Check if we're in a test environment by looking for vitest
const isTestEnvironment = process.env.VITEST !== undefined ||
  process.argv.some(arg => arg.includes('vitest'));

if (!isTestEnvironment) {
  program.parse();
}

export { program };
