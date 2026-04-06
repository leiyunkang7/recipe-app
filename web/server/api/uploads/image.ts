import { defineEventHandler, readMultipartFormData } from 'h3';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'server/uploads';
const VALID_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const MAX_SIZE = 10 * 1024 * 1024;

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
  const uniqueName = `${randomUUID()}.${ext}`;
  const relativePath = `images/${uniqueName}`;
  const fullPath = join(process.cwd(), UPLOAD_DIR, relativePath);

  // Ensure directory exists
  mkdirSync(join(process.cwd(), UPLOAD_DIR, 'images'), { recursive: true });

  // Write file
  writeFileSync(fullPath, file.data);

  const url = `/uploads/${relativePath}`;

  return { data: { url, path: relativePath } };
});
