import { defineEventHandler, readMultipartFormData } from 'h3';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { rateLimiters } from '../../utils/rateLimit';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'server/uploads';
const VALID_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const MAX_SIZE = 10 * 1024 * 1024;
const AVIF_QUALITY = 80;
const WEBP_QUALITY = 85;
const MAX_DIMENSION = 2048;

// Responsive image sizes for srcset
const RESPONSIVE_SIZES = [400, 800, 1200, 1600, 2000];

export default defineEventHandler(async (event) => {
  // Apply upload rate limiting (5 requests per minute - expensive operation)
  await rateLimiters.upload(event);

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

  // Generate unique filenames
  const uuid = randomUUID();
  const baseRelativePath = `images/${uuid}`;

  // Ensure directory exists
  const imagesDir = join(process.cwd(), UPLOAD_DIR, 'images');
  mkdirSync(imagesDir, { recursive: true });

  // Resize options shared between formats
  const resizeOptions = {
    fit: 'inside' as const,
    withoutEnlargement: true,
  };

  try {
    // Store the original sharp instance for reuse
    const originalSharp = sharp(file.data);

    // Generate responsive images for AVIF and WebP
    const avifSrcset: string[] = [];
    const webpSrcset: string[] = [];

    for (const width of RESPONSIVE_SIZES) {
      const widthSuffix = width < MAX_DIMENSION ? `_${width}w` : '';

      // AVIF
      const avifBuffer = await originalSharp
        .clone()
        .resize(width, undefined, width < MAX_DIMENSION ? resizeOptions : { ...resizeOptions, fit: 'outside' })
        .avif({ quality: AVIF_QUALITY })
        .toBuffer();

      const avifRelativePath = `${baseRelativePath}${widthSuffix}.avif`;
      writeFileSync(join(process.cwd(), UPLOAD_DIR, avifRelativePath), avifBuffer);
      avifSrcset.push(`/uploads/${avifRelativePath} ${width}w`);

      // WebP
      const webpBuffer = await originalSharp
        .clone()
        .resize(width, undefined, width < MAX_DIMENSION ? resizeOptions : { ...resizeOptions, fit: 'outside' })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      const webpRelativePath = `${baseRelativePath}${widthSuffix}.webp`;
      writeFileSync(join(process.cwd(), UPLOAD_DIR, webpRelativePath), webpBuffer);
      webpSrcset.push(`/uploads/${webpRelativePath} ${width}w`);
    }

    // Return AVIF URL as primary (modern format with best compression)
    const url = `/uploads/${baseRelativePath}.avif`;
    const fallbackUrl = `/uploads/${baseRelativePath}.webp`;

    return {
      data: {
        url,
        fallbackUrl,
        path: `${baseRelativePath}.avif`,
        // Include srcsets for responsive images
        srcset: {
          avif: avifSrcset.join(', '),
          webp: webpSrcset.join(', '),
        },
      },
    };
  } catch (err) {
    console.error('Image conversion error:', err);
    return { error: 'Failed to process image' };
  }
});
