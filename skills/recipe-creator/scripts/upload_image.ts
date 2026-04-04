#!/usr/bin/env bun
/**
 * 上传截图到 Supabase Storage
 * 
 * 用法:
 *   bun run scripts/upload_image.ts /path/to/image.png
 *   bun run scripts/upload_image.ts /path/to/image.png --folder screenshots
 * 
 * 环境变量:
 *   SUPABASE_URL - Supabase 项目 URL
 *   SUPABASE_ANON_KEY - Supabase 匿名密钥
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY
const defaultBucket = 'recipe-images'

if (!supabaseUrl || !supabaseKey) {
  console.error(JSON.stringify({
    success: false,
    error: {
      code: 'MISSING_ENV',
      message: '缺少 Supabase 配置。请设置 SUPABASE_URL 和 SUPABASE_ANON_KEY 环境变量'
    }
  }))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

function parseArgs(): { filePath: string; folder: string; bucket: string } {
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args[0].startsWith('--')) {
    console.error(JSON.stringify({
      success: false,
      error: {
        code: 'MISSING_FILE',
        message: '请提供文件路径。用法: upload_image.ts <file> [--folder <name>] [--bucket <name>]'
      }
    }))
    process.exit(1)
  }

  const filePath = args[0]
  let folder = 'screenshots'
  let bucket = defaultBucket

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--folder' && args[i + 1]) {
      folder = args[++i]
    } else if (args[i] === '--bucket' && args[i + 1]) {
      bucket = args[++i]
    }
  }

  return { filePath, folder, bucket }
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const contentTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
  }
  return contentTypes[ext] || 'application/octet-stream'
}

function generateFileName(originalPath: string): string {
  const ext = path.extname(originalPath)
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${randomStr}${ext}`
}

async function uploadImage(filePath: string, folder: string, bucket: string) {
  if (!fs.existsSync(filePath)) {
    return {
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: `文件不存在: ${filePath}` }
    }
  }

  try {
    const fileBuffer = fs.readFileSync(filePath)
    const contentType = getContentType(filePath)
    const fileName = generateFileName(filePath)
    const storagePath = `${folder}/${fileName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: false,
      })

    if (error) {
      if (error.message.includes('Bucket not found')) {
        const { error: createError } = await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 10485760,
        })
        
        if (createError) {
          return {
            success: false,
            error: {
              code: 'BUCKET_CREATE_FAILED',
              message: `无法创建存储桶: ${createError.message}`,
            }
          }
        }

        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, fileBuffer, {
            contentType,
            upsert: false,
          })

        if (retryError) throw retryError
        
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(retryData.path)

        return {
          success: true,
          data: {
            path: retryData.path,
            publicUrl: urlData.publicUrl,
            bucket,
          }
        }
      }
      throw error
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return {
      success: true,
      data: {
        path: data.path,
        publicUrl: urlData.publicUrl,
        bucket,
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '上传失败';
    return {
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message,
        details: err,
      }
    }
  }
}

async function main() {
  const { filePath, folder, bucket } = parseArgs()
  const result = await uploadImage(filePath, folder, bucket)
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.success ? 0 : 1)
}

main()
