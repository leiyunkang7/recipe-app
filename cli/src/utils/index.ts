/**
 * Utils module exports
 */

// Types
export type {
  Logger,
} from './logger.js';

// Logger
export {
  createLogger,
  createSilentLogger,
  LogLevel,
} from './logger.js';

// Output formatting
export {
  formatOutput,
  printOutput,
  printSuccess,
  printError,
  printWarning,
  printInfo,
} from './output.js';

// Error handling
export {
  handleError,
  setupGlobalErrorHandlers,
  createError,
  getErrorMessage,
} from './error-handler.js';

// Spinner
export {
  createSpinner,
  withSpinner,
} from './spinner.js';

// Validation
export {
  validateUuid,
  validatePagination,
  validateFormat,
  validateFilePath,
  validateSearchQuery,
  UuidSchema,
  PaginationSchema,
  OutputFormatSchema,
  DifficultySchema,
  CategorySchema,
} from './validation.js';
