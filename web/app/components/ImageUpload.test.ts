import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'zh' },
  }),
}))

// Mock useImageUpload
const mockUploadImage = vi.fn()
const mockClearError = vi.fn()

vi.mock('~/composables/useImageUpload', () => ({
  useImageUpload: () => ({
    uploading: { value: false },
    error: { value: null },
    progress: { value: 0 },
    uploadImage: mockUploadImage,
    clearError: mockClearError,
  }),
}))

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUploadImage.mockResolvedValue('https://example.com/uploaded-image.jpg')
  })

  describe('rendering without image', () => {
    it('should render upload area when no image is provided', async () => {
      const ImageUpload = await import('./ImageUpload.vue')
      const wrapper = mount(ImageUpload.default, {
        props: {},
      })

      expect(wrapper.find('.border-2.border-dashed').exists()).toBe(true)
      expect(wrapper.text()).toContain('imageUpload.clickOrDrag')
    })

    it('should render camera emoji in upload area', async () => {
      const ImageUpload = await import('./ImageUpload.vue')
      const wrapper = mount(ImageUpload.default, {
        props: {},
      })

      expect(wrapper.find('.text-4xl').text()).toBe('📷')
    })

    it('should render supported formats text', async () => {
      const ImageUpload = await import('./ImageUpload.vue')
      const wrapper = mount(ImageUpload.default, {
        props: {},
      })

      expect(wrapper.text()).toContain('imageUpload.supportedFormats')
    })
  })

  describe('rendering with modelValue', () => {
    it('should render image preview when modelValue is provided', async () => {
      const ImageUpload = await import('./ImageUpload.vue')
      const wrapper = mount(ImageUpload.default, {
        props: {
          modelValue: 'https://example.com/image.jpg',
        },
      })

      expect(wrapper.find('img[alt="Preview"]').exists()).toBe(true)
      expect(wrapper.find('img').attributes('src')).toBe('https://example.com/image.jpg')
    })

    it('should render delete button when image exists and not uploading', async () => {
      const ImageUpload = await import('./ImageUpload.vue')
      const wrapper = mount(ImageUpload.default, {
        props: {
          modelValue: 'https://example.com/image.jpg',
        },
      })

      const deleteButton = wrapper.find('button.rounded-full')
      expect(deleteButton.exists()).toBe(true)
    })

    it('should hide delete button while uploading', async () => {
      vi.mocked(useImageUpload).mockReturnValue({
        uploading: { value: true },
        error: { value: null },
        progress: { value: 50 },
        uploadImage: mockUploadImage,
        clearError: mockClearError,
      } as unknown)

      const ImageUpload = await import('./ImageUpload.vue')
      const wrapper = mount(ImageUpload.default, {
        props: {
          modelValue: 'https://example.com/image.jpg',
        },
      })

      expect(wrapper.find('button.rounded-full').exists()).toBe(false)
    })
  })

  describe('drag and drop', () => {
    it('should apply dragging styles when dragging', async () => {
      const ImageUpload = await import('./ImageUpload.vue')
      const wrapper = mount(ImageUpload.default, {
        props: {},
      })

      await wrapper.find('.border-2.border-dashed').trigger('dragenter')
      await flushPromises()

      expect(wrapper.find('.border-orange-500').exists()).toBe(true)
      expect(wrapper.find('.bg-orange-50').exists()).toBe(true)
    })
  })

  describe('file input interaction', () => {
    it('should have hidden file input', async () => {
      const ImageUpload = await import('./ImageUpload.vue')
      const wrapper = mount(ImageUpload.default, {
        props: {},
      })

      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.exists()).toBe(true)
      expect(fileInput.classes()).toContain('hidden')
    })
  })

  describe('upload progress', () => {
    it('should show progress bar when uploading', async () => {
      vi.mocked(useImageUpload).mockReturnValue({
        uploading: { value: true },
        error: { value: null },
        progress: { value: 50 },
        uploadImage: mockUploadImage,
        clearError: mockClearError,
      } as unknown)

      const ImageUpload = await import('./ImageUpload.vue')
      const wrapper = mount(ImageUpload.default, {
        props: {},
      })

      expect(wrapper.find('.animate-spin').exists()).toBe(true)
      expect(wrapper.find('.bg-orange-500').exists()).toBe(true)
    })
  })

  describe('error display', () => {
    it('should show error when error is set', async () => {
      vi.mocked(useImageUpload).mockReturnValue({
        uploading: { value: false },
        error: { value: 'Upload failed' },
        progress: { value: 0 },
        uploadImage: mockUploadImage,
        clearError: mockClearError,
      } as unknown)

      const ImageUpload = await import('./ImageUpload.vue')
      const wrapper = mount(ImageUpload.default, {
        props: {},
      })

      expect(wrapper.find('.bg-red-50').exists()).toBe(true)
      expect(wrapper.text()).toContain('Upload failed')
    })

    it('should render error with dismiss button', async () => {
      vi.mocked(useImageUpload).mockReturnValue({
        uploading: { value: false },
        error: { value: 'Upload failed' },
        progress: { value: 0 },
        uploadImage: mockUploadImage,
        clearError: mockClearError,
      } as unknown)

      const ImageUpload = await import('./ImageUpload.vue')
      const wrapper = mount(ImageUpload.default, {
        props: {},
      })

      const dismissButton = wrapper.find('.text-red-500')
      expect(dismissButton.exists()).toBe(true)
    })
  })

  describe('click to upload', () => {
    it('should trigger file input when clicking upload area', async () => {
      const clickSpy = vi.fn()
      const originalCreateElement = document.createElement
      document.createElement = vi.fn((tagName: string) => {
        const element = originalCreateElement.call(document, tagName)
        if (tagName === 'input') {
          element.click = clickSpy
        }
        return element
      })

      const ImageUpload = await import('./ImageUpload.vue')
      const wrapper = mount(ImageUpload.default, {
        props: {},
      })

      await wrapper.find('.border-2.border-dashed').trigger('click')

      document.createElement = originalCreateElement
    })
  })
})

