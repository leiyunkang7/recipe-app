import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey: string;
}

export function loadConfig(): Config {
  // Check for config file in workspace first
  const workspaceConfig = join(process.cwd(), '.credentials', 'recipe-app-supabase.txt');
  const homeConfig = join(homedir(), '.recipe-app', 'config.json');

  let configPath: string | null = null;

  if (existsSync(workspaceConfig)) {
    configPath = workspaceConfig;
  } else if (existsSync(homeConfig)) {
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

  const content = readFileSync(configPath, 'utf-8');
  const lines = content.split('\n');

  const config: any = {};

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
