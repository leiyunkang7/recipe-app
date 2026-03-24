import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { h } from 'vue'

// Mock useFavorites composable
const mockIsFavorite = vi.fn()
const mockToggleFavorite = vi.fn()

vi.mock('~/composables/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
  }),
}))

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

describe('FavoriteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsFavorite.mockReturnValue(false)
    mockToggleFavorite.mockResolvedValue(undefined)
  })

  it('should render with default props', async () => {
    const FavoriteButton = await import('./FavoriteButton.vue')
    const wrapper = mount(FavoriteButton.default, {
      props: {
        recipeId: 'test-recipe-123',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('should display heart outline when not favorited', async () => {
    mockIsFavorite.mockReturnValue(false)

    const FavoriteButton = await import('./FavoriteButton.vue')
    const wrapper = mount(FavoriteButton.default, {
      props: {
        recipeId: 'test-recipe-123',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('fill')).toBe('none')
  })

  it('should display filled heart when favorited', async () => {
    mockIsFavorite.mockReturnValue(true)

    const FavoriteButton = await import('./FavoriteButton.vue')
    const wrapper = mount(FavoriteButton.default, {
      props: {
        recipeId: 'test-recipe-123',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('fill')).toBe('currentColor')
  })

  it('should call toggleFavorite when clicked', async () => {
    const FavoriteButton = await import('./FavoriteButton.vue')
    const wrapper = mount(FavoriteButton.default, {
      props: {
        recipeId: 'test-recipe-123',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(mockToggleFavorite).toHaveBeenCalledWith('test-recipe-123')
  })

  it('should prevent event propagation when clicked', async () => {
    const FavoriteButton = await import('./FavoriteButton.vue')
    const wrapper = mount(FavoriteButton.default, {
      props: {
        recipeId: 'test-recipe-123',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const clickEvent = new MouseEvent('click', { bubbles: true })
    vi.spyOn(clickEvent, 'preventDefault')
    vi.spyOn(clickEvent, 'stopPropagation')

    await wrapper.find('button').trigger('click', {
      event: clickEvent,
    })
    await flushPromises()

    expect(clickEvent.preventDefault).toHaveBeenCalled()
    expect(clickEvent.stopPropagation).toHaveBeenCalled()
  })

  it('should apply correct size classes', async () => {
    const FavoriteButton = await import('./FavoriteButton.vue')

    // Test small size
    const wrapperSm = mount(FavoriteButton.default, {
      props: {
        recipeId: 'test-recipe-123',
        size: 'sm',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })
    expect(wrapperSm.find('button').classes()).toContain('w-8')
    expect(wrapperSm.find('button').classes()).toContain('h-8')

    // Test large size
    const wrapperLg = mount(FavoriteButton.default, {
      props: {
        recipeId: 'test-recipe-123',
        size: 'lg',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })
    expect(wrapperLg.find('button').classes()).toContain('w-12')
    expect(wrapperLg.find('button').classes()).toContain('h-12')
  })
})