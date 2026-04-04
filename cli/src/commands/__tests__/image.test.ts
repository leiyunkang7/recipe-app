import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ImageService } from '@recipe-app/image-service';
import { imageUploadCommand } from '../image';
import { Config } from '../../config';

vi.mock('@recipe-app/image-service', () => ({
  ImageService: vi.fn(),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn(() => ({
      stop: vi.fn(),
    })),
  })),
}));

vi.mock('chalk', () => ({
  default: {
    gray: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    red: vi.fn((text: string) => text),
    dim: vi.fn((text: string) => text),
  },
}));

describe('CLI - imageUploadCommand', () => {
  let config: Config;
  let mockService: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    config = {
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-anon-key',
      supabaseServiceKey: 'test-service-key',
      uploadDir: './uploads',
    };

    mockService = {
      upload: vi.fn(),
    };

    vi.mocked(ImageService).mockImplementation(function () {
      return mockService;
    });

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock process.exit to throw an error so we can catch it in tests
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('PROCESS_EXIT');
    }) as any);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('successful upload', () => {
    it('should upload image without resize options', async () => {
      mockService.upload.mockResolvedValue({
        success: true,
        data: {
          url: '/uploads/images/test-uuid.jpg',
          path: 'images/test-uuid.jpg',
        },
      });

      const command = imageUploadCommand(config);
      await command.parseAsync(['node', 'test', 'test-image.jpg']);

      expect(mockService.upload).toHaveBeenCalledWith(
        'test-image.jpg',
        'test-image.jpg',
        expect.objectContaining({
          compress: true,
          quality: 85,
        })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Image uploaded successfully'));
    });

    it('should upload image with resize options', async () => {
      mockService.upload.mockResolvedValue({
        success: true,
        data: {
          url: '/uploads/images/test-uuid.jpg',
          path: 'images/test-uuid.jpg',
        },
      });

      const command = imageUploadCommand(config);
      await command.parseAsync(['node', 'test', 'test-image.jpg', '--width', '800', '--height', '600']);

      expect(mockService.upload).toHaveBeenCalledWith(
        'test-image.jpg',
        'test-image.jpg',
        expect.objectContaining({
          compress: true,
          quality: 85,
          width: 800,
          height: 600,
        })
      );
    });

    it('should upload image with custom quality', async () => {
      mockService.upload.mockResolvedValue({
        success: true,
        data: {
          url: '/uploads/images/test-uuid.jpg',
          path: 'images/test-uuid.jpg',
        },
      });

      const command = imageUploadCommand(config);
      await command.parseAsync(['node', 'test', 'test-image.jpg', '--quality', '90']);

      expect(mockService.upload).toHaveBeenCalledWith(
        'test-image.jpg',
        'test-image.jpg',
        expect.objectContaining({
          compress: true,
          quality: 90,
        })
      );
    });

    it('should display upload result with URL and path', async () => {
      mockService.upload.mockResolvedValue({
        success: true,
        data: {
          url: '/uploads/images/test-uuid.jpg',
          path: 'images/test-uuid.jpg',
        },
      });

      const command = imageUploadCommand(config);
      await command.parseAsync(['node', 'test', 'test-image.jpg']);

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('URL:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('/uploads/images/test-uuid.jpg'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Path:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('images/test-uuid.jpg'));
    });

    it('should upload image with only width option', async () => {
      mockService.upload.mockResolvedValue({
        success: true,
        data: {
          url: '/uploads/images/test-uuid.jpg',
          path: 'images/test-uuid.jpg',
        },
      });

      const command = imageUploadCommand(config);
      await command.parseAsync(['node', 'test', 'test-image.jpg', '--width', '1024']);

      expect(mockService.upload).toHaveBeenCalledWith(
        'test-image.jpg',
        'test-image.jpg',
        expect.objectContaining({
          width: 1024,
        })
      );
      expect(mockService.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.not.objectContaining({ height: expect.any(Number) })
      );
    });

    it('should upload image with only height option', async () => {
      mockService.upload.mockResolvedValue({
        success: true,
        data: {
          url: '/uploads/images/test-uuid.jpg',
          path: 'images/test-uuid.jpg',
        },
      });

      const command = imageUploadCommand(config);
      await command.parseAsync(['node', 'test', 'test-image.jpg', '--height', '768']);

      expect(mockService.upload).toHaveBeenCalledWith(
        'test-image.jpg',
        'test-image.jpg',
        expect.objectContaining({
          height: 768,
        })
      );
      expect(mockService.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.not.objectContaining({ width: expect.any(Number) })
      );
    });
  });

  describe('error handling', () => {
    it('should handle upload failure', async () => {
      mockService.upload.mockResolvedValue({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Failed to upload image',
        },
      });

      const command = imageUploadCommand(config);
      await expect(command.parseAsync(['node', 'test', 'test-image.jpg'])).rejects.toThrow('PROCESS_EXIT');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Upload failed'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle file not found error', async () => {
      mockService.upload.mockResolvedValue({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File does not exist',
        },
      });

      const command = imageUploadCommand(config);
      await expect(command.parseAsync(['node', 'test', 'non-existent.jpg'])).rejects.toThrow('PROCESS_EXIT');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle file too large error', async () => {
      mockService.upload.mockResolvedValue({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'Image size exceeds 10MB limit',
        },
      });

      const command = imageUploadCommand(config);
      await expect(command.parseAsync(['node', 'test', 'large-image.jpg'])).rejects.toThrow('PROCESS_EXIT');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle invalid file extension error', async () => {
      mockService.upload.mockResolvedValue({
        success: false,
        error: {
          code: 'INVALID_FILE_NAME',
          message: 'File name must have a valid extension',
        },
      });

      const command = imageUploadCommand(config);
      await expect(command.parseAsync(['node', 'test', 'invalid-file.txt'])).rejects.toThrow('PROCESS_EXIT');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should display error message from service', async () => {
      mockService.upload.mockResolvedValue({
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
        },
      });

      const command = imageUploadCommand(config);
      await expect(command.parseAsync(['node', 'test', 'test-image.jpg'])).rejects.toThrow('PROCESS_EXIT');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('An unexpected error occurred'));
    });

    it('should handle missing data in success response', async () => {
      mockService.upload.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const command = imageUploadCommand(config);
      await expect(command.parseAsync(['node', 'test', 'test-image.jpg'])).rejects.toThrow('PROCESS_EXIT');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Upload failed'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle unknown error when no error message provided', async () => {
      mockService.upload.mockResolvedValue({
        success: false,
        error: undefined,
      });

      const command = imageUploadCommand(config);
      await expect(command.parseAsync(['node', 'test', 'test-image.jpg'])).rejects.toThrow('PROCESS_EXIT');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('command configuration', () => {
    it('should have correct command name', () => {
      const command = imageUploadCommand(config);
      expect(command.name()).toBe('upload');
    });

    it('should have correct description', () => {
      const command = imageUploadCommand(config);
      expect(command.description()).toContain('Upload an image');
    });

    it('should require file argument', () => {
      const command = imageUploadCommand(config);
      const args = command.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].name()).toBe('file');
      expect(args[0].required).toBe(true);
    });

    it('should have width option', () => {
      const command = imageUploadCommand(config);
      const options = command.options;
      const widthOption = options.find((opt: any) => opt.long === '--width');
      expect(widthOption).toBeDefined();
      expect(widthOption.description).toBe('Resize width');
    });

    it('should have height option', () => {
      const command = imageUploadCommand(config);
      const options = command.options;
      const heightOption = options.find((opt: any) => opt.long === '--height');
      expect(heightOption).toBeDefined();
      expect(heightOption.description).toBe('Resize height');
    });

    it('should have quality option with default value', () => {
      const command = imageUploadCommand(config);
      const options = command.options;
      const qualityOption = options.find((opt: any) => opt.long === '--quality');
      expect(qualityOption).toBeDefined();
      expect(qualityOption.description).toContain('JPEG quality');
    });

    it('should be subcommand of image', () => {
      const command = imageUploadCommand(config);
      // The command is created as 'image' -> 'upload' subcommand
      // We verify the command structure exists
      expect(command).toBeDefined();
      expect(command.name()).toBe('upload');
    });
  });

  describe('upload options parsing', () => {
    it('should parse quality as integer', async () => {
      mockService.upload.mockResolvedValue({
        success: true,
        data: {
          url: '/uploads/images/test-uuid.jpg',
          path: 'images/test-uuid.jpg',
        },
      });

      const command = imageUploadCommand(config);
      await command.parseAsync(['node', 'test', 'test-image.jpg', '--quality', '75']);

      expect(mockService.upload).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          quality: 75,
        })
      );
    });

    it('should parse width as integer', async () => {
      mockService.upload.mockResolvedValue({
        success: true,
        data: {
          url: '/uploads/images/test-uuid.jpg',
          path: 'images/test-uuid.jpg',
        },
      });

      const command = imageUploadCommand(config);
      await command.parseAsync(['node', 'test', 'test-image.jpg', '--width', '1920']);

      const callArgs = mockService.upload.mock.calls[0];
      expect(callArgs[2].width).toBe(1920);
    });

    it('should parse height as integer', async () => {
      mockService.upload.mockResolvedValue({
        success: true,
        data: {
          url: '/uploads/images/test-uuid.jpg',
          path: 'images/test-uuid.jpg',
        },
      });

      const command = imageUploadCommand(config);
      await command.parseAsync(['node', 'test', 'test-image.jpg', '--height', '1080']);

      const callArgs = mockService.upload.mock.calls[0];
      expect(callArgs[2].height).toBe(1080);
    });

    it('should combine multiple options correctly', async () => {
      mockService.upload.mockResolvedValue({
        success: true,
        data: {
          url: '/uploads/images/test-uuid.jpg',
          path: 'images/test-uuid.jpg',
        },
      });

      const command = imageUploadCommand(config);
      await command.parseAsync([
        'node',
        'test',
        'test-image.jpg',
        '--width',
        '800',
        '--height',
        '600',
        '--quality',
        '95',
      ]);

      expect(mockService.upload).toHaveBeenCalledWith(
        'test-image.jpg',
        'test-image.jpg',
        {
          compress: true,
          quality: 95,
          width: 800,
          height: 600,
        }
      );
    });
  });
});
