import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

describe('ErrorAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not render when error is null', async () => {
    const ErrorAlert = await import('./ErrorAlert.vue')
    const wrapper = mount(ErrorAlert.default, {
      props: {
        error: null,
      },
    })

    expect(wrapper.find('div').exists()).toBe(false)
  })

  it('should not render when error is undefined', async () => {
    const ErrorAlert = await import('./ErrorAlert.vue')
    const wrapper = mount(ErrorAlert.default, {
      props: {
        error: undefined as unknown as null,
      },
    })

    expect(wrapper.find('div').exists()).toBe(false)
  })

  it('should not render when error is empty string', async () => {
    const ErrorAlert = await import('./ErrorAlert.vue')
    const wrapper = mount(ErrorAlert.default, {
      props: {
        error: '',
      },
    })

    expect(wrapper.find('div').exists()).toBe(false)
  })

  it('should render error message when error is provided', async () => {
    const ErrorAlert = await import('./ErrorAlert.vue')
    const wrapper = mount(ErrorAlert.default, {
      props: {
        error: 'Something went wrong',
      },
    })

    expect(wrapper.find('div').exists()).toBe(true)
    expect(wrapper.text()).toContain('Something went wrong')
  })

  it('should apply default classes without wrapped prop', async () => {
    const ErrorAlert = await import('./ErrorAlert.vue')
    const wrapper = mount(ErrorAlert.default, {
      props: {
        error: 'Test error',
      },
    })

    const div = wrapper.find('div')
    expect(div.classes()).toContain('bg-red-50')
    expect(div.classes()).toContain('dark:bg-red-900/30')
    expect(div.classes()).toContain('border-red-200')
    expect(div.classes()).toContain('dark:border-red-800')
    expect(div.classes()).toContain('rounded-lg')
    expect(div.classes()).toContain('p-4')
  })

  it('should apply mb-6 margin by default', async () => {
    const ErrorAlert = await import('./ErrorAlert.vue')
    const wrapper = mount(ErrorAlert.default, {
      props: {
        error: 'Test error',
      },
    })

    const div = wrapper.find('div')
    expect(div.classes()).toContain('mb-6')
  })

  it('should not apply mb-6 when noMargin is true', async () => {
    const ErrorAlert = await import('./ErrorAlert.vue')
    const wrapper = mount(ErrorAlert.default, {
      props: {
        error: 'Test error',
        noMargin: true,
      },
    })

    const div = wrapper.find('div')
    expect(div.classes()).not.toContain('mb-6')
  })

  it('should apply wrapped classes when wrapped prop is true', async () => {
    const ErrorAlert = await import('./ErrorAlert.vue')
    const wrapper = mount(ErrorAlert.default, {
      props: {
        error: 'Test error',
        wrapped: true,
      },
    })

    const div = wrapper.find('div')
    expect(div.classes()).toContain('max-w-7xl')
    expect(div.classes()).toContain('mx-auto')
    expect(div.classes()).toContain('px-4')
    expect(div.classes()).toContain('sm:px-6')
    expect(div.classes()).toContain('lg:px-8')
    expect(div.classes()).toContain('py-8')
  })

  it('should not apply wrapped classes when wrapped is false', async () => {
    const ErrorAlert = await import('./ErrorAlert.vue')
    const wrapper = mount(ErrorAlert.default, {
      props: {
        error: 'Test error',
        wrapped: false,
      },
    })

    const div = wrapper.find('div')
    expect(div.classes()).not.toContain('max-w-7xl')
    expect(div.classes()).not.toContain('mx-auto')
  })

  it('should display error text with correct dark mode color', async () => {
    const ErrorAlert = await import('./ErrorAlert.vue')
    const wrapper = mount(ErrorAlert.default, {
      props: {
        error: 'Dark mode error',
      },
    })

    const p = wrapper.find('p')
    expect(p.classes()).toContain('text-red-800')
    expect(p.classes()).toContain('dark:text-red-300')
  })

  it('should handle wrapped and noMargin together - noMargin takes precedence', async () => {
    const ErrorAlert = await import('./ErrorAlert.vue')
    const wrapper = mount(ErrorAlert.default, {
      props: {
        error: 'Test error',
        wrapped: true,
        noMargin: true,
      },
    })

    const div = wrapper.find('div')
    expect(div.classes()).not.toContain('mb-6')
    expect(div.classes()).toContain('max-w-7xl')
  })

  it('should render correctly with wrapped and noMargin both false', async () => {
    const ErrorAlert = await import('./ErrorAlert.vue')
    const wrapper = mount(ErrorAlert.default, {
      props: {
        error: 'Test error',
        wrapped: false,
        noMargin: false,
      },
    })

    const div = wrapper.find('div')
    expect(div.classes()).toContain('mb-6')
    expect(div.classes()).not.toContain('max-w-7xl')
  })
})