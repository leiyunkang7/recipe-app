import { defineEventHandler, readMultipartFormData } from 'h3';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'server/uploads';
const VALID_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const MAX_SIZE = 10 * 1024 * 1024;
const WEBP_QUALITY = 85;

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

  // Generate unique filename
  const uniqueName = `${randomUUID()}.webp`;
  const relativePath = `images/${uniqueName}`;
  const fullPath = join(process.cwd(), UPLOAD_DIR, relativePath);

  // Ensure directory exists
  mkdirSync(join(process.cwd(), UPLOAD_DIR, 'images'), { recursive: true });

  // Convert to WebP using sharp
  try {
    const webpBuffer = await sharp(file.data)
      .resize(2048, 2048, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    writeFileSync(fullPath, webpBuffer);
  } catch (err) {
    console.error('Image conversion error:', err);
    return { error: 'Failed to process image' };
  }

  const url = `/uploads/${relativePath}`;

  return { data: { url, path: relativePath } };
});
