"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageService = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const sharp_1 = __importDefault(require("sharp"));
const fs_1 = require("fs");
const crypto_1 = require("crypto");
const shared_types_1 = require("@recipe-app/shared-types");
class ImageService {
    constructor(supabaseUrl, supabaseKey) {
        this.bucketName = 'recipe-images';
        this.client = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    /**
     * Upload a single image with optional processing
     */
    async upload(filePath, fileName, options = {}) {
        try {
            // Apply defaults for required properties
            const quality = options.quality ?? 85;
            const compress = options.compress ?? true;
            // Read the file
            let fileBuffer = (0, fs_1.readFileSync)(filePath);
            // Process image if options provided
            if (options.width || options.height) {
                let pipeline = (0, sharp_1.default)(fileBuffer);
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
                fileBuffer = await pipeline.toBuffer();
            }
            // Generate unique filename
            const ext = this.getFileExtension(fileName);
            const uniqueFileName = `${(0, crypto_1.randomUUID)()}.${ext}`;
            const storagePath = `recipes/${uniqueFileName}`;
            // Upload to Supabase Storage
            const { data, error } = await this.client.storage
                .from(this.bucketName)
                .upload(storagePath, fileBuffer, {
                contentType: this.getMimeType(ext),
                upsert: false,
            });
            if (error) {
                return (0, shared_types_1.errorResponse)('UPLOAD_ERROR', 'Failed to upload image', error);
            }
            // Get public URL
            const url = this.getUrl(data.path);
            return (0, shared_types_1.successResponse)({
                url,
                path: data.path,
            });
        }
        catch (error) {
            return (0, shared_types_1.errorResponse)('UNKNOWN_ERROR', 'An unexpected error occurred', error);
        }
    }
    /**
     * Upload multiple images
     */
    async uploadMultiple(files, options = {}) {
        try {
            const results = await Promise.all(files.map((file) => this.upload(file.path, file.name, options)));
            const successful = results.filter((r) => r.success && r.data);
            const failed = results.filter((r) => !r.success);
            if (failed.length > 0) {
                return (0, shared_types_1.errorResponse)('PARTIAL_FAILURE', `${failed.length} out of ${files.length} uploads failed`, { successful, failed });
            }
            return (0, shared_types_1.successResponse)(successful.map((r) => r.data));
        }
        catch (error) {
            return (0, shared_types_1.errorResponse)('UNKNOWN_ERROR', 'An unexpected error occurred', error);
        }
    }
    /**
     * Delete an image
     */
    async delete(path) {
        try {
            const { error } = await this.client.storage
                .from(this.bucketName)
                .remove([path]);
            if (error) {
                return (0, shared_types_1.errorResponse)('DELETE_ERROR', 'Failed to delete image', error);
            }
            return (0, shared_types_1.successResponse)(undefined);
        }
        catch (error) {
            return (0, shared_types_1.errorResponse)('UNKNOWN_ERROR', 'An unexpected error occurred', error);
        }
    }
    /**
     * Get public URL for an image
     */
    getUrl(path) {
        const { data } = this.client.storage
            .from(this.bucketName)
            .getPublicUrl(path);
        return data.publicUrl;
    }
    /**
     * Get file extension
     */
    getFileExtension(fileName) {
        const parts = fileName.split('.');
        return parts[parts.length - 1].toLowerCase();
    }
    /**
     * Get MIME type based on extension
     */
    getMimeType(ext) {
        const mimeTypes = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
        };
        return mimeTypes[ext] || 'image/jpeg';
    }
}
exports.ImageService = ImageService;
