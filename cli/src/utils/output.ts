/**
 * Output formatting utility for CLI
 */
import chalk from 'chalk';
import { table } from 'table';
import type { OutputFormat } from '../types/index.js';

/**
 * Format data for output based on format option
 */
export function formatOutput<T>(
  data: T,
  format: OutputFormat,
  options?: { noColor?: boolean }
): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv':
      return formatAsCsv(data);
    case 'table':
    default:
      return formatAsTable(data, options);
  }
}

/**
 * Format data as CSV
 */
function formatAsCsv<T>(data: T): string {
  if (!data) return '';

  // Handle array of objects
  if (Array.isArray(data) && data.length > 0) {
    const firstItem = data[0];
    if (typeof firstItem === 'object' && firstItem !== null) {
      const keys = Object.keys(firstItem);
      const headers = keys.join(',');
      const rows = data.map((item) =>
        keys
          .map((key) => {
            const value = (item as Record<string, unknown>)[key];
            return escapeCsvValue(value);
          })
          .join(',')
      );
      return [headers, ...rows].join('\n');
    }
  }

  // Handle single object
  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    return entries.map(([key, value]) => `${key},${escapeCsvValue(value)}`).join('\n');
  }

  return String(data);
}

/**
 * Escape CSV value
 */
function escapeCsvValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  // Escape quotes and wrap in quotes if contains special characters
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format data as table
 */
function formatAsTable<T>(data: T, options?: { noColor?: boolean }): string {
  const noColor = options?.noColor ?? false;

  if (!data) return '';

  // Handle array of objects (like recipes list)
  if (Array.isArray(data) && data.length > 0) {
    return formatArrayAsTable(data, noColor);
  }

  // Handle single object (like recipe details)
  if (typeof data === 'object' && data !== null) {
    return formatObjectAsTable(data as Record<string, unknown>, noColor);
  }

  return String(data);
}

/**
 * Format array of objects as table
 */
function formatArrayAsTable(data: unknown[], noColor: boolean): string {
  const firstItem = data[0] as Record<string, unknown>;
  const keys = Object.keys(firstItem);

  // Filter out nested objects/arrays for clean display
  const displayKeys = keys.filter((key) => {
    const value = firstItem[key];
    return typeof value !== 'object' || value === null;
  });

  if (displayKeys.length === 0) {
    return 'No displayable columns found';
  }

  const headers = displayKeys.map((key) => (noColor ? key : chalk.bold(key)));

  const rows = data.map((item) =>
    displayKeys.map((key) => {
      const value = (item as Record<string, unknown>)[key];
      return formatCellValue(value, noColor);
    })
  );

  const tableData = [headers, ...rows];

  return table(tableData, {
    border: getTableBorder(),
  });
}

/**
 * Format single object as key-value table
 */
function formatObjectAsTable(obj: Record<string, unknown>, noColor: boolean): string {
  const entries = Object.entries(obj);

  // Filter out nested objects/arrays
  const displayEntries = entries.filter(([, value]) => {
    return typeof value !== 'object' || value === null || Array.isArray(value);
  });

  if (displayEntries.length === 0) {
    return 'No displayable fields found';
  }

  const rows = displayEntries.map(([key, value]) => [
    noColor ? key : chalk.bold(key),
    formatCellValue(value, noColor),
  ]);

  return table(rows, {
    border: getTableBorder(),
  });
}

/**
 * Format cell value for display
 */
function formatCellValue(value: unknown, _noColor: boolean): string {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (value.length === 0) return '-';
    return `[${value.length} items]`;
  }
  const str = String(value);
  // Truncate long strings
  if (str.length > 50) {
    return str.substring(0, 47) + '...';
  }
  return str;
}

/**
 * Get table border configuration
 */
function getTableBorder() {
  return {
    topBody: '─',
    topJoin: '┬',
    topLeft: '┌',
    topRight: '┐',
    bottomBody: '─',
    bottomJoin: '┴',
    bottomLeft: '└',
    bottomRight: '┘',
    bodyLeft: '│',
    bodyRight: '│',
    bodyJoin: '│',
    joinBody: '─',
    joinLeft: '├',
    joinRight: '┤',
    joinJoin: '┼',
  };
}

/**
 * Print formatted output to console
 */
export function printOutput<T>(
  data: T,
  format: OutputFormat,
  options?: { noColor?: boolean }
): void {
  const output = formatOutput(data, format, options);
  console.log(output);
}

/**
 * Print success message
 */
export function printSuccess(message: string, noColor?: boolean): void {
  const icon = noColor ? '✓' : chalk.green('✓');
  console.log(`${icon} ${message}`);
}

/**
 * Print error message
 */
export function printError(message: string, noColor?: boolean): void {
  const icon = noColor ? '✗' : chalk.red('✗');
  console.error(`${icon} ${message}`);
}

/**
 * Print warning message
 */
export function printWarning(message: string, noColor?: boolean): void {
  const icon = noColor ? '⚠' : chalk.yellow('⚠');
  console.warn(`${icon} ${message}`);
}

/**
 * Print info message
 */
export function printInfo(message: string, noColor?: boolean): void {
  if (noColor) {
    console.log(message);
  } else {
    console.log(chalk.gray(message));
  }
}
