import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock i18n
vi.mock('#imports', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string) => key,
  })),
}))

describe('LoadingSpinner', () => {
  it('should render spinner with default size (md)', async () => {
    const LoadingSpinner = await import('../app/components/LoadingSpinner.vue')
    const wrapper = mount(LoadingSpinner.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const spinner = wrapper.find('.animate-spin')
    expect(spinner.exists()).toBe(true)
    expect(spinner.classes()).toContain('h-12')
    expect(spinner.classes()).toContain('w-12')
    expect(spinner.classes()).toContain('border-b-2')
  })

  it('should render spinner with sm size', async () => {
    const LoadingSpinner = await import('../app/components/LoadingSpinner.vue')
    const wrapper = mount(LoadingSpinner.default, {
      props: {
        size: 'sm',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const spinner = wrapper.find('.animate-spin')
    expect(spinner.exists()).toBe(true)
    expect(spinner.classes()).toContain('h-6')
    expect(spinner.classes()).toContain('w-6')
    expect(spinner.classes()).toContain('border-2')
  })

  it('should render spinner with lg size', async () => {
    const LoadingSpinner = await import('../app/components/LoadingSpinner.vue')
    const wrapper = mount(LoadingSpinner.default, {
      props: {
        size: 'lg',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const spinner = wrapper.find('.animate-spin')
    expect(spinner.exists()).toBe(true)
    expect(spinner.classes()).toContain('h-16')
    expect(spinner.classes()).toContain('w-16')
    expect(spinner.classes()).toContain('border-3')
  })

  it('should have correct border color class', async () => {
    const LoadingSpinner = await import('../app/components/LoadingSpinner.vue')
    const wrapper = mount(LoadingSpinner.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const spinner = wrapper.find('.animate-spin')
    expect(spinner.classes()).toContain('border-orange-600')
  })

  it('should be centered in container', async () => {
    const LoadingSpinner = await import('../app/components/LoadingSpinner.vue')
    const wrapper = mount(LoadingSpinner.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const container = wrapper.find('.flex.justify-center.items-center.py-12')
    expect(container.exists()).toBe(true)
  })

  it('should render rounded-full circle', async () => {
    const LoadingSpinner = await import('../app/components/LoadingSpinner.vue')
    const wrapper = mount(LoadingSpinner.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const spinner = wrapper.find('.animate-spin')
    expect(spinner.classes()).toContain('rounded-full')
  })
})
