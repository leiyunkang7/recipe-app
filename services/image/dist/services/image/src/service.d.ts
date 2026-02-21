import { ImageUploadOptions, ServiceResponse } from '@recipe-app/shared-types';
export declare class ImageService {
    private client;
    private bucketName;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Upload a single image with optional processing
     */
    upload(filePath: string, fileName: string, options?: ImageUploadOptions): Promise<ServiceResponse<{
        url: string;
        path: string;
    }>>;
    /**
     * Upload multiple images
     */
    uploadMultiple(files: Array<{
        path: string;
        name: string;
    }>, options?: ImageUploadOptions): Promise<ServiceResponse<Array<{
        url: string;
        path: string;
    }>>>;
    /**
     * Delete an image
     */
    delete(path: string): Promise<ServiceResponse<void>>;
    /**
     * Get public URL for an image
     */
    getUrl(path: string): string;
    /**
     * Get file extension
     */
    private getFileExtension;
    /**
     * Get MIME type based on extension
     */
    private getMimeType;
}
