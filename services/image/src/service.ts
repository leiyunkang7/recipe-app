import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import {
  ImageUploadOptions,
  ServiceResponse,
  successResponse,
  errorResponse,
} from '@recipe-app/shared-types';

export class ImageService {
  private client: SupabaseClient;
  private bucketName = 'recipe-images';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  private readonly VALID_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Upload a single image with optional processing
   */
  async upload(
    filePath: string,
    fileName: string,
    options: ImageUploadOptions = {} as any
  ): Promise<ServiceResponse<{ url: string; path: string }>> {
    try {
      const quality = options.quality ?? 85;
      const compress = options.compress ?? true;

      let fileBuffer = readFileSync(filePath);

      if (fileBuffer.length > this.MAX_FILE_SIZE) {
        return errorResponse('FILE_TOO_LARGE', `Image size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
      }

      if (options.width || options.height) {
        let pipeline = sharp(fileBuffer);

        if (options.width || options.height) {
          pipeline = pipeline.resize(options.width, options.height, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        if (compress) {
          pipeline = pipeline.jpeg({ quality });
        }

        fileBuffer = await pipeline.toBuffer() as any;
      }

      const ext = this.getFileExtension(fileName);
      if (!ext) {
        return errorResponse('INVALID_FILE_NAME', 'File name must have a valid extension');
      }
      const uniqueFileName = `${randomUUID()}.${ext}`;
      const storagePath = `recipes/${uniqueFileName}`;

      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .upload(storagePath, fileBuffer as any, {
          contentType: this.getMimeType(ext),
          upsert: false,
        });

      if (error) {
        return errorResponse('UPLOAD_ERROR', 'Failed to upload image', error);
      }

      const url = this.getUrl(data.path);

      return successResponse({
        url,
        path: data.path,
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
    options: ImageUploadOptions = {} as any
  ): Promise<ServiceResponse<Array<{ url: string; path: string }>>> {
    try {
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
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', error);
    }
  }

  /**
   * Delete an image
   */
  async delete(path: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.client.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        return errorResponse('DELETE_ERROR', 'Failed to delete image', error);
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
    const { data } = this.client.storage
      .from(this.bucketName)
      .getPublicUrl(path);

    return data.publicUrl;
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

  /**
   * Get MIME type based on extension
   */
  private getMimeType(ext: string): string {
    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    return mimeTypes[ext] || 'image/jpeg';
  }
}
