/**
 * Error handling utility for CLI
 */
import chalk from 'chalk';
import { ErrorCode, type CliError, type GlobalOptions } from '../types/index.js';

/**
 * Error messages for error codes
 */
const errorMessages: Record<ErrorCode, string> = {
  CONFIG_NOT_FOUND: 'Configuration file not found',
  CONFIG_INVALID: 'Invalid configuration',
  DB_CONNECTION_FAILED: 'Failed to connect to database',
  DB_QUERY_FAILED: 'Database query failed',
  RECIPE_NOT_FOUND: 'Recipe not found',
  RECIPE_CREATE_FAILED: 'Failed to create recipe',
  RECIPE_UPDATE_FAILED: 'Failed to update recipe',
  RECIPE_DELETE_FAILED: 'Failed to delete recipe',
  VALIDATION_FAILED: 'Validation failed',
  INVALID_INPUT: 'Invalid input provided',
  FILE_NOT_FOUND: 'File not found',
  FILE_READ_FAILED: 'Failed to read file',
  FILE_WRITE_FAILED: 'Failed to write file',
  IMPORT_FAILED: 'Import failed',
  EXPORT_FAILED: 'Export failed',
  IMAGE_UPLOAD_FAILED: 'Image upload failed',
  IMAGE_INVALID: 'Invalid image file',
  SEARCH_FAILED: 'Search failed',
  UNKNOWN_ERROR: 'An unknown error occurred',
};

/**
 * Get human-readable error message for error code
 */
export function getErrorMessage(code: ErrorCode): string {
  return errorMessages[code] || errorMessages[ErrorCode.UNKNOWN_ERROR];
}

/**
 * Handle error and exit process
 */
export function handleError(error: unknown, options: GlobalOptions): never {
  const { debug, noColor } = options;

  // Determine error code and message
  let code: ErrorCode = ErrorCode.UNKNOWN_ERROR;
  let message: string;
  let details: unknown;

  if (error instanceof Error && error.name === 'CliError') {
    const cliError = error as CliError;
    code = cliError.code;
    message = cliError.message;
    details = cliError.details;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }

  // Print error
  const errorIcon = noColor ? '✗' : chalk.red('✗');
  const errorLabel = noColor ? `[${code}]` : chalk.red(`[${code}]`);

  console.error(`${errorIcon} ${errorLabel} ${message}`);

  // Print details in debug mode
  if (debug && details) {
    console.error('\nDetails:');
    console.error(details);
  }

  // Print stack trace in debug mode
  if (debug && error instanceof Error && error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }

  // Print helpful hint for common errors
  if (!debug) {
    const hint = getErrorHint(code);
    if (hint) {
      console.error(`\n${noColor ? 'Hint:' : chalk.yellow('Hint:')} ${hint}`);
    }
  }

  process.exit(1);
}

/**
 * Get helpful hint for error code
 */
function getErrorHint(code: ErrorCode): string | null {
  switch (code) {
    case ErrorCode.CONFIG_NOT_FOUND:
      return 'Create .credentials/recipe-app-db.txt or set DATABASE_URL environment variable';
    case ErrorCode.DB_CONNECTION_FAILED:
      return 'Check your database URL and ensure the database server is running';
    case ErrorCode.RECIPE_NOT_FOUND:
      return 'Use "recipe list" to see available recipes';
    case ErrorCode.VALIDATION_FAILED:
      return 'Check your input and try again';
    case ErrorCode.FILE_NOT_FOUND:
      return 'Check the file path and try again';
    default:
      return null;
  }
}

/**
 * Setup global error handlers
 */
export function setupGlobalErrorHandlers(options: GlobalOptions): void {
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:');
    handleError(error, options);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:');
    handleError(reason, options);
  });
}

/**
 * Create a CliError
 */
export function createError(
  message: string,
  code: ErrorCode,
  details?: unknown
): Error {
  const error = new Error(message) as CliError;
  error.name = 'CliError';
  (error as { code: ErrorCode }).code = code;
  if (details) {
    (error as { details: unknown }).details = details;
  }
  return error;
}
