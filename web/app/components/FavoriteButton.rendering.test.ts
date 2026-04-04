import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock isFavorite and toggleFavorite
const mockIsFavorite = vi.fn()
const mockToggleFavorite = vi.fn()

// Mock useFavorites composable
vi.mock('~/composables/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
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
        props: { recipeId: 'recipe-1' },
      })

      expect(wrapper.find('button.favorite-btn').exists()).toBe(true)
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should render with default size (md)', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1' },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.classes()).toContain('min-w-[44px]')
      expect(button.classes()).toContain('min-h-[44px]')
    })

    it('should render with small size (sm)', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1', size: 'sm' },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.classes()).toContain('w-8')
      expect(button.classes()).toContain('h-8')
    })

    it('should render with large size (lg)', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1', size: 'lg' },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.classes()).toContain('w-12')
      expect(button.classes()).toContain('h-12')
    })
  })
})
