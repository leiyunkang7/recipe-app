"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageUploadCommand = imageUploadCommand;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const image_service_1 = require("@recipe-app/image-service");
function imageUploadCommand(config) {
    return new commander_1.Command('image')
        .description('Image operations')
        .command('upload')
        .description('Upload an image to Supabase Storage')
        .argument('<file>', 'Path to image file')
        .option('--width <width>', 'Resize width')
        .option('--height <height>', 'Resize height')
        .option('--quality <quality>', 'JPEG quality (1-100)', '85')
        .action(async (file, options) => {
        const service = new image_service_1.ImageService(config.supabaseUrl, config.supabaseServiceKey);
        console.log(chalk_1.default.gray(`Uploading ${file}...`));
        const uploadOptions = {
            compress: true,
            quality: parseInt(options.quality),
        };
        if (options.width)
            uploadOptions.width = parseInt(options.width);
        if (options.height)
            uploadOptions.height = parseInt(options.height);
        const spinner = (0, ora_1.default)('Uploading...').start();
        const result = await service.upload(file, file, uploadOptions);
        spinner.stop();
        if (!result.success || !result.data) {
            console.error(chalk_1.default.red('✗ Upload failed'));
            console.error(chalk_1.default.red(result.error?.message || 'Unknown error'));
            process.exit(1);
        }
        const { url, path } = result.data;
        console.log(chalk_1.default.green('✓ Image uploaded successfully!'));
        console.log(chalk_1.default.dim(`URL:  ${url}`));
        console.log(chalk_1.default.dim(`Path: ${path}`));
    });
}
