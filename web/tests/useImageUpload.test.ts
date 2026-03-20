import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

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


  })
})
