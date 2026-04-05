import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { RecipeListItem } from '~/types'

describe('RecipeGridColumn', () => {
  const createMockRecipe = (id: string, title: string): RecipeListItem => ({
    id,
    title,
    imageUrl: '/test.jpg',
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    servings: 4,
    created_at: '2024-01-01',
  })

  describe('rendering', () => {
    it('should render recipe cards for each recipe', async () => {
      const RecipeGridColumn = await import('./RecipeGridColumn.vue')
      const recipes = [
        createMockRecipe('1', 'Recipe 1'),
        createMockRecipe('2', 'Recipe 2'),
        createMockRecipe('3', 'Recipe 3'),
      ]

      const wrapper = mount(RecipeGridColumn.default, {
        props: {
          recipes,
        },
        global: {
          stubs: {
            RecipeCardLazy: {
              template: '<div class="recipe-card">{{ recipe.title }}</div>',
              props: ['recipe', 'enterDelay', 'disableAnimation'],
            },
          },
        },
      })

      const cards = wrapper.findAll('.recipe-card')
      expect(cards).toHaveLength(3)
    })

    it('should render empty when no recipes provided', async () => {
      const RecipeGridColumn = await import('./RecipeGridColumn.vue')
      const wrapper = mount(RecipeGridColumn.default, {
        props: {
          recipes: [],
        },
        global: {
          stubs: {
            RecipeCardLazy: {
              template: '<div class="recipe-card">{{ recipe.title }}</div>',
              props: ['recipe', 'enterDelay', 'disableAnimation'],
            },
          },
        },
      })

      const cards = wrapper.findAll('.recipe-card')
      expect(cards).toHaveLength(0)
    })

    it('should apply flex-col and gap classes', async () => {
      const RecipeGridColumn = await import('./RecipeGridColumn.vue')
      const recipes = [createMockRecipe('1', 'Recipe 1')]

      const wrapper = mount(RecipeGridColumn.default, {
        props: {
          recipes,
        },
        global: {
          stubs: {
            RecipeCardLazy: {
              template: '<div class="recipe-card">{{ recipe.title }}</div>',
              props: ['recipe', 'enterDelay', 'disableAnimation'],
            },
          },
        },
      })

      const container = wrapper.find('div')
      expect(container.classes()).toContain('flex-1')
      expect(container.classes()).toContain('flex-col')
      expect(container.classes()).toContain('gap-4')
      expect(container.classes()).toContain('md:gap-5')
    })
  })

  describe('enter delay calculation', () => {
    it('should pass enterDelay as index * 50 by default', async () => {
      const RecipeGridColumn = await import('./RecipeGridColumn.vue')
      const recipes = [
        createMockRecipe('1', 'Recipe 1'),
        createMockRecipe('2', 'Recipe 2'),
      ]

      const wrapper = mount(RecipeGridColumn.default, {
        props: {
          recipes,
        },
        global: {
          stubs: {
            RecipeCardLazy: {
              template: '<div class="recipe-card">{{ enterDelay }}</div>',
              props: ['recipe', 'enterDelay', 'disableAnimation'],
            },
          },
        },
      })

      const cards = wrapper.findAll('.recipe-card')
      expect(cards[0]!.text()).toBe('0')    // 0 * 50 = 0
      expect(cards[1]!.text()).toBe('50')   // 1 * 50 = 50
    })

    it('should apply enterDelayBase offset to all cards', async () => {
      const RecipeGridColumn = await import('./RecipeGridColumn.vue')
      const recipes = [
        createMockRecipe('1', 'Recipe 1'),
        createMockRecipe('2', 'Recipe 2'),
      ]

      const wrapper = mount(RecipeGridColumn.default, {
        props: {
          recipes,
          enterDelayBase: 100,
        },
        global: {
          stubs: {
            RecipeCardLazy: {
              template: '<div class="recipe-card">{{ enterDelay }}</div>',
              props: ['recipe', 'enterDelay', 'disableAnimation'],
            },
          },
        },
      })

      const cards = wrapper.findAll('.recipe-card')
      expect(cards[0]!.text()).toBe('100')  // 100 + 0 * 50 = 100
      expect(cards[1]!.text()).toBe('150')  // 100 + 1 * 50 = 150
    })

    it('should start from 0 enter delay when enterDelayBase is 0', async () => {
      const RecipeGridColumn = await import('./RecipeGridColumn.vue')
      const recipes = [createMockRecipe('1', 'Recipe 1')]

      const wrapper = mount(RecipeGridColumn.default, {
        props: {
          recipes,
          enterDelayBase: 0,
        },
        global: {
          stubs: {
            RecipeCardLazy: {
              template: '<div class="recipe-card">{{ enterDelay }}</div>',
              props: ['recipe', 'enterDelay', 'disableAnimation'],
            },
          },
        },
      })

      const card = wrapper.find('.recipe-card')
      expect(card.text()).toBe('0')
    })
  })

  describe('recipe prop passing', () => {
    it('should pass correct recipe to each card', async () => {
      const RecipeGridColumn = await import('./RecipeGridColumn.vue')
      const recipes = [
        createMockRecipe('recipe-a', 'Alpha Recipe'),
        createMockRecipe('recipe-b', 'Beta Recipe'),
      ]

      const wrapper = mount(RecipeGridColumn.default, {
        props: {
          recipes,
        },
        global: {
          stubs: {
            RecipeCardLazy: {
              template: '<div class="recipe-card">{{ recipe.title }}</div>',
              props: ['recipe', 'enterDelay', 'disableAnimation'],
            },
          },
        },
      })

      const cards = wrapper.findAll('.recipe-card')
      expect(cards[0]!.text()).toBe('Alpha Recipe')
      expect(cards[1]!.text()).toBe('Beta Recipe')
    })
  })
})