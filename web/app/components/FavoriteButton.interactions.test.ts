import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

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

  describe('click handling', () => {
    it('should call toggleFavorite when clicked', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1' },
      })

      await wrapper.find('button.favorite-btn').trigger('click')
      await flushPromises()

      expect(mockToggleFavorite).toHaveBeenCalledWith('recipe-1')
    })

    it('should prevent event propagation', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1' },
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
        props: { recipeId: 'recipe-1' },
      })

      await wrapper.find('button.favorite-btn').trigger('click')
      await flushPromises()

      // Animation class should be applied briefly
      vi.advanceTimersByTime(350)

      await nextTick()
    })
  })

  describe('icon scaling animation', () => {
    it('should apply scale-125 class during animation', async () => {
      const FavoriteButton = await import('./FavoriteButton.vue')
      const wrapper = mount(FavoriteButton.default, {
        props: { recipeId: 'recipe-1' },
      })

      await wrapper.find('button.favorite-btn').trigger('click')
      await flushPromises()

      const svg = wrapper.find('svg')
      expect(svg.classes()).toContain('scale-125')
    })
  })
})
