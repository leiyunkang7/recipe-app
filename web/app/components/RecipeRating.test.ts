import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, readonly } from 'vue'

// Mock dependencies
const mockInit = vi.fn()
const mockSubmitRating = vi.fn()

vi.mock('~/composables/useRecipeRating', () => ({
  useRecipeRating: () => ({
    averageRating: ref(4.5),
    ratingCount: ref(128),
    userRating: ref(0),
    loading: ref(false),
    submitting: ref(false),
    init: mockInit,
    submitRating: mockSubmitRating,
  }),
}))

vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: ref('zh'),
  }),
}))

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
})

describe('RecipeRating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInit.mockResolvedValue(undefined)
    mockSubmitRating.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should render 5 stars', async () => {
      const RecipeRating = await import('./RecipeRating.vue')
      const wrapper = mount(RecipeRating.default, {
        props: {
          recipeId: 'test-recipe',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const stars = wrapper.findAll('.star')
      expect(stars).toHaveLength(5)
    })

    it('should display average rating', async () => {
      const RecipeRating = await import('./RecipeRating.vue')
      const wrapper = mount(RecipeRating.default, {
        props: {
          recipeId: 'test-recipe',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      expect(wrapper.html()).toContain('4.5')
    })

    it('should display rating count', async () => {
      const RecipeRating = await import('./RecipeRating.vue')
      const wrapper = mount(RecipeRating.default, {
        props: {
          recipeId: 'test-recipe',
          showCount: true,
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      expect(wrapper.html()).toContain('(128)')
    })

    it('should hide rating count when showCount is false', async () => {
      const RecipeRating = await import('./RecipeRating.vue')
      const wrapper = mount(RecipeRating.default, {
        props: {
          recipeId: 'test-recipe',
          showCount: false,
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      expect(wrapper.html()).not.toContain('(128)')
    })
  })

  describe('loading state', () => {
    it('should show loading skeleton when loading', async () => {
      vi.mock('~/composables/useRecipeRating', () => ({
        useRecipeRating: () => ({
          averageRating: ref(0),
          ratingCount: ref(0),
          userRating: ref(0),
          loading: ref(true),
          submitting: ref(false),
          init: mockInit,
          submitRating: mockSubmitRating,
        }),
      }))

      const RecipeRating = await import('./RecipeRating.vue')
      const wrapper = mount(RecipeRating.default, {
        props: {
          recipeId: 'test-recipe',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    })
  })

  describe('interactivity', () => {
    it('should call init on mount', async () => {
      const RecipeRating = await import('./RecipeRating.vue')
      mount(RecipeRating.default, {
        props: {
          recipeId: 'test-recipe',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      expect(mockInit).toHaveBeenCalled()
    })

    it('should submit rating when star is clicked', async () => {
      const RecipeRating = await import('./RecipeRating.vue')
      const wrapper = mount(RecipeRating.default, {
        props: {
          recipeId: 'test-recipe',
          interactive: true,
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const stars = wrapper.findAll('.star')
      await stars[3]!.trigger('click') // Click 4th star

      expect(mockSubmitRating).toHaveBeenCalledWith(4)
    })

    it('should not submit rating when not interactive', async () => {
      const RecipeRating = await import('./RecipeRating.vue')
      const wrapper = mount(RecipeRating.default, {
        props: {
          recipeId: 'test-recipe',
          interactive: false,
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const stars = wrapper.findAll('.star')
      await stars[3]!.trigger('click')

      expect(mockSubmitRating).not.toHaveBeenCalled()
    })

    it('should show hover state on star mouseenter', async () => {
      const RecipeRating = await import('./RecipeRating.vue')
      const wrapper = mount(RecipeRating.default, {
        props: {
          recipeId: 'test-recipe',
          interactive: true,
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const stars = wrapper.findAll('.star')
      await stars[2]!.trigger('mouseenter') // Hover 3rd star

      // The display rating should show 3 stars when hovering
      const filledStars = wrapper.findAll('.text-amber-400')
      expect(filledStars.length).toBeGreaterThan(0)
    })
  })

  describe('size variants', () => {
    it('should apply small size classes', async () => {
      const RecipeRating = await import('./RecipeRating.vue')
      const wrapper = mount(RecipeRating.default, {
        props: {
          recipeId: 'test-recipe',
          size: 'sm',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const starButton = wrapper.find('.star')
      expect(starButton.classes()).toContain('w-4')
      expect(starButton.classes()).toContain('h-4')
    })

    it('should apply large size classes', async () => {
      const RecipeRating = await import('./RecipeRating.vue')
      const wrapper = mount(RecipeRating.default, {
        props: {
          recipeId: 'test-recipe',
          size: 'lg',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      const starButton = wrapper.find('.star')
      expect(starButton.classes()).toContain('w-6')
      expect(starButton.classes()).toContain('h-6')
    })
  })

  describe('submitting state', () => {
    it('should show submitting indicator', async () => {
      vi.mock('~/composables/useRecipeRating', () => ({
        useRecipeRating: () => ({
          averageRating: ref(4.5),
          ratingCount: ref(128),
          userRating: ref(0),
          loading: ref(false),
          submitting: ref(true),
          init: mockInit,
          submitRating: mockSubmitRating,
        }),
      }))

      const RecipeRating = await import('./RecipeRating.vue')
      const wrapper = mount(RecipeRating.default, {
        props: {
          recipeId: 'test-recipe',
        },
        global: {
          stubs: {
            Teleport: true,
          },
        },
      })

      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })
  })
})