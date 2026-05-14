/**
 * Spinner utility for CLI
 */
import ora, { type Ora } from 'ora';
import type { Spinner } from '../types/index.js';

/**
 * Create a spinner instance
 */
export function createSpinner(text: string, options?: { noColor?: boolean }): Spinner {
  const noColor = options?.noColor ?? false;

  const oraInstance: Ora = ora({
    text,
    // Disable spinner animation if no-color is set
    spinner: noColor ? 'line' : 'dots',
  });

  return {
    start: (newText?: string): Spinner => {
      if (newText) {
        oraInstance.text = newText;
      }
      oraInstance.start();
      return createSpinner(oraInstance.text, options);
    },
    stop: (): Spinner => {
      oraInstance.stop();
      return createSpinner(oraInstance.text, options);
    },
    succeed: (text?: string): Spinner => {
      oraInstance.succeed(text);
      return createSpinner(oraInstance.text, options);
    },
    fail: (text?: string): Spinner => {
      oraInstance.fail(text);
      return createSpinner(oraInstance.text, options);
    },
  };
}

/**
 * Wrap an async function with spinner
 */
export async function withSpinner<T>(
  text: string,
  fn: () => Promise<T>,
  options?: { noColor?: boolean }
): Promise<T> {
  const spinner = createSpinner(text, options);
  spinner.start();

  try {
    const result = await fn();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}
