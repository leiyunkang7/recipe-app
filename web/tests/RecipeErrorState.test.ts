import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock i18n
vi.mock('#imports', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'error.title': 'Error Title',
        'error.retry': 'Retry',
      }
      return translations[key] || key
    },
  })),
}))

describe('RecipeErrorState', () => {
  it('should render error state when error prop is provided', async () => {
    const RecipeErrorState = await import('../app/components/RecipeErrorState.vue')
    const wrapper = mount(RecipeErrorState.default, {
      props: {
        error: 'Something went wrong',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.find('.bg-red-50\\/80').exists()).toBe(true)
    expect(wrapper.text()).toContain('Something went wrong')
  })

  it('should not render when error prop is null', async () => {
    const RecipeErrorState = await import('../app/components/RecipeErrorState.vue')
    const wrapper = mount(RecipeErrorState.default, {
      props: {
        error: null,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.html()).toBe('')
  })

  it('should not render when error prop is undefined', async () => {
    const RecipeErrorState = await import('../app/components/RecipeErrorState.vue')
    const wrapper = mount(RecipeErrorState.default, {
      props: {
        error: undefined,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.html()).toBe('')
  })

  it('should display error title from i18n', async () => {
    const RecipeErrorState = await import('../app/components/RecipeErrorState.vue')
    const wrapper = mount(RecipeErrorState.default, {
      props: {
        error: 'Test error',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Error Title')
  })

  it('should display retry button with i18n text', async () => {
    const RecipeErrorState = await import('../app/components/RecipeErrorState.vue')
    const wrapper = mount(RecipeErrorState.default, {
      props: {
        error: 'Test error',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const retryButton = wrapper.find('button')
    expect(retryButton.exists()).toBe(true)
    expect(retryButton.text()).toBe('Retry')
  })

  it('should emit retry event when retry button is clicked', async () => {
    const RecipeErrorState = await import('../app/components/RecipeErrorState.vue')
    const wrapper = mount(RecipeErrorState.default, {
      props: {
        error: 'Test error',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const retryButton = wrapper.find('button')
    await retryButton.trigger('click')

    expect(wrapper.emitted('retry')).toBeTruthy()
    expect(wrapper.emitted('retry')?.length).toBe(1)
  })

  it('should display sad emoji', async () => {
    const RecipeErrorState = await import('../app/components/RecipeErrorState.vue')
    const wrapper = mount(RecipeErrorState.default, {
      props: {
        error: 'Test error',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).toContain('😕')
  })

  it('should have correct styling classes for dark mode support', async () => {
    const RecipeErrorState = await import('../app/components/RecipeErrorState.vue')
    const wrapper = mount(RecipeErrorState.default, {
      props: {
        error: 'Test error',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const errorCard = wrapper.find('.bg-red-50\\/80')
    expect(errorCard.classes()).toContain('dark:bg-red-900/30')
    expect(errorCard.classes()).toContain('dark:border-red-800')
  })

  it('should have centered text layout', async () => {
    const RecipeErrorState = await import('../app/components/RecipeErrorState.vue')
    const wrapper = mount(RecipeErrorState.default, {
      props: {
        error: 'Test error',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const errorCard = wrapper.find('.text-center')
    expect(errorCard.exists()).toBe(true)
  })

  it('should have max-width constraint', async () => {
    const RecipeErrorState = await import('../app/components/RecipeErrorState.vue')
    const wrapper = mount(RecipeErrorState.default, {
      props: {
        error: 'Test error',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const container = wrapper.find('.max-w-md')
    expect(container.exists()).toBe(true)
  })
})
