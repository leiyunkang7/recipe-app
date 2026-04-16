/**
 * Dev command - Efficiency companion for recipe-app development
 * Provides quick access to project status, health checks, and common tasks
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { getGlobalOptions } from '../index.js';
import { printSuccess, printError, printInfo, printOutput } from '../utils/index.js';

interface DevStatus {
  project: string;
  timestamp: string;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    duration?: string;
  }[];
}

/**
 * Run a command safely and return result
 */
function runCmd(cmd: string, cwd: string): { success: boolean; output: string; duration: string } {
  const start = Date.now();
  try {
    const output = execSync(cmd, { cwd, timeout: 8000, encoding: 'utf-8' });
    return { success: true, output: output.trim(), duration: `${Date.now() - start}ms` };
  } catch (e: any) {
    return { success: false, output: e.message?.trim() || String(e), duration: `${Date.now() - start}ms` };
  }
}

/**
 * Check if directory is a git repo
 */
function isGitRepo(cwd: string): boolean {
  return existsSync(join(cwd, '.git'));
}

/**
 * Get git branch and status summary
 */
function checkGit(cwd: string): { branch: string; status: string; commits: string } {
  const branchResult = runCmd('git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A"', cwd);
  const branch = branchResult.success ? branchResult.output : 'N/A';

  const statusResult = runCmd('git status --porcelain 2>/dev/null | wc -l | xargs', cwd);
  const changed = statusResult.success ? parseInt(statusResult.output) || 0 : -1;

  const logResult = runCmd('git log --oneline -3 2>/dev/null | cat', cwd);
  const commits = logResult.success ? logResult.output.split('\n').filter(Boolean).join(' | ') : 'N/A';

  let status = 'clean';
  if (changed > 0) status = `${changed} uncommitted`;
  if (changed > 10) status = 'dirty';

  return { branch, status, commits };
}

/**
 * Check node_modules existence
 */
function checkDeps(cwd: string): boolean {
  return existsSync(join(cwd, 'node_modules'));
}

/**
 * Check if build artifacts exist
 */
function checkBuild(cwd: string): boolean {
  return existsSync(join(cwd, '.output')) || existsSync(join(cwd, '.nuxt')) || existsSync(join(cwd, 'dist'));
}

/**
 * Check recent git commits across all repos
 */
async function checkRecentWork(cwd: string): Promise<string[]> {
  const results: string[] = [];
  const repos = ['/root/code/recipe-app', '/root/.openclaw/workspace'];

  for (const repo of repos) {
    if (!isGitRepo(repo)) continue;
    const logResult = runCmd('git log --since="24 hours ago" --oneline 2>/dev/null | cat', repo);
    if (logResult.success && logResult.output) {
      const lines = logResult.output.split('\n').filter(Boolean);
      if (lines.length > 0) {
        const name = repo.split('/').pop();
        results.push(`${chalk.cyan(name)}: ${lines.length} commit(s)`);
        lines.slice(0, 2).forEach(l => results.push(`  ${l}`));
      }
    }
  }
  return results;
}

/**
 * Get workspace disk usage hint
 */
function checkDisk(): { used: number; total: number; percent: number } {
  try {
    const output = execSync('df -h /root --output=size,used,pcent 2>/dev/null | tail -1', { encoding: 'utf-8' });
    const parts = output.trim().split(/\s+/);
    if (parts.length >= 3) {
      const total = parseFloat(parts[0]);
      const used = parseFloat(parts[1]);
      const percent = parseInt(parts[2]);
      return { used, total, percent };
    }
  } catch {}
  return { used: 0, total: 0, percent: 0 };
}

/**
 * Main dev status action
 */
