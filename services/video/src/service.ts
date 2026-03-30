import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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
  private client: SupabaseClient;
  private bucketName = 'recipe-videos';
  private readonly DEFAULT_MAX_SIZE = 100 * 1024 * 1024; // 100MB

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
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
      const storagePath = `recipes/${uniqueFileName}`;

      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .upload(storagePath, fileBuffer as any, {
          contentType: this.getMimeType(ext),
          upsert: false,
        });

      if (error) {
        return errorResponse('UPLOAD_ERROR', 'Failed to upload video', error);
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
   * Delete a video
   */
  async delete(path: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.client.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        return errorResponse('DELETE_ERROR', 'Failed to delete video', error);
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

  private readonly VALID_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
}
