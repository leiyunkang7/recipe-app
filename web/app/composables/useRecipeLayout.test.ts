import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useRecipeLayout, useCategorySelect } from '../composables/useRecipeLayout'

const mockRecipe = (id: number, title: string) => ({
  id,
  title,
  description: 'Test description',
  ingredients: [],
  steps: [],
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  servings: 4,
  difficulty: 'medium' as const,
  category: 'main',
  imageUrl: null,
  createdAt: new Date(),
})

describe('useRecipeLayout', () => {
  describe('leftColumnRecipes', () => {
    it('should return recipes at even indices (0, 2, 4...)', () => {
      const recipes = ref([
        mockRecipe(1, 'Recipe 1'),
        mockRecipe(2, 'Recipe 2'),
        mockRecipe(3, 'Recipe 3'),
        mockRecipe(4, 'Recipe 4'),
        mockRecipe(5, 'Recipe 5'),
      ])

      const { leftColumnRecipes } = useRecipeLayout(() => recipes.value)

      expect(leftColumnRecipes.value).toHaveLength(3)
      expect(leftColumnRecipes.value.map(r => r.id)).toEqual([1, 3, 5])
    })

    it('should return empty array when no recipes', () => {
      const recipes = ref<ReturnType<typeof mockRecipe>[]>([])

      const { leftColumnRecipes } = useRecipeLayout(() => recipes.value)

      expect(leftColumnRecipes.value).toHaveLength(0)
    })

    it('should return single recipe when only one recipe', () => {
      const recipes = ref([mockRecipe(1, 'Recipe 1')])

      const { leftColumnRecipes } = useRecipeLayout(() => recipes.value)

      expect(leftColumnRecipes.value).toHaveLength(1)
      expect(leftColumnRecipes.value[0].id).toBe(1)
    })
  })

  describe('rightColumnRecipes', () => {
    it('should return recipes at odd indices (1, 3, 5...)', () => {
      const recipes = ref([
        mockRecipe(1, 'Recipe 1'),
        mockRecipe(2, 'Recipe 2'),
        mockRecipe(3, 'Recipe 3'),
        mockRecipe(4, 'Recipe 4'),
        mockRecipe(5, 'Recipe 5'),
      ])

      const { rightColumnRecipes } = useRecipeLayout(() => recipes.value)

      expect(rightColumnRecipes.value).toHaveLength(2)
      expect(rightColumnRecipes.value.map(r => r.id)).toEqual([2, 4])
    })

    it('should return empty array when no recipes', () => {
      const recipes = ref<ReturnType<typeof mockRecipe>[]>([])

      const { rightColumnRecipes } = useRecipeLayout(() => recipes.value)

      expect(rightColumnRecipes.value).toHaveLength(0)
    })

    it('should return empty when only one recipe', () => {
      const recipes = ref([mockRecipe(1, 'Recipe 1')])

      const { rightColumnRecipes } = useRecipeLayout(() => recipes.value)

      expect(rightColumnRecipes.value).toHaveLength(0)
    })
  })
})

describe('useCategorySelect', () => {
  describe('selectCategory', () => {
    it('should set category when different from current', () => {
      const selectedCategory = ref('')
      const setCategory = (value: string) => { selectedCategory.value = value }

      const { selectCategory } = useCategorySelect(
        () => selectedCategory.value,
        setCategory
      )

      selectCategory('main')

      expect(selectedCategory.value).toBe('main')
    })

    it('should clear category when same as current', () => {
      const selectedCategory = ref('main')
      const setCategory = (value: string) => { selectedCategory.value = value }

      const { selectCategory } = useCategorySelect(
        () => selectedCategory.value,
        setCategory
      )

      selectCategory('main')

      expect(selectedCategory.value).toBe('')
    })

    it('should switch between categories', () => {
      const selectedCategory = ref('main')
      const setCategory = (value: string) => { selectedCategory.value = value }

      const { selectCategory } = useCategorySelect(
        () => selectedCategory.value,
        setCategory
      )

      selectCategory('dessert')
      expect(selectedCategory.value).toBe('dessert')

      selectCategory('dessert')
      expect(selectedCategory.value).toBe('')
    })
  })
})
