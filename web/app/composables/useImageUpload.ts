import { createClient } from '@supabase/supabase-js'

export function useImageUpload() {
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const progress = ref(0)

  const uploadImage = async (file: File): Promise<string | null> => {
    uploading.value = true
    error.value = null
    progress.value = 0

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('请上传图片文件')
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('图片大小不能超过 5MB')
      }

      const { $supabase } = useNuxtApp()
      
      // Generate unique filename
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const extension = file.name.split('.').pop() || 'jpg'
      const filename = `recipe-${timestamp}-${randomStr}.${extension}`

      console.log('Uploading image:', filename)
      progress.value = 30

      // Upload to Supabase Storage
      const { data, error: uploadError } = await $supabase.storage
        .from('recipe-images')
        .upload(filename, file, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(uploadError.message)
      }

      progress.value = 70

      // Get public URL
      const { data: { publicUrl } } = $supabase.storage
        .from('recipe-images')
        .getPublicUrl(filename)

      progress.value = 100
      console.log('Upload successful! URL:', publicUrl)

      return publicUrl

    } catch (err) {
      const message = err instanceof Error ? err.message : '上传失败'
      error.value = message
      console.error('Image upload error:', err)
      return null

    } finally {
      uploading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    uploading,
    error,
    progress,
    uploadImage,
    clearError
  }
}
