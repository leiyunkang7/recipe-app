import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

describe('HeartIcon', () => {
  describe('rendering', () => {
    it('should render an SVG element', async () => {
      const HeartIcon = await import('./HeartIcon.vue')
      const wrapper = mount(HeartIcon.default, {
        props: {
          filled: false,
        },
      })

      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should apply fill when filled prop is true', async () => {
      const HeartIcon = await import('./HeartIcon.vue')
      const wrapper = mount(HeartIcon.default, {
        props: {
          filled: true,
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('fill')).toBe('currentColor')
    })

    it('should not apply fill when filled prop is false', async () => {
      const HeartIcon = await import('./HeartIcon.vue')
      const wrapper = mount(HeartIcon.default, {
        props: {
          filled: false,
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('fill')).toBe('none')
    })

    it('should have stroke currentColor', async () => {
      const HeartIcon = await import('./HeartIcon.vue')
      const wrapper = mount(HeartIcon.default, {
        props: {
          filled: false,
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('stroke')).toBe('currentColor')
    })

    it('should have correct viewBox', async () => {
      const HeartIcon = await import('./HeartIcon.vue')
      const wrapper = mount(HeartIcon.default, {
        props: {
          filled: false,
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    })
  })

  describe('class binding', () => {
    it('should apply custom class via $attrs', async () => {
      const HeartIcon = await import('./HeartIcon.vue')
      const wrapper = mount(HeartIcon.default, {
        props: {
          filled: false,
        },
        attrs: {
          class: 'w-6 h-6 text-red-500',
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.classes()).toContain('w-6')
      expect(svg.classes()).toContain('h-6')
      expect(svg.classes()).toContain('text-red-500')
    })

    it('should apply multiple custom classes', async () => {
      const HeartIcon = await import('./HeartIcon.vue')
      const wrapper = mount(HeartIcon.default, {
        props: {
          filled: false,
        },
        attrs: {
          class: 'w-5 h-5 mx-2',
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.classes()).toContain('w-5')
      expect(svg.classes()).toContain('h-5')
      expect(svg.classes()).toContain('mx-2')
    })
  })

  describe('path rendering', () => {
    it('should render the heart path', async () => {
      const HeartIcon = await import('./HeartIcon.vue')
      const wrapper = mount(HeartIcon.default, {
        props: {
          filled: false,
        },
      })

      const path = wrapper.find('path')
      expect(path.exists()).toBe(true)
      expect(path.attributes('d')).toContain('4.318')
      expect(path.attributes('d')).toContain('6.318')
    })

    it('should have correct stroke attributes on path', async () => {
      const HeartIcon = await import('./HeartIcon.vue')
      const wrapper = mount(HeartIcon.default, {
        props: {
          filled: false,
        },
      })

      const path = wrapper.find('path')
      expect(path.attributes('stroke-linecap')).toBe('round')
      expect(path.attributes('stroke-linejoin')).toBe('round')
      expect(path.attributes('stroke-width')).toBe('2')
    })
  })

  describe('reactive filled prop', () => {
    it('should update fill when filled prop changes', async () => {
      const HeartIcon = await import('./HeartIcon.vue')
      const wrapper = mount(HeartIcon.default, {
        props: {
          filled: false,
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('fill')).toBe('none')

      await wrapper.setProps({ filled: true })
      expect(svg.attributes('fill')).toBe('currentColor')
    })
  })
})