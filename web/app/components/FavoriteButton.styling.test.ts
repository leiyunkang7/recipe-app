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

  describe('favorite state styling', () => {
    it('should apply non-favorited styles when not favorited', async () => {
      mockIsFavorite.mockReturnValue(false)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1' },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.classes()).toContain('bg-white/90')
      expect(button.classes()).toContain('text-gray-400')
    })

    it('should apply favorited styles when favorited', async () => {
      mockIsFavorite.mockReturnValue(true)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1' },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.classes()).toContain('bg-red-50')
      expect(button.classes()).toContain('text-red-500')
    })

    it('should fill the heart icon when favorited', async () => {
      mockIsFavorite.mockReturnValue(true)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1' },
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('fill')).toBe('currentColor')
    })

    it('should not fill the heart icon when not favorited', async () => {
      mockIsFavorite.mockReturnValue(false)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1' },
      })

      const svg = wrapper.find('svg')
      expect(svg.attributes('fill')).toBe('none')
    })
  })
})
