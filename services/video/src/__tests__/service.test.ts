import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoService } from '../service';
import { VideoUploadOptions } from '../service';

// Mock dependencies
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    readFileSync: vi.fn(() => Buffer.from('fake-video-data')),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    mkdirSync: vi.fn(),
    existsSync: vi.fn(() => true),
  };
});

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
}));

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';

describe('VideoService', () => {
  let service: VideoService;
  const uploadDir = '/tmp/uploads';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new VideoService(uploadDir);
  });

  const mockVideoResult = {
    path: 'videos/123e4567-e89b-12d3-a456-426614174000.mp4',
    url: '/uploads/videos/123e4567-e89b-12d3-a456-426614174000.mp4',
  };

  describe('upload', () => {
    it('should upload a video successfully', async () => {
      const result = await service.upload('/path/to/video.mp4', 'video.mp4', {});

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe(mockVideoResult.url);
      expect(result.data?.path).toBe(mockVideoResult.path);
    });

    it('should upload with custom max size', async () => {
      const options: VideoUploadOptions = {
        maxSizeMB: 50,
      };

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', options);

      expect(result.success).toBe(true);
    });

    it('should handle file read errors', async () => {
      (readFileSync as any).mockImplementationOnce(() => {
        throw new Error('File not found');
      });

      const result = await service.upload('/path/to/nonexistent.mp4', 'video.mp4', {});

      expect(result.success).toBe(false);
    });

    it('should generate unique filename with UUID', async () => {
      await service.upload('/path/to/video.mp4', 'video.mp4', {});

      expect(randomUUID).toHaveBeenCalled();
    });
  });

  describe('uploadBuffer', () => {
    it('should upload a buffer successfully', async () => {
      const buffer = Buffer.from('fake-video-data');

      const result = await service.uploadBuffer(buffer, 'video.mp4', {});

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe(mockVideoResult.url);
    });

    it('should handle buffer size limit', async () => {
      const largeBuffer = Buffer.alloc(101 * 1024 * 1024); // 101MB

      const result = await service.uploadBuffer(largeBuffer, 'video.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('delete', () => {
    it('should delete a video successfully', async () => {
      const result = await service.delete('videos/video.mp4');

      expect(result.success).toBe(true);
    });

    it('should handle delete errors', async () => {
      (existsSync as any).mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });

      const result = await service.delete('videos/video.mp4');

      expect(result.success).toBe(false);
    });
  });

  describe('getUrl', () => {
    it('should return public URL for a video', () => {
      const url = service.getUrl('videos/video.mp4');

      expect(url).toBe('/uploads/videos/video.mp4');
    });
  });

  describe('File Extension Validation', () => {
    it('should accept valid video extensions', async () => {
      const validExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

      for (const ext of validExtensions) {
        const result = await service.upload('/path/to/video.' + ext, 'video.' + ext, {});
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid file extensions', async () => {
      const result = await service.upload('/path/to/file.txt', 'file.txt', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
    });

    it('should reject file with no extension', async () => {
      const result = await service.upload('/path/to/file', 'file', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should reject file ending with dot', async () => {
      const result = await service.upload('/path/to/file.', 'file.', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should reject hidden files like .gitignore', async () => {
      const result = await service.upload('/path/to/.gitignore', '.gitignore', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should reject empty filename', async () => {
      const result = await service.upload('/path/to/', '', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });
  });

  describe('File Size Validation', () => {
    it('should reject files larger than 100MB', async () => {
      const largeBuffer = Buffer.alloc(101 * 1024 * 1024);
      (readFileSync as any).mockReturnValueOnce(largeBuffer);

      const result = await service.upload('/path/to/large.mp4', 'large.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });

    it('should accept files smaller than 100MB', async () => {
      const smallBuffer = Buffer.alloc(50 * 1024 * 1024);
      (readFileSync as any).mockReturnValueOnce(smallBuffer);

      const result = await service.upload('/path/to/small.mp4', 'small.mp4', {});

      expect(result.success).toBe(true);
    });

    it('should respect custom max size', async () => {
      const buffer = Buffer.alloc(60 * 1024 * 1024); // 60MB
      (readFileSync as any).mockReturnValueOnce(buffer);

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', { maxSizeMB: 50 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('Edge Cases', () => {
    it('should handle options with undefined values', async () => {
      const options = {
        maxSizeMB: undefined,
      } as any;

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', options);

      expect(result.success).toBe(true);
    });

    it('should handle whitespace in filename', async () => {
      const result = await service.upload('/path/to/video.mp4', '  video.mp4  ', {});

      expect(result.success).toBe(true);
    });
  });
});
