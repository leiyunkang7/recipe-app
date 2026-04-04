import { readFileSync, mkdirSync, existsSync, unlinkSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import {
  ServiceResponse,
  successResponse,
  errorResponse,
} from '@recipe-app/shared-types';

export interface VideoUploadOptions {
  maxSizeMB?: number;
}

export class VideoService {
  private uploadDir: string;
  private readonly DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly VALID_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

  constructor(uploadDir: string) {
    this.uploadDir = uploadDir;

    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
  }

  /**
   * Upload a single video
   */
  async upload(
    filePath: string,
    fileName: string,
    options: VideoUploadOptions = {}
  ): Promise<ServiceResponse<{ url: string; path: string }>> {
    try {
      const maxSize = options.maxSizeMB
        ? options.maxSizeMB * 1024 * 1024
        : this.DEFAULT_MAX_SIZE;

      const fileBuffer = readFileSync(filePath);

      if (fileBuffer.length > maxSize) {
        return errorResponse(
          'FILE_TOO_LARGE',
          `Video size exceeds ${maxSize / 1024 / 1024}MB limit`
        );
      }

      const ext = this.getFileExtension(fileName);
      if (!ext) {
        return errorResponse('INVALID_FILE_NAME', 'File name must have a valid extension');
      }

      if (!this.VALID_EXTENSIONS.includes(ext)) {
        return errorResponse(
          'INVALID_FILE_TYPE',
          `Invalid video type. Allowed: ${this.VALID_EXTENSIONS.join(', ')}`
        );
      }

      const uniqueFileName = `${randomUUID()}.${ext}`;
      const relativePath = `videos/${uniqueFileName}`;
      const fullPath = join(this.uploadDir, relativePath);

      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, fileBuffer);

      const url = `/uploads/${relativePath}`;

      return successResponse({
        url,
        path: relativePath,
      });
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', error);
    }
  }

  /**
   * Upload a buffer directly (for server-side use)
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    options: VideoUploadOptions = {}
  ): Promise<ServiceResponse<{ url: string; path: string }>> {
    try {
      const maxSize = options.maxSizeMB
        ? options.maxSizeMB * 1024 * 1024
        : this.DEFAULT_MAX_SIZE;

      if (buffer.length > maxSize) {
        return errorResponse(
          'FILE_TOO_LARGE',
          `Video size exceeds ${maxSize / 1024 / 1024}MB limit`
        );
      }

      const ext = this.getFileExtension(fileName);
      if (!ext) {
        return errorResponse('INVALID_FILE_NAME', 'File name must have a valid extension');
      }

      if (!this.VALID_EXTENSIONS.includes(ext)) {
        return errorResponse(
          'INVALID_FILE_TYPE',
          `Invalid video type. Allowed: ${this.VALID_EXTENSIONS.join(', ')}`
        );
      }

      const uniqueFileName = `${randomUUID()}.${ext}`;
      const relativePath = `videos/${uniqueFileName}`;
      const fullPath = join(this.uploadDir, relativePath);

      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, buffer);

      const url = `/uploads/${relativePath}`;

      return successResponse({
        url,
        path: relativePath,
      });
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', error);
    }
  }

  /**
   * Delete a video
   */
  async delete(path: string): Promise<ServiceResponse<void>> {
    try {
      const fullPath = join(this.uploadDir, path);
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
      }
      return successResponse(undefined);
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', error);
    }
  }

  /**
   * Get public URL for a video
   */
  getUrl(path: string): string {
    return `/uploads/${path}`;
  }

  /**
   * Get file extension with validation
   */
  private getFileExtension(fileName: string): string | null {
    if (!fileName || typeof fileName !== 'string') {
      return null;
    }

    const trimmed = fileName.trim();
    if (trimmed.length === 0 || trimmed.startsWith('.')) {
      return null;
    }

    const lastDotIndex = trimmed.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === trimmed.length - 1) {
      return null;
    }

    return trimmed.slice(lastDotIndex + 1).toLowerCase();
  }

  /**
   * Get MIME type based on extension
   */
  private getMimeType(ext: string): string {
    const mimeTypes: { [key: string]: string } = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
    };

    return mimeTypes[ext] || 'video/mp4';
  }
}
