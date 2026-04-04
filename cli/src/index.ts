#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig } from './config';
import { createDb } from '@recipe-app/database';
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

// Load config and create DB connection
const config = loadConfig();
const db = createDb(config.databaseUrl);

// Recipe commands
program.addCommand(addCommand(db));
program.addCommand(listCommand(db));
program.addCommand(getCommand(db));
program.addCommand(updateCommand(db));
program.addCommand(deleteCommand(db));
program.addCommand(searchCommand(db));

// Batch operations
program.addCommand(importCommand(db));
program.addCommand(exportCommand(db));
program.addCommand(deleteManyCommand(db));

// Image commands
program.addCommand(imageUploadCommand(config));

program.parse();
