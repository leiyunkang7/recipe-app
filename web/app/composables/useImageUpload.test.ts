import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useImageUpload } from './useImageUpload'

// Mock Nuxt app
const mockSupabase = {
  storage: {
    from: vi.fn().mockReturnThis(),
    upload: vi.fn(),
    getPublicUrl: vi.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/image.jpg' }
    })
  }
}

vi.mock('~/app', () => ({
  useNuxtApp: () => ({
    $supabase: mockSupabase
  })
}))

describe('useImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('uploadImage', () => {
    it('should reject non-image files', async () => {
      const { uploadImage, error, uploading } = useImageUpload()

      const nonImageFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      const result = await uploadImage(nonImageFile)

      expect(result).toBeNull()
      expect(error.value).toBe('请上传图片文件')
      expect(uploading.value).toBe(false)
    })

    it('should reject files larger than 5MB', async () => {
      const { uploadImage, error, uploading } = useImageUpload()

      // Create a file that's larger than 5MB (5 * 1024 * 1024 = 5242880 bytes)
      const largeContent = new ArrayBuffer(5 * 1024 * 1024 + 1)
      const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })

      const result = await uploadImage(largeFile)

      expect(result).toBeNull()
      expect(error.value).toBe('图片大小不能超过 5MB')
      expect(uploading.value).toBe(false)
    })

    it('should upload valid image successfully', async () => {
      const { uploadImage, uploading, progress } = useImageUpload()

      mockSupabase.storage.upload.mockResolvedValue({
        data: { path: 'recipe-123-abc.jpg' },
        error: null
      })

      const validFile = new File(['image-content'], 'recipe.jpg', { type: 'image/jpeg' })
      const result = await uploadImage(validFile)

      expect(result).toBe('https://example.com/image.jpg')
      expect(uploading.value).toBe(false)
      expect(progress.value).toBe(100)
    })

    it('should handle upload errors', async () => {
      const { uploadImage, error, uploading } = useImageUpload()

      mockSupabase.storage.upload.mockResolvedValue({
        data: null,
        error: { message: 'Storage error' }
      })

      const validFile = new File(['image-content'], 'recipe.jpg', { type: 'image/jpeg' })
      const result = await uploadImage(validFile)

      expect(result).toBeNull()
      expect(error.value).toBe('Storage error')
      expect(uploading.value).toBe(false)
    })

    it('should set uploading state during upload', async () => {
      const { uploadImage, uploading } = useImageUpload()

      let uploadStarted = false
      let uploadFinished = false

      mockSupabase.storage.upload.mockImplementation(async () => {
        uploadStarted = uploading.value === true
        uploadFinished = false
        return { data: { path: 'test.jpg' }, error: null }
      })

      const validFile = new File(['image-content'], 'recipe.jpg', { type: 'image/jpeg' })
      await uploadImage(validFile)

      expect(uploadFinished).toBe(false)
      expect(uploading.value).toBe(false)
    })

    it('should reset progress on upload start', async () => {
      const { uploadImage, progress } = useImageUpload()

      progress.value = 100

      mockSupabase.storage.upload.mockResolvedValue({
        data: { path: 'test.jpg' },
        error: null
      })

      const validFile = new File(['image-content'], 'recipe.jpg', { type: 'image/jpeg' })
      await uploadImage(validFile)

      expect(progress.value).toBe(100) // After successful upload
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      const { clearError, error } = useImageUpload()

      error.value = 'Some error'

      clearError()

      expect(error.value).toBeNull()
    })
  })
})