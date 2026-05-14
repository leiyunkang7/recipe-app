/**
 * CLI shared types
 */

/**
 * Output format options
 */
export type OutputFormat = 'table' | 'json' | 'csv';

/**
 * Global CLI options available for all commands
 */
export interface GlobalOptions {
  /** Enable verbose logging */
  verbose: boolean;
  /** Enable debug mode with detailed output */
  debug: boolean;
  /** Disable colored output */
  noColor: boolean;
  /** Output format */
  format: OutputFormat;
}

/**
 * CLI error codes
 */
export enum ErrorCode {
  // Configuration errors
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',
  CONFIG_INVALID = 'CONFIG_INVALID',

  // Database errors
  DB_CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED = 'DB_QUERY_FAILED',

  // Recipe errors
  RECIPE_NOT_FOUND = 'RECIPE_NOT_FOUND',
  RECIPE_CREATE_FAILED = 'RECIPE_CREATE_FAILED',
  RECIPE_UPDATE_FAILED = 'RECIPE_UPDATE_FAILED',
  RECIPE_DELETE_FAILED = 'RECIPE_DELETE_FAILED',

  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',

  // File errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_FAILED = 'FILE_READ_FAILED',
  FILE_WRITE_FAILED = 'FILE_WRITE_FAILED',

  // Import/Export errors
  IMPORT_FAILED = 'IMPORT_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',

  // Image errors
  IMAGE_UPLOAD_FAILED = 'IMAGE_UPLOAD_FAILED',
  IMAGE_INVALID = 'IMAGE_INVALID',

  // Search errors
  SEARCH_FAILED = 'SEARCH_FAILED',

  // Unknown error
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * CLI error class
 */
export class CliError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'CliError';
  }
}

/**
 * Command context passed to all commands
 */
export interface CommandContext {
  /** Global options */
  options: GlobalOptions;
  /** Logger instance */
  logger: {
    debug: (message: string) => void;
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  };
}

/**
 * Spinner interface
 */
export interface Spinner {
  start(text?: string): Spinner;
  stop(): Spinner;
  succeed(text?: string): Spinner;
  fail(text?: string): Spinner;
}

/**
 * Table column definition
 */
export interface TableColumn {
  header: string;
  key: string;
  width?: number;
}
