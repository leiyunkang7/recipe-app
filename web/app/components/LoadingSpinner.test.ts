import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
})

describe('LoadingSpinner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should render spinner element', async () => {
      const LoadingSpinner = await import('./LoadingSpinner.vue')
      const wrapper = mount(LoadingSpinner.default)

      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })

    it('should have orange border color', async () => {
      const LoadingSpinner = await import('./LoadingSpinner.vue')
      const wrapper = mount(LoadingSpinner.default)

      const spinner = wrapper.find('.animate-spin')
      expect(spinner.classes()).toContain('border-orange-600')
    })
  })

  describe('size variants', () => {
    it('should render small size by default', async () => {
      const LoadingSpinner = await import('./LoadingSpinner.vue')
      const wrapper = mount(LoadingSpinner.default)

      const spinner = wrapper.find('.animate-spin')
      expect(spinner.classes()).toContain('h-6')
      expect(spinner.classes()).toContain('w-6')
      expect(spinner.classes()).toContain('border-2')
    })

    it('should render small size explicitly', async () => {
      const LoadingSpinner = await import('./LoadingSpinner.vue')
      const wrapper = mount(LoadingSpinner.default, {
        props: { size: 'sm' },
      })

      const spinner = wrapper.find('.animate-spin')
      expect(spinner.classes()).toContain('h-6')
      expect(spinner.classes()).toContain('w-6')
      expect(spinner.classes()).toContain('border-2')
    })

    it('should render medium size', async () => {
      const LoadingSpinner = await import('./LoadingSpinner.vue')
      const wrapper = mount(LoadingSpinner.default, {
        props: { size: 'md' },
      })

      const spinner = wrapper.find('.animate-spin')
      expect(spinner.classes()).toContain('h-12')
      expect(spinner.classes()).toContain('w-12')
      expect(spinner.classes()).toContain('border-b-2')
    })

    it('should render large size', async () => {
      const LoadingSpinner = await import('./LoadingSpinner.vue')
      const wrapper = mount(LoadingSpinner.default, {
        props: { size: 'lg' },
      })

      const spinner = wrapper.find('.animate-spin')
      expect(spinner.classes()).toContain('h-16')
      expect(spinner.classes()).toContain('w-16')
      expect(spinner.classes()).toContain('border-3')
    })
  })

  describe('container', () => {
    it('should be centered in flex container', async () => {
      const LoadingSpinner = await import('./LoadingSpinner.vue')
      const wrapper = mount(LoadingSpinner.default)

      const container = wrapper.find('.flex')
      expect(container.classes()).toContain('justify-center')
      expect(container.classes()).toContain('items-center')
    })

    it('should have vertical padding', async () => {
      const LoadingSpinner = await import('./LoadingSpinner.vue')
      const wrapper = mount(LoadingSpinner.default)

      const container = wrapper.find('.py-12')
      expect(container.exists()).toBe(true)
    })

    it('should be a rounded circle', async () => {
      const LoadingSpinner = await import('./LoadingSpinner.vue')
      const wrapper = mount(LoadingSpinner.default)

      const spinner = wrapper.find('.animate-spin')
      expect(spinner.classes()).toContain('rounded-full')
    })
  })
})