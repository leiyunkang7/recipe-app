import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

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

// Mock useI18n from vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: ref('zh'),
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

  describe('accessibility', () => {
    it('should have correct title for non-favorited state', async () => {
      mockIsFavorite.mockReturnValue(false)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1' },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.attributes('title')).toBe('favorites.add')
    })

    it('should have correct title for favorited state', async () => {
      mockIsFavorite.mockReturnValue(true)

      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1' },
      })

      const button = wrapper.find('button.favorite-btn')
      expect(button.attributes('title')).toBe('favorites.remove')
    })

    it('should be a button element', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1' },
      })

      expect(wrapper.find('button').exists()).toBe(true)
    })
  })
})