async function devStatus(): Promise<void> {
  const options = getGlobalOptions();
  const cwd = '/root/code/recipe-app';
  const checks: DevStatus['checks'] = [];

  // 1. Git status
  const git = checkGit(cwd);
  checks.push({
    name: 'Git',
    status: git.status === 'clean' ? 'pass' : 'warn',
    message: `${git.branch} (${git.status})`,
    duration: 'instant',
  });

  // 2. Dependencies
  const hasDeps = checkDeps(cwd);
  checks.push({
    name: 'Dependencies',
    status: hasDeps ? 'pass' : 'fail',
    message: hasDeps ? 'node_modules present' : 'MISSING - run npm install',
  });

  // 3. Build artifacts
  const hasBuild = checkBuild(cwd);
  checks.push({
    name: 'Build',
    status: hasBuild ? 'pass' : 'warn',
    message: hasBuild ? 'build artifacts found' : 'no build yet (run npm run build)',
  });

  // 4. Disk space
  const disk = checkDisk();
  const diskStatus = disk.percent === 0 ? 'warn' : disk.percent > 85 ? 'fail' : disk.percent > 70 ? 'warn' : 'pass';
  checks.push({
    name: 'Disk',
    status: diskStatus,
    message: disk.percent > 0 ? `${disk.used}/${disk.total} (${disk.percent}%)` : 'unknown',
  });

  // 5. Health check script
  const healthScript = '/root/.openclaw/workspace/scripts/health-check-alert.ts';
  const hasHealth = existsSync(healthScript);
  checks.push({
    name: 'Health Cron',
    status: hasHealth ? 'pass' : 'warn',
    message: hasHealth ? 'health-check-alert active' : 'no health cron found',
  });

  // Output
  if (options.format === 'json') {
    const status: DevStatus = {
      project: 'recipe-app',
      timestamp: new Date().toISOString(),
      checks,
    };
    printOutput(status, 'json', options);
    return;
  }

  console.log(chalk.bold('\n🔧 recipe-app Dev Status'));
  console.log(chalk.gray(`  ${new Date().toLocaleString('zh-CN')}\n`));

  for (const check of checks) {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
    const color = check.status === 'pass' ? chalk.green : check.status === 'warn' ? chalk.yellow : chalk.red;
    console.log(`  ${icon} ${chalk.bold(check.name.padEnd(14))} ${color(check.message)}`);
  }

  // Recent commits
  console.log(chalk.bold('\n📋 Recent Activity (24h):'));
  const recent = await checkRecentWork(cwd);
  if (recent.length === 0) {
    console.log(`  ${chalk.gray('No recent commits found')}`);
  } else {
    for (const line of recent.slice(0, 8)) {
      console.log(`  ${chalk.gray(line)}`);
    }
  }

  console.log();
}

/**
 * Quick alias: check supabase connection
 */
async function devDb(): Promise<void> {
  const options = getGlobalOptions();
  const cwd = '/root/code/recipe-app';

  printInfo('Checking Supabase connection...', options.noColor);

  const result = runCmd('npx supabase status 2>/dev/null || echo "SUPABASE_NOT_RUNNING"', cwd);

  if (result.output.includes('SUPABASE_NOT_RUNNING')) {
    printError('Supabase not running. Start with: supabase start', options.noColor);
    process.exit(1);
  }

  if (result.success) {
    printSuccess('Supabase is running', options.noColor);
    console.log(chalk.gray(result.output));
  } else {
    printError(`Supabase check failed: ${result.output}`, options.noColor);
  }
}

/**
 * Quick alias: show recent git log
 */
async function devLog(n = 5): Promise<void> {
  const options = getGlobalOptions();
  const cwd = '/root/code/recipe-app';

  const result = runCmd(`git log --oneline -${n} 2>/dev/null | cat`, cwd);
  if (result.success && result.output) {
    console.log(chalk.bold('\n📜 Recent Commits:\n'));
    result.output.split('\n').forEach((line, i) => {
      console.log(`  ${chalk.gray(String(n - i).padStart(2, ' '))}  ${line}`);
    });
    console.log();
  } else {
    printError('No git history found', options.noColor);
  }
}

/**
 * Create dev command
 */
export function devCommand(): Command {
  const command = new Command('dev')
    .description('Efficiency companion for recipe-app development')
    .action(async () => {
      await devStatus();
    });

  // dev status (default)
  command
    .command('status')
    .description('Show comprehensive dev status dashboard')
    .action(async () => {
      await devStatus();
    });

  // dev db
  command
    .command('db')
    .description('Check Supabase database connection')
    .action(async () => {
      await devDb();
    });

  // dev log [n]
  command
    .command('log')
    .description('Show recent git commits')
    .argument('[n]', 'Number of commits to show', '5')
    .action(async (n: string) => {
      await devLog(parseInt(n) || 5);
    });

  return command;
}
