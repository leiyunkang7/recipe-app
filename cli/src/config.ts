import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface Config {
  databaseUrl: string;
  uploadDir: string;
}

export function loadConfig(): Config {
  // Priority: env var > config file
  if (process.env.DATABASE_URL) {
    return {
      databaseUrl: process.env.DATABASE_URL,
      uploadDir: process.env.UPLOAD_DIR || join(process.cwd(), 'uploads'),
    };
  }

  // Check for config file in workspace first
  const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-db.txt');
  const homeConfig = join(homedir(), '.recipe-app', 'config.json');

  let configPath: string | null = null;

  if (existsSync(workspaceConfig)) {
    configPath = workspaceConfig;
  } else if (existsSync(homeConfig)) {
    configPath = homeConfig;
  }

  if (!configPath) {
    console.error('Config file not found. Please create .credentials/recipe-app-db.txt');
    console.error('Expected format:');
    console.error('DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app');
    console.error('UPLOAD_DIR=./uploads');
    console.error('');
    console.error('Or set the DATABASE_URL environment variable.');
    process.exit(1);
  }

  const content = readFileSync(configPath, 'utf-8');
  const lines = content.split('\n');

  const config: Record<string, string> = {};

  for (const line of lines) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      config[key.trim()] = valueParts.join('=').trim();
    }
  }

  if (!config.DATABASE_URL) {
    console.error('Invalid config file. Missing DATABASE_URL.');
    process.exit(1);
  }

  return {
    databaseUrl: config.DATABASE_URL,
    uploadDir: config.UPLOAD_DIR || join(process.cwd(), 'uploads'),
  };
}
