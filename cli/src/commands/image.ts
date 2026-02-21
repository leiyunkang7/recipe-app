import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { Config } from '../config';
import { ImageService } from '@recipe-app/image-service';

export function imageUploadCommand(config: Config): Command {
  return new Command('image')
    .description('Image operations')
    .command('upload')
    .description('Upload an image to Supabase Storage')
    .argument('<file>', 'Path to image file')
    .option('--width <width>', 'Resize width')
    .option('--height <height>', 'Resize height')
    .option('--quality <quality>', 'JPEG quality (1-100)', '85')
    .action(async (file, options) => {
      const service = new ImageService(config.supabaseUrl, config.supabaseServiceKey);

      console.log(chalk.gray(`Uploading ${file}...`));

      const uploadOptions: any = {
        compress: true,
        quality: parseInt(options.quality),
      };

      if (options.width) uploadOptions.width = parseInt(options.width);
      if (options.height) uploadOptions.height = parseInt(options.height);

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
