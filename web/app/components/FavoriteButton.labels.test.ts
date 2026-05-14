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

  describe('label display', () => {
    it('should not show label by default', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1' },
      })

      expect(wrapper.find('span.text-sm').exists()).toBe(false)
    })

    it('should show label when showLabel is true', async () => {
      mockIsFavorite.mockReturnValue(false)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1', showLabel: true },
      })

      const label = wrapper.find('span.text-sm')
      expect(label.exists()).toBe(true)
      expect(label.text()).toBe('favorites.add')
    })

    it('should show remove label when favorited and showLabel is true', async () => {
      mockIsFavorite.mockReturnValue(true)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1', showLabel: true },
      })

      const label = wrapper.find('span.text-sm')
      expect(label.text()).toBe('favorites.remove')
    })
  })
})
