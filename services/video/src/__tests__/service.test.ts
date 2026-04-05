import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VideoService } from '../service';
import { VideoUploadOptions } from '../service';

// Mock dependencies
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
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

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
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

  describe('constructor', () => {
    it('should create upload directory if it does not exist', () => {
      (existsSync as any).mockReturnValueOnce(false);
      const newService = new VideoService('/new/upload/dir');
      expect(mkdirSync).toHaveBeenCalledWith('/new/upload/dir', { recursive: true });
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

    it('should use custom maxSizeMB option', async () => {
      const buffer = Buffer.alloc(60 * 1024 * 1024); // 60MB

      const result = await service.uploadBuffer(buffer, 'video.mp4', { maxSizeMB: 50 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });

    it('should handle empty filename (getFileExtension returns null)', async () => {
      const buffer = Buffer.from('fake-video-data');

      const result = await service.uploadBuffer(buffer, '', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should handle filename with no extension (getFileExtension returns null)', async () => {
      const buffer = Buffer.from('fake-video-data');

      const result = await service.uploadBuffer(buffer, 'video', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should handle invalid file type in uploadBuffer', async () => {
      const buffer = Buffer.from('fake-video-data');

      const result = await service.uploadBuffer(buffer, 'video.txt', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
    });

    it('should handle writeFileSync error', async () => {
      (writeFileSync as any).mockImplementationOnce(() => {
        throw new Error('Write permission denied');
      });

      const buffer = Buffer.from('fake-video-data');
      const result = await service.uploadBuffer(buffer, 'video.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle mkdirSync error', async () => {
      (mkdirSync as any).mockImplementationOnce(() => {
        throw new Error('Directory creation failed');
      });

      const buffer = Buffer.from('fake-video-data');
      const result = await service.uploadBuffer(buffer, 'video.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('getMimeTypeForExtension', () => {
    it('should return correct MIME type for mp4', () => {
      const mimeType = service.getMimeTypeForExtension('mp4');
      expect(mimeType).toBe('video/mp4');
    });

    it('should return correct MIME type for webm', () => {
      const mimeType = service.getMimeTypeForExtension('webm');
      expect(mimeType).toBe('video/webm');
    });

    it('should return correct MIME type for mov', () => {
      const mimeType = service.getMimeTypeForExtension('mov');
      expect(mimeType).toBe('video/quicktime');
    });

    it('should return correct MIME type for avi', () => {
      const mimeType = service.getMimeTypeForExtension('avi');
      expect(mimeType).toBe('video/x-msvideo');
    });

    it('should return correct MIME type for mkv', () => {
      const mimeType = service.getMimeTypeForExtension('mkv');
      expect(mimeType).toBe('video/x-matroska');
    });

    it('should return default MIME type for unknown extension', () => {
      const mimeType = service.getMimeTypeForExtension('unknown');
      expect(mimeType).toBe('video/mp4');
    });

    it('should handle uppercase extension', () => {
      const mimeType = service.getMimeTypeForExtension('MP4');
      expect(mimeType).toBe('video/mp4');
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

  describe('getFileExtension - additional edge cases', () => {
    it('should handle filename with multiple dots', async () => {
      const result = await service.upload('/path/to/my.video.file.mp4', 'my.video.file.mp4', {});

      expect(result.success).toBe(true);
    });

    it('should handle filename with non-string type', async () => {
      const result = await service.upload('/path/to/video.mp4', 123 as any, {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should handle filename with only whitespace', async () => {
      const result = await service.upload('/path/to/video.mp4', '   ', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should handle null filename', async () => {
      const result = await service.upload('/path/to/video.mp4', null as any, {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should handle undefined filename', async () => {
      const result = await service.upload('/path/to/video.mp4', undefined as any, {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should handle file starting with dot', async () => {
      const result = await service.upload('/path/to/.hidden.mp4', '.hidden.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });
  });

  describe('uploadBuffer - additional edge cases', () => {
    it('should handle buffer at exact size limit', async () => {
      const exactBuffer = Buffer.alloc(100 * 1024 * 1024);

      const result = await service.uploadBuffer(exactBuffer, 'video.mp4', {});

      expect(result.success).toBe(true);
    });

    it('should handle buffer just over size limit', async () => {
      const overBuffer = Buffer.alloc(100 * 1024 * 1024 + 1);

      const result = await service.uploadBuffer(overBuffer, 'video.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });

    it('should handle custom maxSizeMB of 1', async () => {
      const buffer = Buffer.from('fake-video-data');

      const result = await service.uploadBuffer(buffer, 'video.mp4', { maxSizeMB: 1 });

      expect(result.success).toBe(true);
    });

    it('should handle very small maxSizeMB', async () => {
      const largeBuffer = Buffer.alloc(2 * 1024 * 1024);

      const result = await service.uploadBuffer(largeBuffer, 'video.mp4', { maxSizeMB: 1 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });

    it('should handle all valid video extensions in uploadBuffer', async () => {
      const buffer = Buffer.from('fake-video-data');
      const validExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

      for (const ext of validExtensions) {
        const result = await service.uploadBuffer(buffer, `video.${ext}`, {});
        expect(result.success).toBe(true);
      }
    });

    it('should handle uppercase extension in uploadBuffer', async () => {
      const buffer = Buffer.from('fake-video-data');

      const result = await service.uploadBuffer(buffer, 'video.MP4', {});

      expect(result.success).toBe(true);
    });

    it('should handle mixed case extension in uploadBuffer', async () => {
      const buffer = Buffer.from('fake-video-data');

      const result = await service.uploadBuffer(buffer, 'video.WeBm', {});

      expect(result.success).toBe(true);
    });
  });

  describe('upload - additional edge cases', () => {
    it('should handle file with trailing spaces in filename', async () => {
      const result = await service.upload('/path/to/video.mp4', '  video.mp4  ', {});

      expect(result.success).toBe(true);
    });

    it('should handle file with uppercase extension', async () => {
      const result = await service.upload('/path/to/video.MP4', 'video.MP4', {});

      expect(result.success).toBe(true);
    });

    it('should handle file with mixed case extension', async () => {
      const result = await service.upload('/path/to/video.Mp4', 'video.Mp4', {});

      expect(result.success).toBe(true);
    });

    it('should handle file with invalid extension', async () => {
      const result = await service.upload('/path/to/video.wmv', 'video.wmv', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
    });

    it('should handle file with flv extension', async () => {
      const result = await service.upload('/path/to/video.flv', 'video.flv', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
    });

    it('should handle file with 3gp extension', async () => {
      const result = await service.upload('/path/to/video.3gp', 'video.3gp', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
    });

    it('should handle file with valid extension but invalid type', async () => {
      const result = await service.upload('/path/to/video.txt', 'video.txt', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
    });

    it('should handle file at exact size limit', async () => {
      const exactBuffer = Buffer.alloc(100 * 1024 * 1024);
      (readFileSync as any).mockReturnValueOnce(exactBuffer);

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', {});

      expect(result.success).toBe(true);
    });

    it('should handle file just over size limit', async () => {
      const overBuffer = Buffer.alloc(100 * 1024 * 1024 + 1);
      (readFileSync as any).mockReturnValueOnce(overBuffer);

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });

    it('should handle custom maxSizeMB option', async () => {
      const buffer = Buffer.alloc(60 * 1024 * 1024);
      (readFileSync as any).mockReturnValueOnce(buffer);

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', { maxSizeMB: 50 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('delete - additional edge cases', () => {
    it('should return success when file does not exist', async () => {
      (existsSync as any).mockReturnValueOnce(false);

      const result = await service.delete('videos/nonexistent.mp4');

      expect(result.success).toBe(true);
    });

    it('should handle error during existsSync', async () => {
      (existsSync as any).mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });

      const result = await service.delete('videos/video.mp4');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('getUrl - additional edge cases', () => {
    it('should return URL with nested path', () => {
      const url = service.getUrl('videos/subfolder/video.mp4');
      expect(url).toBe('/uploads/videos/subfolder/video.mp4');
    });

    it('should handle URL with leading slash', () => {
      const url = service.getUrl('/videos/video.mp4');
      expect(url).toBe('/uploads//videos/video.mp4');
    });

    it('should handle empty path gracefully', () => {
      const url = service.getUrl('');
      expect(url).toBe('/uploads/');
    });
  });

  describe('getMimeTypeForExtension - additional edge cases', () => {
    it('should return video/mp4 for unknown extension', () => {
      const mimeType = service.getMimeTypeForExtension('unknown');
      expect(mimeType).toBe('video/mp4');
    });

    it('should return video/mp4 for empty string extension', () => {
      const mimeType = service.getMimeTypeForExtension('');
      expect(mimeType).toBe('video/mp4');
    });

    it('should handle uppercase extension for MIME type', () => {
      const mimeType = service.getMimeTypeForExtension('MP4');
      expect(mimeType).toBe('video/mp4');
    });

    it('should handle mixed case extension for MIME type', () => {
      const mimeType = service.getMimeTypeForExtension('MP4');
      expect(mimeType).toBe('video/mp4');
    });
  });

  describe('constructor - additional edge cases', () => {
    it('should handle directory creation failure gracefully in constructor', () => {
      (existsSync as any).mockReturnValueOnce(false);
      (mkdirSync as any).mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });

      expect(() => new VideoService('/forbidden/dir')).toThrow();
    });

    it('should not throw when directory already exists', () => {
      (existsSync as any).mockReturnValueOnce(true);

      expect(() => new VideoService('/existing/dir')).not.toThrow();
    });
  });

  describe('upload - writeFileSync error handling', () => {
    it('should handle writeFileSync error during upload', async () => {
      (writeFileSync as any).mockImplementationOnce(() => {
        throw new Error('Disk full');
      });

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle mkdirSync error during upload', async () => {
      (mkdirSync as any).mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('uploadBuffer - writeFileSync error handling', () => {
    it('should handle writeFileSync error during buffer upload', async () => {
      const buffer = Buffer.from('fake-video-data');
      (writeFileSync as any).mockImplementationOnce(() => {
        throw new Error('Disk full');
      });

      const result = await service.uploadBuffer(buffer, 'video.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle mkdirSync error during buffer upload', async () => {
      const buffer = Buffer.from('fake-video-data');
      (mkdirSync as any).mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });

      const result = await service.uploadBuffer(buffer, 'video.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });
  });



  describe('file extension validation edge cases', () => {
    it('should handle filename with only dot', async () => {
      const result = await service.upload('/path/to/.', '.', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should handle filename starting with dot', async () => {
      const result = await service.upload('/path/to/.htaccess', '.htaccess', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should handle filename with trailing dot', async () => {
      const result = await service.upload('/path/to/video.', 'video.', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });

    it('should handle filename with no extension after last dot', async () => {
      const result = await service.upload('/path/to/video.', 'video.', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
    });
  });

  describe('video file size boundary tests', () => {
    it('should reject file just over default limit', async () => {
      const overBuffer = Buffer.alloc(100 * 1024 * 1024 + 1);
      (readFileSync as any).mockReturnValueOnce(overBuffer);

      const result = await service.upload('/path/to/large.mp4', 'large.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });

    it('should accept file at exactly custom maxSizeMB limit', async () => {
      const buffer = Buffer.alloc(50 * 1024 * 1024);
      (readFileSync as any).mockReturnValueOnce(buffer);

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', { maxSizeMB: 50 });

      expect(result.success).toBe(true);
    });

    it('should reject file just over custom maxSizeMB limit', async () => {
      const buffer = Buffer.alloc(50 * 1024 * 1024 + 1);
      (readFileSync as any).mockReturnValueOnce(buffer);

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', { maxSizeMB: 50 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });

    it('should handle very small maxSizeMB limit', async () => {
      const buffer = Buffer.alloc(200); // 200 bytes - still larger than 100KB
      (readFileSync as any).mockReturnValueOnce(buffer);

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', { maxSizeMB: 0.0001 });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('valid video extensions comprehensive tests', () => {
    const validExtensions = ['mp4', 'webm', 'mov', 'mkv', 'avi'];

    validExtensions.forEach((ext) => {
      it(`should accept .${ext} extension in upload`, async () => {
        const result = await service.upload(`/path/to/video.${ext}`, `video.${ext}`, {});

        expect(result.success).toBe(true);
      });

      it(`should accept .${ext.toUpperCase()} extension in upload`, async () => {
        const result = await service.upload(`/path/to/video.${ext.toUpperCase()}`, `video.${ext.toUpperCase()}`, {});

        expect(result.success).toBe(true);
      });

      it(`should accept .${ext} extension in uploadBuffer`, async () => {
        const buffer = Buffer.from('fake-video-data');
        const result = await service.uploadBuffer(buffer, `video.${ext}`, {});

        expect(result.success).toBe(true);
      });
    });

    const invalidExtensions = ['txt', 'pdf', 'doc', 'exe', 'bmp', 'gif', 'jpg', 'png', 'webp'];

    invalidExtensions.forEach((ext) => {
      it(`should reject .${ext} extension`, async () => {
        const result = await service.upload(`/path/to/video.${ext}`, `video.${ext}`, {});

        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('INVALID_FILE_TYPE');
      });
    });
  });

  describe('additional edge cases for upload', () => {
    it('should handle upload with maxSizeMB set to 0 (uses default limit)', async () => {
      const buffer = Buffer.from('fake-video-data');
      (readFileSync as any).mockReturnValueOnce(buffer);

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', { maxSizeMB: 0 });

      // When maxSizeMB is 0, it uses default 100MB limit
      expect(result.success).toBe(true);
    });

    it('should handle upload with negative maxSizeMB (rejects all files)', async () => {
      const buffer = Buffer.from('fake-video-data');
      (readFileSync as any).mockReturnValueOnce(buffer);

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', { maxSizeMB: -1 });

      // When maxSizeMB is negative, maxSize becomes negative, rejecting all files
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });

    it('should handle upload with very large maxSizeMB', async () => {
      const buffer = Buffer.from('fake-video-data');
      (readFileSync as any).mockReturnValueOnce(buffer);

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', { maxSizeMB: 1000 });

      expect(result.success).toBe(true);
    });

    it('should handle uploadBuffer with maxSizeMB set to 0 (uses default limit)', async () => {
      const buffer = Buffer.from('fake-video-data');

      const result = await service.uploadBuffer(buffer, 'video.mp4', { maxSizeMB: 0 });

      // When maxSizeMB is 0, it uses default 100MB limit
      expect(result.success).toBe(true);
    });

    it('should handle uploadBuffer with negative maxSizeMB (rejects all files)', async () => {
      const buffer = Buffer.from('fake-video-data');

      const result = await service.uploadBuffer(buffer, 'video.mp4', { maxSizeMB: -1 });

      // When maxSizeMB is negative, maxSize becomes negative, rejecting all files
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });

    it('should handle uploadBuffer with very large maxSizeMB', async () => {
      const buffer = Buffer.from('fake-video-data');

      const result = await service.uploadBuffer(buffer, 'video.mp4', { maxSizeMB: 1000 });

      expect(result.success).toBe(true);
    });

    it('should handle upload with file path containing special characters', async () => {
      const result = await service.upload('/path/with spaces/and-dashes/video.mp4', 'video.mp4', {});

      expect(result.success).toBe(true);
    });

    it('should handle upload with file path containing unicode characters', async () => {
      const result = await service.upload('/path/中文/视频.mp4', '视频.mp4', {});

      expect(result.success).toBe(true);
    });

    it('should handle uploadBuffer with empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);

      const result = await service.uploadBuffer(emptyBuffer, 'video.mp4', {});

      expect(result.success).toBe(true);
    });

    it('should handle uploadBuffer with very small buffer', async () => {
      const tinyBuffer = Buffer.from('x');

      const result = await service.uploadBuffer(tinyBuffer, 'video.mp4', {});

      expect(result.success).toBe(true);
    });
  });

  describe('error message validation', () => {
    it('should return correct error message for FILE_TOO_LARGE', async () => {
      const largeBuffer = Buffer.alloc(101 * 1024 * 1024);
      (readFileSync as any).mockReturnValueOnce(largeBuffer);

      const result = await service.upload('/path/to/large.mp4', 'large.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
      expect(result.error?.message).toContain('100MB');
    });

    it('should return correct error message for custom max size', async () => {
      const buffer = Buffer.alloc(60 * 1024 * 1024);
      (readFileSync as any).mockReturnValueOnce(buffer);

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', { maxSizeMB: 50 });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('50MB');
    });

    it('should return correct error message for INVALID_FILE_NAME', async () => {
      const result = await service.upload('/path/to/video.mp4', '', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_NAME');
      expect(result.error?.message).toContain('File name must have a valid extension');
    });

    it('should return correct error message for INVALID_FILE_TYPE', async () => {
      const result = await service.upload('/path/to/video.txt', 'video.txt', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
      expect(result.error?.message).toContain('Invalid video type');
    });

    it('should include valid extensions in INVALID_FILE_TYPE error', async () => {
      const result = await service.upload('/path/to/video.xyz', 'video.xyz', {});

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('mp4');
      expect(result.error?.message).toContain('webm');
    });
  });

  describe('MIME type validation', () => {
    it('should return video/mp4 for mp4 extension', () => {
      expect(service.getMimeTypeForExtension('mp4')).toBe('video/mp4');
    });

    it('should return video/webm for webm extension', () => {
      expect(service.getMimeTypeForExtension('webm')).toBe('video/webm');
    });

    it('should return video/quicktime for mov extension', () => {
      expect(service.getMimeTypeForExtension('mov')).toBe('video/quicktime');
    });

    it('should return video/x-msvideo for avi extension', () => {
      expect(service.getMimeTypeForExtension('avi')).toBe('video/x-msvideo');
    });

    it('should return video/x-matroska for mkv extension', () => {
      expect(service.getMimeTypeForExtension('mkv')).toBe('video/x-matroska');
    });

    it('should return video/mp4 for unknown extension', () => {
      expect(service.getMimeTypeForExtension('unknown')).toBe('video/mp4');
    });

    it('should return video/mp4 for empty extension', () => {
      expect(service.getMimeTypeForExtension('')).toBe('video/mp4');
    });

    it('should handle uppercase extension for MIME type', () => {
      expect(service.getMimeTypeForExtension('MP4')).toBe('video/mp4');
    });

    it('should handle mixed case extension for MIME type', () => {
      expect(service.getMimeTypeForExtension('Mp4')).toBe('video/mp4');
    });
  });

  describe('delete operation edge cases', () => {
    it('should handle delete with nested path', async () => {
      const result = await service.delete('videos/2024/01/video.mp4');

      expect(result.success).toBe(true);
    });

    it('should handle delete with path starting with slash', async () => {
      const result = await service.delete('/videos/video.mp4');

      expect(result.success).toBe(true);
    });

    it('should handle delete with empty path', async () => {
      const result = await service.delete('');

      expect(result.success).toBe(true);
    });

    it('should handle delete when file does not exist', async () => {
      (existsSync as any).mockReturnValueOnce(false);

      const result = await service.delete('videos/nonexistent.mp4');

      expect(result.success).toBe(true);
    });

    it('should handle delete error with details', async () => {
      const errorDetails = new Error('Permission denied');
      (existsSync as any).mockImplementationOnce(() => {
        throw errorDetails;
      });

      const result = await service.delete('videos/video.mp4');

      expect(result.success).toBe(false);
      expect(result.error?.details).toBeDefined();
    });
  });

  describe('getUrl edge cases', () => {
    it('should handle getUrl with nested path', () => {
      const url = service.getUrl('videos/2024/01/video.mp4');
      expect(url).toBe('/uploads/videos/2024/01/video.mp4');
    });

    it('should handle getUrl with path starting with slash', () => {
      const url = service.getUrl('/videos/video.mp4');
      expect(url).toBe('/uploads//videos/video.mp4');
    });

    it('should handle getUrl with empty path', () => {
      const url = service.getUrl('');
      expect(url).toBe('/uploads/');
    });

    it('should handle getUrl with path containing spaces', () => {
      const url = service.getUrl('videos/my video.mp4');
      expect(url).toBe('/uploads/videos/my video.mp4');
    });
  });

  describe('constructor edge cases', () => {
    it('should handle constructor with relative path', () => {
      (existsSync as any).mockReturnValueOnce(false);

      expect(() => new VideoService('./uploads')).not.toThrow();
    });

    it('should handle constructor with absolute path', () => {
      (existsSync as any).mockReturnValueOnce(false);

      expect(() => new VideoService('/absolute/path/to/uploads')).not.toThrow();
    });

    it('should handle constructor with path containing spaces', () => {
      (existsSync as any).mockReturnValueOnce(false);

      expect(() => new VideoService('/path with spaces/uploads')).not.toThrow();
    });

    it('should handle constructor when directory already exists', () => {
      (existsSync as any).mockReturnValueOnce(true);

      expect(() => new VideoService('/existing/dir')).not.toThrow();
    });
  });

  describe('file extension edge cases', () => {
    it('should handle filename with multiple consecutive dots', async () => {
      const result = await service.upload('/path/to/video.mp4', 'video...mp4', {});

      expect(result.success).toBe(true);
    });

    it('should handle filename with extension containing numbers', async () => {
      const result = await service.upload('/path/to/video.mp4', 'video.mp4', {});

      expect(result.success).toBe(true);
    });

    it('should handle filename with very long extension', async () => {
      const result = await service.upload('/path/to/video.mp4', 'video.thisisaverylongextension', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
    });

    it('should handle filename with single character extension', async () => {
      const result = await service.upload('/path/to/video.mp4', 'video.x', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
    });

    it('should handle filename with numeric extension', async () => {
      const result = await service.upload('/path/to/video.mp4', 'video.123', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
    });
  });

  describe('concurrent upload scenarios', () => {
    it('should handle multiple sequential uploads', async () => {
      const results = await Promise.all([
        service.upload('/path/to/video1.mp4', 'video1.mp4', {}),
        service.upload('/path/to/video2.mp4', 'video2.mp4', {}),
        service.upload('/path/to/video3.mp4', 'video3.mp4', {}),
      ]);

      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle multiple sequential buffer uploads', async () => {
      const buffer = Buffer.from('fake-video-data');

      const results = await Promise.all([
        service.uploadBuffer(buffer, 'video1.mp4', {}),
        service.uploadBuffer(buffer, 'video2.mp4', {}),
        service.uploadBuffer(buffer, 'video3.mp4', {}),
      ]);

      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('error handling with different error types', () => {
    it('should handle Error instance in upload', async () => {
      (readFileSync as any).mockImplementationOnce(() => {
        throw new Error('Custom error message');
      });

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', {});

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle string error in upload', async () => {
      (readFileSync as any).mockImplementationOnce(() => {
        throw 'String error';
      });

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', {});

      expect(result.success).toBe(false);
    });

    it('should handle object error in upload', async () => {
      (readFileSync as any).mockImplementationOnce(() => {
        throw { message: 'Object error' };
      });

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', {});

      expect(result.success).toBe(false);
    });

    it('should handle undefined error in upload', async () => {
      (readFileSync as any).mockImplementationOnce(() => {
        throw undefined;
      });

      const result = await service.upload('/path/to/video.mp4', 'video.mp4', {});

      expect(result.success).toBe(false);
    });
  });
});
