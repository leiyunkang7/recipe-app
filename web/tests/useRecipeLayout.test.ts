import { describe, it, expect } from 'vitest'
import { useRecipeLayout, useCategorySelect } from '../app/composables/useRecipeLayout'
import type { Recipe } from '../app/types'

describe('useRecipeLayout', () => {
  const createMockRecipes = (count: number): Recipe[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `recipe-${i}`,
      title: `Recipe ${i}`,
      category: 'main',
      servings: 4,
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      difficulty: 'medium' as const,
      ingredients: [],
      steps: [],
    }))
  }

  describe('leftColumnRecipes', () => {
    it('should contain recipes at even indices', () => {
      const recipes = createMockRecipes(4)
      const { leftColumnRecipes } = useRecipeLayout(() => recipes)
      
      expect(leftColumnRecipes.value).toHaveLength(2)
      expect(leftColumnRecipes.value[0].id).toBe('recipe-0')
      expect(leftColumnRecipes.value[1].id).toBe('recipe-2')
    })

    it('should return empty array when no recipes', () => {
      const { leftColumnRecipes } = useRecipeLayout(() => [])
      expect(leftColumnRecipes.value).toHaveLength(0)
    })

    it('should handle single recipe', () => {
      const recipes = createMockRecipes(1)
      const { leftColumnRecipes } = useRecipeLayout(() => recipes)
      
      expect(leftColumnRecipes.value).toHaveLength(1)
      expect(leftColumnRecipes.value[0].id).toBe('recipe-0')
    })

    it('should handle odd number of recipes', () => {
      const recipes = createMockRecipes(5)
      const { leftColumnRecipes } = useRecipeLayout(() => recipes)
      
      expect(leftColumnRecipes.value).toHaveLength(3)
    })
  })

  describe('rightColumnRecipes', () => {
    it('should contain recipes at odd indices', () => {
      const recipes = createMockRecipes(4)
      const { rightColumnRecipes } = useRecipeLayout(() => recipes)
      
      expect(rightColumnRecipes.value).toHaveLength(2)
      expect(rightColumnRecipes.value[0].id).toBe('recipe-1')
      expect(rightColumnRecipes.value[1].id).toBe('recipe-3')
    })

    it('should return empty array when no recipes', () => {
      const { rightColumnRecipes } = useRecipeLayout(() => [])
      expect(rightColumnRecipes.value).toHaveLength(0)
    })

    it('should return empty array when only one recipe', () => {
      const recipes = createMockRecipes(1)
      const { rightColumnRecipes } = useRecipeLayout(() => recipes)
      
      expect(rightColumnRecipes.value).toHaveLength(0)
    })

    it('should handle odd number of recipes', () => {
      const recipes = createMockRecipes(5)
      const { rightColumnRecipes } = useRecipeLayout(() => recipes)
      
      expect(rightColumnRecipes.value).toHaveLength(2)
    })
  })

  describe('column distribution', () => {
    it('should distribute all recipes between columns', () => {
      const recipes = createMockRecipes(10)
      const { leftColumnRecipes, rightColumnRecipes } = useRecipeLayout(() => recipes)
      
      expect(leftColumnRecipes.value.length + rightColumnRecipes.value.length).toBe(10)
    })

    it('should not have overlapping recipes between columns', () => {
      const recipes = createMockRecipes(6)
      const { leftColumnRecipes, rightColumnRecipes } = useRecipeLayout(() => recipes)
      
      const leftIds = leftColumnRecipes.value.map(r => r.id)
      const rightIds = rightColumnRecipes.value.map(r => r.id)
      
      const overlap = leftIds.filter(id => rightIds.includes(id))
      expect(overlap).toHaveLength(0)
    })
  })
})

describe('useCategorySelect', () => {
  const createMockState = () => {
    let selected = ''
    const setSelected = (value: string) => {
      selected = value
    }
    const getSelected = () => selected
    return { getSelected, setSelected }
  }

  describe('selectCategory', () => {
    it('should select a category when none is selected', () => {
      const { getSelected, setSelected } = createMockState()
      const { selectCategory } = useCategorySelect(getSelected, setSelected)
      
      selectCategory('main')
      expect(getSelected()).toBe('main')
    })

    it('should deselect a category when it is already selected', () => {
      const { getSelected, setSelected } = createMockState()
      const { selectCategory } = useCategorySelect(getSelected, setSelected)
      
      setSelected('main')
      selectCategory('main')
      expect(getSelected()).toBe('')
    })

    it('should switch to a different category', () => {
      const { getSelected, setSelected } = createMockState()
      const { selectCategory } = useCategorySelect(getSelected, setSelected)
      
      setSelected('main')
      selectCategory('dessert')
      expect(getSelected()).toBe('dessert')
    })

    it('should toggle category on repeated calls', () => {
      const { getSelected, setSelected } = createMockState()
      const { selectCategory } = useCategorySelect(getSelected, setSelected)
      
      selectCategory('main')
      expect(getSelected()).toBe('main')
      
      selectCategory('main')
      expect(getSelected()).toBe('')
      
      selectCategory('main')
      expect(getSelected()).toBe('main')
    })
  })
})
