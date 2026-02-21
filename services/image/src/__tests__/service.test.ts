import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageService } from '../service';
import { ImageUploadOptions } from '@recipe-app/shared-types';

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        remove: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } })),
      })),
    },
  })),
}));

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn(() => ({
      jpeg: vi.fn(() => ({
        toBuffer: vi.fn(),
      })),
    })),
    jpeg: vi.fn(() => ({
      toBuffer: vi.fn(),
    })),
  })),
}));

vi.mock('fs', () => ({
  readFileSync: vi.fn(() => Buffer.from('fake-image-data')),
  unlinkSync: vi.fn(),
}));

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
}));

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

describe('ImageService', () => {
  let service: ImageService;
  let mockStorage: any;
  let mockUpload: any;

  beforeEach(() => {
    vi.clearAllMocks();

    const mockClient = createClient('https://test.supabase.co', 'test-key');
    service = new ImageService('https://test.supabase.co', 'test-key');

    mockStorage = mockClient.storage.from('recipe-images');
    mockUpload = vi.fn();
    mockStorage.upload = mockUpload;
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
      const sharpInstance = sharp();
      const resizeSpy = vi.spyOn(sharpInstance, 'resize');

      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      const options: ImageUploadOptions = {
        width: 800,
        height: 600,
      };

      await service.upload('/path/to/image.jpg', 'image.jpg', options);

      expect(resizeSpy).toHaveBeenCalledWith(800, 600, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    });

    it('should upload with custom quality', async () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      const options: ImageUploadOptions = {
        quality: 90,
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
      expect(result.error?.code).toBe('UPLOAD_ERROR');
    });

    it('should handle file read errors', async () => {
      (readFileSync as any).mockImplementationOnce(() => {
        throw new Error('File not found');
      });

      const result = await service.upload('/path/to/nonexistent.jpg', 'image.jpg', {} as ImageUploadOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('should generate unique filename with UUID', async () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      await service.upload('/path/to/image.jpg', 'image.jpg', {} as ImageUploadOptions);

      expect(randomUUID).toHaveBeenCalled();
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('recipes/'),
        expect.any(Buffer),
        expect.objectContaining({
          contentType: 'image/jpeg',
        })
      );
    });

    it('should detect correct MIME type for jpg', async () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      await service.upload('/path/to/image.jpg', 'image.jpg', {} as ImageUploadOptions);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          contentType: 'image/jpeg',
        })
      );
    });

    it('should detect correct MIME type for png', async () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      await service.upload('/path/to/image.png', 'image.png', {} as ImageUploadOptions);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          contentType: 'image/png',
        })
      );
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

      // Verify sharp pipeline was called
      expect(sharp).toHaveBeenCalled();
    });

    it('should handle image processing errors', async () => {
      const sharpInstance = sharp();
      (sharpInstance as any).resize = vi.fn(() => {
        throw new Error('Processing failed');
      });

      const result = await service.upload('/path/to/image.jpg', 'image.jpg', {
        width: 800,
      } as ImageUploadOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
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
      expect(result.data).toHaveLength(2);
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
      expect(result.error?.code).toBe('PARTIAL_FAILURE');
    });

    it('should handle all failures', async () => {
      mockUpload.mockResolvedValue({
        data: null,
        error: { message: 'Upload failed' },
      });

      const files = [
        { path: '/path/to/image1.jpg', name: 'image1.jpg' },
        { path: '/path/to/image2.jpg', name: 'image2.jpg' },
      ];

      const result = await service.uploadMultiple(files, {} as ImageUploadOptions);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PARTIAL_FAILURE');
    });

    it('should handle empty file list', async () => {
      const result = await service.uploadMultiple([], {} as ImageUploadOptions);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should apply same options to all uploads', async () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      const files = [
        { path: '/path/to/image1.jpg', name: 'image1.jpg' },
        { path: '/path/to/image2.jpg', name: 'image2.jpg' },
      ];

      const options: ImageUploadOptions = {
        width: 800,
        quality: 90,
      };

      await service.uploadMultiple(files, options);

      expect(mockUpload).toHaveBeenCalledTimes(2);
    });
  });

  describe('delete', () => {
    it('should delete an image successfully', async () => {
      const mockRemove = vi.fn().mockResolvedValue({
        error: null,
      });

      const mockClient = createClient('https://test.supabase.co', 'test-key');
      const storage = mockClient.storage.from('recipe-images');
      storage.remove = mockRemove;

      const result = await service.delete('recipes/image.jpg');

      expect(result.success).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith(['recipes/image.jpg']);
    });

    it('should handle delete errors', async () => {
      const mockRemove = vi.fn().mockResolvedValue({
        error: { message: 'Delete failed' },
      });

      const mockClient = createClient('https://test.supabase.co', 'test-key');
      const storage = mockClient.storage.from('recipe-images');
      storage.remove = mockRemove;

      const result = await service.delete('recipes/image.jpg');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DELETE_ERROR');
    });

    it('should handle unknown errors', async () => {
      const mockRemove = vi.fn().mockImplementation(() => {
        throw new Error('Unknown error');
      });

      const mockClient = createClient('https://test.supabase.co', 'test-key');
      const storage = mockClient.storage.from('recipe-images');
      storage.remove = mockRemove;

      const result = await service.delete('recipes/image.jpg');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('getUrl', () => {
    it('should return public URL for an image', () => {
      const url = service.getUrl('recipes/image.jpg');

      expect(url).toBe('https://example.com/image.jpg');
    });

    it('should work with different paths', () => {
      const url = service.getUrl('recipes/subfolder/image.png');

      expect(url).toBe('https://example.com/image.jpg');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension correctly', () => {
      const service = new ImageService('https://test.supabase.co', 'test-key');

      // Test through upload
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      service.upload('/path/to/image.jpg', 'test.jpg', {} as ImageUploadOptions);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/\.jpg$/),
        expect.anything(),
        expect.anything()
      );
    });

    it('should handle multiple dots in filename', () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      service.upload('/path/to/image.test.jpg', 'image.test.jpg', {} as ImageUploadOptions);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/\.jpg$/),
        expect.anything(),
        expect.anything()
      );
    });

    it('should convert extension to lowercase', () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      service.upload('/path/to/image.JPG', 'image.JPG', {} as ImageUploadOptions);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/\.jpg$/),
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME type for jpg', () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      service.upload('/path/to/image.jpg', 'image.jpg', {} as ImageUploadOptions);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          contentType: 'image/jpeg',
        })
      );
    });

    it('should return correct MIME type for png', () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      service.upload('/path/to/image.png', 'image.png', {} as ImageUploadOptions);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          contentType: 'image/png',
        })
      );
    });

    it('should return correct MIME type for gif', () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      service.upload('/path/to/image.gif', 'image.gif', {} as ImageUploadOptions);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          contentType: 'image/gif',
        })
      );
    });

    it('should return correct MIME type for webp', () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      service.upload('/path/to/image.webp', 'image.webp', {} as ImageUploadOptions);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          contentType: 'image/webp',
        })
      );
    });

    it('should default to jpeg for unknown extensions', () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      service.upload('/path/to/image.xyz', 'image.xyz', {} as ImageUploadOptions);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          contentType: 'image/jpeg',
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty filename', async () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      const result = await service.upload('/path/to/file', '', {} as ImageUploadOptions);

      expect(result.success).toBe(true);
    });

    it('should handle filename without extension', async () => {
      mockUpload.mockResolvedValue({
        data: mockUploadResult,
        error: null,
      });

      const result = await service.upload('/path/to/imagefile', 'imagefile', {} as ImageUploadOptions);

      expect(result.success).toBe(true);
    });

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
});
