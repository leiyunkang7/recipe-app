import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUpload = vi.fn()
const mockGetPublicUrl = vi.fn()
const mockStorageFrom = vi.fn().mockReturnValue({
  upload: mockUpload,
  getPublicUrl: mockGetPublicUrl,
})

vi.mock('#imports', () => ({
  useNuxtApp: vi.fn(() => ({
    $supabase: {
      storage: {
        from: mockStorageFrom,
      },
    },
  })),
}))

vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

describe('useImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpload.mockReset()
    mockGetPublicUrl.mockReset()
    mockStorageFrom.mockClear()
  })

  describe('initial state', () => {
    it('should have uploading set to false initially', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      const { uploading } = useImageUpload()
      expect(uploading.value).toBe(false)
    })

    it('should have error set to null initially', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      const { error } = useImageUpload()
      expect(error.value).toBe(null)
    })

    it('should have progress set to 0 initially', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      const { progress } = useImageUpload()
      expect(progress.value).toBe(0)
    })
  })

  describe('clearError', () => {
    it('should clear error value', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      const { error, clearError } = useImageUpload()
      error.value = 'Some error'
      clearError()
      expect(error.value).toBe(null)
    })
  })

  describe('uploadImage validation', () => {
    const createMockFile = (name: string, type: string, size: number): File => {
      const file = new File([], name, { type })
      Object.defineProperty(file, 'size', { value: size })
      return file
    }

    it('should reject non-image files', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      const textFile = createMockFile('document.txt', 'text/plain', 1024)
      const { uploadImage, error } = useImageUpload()
      const url = await uploadImage(textFile)

      expect(url).toBe(null)
      expect(error.value).toBe('请上传图片文件')
    })

    it('should reject files larger than 5MB', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      const largeFile = createMockFile('image.jpg', 'image/jpeg', 6 * 1024 * 1024)
      const { uploadImage, error } = useImageUpload()
      const url = await uploadImage(largeFile)

      expect(url).toBe(null)
      expect(error.value).toBe('图片大小不能超过 5MB')
    })

    it('should reject files at exactly 5MB boundary', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      // Exactly 5MB should be rejected (max is 5MB - 1 byte)
      const boundaryFile = createMockFile('image.jpg', 'image/jpeg', 5 * 1024 * 1024)
      const { uploadImage, error } = useImageUpload()
      const url = await uploadImage(boundaryFile)

      expect(url).toBe(null)
      expect(error.value).toBe('图片大小不能超过 5MB')
    })

    it('should accept files just under 5MB', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      // Just under 5MB should be accepted
      const smallFile = createMockFile('image.jpg', 'image/jpeg', 5 * 1024 * 1024 - 1)
      const { uploadImage } = useImageUpload()

      mockUpload.mockResolvedValue({ data: null, error: null })
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/image.jpg' } })

      const url = await uploadImage(smallFile)

      expect(url).toBe('https://example.com/image.jpg')
    })
  })

  describe('uploadImage successful upload', () => {
    const createMockFile = (name: string, type: string, size: number): File => {
      const file = new File([], name, { type })
      Object.defineProperty(file, 'size', { value: size })
      return file
    }

    it('should upload image and return public URL', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      const file = createMockFile('recipe.jpg', 'image/jpeg', 1024 * 1024) // 1MB

      mockUpload.mockResolvedValue({ data: { path: 'recipe-123.jpg' }, error: null })
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/recipe-123.jpg' } })

      const { uploadImage, error } = useImageUpload()
      const url = await uploadImage(file)

      expect(url).toBe('https://example.com/recipe-123.jpg')
      expect(error.value).toBe(null)
      expect(mockStorageFrom).toHaveBeenCalledWith('recipe-images')
    })

    it('should update progress during upload', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      const file = createMockFile('recipe.jpg', 'image/jpeg', 1024 * 1024)

      mockUpload.mockResolvedValue({ data: { path: 'recipe-123.jpg' }, error: null })
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/recipe-123.jpg' } })

      const { uploadImage, progress } = useImageUpload()

      expect(progress.value).toBe(0)

      const uploadPromise = uploadImage(file)

      // Progress should be updated during upload
      expect(progress.value).toBe(30)

      await uploadPromise

      // Final progress should be 100
      expect(progress.value).toBe(100)
    })

    it('should set uploading to true during upload', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      const file = createMockFile('recipe.jpg', 'image/jpeg', 1024 * 1024)

      mockUpload.mockResolvedValue({ data: { path: 'recipe-123.jpg' }, error: null })
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/recipe-123.jpg' } })

      const { uploadImage, uploading } = useImageUpload()

      const uploadPromise = uploadImage(file)
      expect(uploading.value).toBe(true)

      await uploadPromise
      expect(uploading.value).toBe(false)
    })

    it('should reset progress on new upload', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      const file1 = createMockFile('recipe1.jpg', 'image/jpeg', 1024 * 1024)
      const file2 = createMockFile('recipe2.jpg', 'image/jpeg', 512 * 1024)

      mockUpload.mockResolvedValue({ data: { path: 'recipe.jpg' }, error: null })
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/recipe.jpg' } })

      const { uploadImage, progress } = useImageUpload()

      await uploadImage(file1)
      expect(progress.value).toBe(100)

      await uploadImage(file2)
      // Progress should reset to 30 at start of new upload
      expect(progress.value).toBe(30)
    })
  })

  describe('uploadImage error handling', () => {
    const createMockFile = (name: string, type: string, size: number): File => {
      const file = new File([], name, { type })
      Object.defineProperty(file, 'size', { value: size })
      return file
    }

    it('should handle upload error from Supabase', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      const file = createMockFile('recipe.jpg', 'image/jpeg', 1024 * 1024)

      mockUpload.mockResolvedValue({ data: null, error: { message: 'Storage quota exceeded' } })

      const { uploadImage, error } = useImageUpload()
      const url = await uploadImage(file)

      expect(url).toBe(null)
      expect(error.value).toBe('Storage quota exceeded')
    })

    it('should set uploading to false after error', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      const file = createMockFile('recipe.jpg', 'image/jpeg', 1024 * 1024)

      mockUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } })

      const { uploadImage, uploading } = useImageUpload()
      await uploadImage(file)

      expect(uploading.value).toBe(false)
    })

    it('should handle unknown errors gracefully', async () => {
      const { useImageUpload } = await import('../app/composables/useImageUpload')
      const file = createMockFile('recipe.jpg', 'image/jpeg', 1024 * 1024)

      mockUpload.mockRejectedValue(new Error('Network error'))

      const { uploadImage, error } = useImageUpload()
      const url = await uploadImage(file)

      expect(url).toBe(null)
      expect(error.value).toBe('上传失败')
    })
  })
})
