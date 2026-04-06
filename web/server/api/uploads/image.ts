import { defineEventHandler, readMultipartFormData } from 'h3';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'server/uploads';
const VALID_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const MAX_SIZE = 10 * 1024 * 1024;
const AVIF_QUALITY = 80;
const WEBP_QUALITY = 85;
const MAX_DIMENSION = 2048;

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event);
  if (!files || files.length === 0) {
    return { error: 'No file uploaded' };
  }

  const file = files[0]!;
  if (!file.filename) {
    return { error: 'Missing filename' };
  }

  // Validate extension
  const ext = file.filename.split('.').pop()?.toLowerCase() || '';
  if (!VALID_EXTENSIONS.has(ext)) {
    return { error: 'Invalid file type' };
  }

  // Validate size
  if (file.data.length > MAX_SIZE) {
    return { error: 'File too large (max 10MB)' };
  }

  // Generate unique filenames for AVIF and WebP
  const uuid = randomUUID();
  const avifRelativePath = `images/${uuid}.avif`;
  const webpRelativePath = `images/${uuid}.webp`;
  const avifFullPath = join(process.cwd(), UPLOAD_DIR, avifRelativePath);
  const webpFullPath = join(process.cwd(), UPLOAD_DIR, webpRelativePath);

  // Ensure directory exists
  mkdirSync(join(process.cwd(), UPLOAD_DIR, 'images'), { recursive: true });

  // Resize options shared between formats
  const resizeOptions = {
    fit: 'inside' as const,
    withoutEnlargement: true,
  };

  try {
    // Convert to AVIF (better compression than WebP)
    const avifBuffer = await sharp(file.data)
      .resize(MAX_DIMENSION, MAX_DIMENSION, resizeOptions)
      .avif({ quality: AVIF_QUALITY })
      .toBuffer();

    writeFileSync(avifFullPath, avifBuffer);

    // Also generate WebP as fallback for browsers that don't support AVIF
    const webpBuffer = await sharp(file.data)
      .resize(MAX_DIMENSION, MAX_DIMENSION, resizeOptions)
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    writeFileSync(webpFullPath, webpBuffer);
  } catch (err) {
    console.error('Image conversion error:', err);
    return { error: 'Failed to process image' };
  }

  // Return AVIF URL as primary (modern format with best compression)
  const url = `/uploads/${avifRelativePath}`;
  const fallbackUrl = `/uploads/${webpRelativePath}`;

  return { data: { url, fallbackUrl, path: avifRelativePath } };
});
