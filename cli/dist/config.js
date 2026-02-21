"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const fs_1 = require("fs");
const path_1 = require("path");
const os_1 = require("os");
function loadConfig() {
    // Check for config file in workspace first
    const workspaceConfig = (0, path_1.join)(process.cwd(), '.credentials', 'recipe-app-supabase.txt');
    const homeConfig = (0, path_1.join)((0, os_1.homedir)(), '.recipe-app', 'config.json');
    let configPath = null;
    if ((0, fs_1.existsSync)(workspaceConfig)) {
        configPath = workspaceConfig;
    }
    else if ((0, fs_1.existsSync)(homeConfig)) {
        configPath = homeConfig;
    }
    if (!configPath) {
        console.error('Config file not found. Please create .credentials/recipe-app-supabase.txt');
        console.error('Expected format:');
        console.error('SUPABASE_URL=your-url');
        console.error('SUPABASE_ANON_KEY=your-anon-key');
        console.error('SUPABASE_SERVICE_KEY=your-service-key');
        process.exit(1);
    }
    const content = (0, fs_1.readFileSync)(configPath, 'utf-8');
    const lines = content.split('\n');
    const config = {};
    for (const line of lines) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            config[key.trim()] = valueParts.join('=').trim();
        }
    }
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY || !config.SUPABASE_SERVICE_KEY) {
        console.error('Invalid config file. Missing required fields.');
        process.exit(1);
    }
    return {
        supabaseUrl: config.SUPABASE_URL,
        supabaseAnonKey: config.SUPABASE_ANON_KEY,
        supabaseServiceKey: config.SUPABASE_SERVICE_KEY,
    };
}
