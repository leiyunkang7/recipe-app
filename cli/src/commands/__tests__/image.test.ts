import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ImageService } from '@recipe-app/image-service';
import { RecipeService } from '@recipe-app/recipe-service';
import { imageUploadCommand, validateDimension } from '../image';

vi.mock('@recipe-app/image-service', () => ({
  ImageService: vi.fn(),
}));

vi.mock('@recipe-app/recipe-service', () => ({
  RecipeService: vi.fn(),
}));

vi.mock('../index', () => ({
  getDb: vi.fn(() => ({})),
  getConfig: vi.fn(() => ({})),
}));

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

vi.mock('chalk', () => ({
  default: {
    gray: vi.fn((text: string) => text),
    green: vi.fn((text: string) => text),
    red: vi.fn((text: string) => text),
    yellow: vi.fn((text: string) => text),
    bold: vi.fn((text: string) => text),
    dim: vi.fn((text: string) => text),
  },
}));

describe('CLI - imageUploadCommand', () => {
  let mockImageService: any;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    mockImageService = {
      upload: vi.fn(),
    };

    vi.mocked(ImageService).mockImplementation(function () {
      return mockImageService;
    });

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`PROCESS_EXIT_${code}`);
    }) as any;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('upload action', () => {
    it('should upload image successfully', async () => {
      mockImageService.upload.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/image.jpg', path: '/uploads/image.jpg' },
      });

      const command = imageUploadCommand();
      await command.parseAsync(['node', 'test', 'image.jpg']);

      expect(mockImageService.upload).toHaveBeenCalledWith('image.jpg', 'image.jpg', expect.any(Object));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Image uploaded successfully'));
    });

    it('should upload image with width option', async () => {
      mockImageService.upload.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/image.jpg', path: '/uploads/image.jpg' },
      });

      const command = imageUploadCommand();
      await command.parseAsync(['node', 'test', 'image.jpg', '--width', '800']);

      expect(mockImageService.upload).toHaveBeenCalledWith(
        'image.jpg',
        'image.jpg',
        expect.objectContaining({ width: 800 })
      );
    });

    it('should upload image with height option', async () => {
      mockImageService.upload.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/image.jpg', path: '/uploads/image.jpg' },
      });

      const command = imageUploadCommand();
      await command.parseAsync(['node', 'test', 'image.jpg', '--height', '600']);

      expect(mockImageService.upload).toHaveBeenCalledWith(
        'image.jpg',
        'image.jpg',
        expect.objectContaining({ height: 600 })
      );
    });

    it('should upload image with both width and height options', async () => {
      mockImageService.upload.mockResolvedValue({
        success: true,
        data: { url: 'https://example.com/image.jpg', path: '/uploads/image.jpg' },
      });

      const command = imageUploadCommand();
      await command.parseAsync(['node', 'test', 'image.jpg', '--width', '800', '--height', '600']);

      expect(mockImageService.upload).toHaveBeenCalledWith(
        'image.jpg',
        'image.jpg',
        expect.objectContaining({ width: 800, height: 600 })
      );
    });

    it('should handle upload failure', async () => {
      mockImageService.upload.mockResolvedValue({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Failed to upload image',
        },
      });

      const command = imageUploadCommand();
      await expect(command.parseAsync(['node', 'test', 'image.jpg'])).rejects.toThrow('PROCESS_EXIT_1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Upload failed'));
    });

    it('should handle missing data in upload response', async () => {
      mockImageService.upload.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const command = imageUploadCommand();
      await expect(command.parseAsync(['node', 'test', 'image.jpg'])).rejects.toThrow('PROCESS_EXIT_1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Upload failed'));
    });
  });

  describe('validateDimension function', () => {
    it('should return undefined for undefined value', () => {
      const result = validateDimension(undefined, 'Width');
      expect(result).toBeUndefined();
    });

    it('should return parsed number for valid positive integer', () => {
      const result = validateDimension('800', 'Width');
      expect(result).toBe(800);
    });

    it('should exit with error for zero value', () => {
      expect(() => validateDimension('0', 'Width')).toThrow('PROCESS_EXIT_1');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Width must be a positive number'));
    });

    it('should exit with error for negative value', () => {
      expect(() => validateDimension('-100', 'Height')).toThrow('PROCESS_EXIT_1');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Height must be a positive number'));
    });

    it('should exit with error for non-numeric value', () => {
      expect(() => validateDimension('abc', 'Width')).toThrow('PROCESS_EXIT_1');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Width must be a positive number'));
    });

    it('should exit with error for value exceeding max (10000)', () => {
      expect(() => validateDimension('10001', 'Width')).toThrow('PROCESS_EXIT_1');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Width is too large'));
    });

    it('should accept max value of 10000', () => {
      const result = validateDimension('10000', 'Width');
      expect(result).toBe(10000);
    });

    it('should handle decimal string by parsing as integer', () => {
      const result = validateDimension('800.5', 'Width');
      expect(result).toBe(800);
    });
  });

  describe('command configuration', () => {
    it('should have correct command name', () => {
      const command = imageUploadCommand();
      expect(command.name()).toBe('upload');
    });

    it('should have correct description', () => {
      const command = imageUploadCommand();
      expect(command.description()).toContain('Upload an image');
    });

    it('should require file argument', () => {
      const command = imageUploadCommand();
      const args = command.registeredArguments;
      expect(args).toHaveLength(1);
      expect(args[0].name()).toBe('file');
    });
  });
});
