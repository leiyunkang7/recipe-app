import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ImageService } from '@recipe-app/image-service';
import type { ImageUploadOptions } from '@recipe-app/shared-types';
import { getConfig } from '../index';

/**
 * Validate dimension value (width/height)
 * Exported for unit testing
 */
export function validateDimension(value: string | undefined, name: string): number | undefined {
  if (!value) return undefined;
  const num = parseInt(value, 10);
  if (Number.isNaN(num) || num <= 0) {
    console.error(chalk.red(`${name} must be a positive number`));
    process.exit(1);
  }
  if (num > 10000) {
    console.error(chalk.red(`${name} is too large (max 10000)`));
    process.exit(1);
  }
  return num;
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
      const config = getConfig();
      const service = new ImageService(config.uploadDir);

      console.log(chalk.gray(`Uploading ${file}...`));

      const uploadOptions: Partial<ImageUploadOptions> = {
        compress: true,
        quality: parseInt(options.quality),
      };

      const width = validateDimension(options.width, 'Width');
      const height = validateDimension(options.height, 'Height');

      if (width !== undefined) uploadOptions.width = width;
      if (height !== undefined) uploadOptions.height = height;

      const spinner = ora('Uploading...').start();

      const result = await service.upload(file, file, uploadOptions);

      spinner.stop();

      if (!result.success || !result.data) {
        console.error(chalk.red('✗ Upload failed'));
        console.error(chalk.red(result.error?.message || 'Unknown error'));
        process.exit(1);
      }

      const { url, path } = result.data;

      console.log(chalk.green('✓ Image uploaded successfully!'));
      console.log(chalk.dim(`URL:  ${url}`));
      console.log(chalk.dim(`Path: ${path}`));
    });
}
