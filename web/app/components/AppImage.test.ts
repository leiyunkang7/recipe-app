import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, nextTick } from 'vue'

// Mock NuxtImg component
const NuxtImgStub = {
  name: 'NuxtImg',
  props: ['src', 'alt', 'sizes', 'quality', 'loading', 'fetchpriority', 'format', 'decoding', 'class'],
  emits: ['load', 'error'],
  template: '<img :class="class" @load="$emit(\'load\')" @error="$emit(\'error\')" />',
}

describe('AppImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering states', () => {
    it('should render with required props', async () => {
      const AppImage = await import('./AppImage.vue')
      const wrapper = mount(AppImage.default, {
        props: {
          src: '/test-image.jpg',
          alt: 'Test image',
        },
        global: {
          stubs: {
            NuxtImg: NuxtImgStub,
          },
        },
      })

      expect(wrapper.find('.app-image-wrapper').exists()).toBe(true)
    })

    it('should show shimmer placeholder while loading', async () => {
      const AppImage = await import('./AppImage.vue')
      const wrapper = mount(AppImage.default, {
        props: {
          src: '/test-image.jpg',
          alt: 'Test image',
          placeholder: true,
        },
        global: {
          stubs: {
            NuxtImg: {
              ...NuxtImgStub,
              template: '<img @load="$emit(\'load\')" @error="$emit(\'error\')" />',
            },
          },
        },
      })

      // Should show shimmer placeholder when not loaded and no error
      const shimmer = wrapper.find('.shimmer-animation')
      expect(shimmer.exists()).toBe(true)
    })

    it('should hide shimmer after image loads', async () => {
      const AppImage = await import('./AppImage.vue')
      const wrapper = mount(AppImage.default, {
        props: {
          src: '/test-image.jpg',
          alt: 'Test image',
          placeholder: true,
        },
        global: {
          stubs: {
            NuxtImg: {
              ...NuxtImgStub,
              template: '<img @load="$emit(\'load\')" @error="$emit(\'error\')" />',
            },
          },
        },
      })

      expect(wrapper.find('.shimmer-animation').exists()).toBe(true)

      // Simulate image load
      const nuxtImg = wrapper.findComponent({ name: 'NuxtImg' })
      await nuxtImg.vm.$emit('load')
      await flushPromises()

      expect(wrapper.find('.shimmer-animation').exists()).toBe(false)
    })

    it('should show fallback emoji on error', async () => {
      const AppImage = await import('./AppImage.vue')
      const wrapper = mount(AppImage.default, {
        props: {
          src: '/broken-image.jpg',
          alt: 'Broken image',
          fallbackEmoji: '🍽️',
        },
        global: {
          stubs: {
            NuxtImg: {
              ...NuxtImgStub,
              template: '<img @load="$emit(\'load\')" @error="$emit(\'error\')" />',
            },
          },
        },
      })

      // Simulate error
      const nuxtImg = wrapper.findComponent({ name: 'NuxtImg' })
      await nuxtImg.vm.$emit('error')
      await flushPromises()

      expect(wrapper.find('.app-image-wrapper').text()).toBe('🍽️')
    })

    it('should show fallback emoji when no src provided', async () => {
      const AppImage = await import('./AppImage.vue')
      const wrapper = mount(AppImage.default, {
        props: {
          src: '',
          alt: 'Empty image',
          fallbackEmoji: '🍕',
        },
        global: {
          stubs: {
            NuxtImg: NuxtImgStub,
          },
        },
      })

      expect(wrapper.find('.app-image-wrapper').text()).toBe('🍕')
    })
  })

  describe('props validation', () => {
    it('should apply correct object-fit class for cover', async () => {
      const AppImage = await import('./AppImage.vue')
      const wrapper = mount(AppImage.default, {
        props: {
          src: '/test-image.jpg',
          alt: 'Test image',
          objectFit: 'cover',
        },
        global: {
          stubs: {
            NuxtImg: NuxtImgStub,
          },
        },
      })

      const nuxtImg = wrapper.findComponent({ name: 'NuxtImg' })
      expect(nuxtImg.props('class')).toContain('object-cover')
    })

    it('should apply correct object-fit class for contain', async () => {
      const AppImage = await import('./AppImage.vue')
      const wrapper = mount(AppImage.default, {
        props: {
          src: '/test-image.jpg',
          alt: 'Test image',
          objectFit: 'contain',
        },
        global: {
          stubs: {
            NuxtImg: NuxtImgStub,
          },
        },
      })

      const nuxtImg = wrapper.findComponent({ name: 'NuxtImg' })
      expect(nuxtImg.props('class')).toContain('object-contain')
    })

    it('should pass correct props to NuxtImg', async () => {
      const AppImage = await import('./AppImage.vue')
      const wrapper = mount(AppImage.default, {
        props: {
          src: '/test-image.jpg',
          alt: 'Test image',
          sizes: 'sm:100vw',
          quality: 90,
          loading: 'eager' as const,
          fetchpriority: 'high' as const,
        },
        global: {
          stubs: {
            NuxtImg: NuxtImgStub,
          },
        },
      })

      const nuxtImg = wrapper.findComponent({ name: 'NuxtImg' })
      expect(nuxtImg.props('src')).toBe('/test-image.jpg')
      expect(nuxtImg.props('alt')).toBe('Test image')
      expect(nuxtImg.props('sizes')).toBe('sm:100vw')
      expect(nuxtImg.props('quality')).toBe(90)
      expect(nuxtImg.props('loading')).toBe('eager')
      expect(nuxtImg.props('fetchpriority')).toBe('high')
    })
  })

  describe('wrapper styling', () => {
    it('should have relative positioning', async () => {
      const AppImage = await import('./AppImage.vue')
      const wrapper = mount(AppImage.default, {
        props: {
          src: '/test-image.jpg',
          alt: 'Test image',
        },
        global: {
          stubs: {
            NuxtImg: NuxtImgStub,
          },
        },
      })

      expect(wrapper.find('.app-image-wrapper').classes()).toContain('relative')
      expect(wrapper.find('.app-image-wrapper').classes()).toContain('overflow-hidden')
    })
  })
})
