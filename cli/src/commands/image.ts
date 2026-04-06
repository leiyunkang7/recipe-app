/**
 * Image command for CLI
 */
import { Command } from 'commander';
import { ImageService } from '@recipe-app/image-service';
import type { ImageUploadOptions } from '@recipe-app/shared-types';
import { getConfig, getGlobalOptions } from '../index.js';
import {
  printSuccess,
  printInfo,
  createSpinner,
  validateFilePath,
  createError,
} from '../utils/index.js';
import { ErrorCode } from '../types/index.js';

/**
 * Validate dimension value (width/height)
 * Exported for unit testing
 */
export function validateDimension(value: string | undefined, name: string): number | undefined {
  if (!value) return undefined;
  const num = parseInt(value, 10);
  if (Number.isNaN(num) || num <= 0) {
    throw createError(
      `${name} must be a positive number`,
      ErrorCode.INVALID_INPUT
    );
  }
  if (num > 10000) {
    throw createError(
      `${name} is too large (max 10000)`,
      ErrorCode.INVALID_INPUT
    );
  }
  return num;
}

export interface ImageOptions {
  width?: string;
  height?: string;
  quality: string;
}

export async function imageUploadAction(file: string, options: ImageOptions): Promise<void> {
  const globalOptions = getGlobalOptions();
  const config = getConfig();
  const service = new ImageService(config.uploadDir);

  validateFilePath(file);

  printInfo(`Uploading ${file}...`, globalOptions.noColor);

  const uploadOptions: Partial<ImageUploadOptions> = {
    compress: true,
    quality: parseInt(options.quality),
  };

  // Validate quality
  const quality = parseInt(options.quality);
  if (isNaN(quality) || quality < 1 || quality > 100) {
    throw createError(
      'Quality must be a number between 1 and 100',
      ErrorCode.INVALID_INPUT
    );
  }

  const width = validateDimension(options.width, 'Width');
  const height = validateDimension(options.height, 'Height');

  if (width !== undefined) uploadOptions.width = width;
  if (height !== undefined) uploadOptions.height = height;

  const spinner = createSpinner('Uploading...', { noColor: globalOptions.noColor });
  spinner.start();

  const result = await service.upload(file, file, uploadOptions);

  spinner.stop();

  if (!result.success || !result.data) {
    throw createError(
      result.error?.message || 'Upload failed',
      ErrorCode.IMAGE_UPLOAD_FAILED,
      result.error
    );
  }

  const { url, path } = result.data;

  printSuccess('Image uploaded successfully!', globalOptions.noColor);
  printInfo(`URL:  ${url}`, globalOptions.noColor);
  printInfo(`Path: ${path}`, globalOptions.noColor);
}

export function imageUploadCommand(): Command {
  return new Command('image')
    .description('Image operations')
    .command('upload')
    .description('Upload an image to local storage')
    .argument('<file>', 'Path to image file')
    .option('--width <width>', 'Resize width')
    .option('--height <height>', 'Resize height')
    .option('--quality <quality>', 'JPEG quality (1-100)', '85')
    .action(async (file, options) => {
      await imageUploadAction(file, options);
    });
}
