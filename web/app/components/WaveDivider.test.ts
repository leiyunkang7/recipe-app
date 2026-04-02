import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
})

describe('WaveDivider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should render svg element', async () => {
      const WaveDivider = await import('./WaveDivider.vue')
      const wrapper = mount(WaveDivider.default)

      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should have preserveAspectRatio none', async () => {
      const WaveDivider = await import('./WaveDivider.vue')
      const wrapper = mount(WaveDivider.default)

      const svg = wrapper.find('svg')
      expect(svg.attributes('preserveAspectRatio')).toBe('none')
    })

    it('should have viewBox', async () => {
      const WaveDivider = await import('./WaveDivider.vue')
      const wrapper = mount(WaveDivider.default)

      const svg = wrapper.find('svg')
      expect(svg.attributes('viewBox')).toBe('0 0 1440 120')
    })
  })

  describe('default props', () => {
    it('should use default height', async () => {
      const WaveDivider = await import('./WaveDivider.vue')
      const wrapper = mount(WaveDivider.default)

      const svg = wrapper.find('svg')
      expect(svg.classes()).toContain('h-8')
    })

    it('should use default fill color for light mode', async () => {
      const WaveDivider = await import('./WaveDivider.vue')
      const wrapper = mount(WaveDivider.default)

      const paths = wrapper.findAll('path')
      expect(paths[0].attributes('fill')).toBe('#fafaf9')
    })

    it('should use default fill color for dark mode', async () => {
      const WaveDivider = await import('./WaveDivider.vue')
      const wrapper = mount(WaveDivider.default)

      const paths = wrapper.findAll('path')
      expect(paths[1].attributes('fill')).toBe('#292524')
    })
  })

  describe('custom props', () => {
    it('should accept custom height', async () => {
      const WaveDivider = await import('./WaveDivider.vue')
      const wrapper = mount(WaveDivider.default, {
        props: { height: 'h-16' },
      })

      const svg = wrapper.find('svg')
      expect(svg.classes()).toContain('h-16')
    })

    it('should accept custom fill color', async () => {
      const WaveDivider = await import('./WaveDivider.vue')
      const wrapper = mount(WaveDivider.default, {
        props: { fillColor: '#ffffff' },
      })

      const paths = wrapper.findAll('path')
      expect(paths[0].attributes('fill')).toBe('#ffffff')
    })

    it('should accept custom dark mode fill color', async () => {
      const WaveDivider = await import('./WaveDivider.vue')
      const wrapper = mount(WaveDivider.default, {
        props: { darkFillColor: '#000000' },
      })

      const paths = wrapper.findAll('path')
      expect(paths[1].attributes('fill')).toBe('#000000')
    })
  })

  describe('positioning', () => {
    it('should be absolutely positioned at bottom', async () => {
      const WaveDivider = await import('./WaveDivider.vue')
      const wrapper = mount(WaveDivider.default)

      const container = wrapper.find('.absolute')
      expect(container.exists()).toBe(true)
      expect(container.classes()).toContain('bottom-0')
      expect(container.classes()).toContain('left-0')
      expect(container.classes()).toContain('right-0')
    })

    it('should span full width', async () => {
      const WaveDivider = await import('./WaveDivider.vue')
      const wrapper = mount(WaveDivider.default)

      const svg = wrapper.find('svg')
      expect(svg.classes()).toContain('w-full')
    })
  })

  describe('dark mode wave', () => {
    it('should have offset transform for visual depth', async () => {
      const WaveDivider = await import('./WaveDivider.vue')
      const wrapper = mount(WaveDivider.default)

      const paths = wrapper.findAll('path')
      // Second path (dark mode) should have transform style
      expect(paths[1].attributes('style')).toContain('transform: translateY(-4px)')
    })
  })
})