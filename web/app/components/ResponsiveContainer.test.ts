import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

describe('ResponsiveContainer', () => {
  describe('size variants', () => {
    it('should apply sm size classes (max-w-screen-sm)', async () => {
      const ResponsiveContainer = await import('./ResponsiveContainer.vue')
      const wrapper = mount(ResponsiveContainer.default, {
        props: {
          size: 'sm',
        },
      })

      const div = wrapper.find('div')
      expect(div.classes()).toContain('max-w-screen-sm')
    })

    it('should apply md size classes (max-w-screen-md)', async () => {
      const ResponsiveContainer = await import('./ResponsiveContainer.vue')
      const wrapper = mount(ResponsiveContainer.default, {
        props: {
          size: 'md',
        },
      })

      const div = wrapper.find('div')
      expect(div.classes()).toContain('max-w-screen-md')
    })

    it('should apply lg size classes by default (max-w-screen-lg)', async () => {
      const ResponsiveContainer = await import('./ResponsiveContainer.vue')
      const wrapper = mount(ResponsiveContainer.default, {
        props: {},
      })

      const div = wrapper.find('div')
      expect(div.classes()).toContain('max-w-screen-lg')
    })

    it('should apply xl size classes (max-w-screen-xl)', async () => {
      const ResponsiveContainer = await import('./ResponsiveContainer.vue')
      const wrapper = mount(ResponsiveContainer.default, {
        props: {
          size: 'xl',
        },
      })

      const div = wrapper.find('div')
      expect(div.classes()).toContain('max-w-screen-xl')
    })

    it('should apply full size classes (max-w-none)', async () => {
      const ResponsiveContainer = await import('./ResponsiveContainer.vue')
      const wrapper = mount(ResponsiveContainer.default, {
        props: {
          size: 'full',
        },
      })

      const div = wrapper.find('div')
      expect(div.classes()).toContain('max-w-none')
    })
  })

  describe('padding behavior', () => {
    it('should apply responsive padding by default', async () => {
      const ResponsiveContainer = await import('./ResponsiveContainer.vue')
      const wrapper = mount(ResponsiveContainer.default, {
        props: {},
      })

      const div = wrapper.find('div')
      expect(div.classes()).toContain('px-3')
      expect(div.classes()).toContain('sm:px-4')
      expect(div.classes()).toContain('md:px-6')
      expect(div.classes()).toContain('lg:px-8')
    })

    it('should not apply padding when noPadding is true', async () => {
      const ResponsiveContainer = await import('./ResponsiveContainer.vue')
      const wrapper = mount(ResponsiveContainer.default, {
        props: {
          noPadding: true,
        },
      })

      const div = wrapper.find('div')
      expect(div.classes()).not.toContain('px-3')
      expect(div.classes()).not.toContain('sm:px-4')
    })
  })

  describe('container base classes', () => {
    it('should always have mx-auto and w-full classes', async () => {
      const ResponsiveContainer = await import('./ResponsiveContainer.vue')
      const wrapper = mount(ResponsiveContainer.default, {
        props: {},
      })

      const div = wrapper.find('div')
      expect(div.classes()).toContain('mx-auto')
      expect(div.classes()).toContain('w-full')
    })
  })

  describe('custom className', () => {
    it('should apply custom className when provided', async () => {
      const ResponsiveContainer = await import('./ResponsiveContainer.vue')
      const wrapper = mount(ResponsiveContainer.default, {
        props: {
          className: 'custom-class',
        },
      })

      const div = wrapper.find('div')
      expect(div.classes()).toContain('custom-class')
    })

    it('should apply custom className alongside default classes', async () => {
      const ResponsiveContainer = await import('./ResponsiveContainer.vue')
      const wrapper = mount(ResponsiveContainer.default, {
        props: {
          className: 'bg-red-500',
          size: 'sm',
        },
      })

      const div = wrapper.find('div')
      expect(div.classes()).toContain('bg-red-500')
      expect(div.classes()).toContain('max-w-screen-sm')
      expect(div.classes()).toContain('mx-auto')
    })
  })

  describe('slot content', () => {
    it('should render slot content', async () => {
      const ResponsiveContainer = await import('./ResponsiveContainer.vue')
      const wrapper = mount(ResponsiveContainer.default, {
        props: {},
        slots: {
          default: () => 'Test Content',
        },
      })

      expect(wrapper.text()).toContain('Test Content')
    })
  })
})