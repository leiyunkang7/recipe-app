#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig } from './config';
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

// Load config
const config = loadConfig();

// Recipe commands
program.addCommand(addCommand(config));
program.addCommand(listCommand(config));
program.addCommand(getCommand(config));
program.addCommand(updateCommand(config));
program.addCommand(deleteCommand(config));
program.addCommand(searchCommand(config));

// Batch operations
program.addCommand(importCommand(config));
program.addCommand(exportCommand(config));
program.addCommand(deleteManyCommand(config));

// Image commands
program.addCommand(imageUploadCommand(config));

program.parse();
