#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const config_1 = require("./config");
const add_1 = require("./commands/add");
const list_1 = require("./commands/list");
const get_1 = require("./commands/get");
const update_1 = require("./commands/update");
const delete_1 = require("./commands/delete");
const search_1 = require("./commands/search");
const import_1 = require("./commands/import");
const export_1 = require("./commands/export");
const deleteMany_1 = require("./commands/deleteMany");
const image_1 = require("./commands/image");
const program = new commander_1.Command();
program
    .name('recipe')
    .description('Recipe Management CLI')
    .version('1.0.0');
// Load config
const config = (0, config_1.loadConfig)();
// Recipe commands
program.addCommand((0, add_1.addCommand)(config));
program.addCommand((0, list_1.listCommand)(config));
program.addCommand((0, get_1.getCommand)(config));
program.addCommand((0, update_1.updateCommand)(config));
program.addCommand((0, delete_1.deleteCommand)(config));
program.addCommand((0, search_1.searchCommand)(config));
// Batch operations
program.addCommand((0, import_1.importCommand)(config));
program.addCommand((0, export_1.exportCommand)(config));
program.addCommand((0, deleteMany_1.deleteManyCommand)(config));
// Image commands
program.addCommand((0, image_1.imageUploadCommand)(config));
program.parse();
