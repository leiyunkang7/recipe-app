/**
 * Logger utility for CLI
 */
import chalk from 'chalk';
import type { GlobalOptions } from '../types/index.js';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

/**
 * Logger interface
 */
export interface Logger {
  error(message: string): void;
  warn(message: string): void;
  info(message: string): void;
  debug(message: string): void;
}

/**
 * Create a logger instance based on global options
 */
export function createLogger(options: GlobalOptions): Logger {
  const { verbose, debug, noColor } = options;

  // Determine log level
  let level = LogLevel.ERROR;
  if (debug) level = LogLevel.DEBUG;
  else if (verbose) level = LogLevel.INFO;

  const formatMessage = (levelStr: string, message: string): string => {
    const timestamp = new Date().toISOString();
    if (noColor) {
      return `[${timestamp}] [${levelStr}] ${message}`;
    }
    return chalk.gray(`[${timestamp}]`) + ` [${levelStr}] ${message}`;
  };

  return {
    error: (message: string): void => {
      if (level >= LogLevel.ERROR) {
        const formatted = noColor
          ? `[ERROR] ${message}`
          : chalk.red(`[ERROR] ${message}`);
        console.error(formatted);
      }
    },

    warn: (message: string): void => {
      if (level >= LogLevel.WARN) {
        const formatted = noColor
          ? `[WARN] ${message}`
          : chalk.yellow(`[WARN] ${message}`);
        console.warn(formatted);
      }
    },

    info: (message: string): void => {
      if (level >= LogLevel.INFO) {
        const formatted = noColor
          ? `[INFO] ${message}`
          : chalk.blue(`[INFO] ${message}`);
        console.log(formatted);
      }
    },

    debug: (message: string): void => {
      if (level >= LogLevel.DEBUG) {
        const formatted = formatMessage(chalk.magenta('DEBUG'), message);
        console.log(formatted);
      }
    },
  };
}

/**
 * Create a silent logger (for testing)
 */
export function createSilentLogger(): Logger {
  return {
    error: (): void => {},
    warn: (): void => {},
    info: (): void => {},
    debug: (): void => {},
  };
}
