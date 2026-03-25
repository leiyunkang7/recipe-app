import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

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
    locale: { value: 'zh' },
  }),
}))

describe('FavoriteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockIsFavorite.mockReturnValue(false)
    mockToggleFavorite.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should render button with correct structure', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      expect(wrapper.find('button.favorite-btn').exists()).toBe(true)
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should render with default size (md)', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.classes()).toContain('min-w-[44px]')
      expect(button.classes()).toContain('min-h-[44px]')
    })

    it('should render with small size (sm)', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
          size: 'sm',
        },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.classes()).toContain('w-8')
      expect(button.classes()).toContain('h-8')
    })

    it('should render with large size (lg)', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
          size: 'lg',
        },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.classes()).toContain('w-12')
      expect(button.classes()).toContain('h-12')
    })
  })

  describe('favorite state styling', () => {
    it('should apply non-favorited styles when not favorited', async () => {
      mockIsFavorite.mockReturnValue(false)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.classes()).toContain('bg-white/90')
      expect(button.classes()).toContain('text-gray-400')
    })

    it('should apply favorited styles when favorited', async () => {
      mockIsFavorite.mockReturnValue(true)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.classes()).toContain('bg-red-50')
      expect(button.classes()).toContain('text-red-500')
    })

    it('should fill the heart icon when favorited', async () => {
      mockIsFavorite.mockReturnValue(true)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('fill')).toBe('currentColor')
    })

    it('should not fill the heart icon when not favorited', async () => {
      mockIsFavorite.mockReturnValue(false)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('fill')).toBe('none')
    })
  })

  describe('click handling', () => {
    it('should call toggleFavorite when clicked', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      await wrapper.find('button.favorite-btn').trigger('click')
      await flushPromises()

      expect(mockToggleFavorite).toHaveBeenCalledWith('recipe-1')
    })

    it('should prevent event propagation', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      }

      const button = wrapper.find('button.favorite-btn')
      await button.trigger('click', mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockEvent.stopPropagation).toHaveBeenCalled()
    })

    it('should trigger animation on click', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      await wrapper.find('button.favorite-btn').trigger('click')
      await flushPromises()

      // Animation class should be applied briefly
      vi.advanceTimersByTime(350)

      await nextTick()
    })
  })

  describe('label display', () => {
    it('should not show label by default', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      expect(wrapper.find('span.text-sm').exists()).toBe(false)
    })

    it('should show label when showLabel is true', async () => {
      mockIsFavorite.mockReturnValue(false)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
          showLabel: true,
        },
      })

      const label = wrapper.find('span.text-sm')
      expect(label.exists()).toBe(true)
      expect(label.text()).toBe('favorites.add')
    })

    it('should show remove label when favorited and showLabel is true', async () => {
      mockIsFavorite.mockReturnValue(true)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
          showLabel: true,
        },
      })

      const label = wrapper.find('span.text-sm')
      expect(label.text()).toBe('favorites.remove')
    })
  })

  describe('icon scaling animation', () => {
    it('should apply scale-125 class during animation', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      await wrapper.find('button.favorite-btn').trigger('click')
      await flushPromises()

      const svg = wrapper.find('svg')
      expect(svg.classes()).toContain('scale-125')
    })
  })

  describe('accessibility', () => {
    it('should have correct title for non-favorited state', async () => {
      mockIsFavorite.mockReturnValue(false)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.attributes('title')).toBe('favorites.add')
    })

    it('should have correct title for favorited state', async () => {
      mockIsFavorite.mockReturnValue(true)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.attributes('title')).toBe('favorites.remove')
    })

    it('should be a button element', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: {
          recipeId: 'recipe-1',
        },
      })

      expect(wrapper.find('button').exists()).toBe(true)
    })
  })
})