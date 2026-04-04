import { ref } from 'vue'

export function useImageUpload() {
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const progress = ref(0)

  const uploadImage = async (file: File): Promise<string | null> => {
    uploading.value = true
    error.value = null
    progress.value = 0

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('请上传图片文件')
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('图片大小不能超过 10MB')
      }

      progress.value = 30

      const formData = new FormData()
      formData.append('file', file)

      const result = await $fetch<{ data?: { url: string }; error?: string }>('/api/uploads/image', {
        method: 'POST',
        body: formData,
      })

      progress.value = 100

      if (result.error) {
        throw new Error(result.error)
      }

      return result.data?.url || null
    } catch (err) {
      const message = err instanceof Error ? err.message : '上传失败'
      error.value = message
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
    clearError,
  }
}
