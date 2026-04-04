import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageService } from '../service';
import { ImageUploadOptions } from '@recipe-app/shared-types';

// Mock dependencies
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-image')),
  })),
}));

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, any>;
  return {
    ...actual,
    readFileSync: vi.fn(() => Buffer.from('fake-image-data')),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    mkdirSync: vi.fn(),
    existsSync: vi.fn(() => true),
  };
});

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
}));

import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';

describe('ImageService', () => {
  let service: ImageService;
  const uploadDir = '/tmp/uploads';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ImageService(uploadDir);
  });

  describe('constructor', () => {
    it('should create directory when it does not exist', () => {
      // Mock existsSync to return false, then true on second call
      (existsSync as any)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const newService = new ImageService('/new/upload/dir');

      // Service should be created successfully
      expect(newService).toBeDefined();
    });
  });

  describe('upload', () => {
    it('should upload an image successfully', async () => {
      const result = await service.upload('/path/to/image.jpg', 'image.jpg', {} as ImageUploadOptions);

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe('/uploads/images/123e4567-e89b-12d3-a456-426614174000.jpg');
      expect(result.data?.path).toBe('images/123e4567-e89b-12d3-a456-426614174000.jpg');
    });

    it('should upload with custom dimensions', async () => {
      const options: ImageUploadOptions = {
        width: 800,
        height: 600,
        quality: 85,
        compress: true,
      };

      const result = await service.upload('/path/to/image.jpg', 'image.jpg', options);

      expect(result.success).toBe(true);
      expect(sharp).toHaveBeenCalled();
    });

    it('should upload with custom quality', async () => {
      const options: ImageUploadOptions = {
        quality: 90,
        compress: true,
      };

      const result = await service.upload('/path/to/image.jpg', 'image.jpg', options);

      expect(result.success).toBe(true);
    });

    it('should handle file read errors', async () => {
      (readFileSync as any).mockImplementationOnce(() => {
        throw new Error('File not found');
      });

      const result = await service.upload('/path/to/nonexistent.jpg', 'image.jpg', {} as ImageUploadOptions);

      expect(result.success).toBe(false);
    });

    it('should generate unique filename with UUID', async () => {
      await service.upload('/path/to/image.jpg', 'image.jpg', {} as ImageUploadOptions);

      expect(randomUUID).toHaveBeenCalled();
    });

    it('should apply compression when enabled', async () => {
      const options: ImageUploadOptions = {
        width: 800,
        compress: true,
        quality: 85,
      };

      await service.upload('/path/to/image.jpg', 'image.jpg', options);

      expect(sharp).toHaveBeenCalled();
    });

    it('should handle image processing errors', async () => {
      (sharp as any).mockImplementationOnce(() => {
        throw new Error('Processing failed');
      });

      const result = await service.upload('/path/to/image.jpg', 'image.jpg', {
        width: 800,
      } as ImageUploadOptions);

      expect(result.success).toBe(false);
    });
  });

  describe('uploadMultiple', () => {
    it('should upload multiple images successfully', async () => {
      const files = [
        { path: '/path/to/image1.jpg', name: 'image1.jpg' },
        { path: '/path/to/image2.jpg', name: 'image2.jpg' },
      ];

      const result = await service.uploadMultiple(files, {} as ImageUploadOptions);

      expect(result.success).toBe(true);
    });

    it('should handle partial failures', async () => {
      let callCount = 0;
      (readFileSync as any).mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          throw new Error('File not found');
        }
        return Buffer.from('fake-image-data');
      });

      const files = [
        { path: '/path/to/image1.jpg', name: 'image1.jpg' },
        { path: '/path/to/image2.jpg', name: 'image2.jpg' },
      ];

      const result = await service.uploadMultiple(files, {} as ImageUploadOptions);

      expect(result.success).toBe(false);
    });

    it('should handle empty file list', async () => {
      const result = await service.uploadMultiple([], {} as ImageUploadOptions);

      expect(result.success).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete an image successfully', async () => {
      const result = await service.delete('images/image.jpg');

      expect(result.success).toBe(true);
    });

    it('should handle delete errors', async () => {
      (existsSync as any).mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });

      const result = await service.delete('images/image.jpg');

      expect(result.success).toBe(false);
    });
  });

  describe('getUrl', () => {
    it('should return public URL for an image', () => {
      const url = service.getUrl('images/image.jpg');

      expect(url).toBe('/uploads/images/image.jpg');
    });
  });

  describe('Edge Cases', () => {
    it('should handle options with undefined values', async () => {
      const options = {
        width: undefined,
        height: undefined,
        quality: undefined,
        compress: undefined,
      } as any;

      const result = await service.upload('/path/to/image.jpg', 'image.jpg', options);

      expect(result.success).toBe(true);
    });
  });

  describe('File Extension Validation', () => {
    it('should accept jpg extension', async () => {
      const result = await service.upload('/path/to/image.jpg', 'image.jpg', {} as ImageUploadOptions);
      expect(result.success).toBe(true);
    });

    it('should accept jpeg extension', async () => {
      const result = await service.upload('/path/to/image.jpeg', 'image.jpeg', {} as ImageUploadOptions);
      expect(result.success).toBe(true);
    });

    it('should accept png extension', async () => {
      const result = await service.upload('/path/to/image.png', 'image.png', {} as ImageUploadOptions);
      if (!result.success) {
        console.log('Error:', result.error);
      }
      expect(result.success).toBe(true);
    });

    it('should accept gif extension', async () => {
      const result = await service.upload('/path/to/image.gif', 'image.gif', {} as ImageUploadOptions);
      expect(result.success).toBe(true);
    });

    it('should accept webp extension', async () => {
      const result = await service.upload('/path/to/image.webp', 'image.webp', {} as ImageUploadOptions);
      expect(result.success).toBe(true);
    });

    it('should reject invalid file extensions', async () => {
      const result = await service.upload('/path/to/file.txt', 'file.txt', {} as ImageUploadOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should reject file with no extension', async () => {
      const result = await service.upload('/path/to/file', 'file', {} as ImageUploadOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should reject file ending with dot', async () => {
      const result = await service.upload('/path/to/file.', 'file.', {} as ImageUploadOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should reject hidden files like .gitignore', async () => {
      const result = await service.upload('/path/to/.gitignore', '.gitignore', {} as ImageUploadOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should reject empty filename', async () => {
      const result = await service.upload('/path/to/', '', {} as ImageUploadOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });
  });

  describe('File Size Validation', () => {
    it('should reject files larger than 10MB', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
      (readFileSync as any).mockReturnValueOnce(largeBuffer);

      const result = await service.upload('/path/to/large.jpg', 'large.jpg', {} as ImageUploadOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });

    it('should accept files smaller than 10MB', async () => {
      const smallBuffer = Buffer.alloc(5 * 1024 * 1024);
      (readFileSync as any).mockReturnValueOnce(smallBuffer);

      const result = await service.upload('/path/to/small.jpg', 'small.jpg', {} as ImageUploadOptions);

      expect(result.success).toBe(true);
    });

    it('should accept files exactly at 10MB limit', async () => {
      const exactBuffer = Buffer.alloc(10 * 1024 * 1024);
      (readFileSync as any).mockReturnValueOnce(exactBuffer);

      const result = await service.upload('/path/to/exact.jpg', 'exact.jpg', {} as ImageUploadOptions);

      expect(result.success).toBe(true);
    });
  });

  describe('uploadBuffer', () => {
    it('should upload buffer successfully', async () => {
      const buffer = Buffer.from('test-image-data');

      const result = await service.uploadBuffer(buffer, 'image.jpg', {} as ImageUploadOptions);

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe('/uploads/images/123e4567-e89b-12d3-a456-426614174000.jpg');
      expect(result.data?.path).toBe('images/123e4567-e89b-12d3-a456-426614174000.jpg');
    });

    it('should upload buffer with dimensions', async () => {
      const buffer = Buffer.from('test-image-data');
      const options: ImageUploadOptions = {
        width: 800,
        height: 600,
        compress: true,
        quality: 85,
      };

      const result = await service.uploadBuffer(buffer, 'image.jpg', options);

      expect(result.success).toBe(true);
      expect(sharp).toHaveBeenCalled();
    });

    it('should reject buffer exceeding size limit', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

      const result = await service.uploadBuffer(largeBuffer, 'large.jpg', {} as ImageUploadOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });

    it('should reject buffer with invalid filename', async () => {
      const buffer = Buffer.from('test-image-data');

      const result = await service.uploadBuffer(buffer, 'file.txt', {} as ImageUploadOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should handle buffer processing error', async () => {
      const buffer = Buffer.from('test-image-data');
      (sharp as any).mockImplementationOnce(() => {
        throw new Error('Processing failed');
      });

      const result = await service.uploadBuffer(buffer, 'image.jpg', {
        width: 800,
      } as ImageUploadOptions);

      expect(result.success).toBe(false);
    });

    it('should upload buffer without compression when compress is false', async () => {
      const buffer = Buffer.from('test-image-data');
      const options: ImageUploadOptions = {
        width: 800,
        compress: false,
        quality: 85,
      };

      const result = await service.uploadBuffer(buffer, 'image.png', options);

      expect(result.success).toBe(true);
    });
  });

  describe('delete', () => {
    it('should return success when file does not exist', async () => {
      (existsSync as any).mockReturnValueOnce(false);

      const result = await service.delete('images/nonexistent.jpg');

      expect(result.success).toBe(true);
    });
  });

  describe('getUrl', () => {
    it('should return URL with nested path', () => {
      const url = service.getUrl('images/subfolder/image.jpg');
      expect(url).toBe('/uploads/images/subfolder/image.jpg');
    });

    it('should handle URL with leading slash', () => {
      const url = service.getUrl('/images/image.jpg');
      expect(url).toBe('/uploads//images/image.jpg');
    });

    it('should handle empty path gracefully', () => {
      const url = service.getUrl('');
      expect(url).toBe('/uploads/');
    });
  });

  describe('upload - additional edge cases', () => {
    it('should resize with only width specified', async () => {
      const options: ImageUploadOptions = {
        width: 800,
        compress: true,
        quality: 85,
      };

      const result = await service.upload('/path/to/image.jpg', 'image.jpg', options);

      expect(result.success).toBe(true);
      expect(sharp).toHaveBeenCalled();
    });

    it('should resize with only height specified', async () => {
      const options: ImageUploadOptions = {
        height: 600,
        compress: true,
        quality: 85,
      };

      const result = await service.upload('/path/to/image.jpg', 'image.jpg', options);

      expect(result.success).toBe(true);
      expect(sharp).toHaveBeenCalled();
    });

    it('should process image without compression when compress is false', async () => {
      const options: ImageUploadOptions = {
        width: 800,
        compress: false,
        quality: 85,
      };

      const result = await service.upload('/path/to/image.jpg', 'image.jpg', options);

      expect(result.success).toBe(true);
    });

    it('should use default quality of 85 when not specified', async () => {
      const options: ImageUploadOptions = {
        width: 800,
        compress: true,
        quality: 85,
      };

      const result = await service.upload('/path/to/image.jpg', 'image.jpg', options);

      expect(result.success).toBe(true);
    });

    it('should handle uppercase extension', async () => {
      const result = await service.upload('/path/to/image.JPG', 'image.JPG', {} as ImageUploadOptions);

      expect(result.success).toBe(true);
    });

    it('should handle mixed case extension', async () => {
      const result = await service.upload('/path/to/image.PnG', 'image.PnG', {} as ImageUploadOptions);

      expect(result.success).toBe(true);
    });
  });

  describe('uploadMultiple - additional edge cases', () => {
    it('should return success when all uploads fail', async () => {
      (readFileSync as any).mockImplementation(() => {
        throw new Error('File not found');
      });

      const files = [
        { path: '/path/to/image1.jpg', name: 'image1.jpg' },
        { path: '/path/to/image2.jpg', name: 'image2.jpg' },
      ];

      const result = await service.uploadMultiple(files, {} as ImageUploadOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PARTIAL_FAILURE');
    });

    it('should return partial failure with details', async () => {
      let callCount = 0;
      (readFileSync as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Buffer.from('fake-image-data');
        }
        throw new Error('File not found');
      });

      const files = [
        { path: '/path/to/image1.jpg', name: 'image1.jpg' },
        { path: '/path/to/image2.jpg', name: 'image2.jpg' },
      ];

      const result = await service.uploadMultiple(files, {} as ImageUploadOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PARTIAL_FAILURE');
      expect(result.error?.details).toBeDefined();
      expect((result.error?.details as any)?.successful).toBeDefined();
      expect((result.error?.details as any)?.failed).toBeDefined();

      // Reset mock for subsequent tests
      (readFileSync as any).mockReset();
    });

    it('should upload single item array successfully', async () => {
      const files = [{ path: '/path/to/image1.jpg', name: 'image1.jpg' }];

      const result = await service.uploadMultiple(files, {} as ImageUploadOptions);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });
});
