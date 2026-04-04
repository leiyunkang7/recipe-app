import sharp from 'sharp';
import { readFileSync, writeFileSync, unlinkSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import {
  ImageUploadOptions,
  ServiceResponse,
  successResponse,
  errorResponse,
} from '@recipe-app/shared-types';

export class ImageService {
  private uploadDir: string;
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  private readonly VALID_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

  constructor(uploadDir: string) {
    this.uploadDir = uploadDir;

    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
  }

  /**
   * Upload a single image with optional processing
   */
  async upload(
    filePath: string,
    fileName: string,
    options: Partial<ImageUploadOptions> = {}
  ): Promise<ServiceResponse<{ url: string; path: string }>> {
    try {
      const quality = options.quality ?? 85;
      const compress = options.compress ?? true;

      let fileBuffer: Buffer = readFileSync(filePath);

      if (fileBuffer.length > this.MAX_FILE_SIZE) {
        return errorResponse('FILE_TOO_LARGE', `Image size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      }

      if (options.width || options.height) {
        let pipeline = sharp(fileBuffer);

        pipeline = pipeline.resize(options.width, options.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });

        if (compress) {
          pipeline = pipeline.jpeg({ quality });
        }

        fileBuffer = await pipeline.toBuffer() as Buffer;
      }

      const ext = this.getFileExtension(fileName);
      if (!ext) {
        return errorResponse('INVALID_FILE_NAME', 'File name must have a valid extension');
      }
      const uniqueFileName = `${randomUUID()}.${ext}`;
      const relativePath = `images/${uniqueFileName}`;
      const fullPath = join(this.uploadDir, relativePath);

      // Ensure subdirectory exists
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
    options: Partial<ImageUploadOptions> = {}
  ): Promise<ServiceResponse<{ url: string; path: string }>> {
    try {
      const quality = options.quality ?? 85;
      const compress = options.compress ?? true;

      let fileBuffer: Buffer = buffer;

      if (fileBuffer.length > this.MAX_FILE_SIZE) {
        return errorResponse('FILE_TOO_LARGE', `Image size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      }

      if (options.width || options.height) {
        let pipeline = sharp(fileBuffer);

        pipeline = pipeline.resize(options.width, options.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });

        if (compress) {
          pipeline = pipeline.jpeg({ quality });
        }

        fileBuffer = await pipeline.toBuffer() as Buffer;
      }

      const ext = this.getFileExtension(fileName);
      if (!ext) {
        return errorResponse('INVALID_FILE_NAME', 'File name must have a valid extension');
      }
      const uniqueFileName = `${randomUUID()}.${ext}`;
      const relativePath = `images/${uniqueFileName}`;
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
   * Upload multiple images
   */
  async uploadMultiple(
    files: Array<{ path: string; name: string }>,
    options: Partial<ImageUploadOptions> = {}
  ): Promise<ServiceResponse<Array<{ url: string; path: string }>>> {
    const results = await Promise.all(
      files.map((file) => this.upload(file.path, file.name, options))
    );

    const successful = results.filter((r) => r.success && r.data);
    const failed = results.filter((r) => !r.success);

    if (failed.length > 0) {
      return errorResponse(
        'PARTIAL_FAILURE',
        `${failed.length} out of ${files.length} uploads failed`,
        { successful, failed }
      );
    }

    return successResponse(successful.map((r) => r.data!));
  }

  /**
   * Delete an image
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
   * Get public URL for an image
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

    const ext = trimmed.slice(lastDotIndex + 1).toLowerCase();

    if (!this.VALID_EXTENSIONS.includes(ext)) {
      return null;
    }

    return ext;
  }
}
