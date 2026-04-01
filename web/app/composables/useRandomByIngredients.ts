import type { Recipe, Locale } from '~/types'
import { mapRecipeData, type RawRecipe } from '~/utils/recipeMapper'

/**
 * useRandomByIngredients - 根据用户输入的食材随机推荐食谱
 * 
 * 功能：
 * - 获取所有可用食材列表（去重）
 * - 根据用户选择的食材筛选食谱
 * - 返回匹配度最高的随机食谱
 */
export const useRandomByIngredients = () => {
  const { $supabase } = useNuxtApp()
  const { locale } = useI18n()
  
  const loading = ref(false)
  const error = ref<string | null>(null)
  const allIngredients = ref<string[]>([])
  const matchedRecipes = ref<Recipe[]>([])
  
  const currentLocale = computed(() => locale.value as Locale)

	// 获取所有去重后的食材名称
	const fetchAllIngredients = async () => {
		loading.value = true
		error.value = null
		
		try {
			const { data, error: err } = await $supabase
				.from('recipe_ingredients')
				.select('name')
				.limit(1000)
			
			if (err) throw err
			
			// 去重并排序
			const uniqueIngredients = [...new Set((data || []).map(i => i.name))].sort()
			allIngredients.value = uniqueIngredients
			
			return uniqueIngredients
		} catch (err: unknown) {
			error.value = err instanceof Error ? err.message : 'Failed to fetch ingredients'
			return []
		} finally {
			loading.value = false
		}
	}

	// 根据食材筛选食谱
	const fetchRecipesByIngredients = async (selectedIngredients: string[]) => {
		if (selectedIngredients.length === 0) {
			matchedRecipes.value = []
			return []
		}

		loading.value = true
		error.value = null

		try {
			const loc = currentLocale.value
			
			// 查询包含任一选中食材的食谱
			// 使用 ilike 进行模糊匹配（支持中文）
			const ingredientFilters = selectedIngredients.map(ing => 
				`name.ilike.%${ing}%`
			)
			
			// 首先获取包含这些食材的食谱ID
			const { data: ingredientsData, error: ingErr } = await $supabase
				.from('recipe_ingredients')
				.select('recipe_id, name')
				.or(ingredientFilters.join(','))

			if (ingErr) throw ingErr

			if (!ingredientsData || ingredientsData.length === 0) {
				matchedRecipes.value = []
				return []
			}

			// 获取匹配的食谱ID列表
			const matchedRecipeIds = [...new Set(ingredientsData.map(i => i.recipe_id))]
			
			// 获取这些食谱的完整信息
			const { data: recipesData, error: recipeErr } = await $supabase
				.from('recipes')
				.select(`
					*,
					ingredients:recipe_ingredients(
						id,
						name,
						amount,
						unit
					),
					steps:recipe_steps(
						id,
						step_number,
						instruction,
						duration_minutes
					),
					tags:recipe_tags(
						tag
					)
				`)
				.in('id', matchedRecipeIds)
				.limit(50)

			if (recipeErr) throw recipeErr

			const mappedData = (recipesData || []).map((recipe: RawRecipe) => 
				mapRecipeData(recipe, loc)
			) as Recipe[]

			// 计算每道菜的匹配度并排序
			const recipesWithMatchScore = mappedData.map(recipe => {
				const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase())
				const selectedLower = selectedIngredients.map(s => s.toLowerCase())
				
				// 计算匹配数量
				const matchCount = selectedLower.filter(sel => 
					recipeIngredients.some(ri => ri.includes(sel) || sel.includes(ri))
				).length
				
				return {
					recipe,
					matchScore: matchCount,
					matchRatio: matchCount / selectedIngredients.length
				}
			})

			// 按匹配度和匹配比例排序
			recipesWithMatchScore.sort((a, b) => {
				if (b.matchScore !== a.matchScore) {
					return b.matchScore - a.matchScore
				}
				return b.matchRatio - a.matchRatio
			})

			matchedRecipes.value = recipesWithMatchScore.map(r => r.recipe)
			return matchedRecipes.value
		} catch (err: unknown) {
			error.value = err instanceof Error ? err.message : 'Failed to fetch recipes'
			return []
		} finally {
			loading.value = false
		}
	}

	// 随机获取一道匹配的食谱
	const getRandomRecipe = () => {
		if (matchedRecipes.value.length === 0) return null
		
		const randomIndex = Math.floor(Math.random() * matchedRecipes.value.length)
		return matchedRecipes.value[randomIndex]
	}

	return {
		loading,
		error,
		allIngredients,
		matchedRecipes,
		fetchAllIngredients,
		fetchRecipesByIngredients,
		getRandomRecipe
	}
}
