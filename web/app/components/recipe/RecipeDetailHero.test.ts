import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Mock AppImage component
vi.mock('~/components/AppImage.vue', () => ({
  default: {
    name: 'AppImage',
    props: ['src', 'alt', 'class', 'loading', 'fetchpriority', 'sizes', 'quality'],
    template: '<img :src="src" :alt="alt" class="app-image" />',
  },
}))

describe('RecipeDetailHero', () => {
  const createMockRecipe = (imageUrl?: string) => ({
    id: 'test-recipe',
    title: 'Test Recipe',
    description: 'A test recipe',
    imageUrl: imageUrl || null,
  })

  describe('mobile hero rendering', () => {
    it('should show image when imageUrl is provided', async () => {
      const RecipeDetailHero = await import('./RecipeDetailHero.vue')
      const recipe = createMockRecipe('/images/test.jpg')
      const wrapper = mount(RecipeDetailHero.default, {
        props: { recipe },
      })
      await flushPromises()
      expect(wrapper.find('.app-image').exists()).toBe(true)
    })

    it('should show emoji when imageUrl is not provided', async () => {
      const RecipeDetailHero = await import('./RecipeDetailHero.vue')
      const recipe = createMockRecipe()
      const wrapper = mount(RecipeDetailHero.default, {
        props: { recipe },
      })
      await flushPromises()
      expect(wrapper.find('.lg\\:hidden').text()).toContain('🍽️')
    })

    it('should have lg:hidden class for mobile hero', async () => {
      const RecipeDetailHero = await import('./RecipeDetailHero.vue')
      const recipe = createMockRecipe('/images/test.jpg')
      const wrapper = mount(RecipeDetailHero.default, {
        props: { recipe },
      })
      await flushPromises()
      expect(wrapper.find('.lg\\:hidden').exists()).toBe(true)
    })
  })

  describe('desktop hero rendering', () => {
    it('should show desktop hero with hidden lg class', async () => {
      const RecipeDetailHero = await import('./RecipeDetailHero.vue')
      const recipe = createMockRecipe('/images/test.jpg')
      const wrapper = mount(RecipeDetailHero.default, {
        props: { recipe },
      })
      await flushPromises()
      expect(wrapper.find('.hidden\\.lg\\:block').exists()).toBe(true)
    })

    it('should display image in desktop hero when provided', async () => {
      const RecipeDetailHero = await import('./RecipeDetailHero.vue')
      const recipe = createMockRecipe('/images/test-desktop.jpg')
      const wrapper = mount(RecipeDetailHero.default, {
        props: { recipe },
      })
      await flushPromises()
      const desktopHero = wrapper.find('.hidden.lg\\:block')
      expect(desktopHero.find('.app-image').exists()).toBe(true)
    })

    it('should show large emoji in desktop hero when no image', async () => {
      const RecipeDetailHero = await import('./RecipeDetailHero.vue')
      const recipe = createMockRecipe()
      const wrapper = mount(RecipeDetailHero.default, {
        props: { recipe },
      })
      await flushPromises()
      const desktopHero = wrapper.find('.hidden.lg\\:block')
      expect(desktopHero.text()).toContain('🍽️')
    })
  })

  describe('image props', () => {
    it('should pass correct src to AppImage', async () => {
      const RecipeDetailHero = await import('./RecipeDetailHero.vue')
      const recipe = createMockRecipe('/images/my-recipe.jpg')
      const wrapper = mount(RecipeDetailHero.default, {
        props: { recipe },
      })
      await flushPromises()
      const appImage = wrapper.find('.app-image')
      expect(appImage.props('src')).toBe('/images/my-recipe.jpg')
    })

    it('should pass recipe title as alt to AppImage', async () => {
      const RecipeDetailHero = await import('./RecipeDetailHero.vue')
      const recipe = createMockRecipe('/images/test.jpg')
      const wrapper = mount(RecipeDetailHero.default, {
        props: { recipe },
      })
      await flushPromises()
      const appImage = wrapper.find('.app-image')
      expect(appImage.props('alt')).toBe('Test Recipe')
    })
  })

  describe('gradient overlay', () => {
    it('should have gradient mask on mobile hero', async () => {
      const RecipeDetailHero = await import('./RecipeDetailHero.vue')
      const recipe = createMockRecipe('/images/test.jpg')
      const wrapper = mount(RecipeDetailHero.default, {
        props: { recipe },
      })
      await flushPromises()
      const gradientMasks = wrapper.findAll('.bg-gradient-to-t')
      expect(gradientMasks.length).toBeGreaterThan(0)
    })
  })
})