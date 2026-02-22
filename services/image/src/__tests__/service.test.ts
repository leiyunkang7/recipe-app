import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageService } from '../service';
import { ImageUploadOptions } from '@recipe-app/shared-types';

// Mock dependencies
let mockUpload: any;
let mockRemove: any;
let mockGetPublicUrl: any;

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  })),
}));

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('processed-image')),
  })),
}));

vi.mock('fs', () => ({
  readFileSync: vi.fn(() => Buffer.from('fake-image-data')),
  unlinkSync: vi.fn(),
}));

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
}));

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

describe('ImageService', () => {
  let service: ImageService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpload = vi.fn();
    mockRemove = vi.fn();
    mockGetPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } }));
    
    service = new ImageService('https://test.supabase.co', 'test-key');
  });

  const mockUploadResult = {
    path: 'recipes/123e4567-e89b-12d3-a456-426614174000.jpg',
    id: '123',
  };

  describe('upload', () => {
    it('should upload an image successfully', async () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      const result = await service.upload('/path/to/image.jpg', 'image.jpg', {} as ImageUploadOptions);

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe('https://example.com/image.jpg');
      expect(result.data?.path).toBe(mockUploadResult.path);
    });

    it('should upload with custom dimensions', async () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

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
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      const options: ImageUploadOptions = {
        quality: 90,
        compress: true,
      };

      const result = await service.upload('/path/to/image.jpg', 'image.jpg', options);

      expect(result.success).toBe(true);
    });

    it('should handle upload errors', async () => {
      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      const result = await service.upload('/path/to/image.jpg', 'image.jpg', {} as ImageUploadOptions);

      expect(result.success).toBe(false);
    });

    it('should handle file read errors', async () => {
      (readFileSync as any).mockImplementationOnce(() => {
        throw new Error('File not found');
      });

      const result = await service.upload('/path/to/nonexistent.jpg', 'image.jpg', {} as ImageUploadOptions);

      expect(result.success).toBe(false);
    });

    it('should generate unique filename with UUID', async () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      await service.upload('/path/to/image.jpg', 'image.jpg', {} as ImageUploadOptions);

      expect(randomUUID).toHaveBeenCalled();
    });

    it('should apply compression when enabled', async () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

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
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      const files = [
        { path: '/path/to/image1.jpg', name: 'image1.jpg' },
        { path: '/path/to/image2.jpg', name: 'image2.jpg' },
      ];

      const result = await service.uploadMultiple(files, {} as ImageUploadOptions);

      expect(result.success).toBe(true);
    });

    it('should handle partial failures', async () => {
      mockUpload
        .mockResolvedValueOnce({
          data: mockUploadResult,
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Upload failed' },
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
      mockRemove.mockResolvedValue({
        error: null,
      });

      const result = await service.delete('recipes/image.jpg');

      expect(result.success).toBe(true);
    });

    it('should handle delete errors', async () => {
      mockRemove.mockResolvedValue({
        error: { message: 'Delete failed' },
      });

      const result = await service.delete('recipes/image.jpg');

      expect(result.success).toBe(false);
    });
  });

  describe('getUrl', () => {
    it('should return public URL for an image', () => {
      const url = service.getUrl('recipes/image.jpg');

      expect(url).toBe('https://example.com/image.jpg');
    });
  });

  describe('Edge Cases', () => {
    it('should handle options with undefined values', async () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

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
    it('should accept valid image extensions', async () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

      for (const ext of validExtensions) {
        const result = await service.upload('/path/to/image.' + ext, 'image.' + ext, {} as ImageUploadOptions);
        expect(result.success).toBe(true);
      }
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
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      const smallBuffer = Buffer.alloc(5 * 1024 * 1024);
      (readFileSync as any).mockReturnValueOnce(smallBuffer);

      const result = await service.upload('/path/to/small.jpg', 'small.jpg', {} as ImageUploadOptions);

      expect(result.success).toBe(true);
    });
  });
});
