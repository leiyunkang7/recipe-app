import { defineEventHandler, readMultipartFormData } from 'h3';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'server/uploads';
const VALID_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'avi', 'mkv']);
const MAX_SIZE = 100 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  const files = await readMultipartFormData(event);
  if (!files || files.length === 0) {
    return { error: 'No file uploaded' };
  }

  const file = files[0];
  if (!file.filename) {
    return { error: 'Missing filename' };
  }

  // Validate extension
  const ext = file.filename.split('.').pop()?.toLowerCase() || '';
  if (!VALID_EXTENSIONS.has(ext)) {
    return { error: 'Invalid video type' };
  }

  // Validate size
  if (file.data.length > MAX_SIZE) {
    return { error: 'File too large (max 100MB)' };
  }

  // Generate unique filename
  const uniqueName = `${randomUUID()}.${ext}`;
  const relativePath = `videos/${uniqueName}`;
  const fullPath = join(process.cwd(), UPLOAD_DIR, relativePath);

  // Ensure directory exists
  mkdirSync(join(process.cwd(), UPLOAD_DIR, 'videos'), { recursive: true });

  // Write file
  writeFileSync(fullPath, file.data);

  const url = `/uploads/${relativePath}`;

  return { data: { url, path: relativePath } };
});
