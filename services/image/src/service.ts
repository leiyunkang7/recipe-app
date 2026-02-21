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
      // Apply defaults for required properties
      const quality = options.quality ?? 85;
      const compress = options.compress ?? true;

      // Read the file
      let fileBuffer = readFileSync(filePath);

      // Process image if options provided
      if (options.width || options.height) {
        let pipeline = sharp(fileBuffer);

        // Resize
        if (options.width || options.height) {
          pipeline = pipeline.resize(options.width, options.height, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        // Compress
        if (compress) {
          pipeline = pipeline.jpeg({ quality });
        }

        fileBuffer = await pipeline.toBuffer() as any;
      }

      // Generate unique filename
      const ext = this.getFileExtension(fileName);
      const uniqueFileName = `${randomUUID()}.${ext}`;
      const storagePath = `recipes/${uniqueFileName}`;

      // Upload to Supabase Storage
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .upload(storagePath, fileBuffer as any, {
          contentType: this.getMimeType(ext),
          upsert: false,
        });

      if (error) {
        return errorResponse('UPLOAD_ERROR', 'Failed to upload image', error);
      }

      // Get public URL
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
   * Get file extension
   */
  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts[parts.length - 1].toLowerCase();
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
