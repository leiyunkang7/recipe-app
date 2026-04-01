import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("vue", async () => {
  const actual = await vi.importActual("vue")
  return {
    ...actual,
    useNuxtApp: vi.fn(() => ({
      $supabase: { from: vi.fn(() => ({ select: vi.fn(() => ({ limit: vi.fn(() => Promise.resolve({ data: [], error: null })) })) })) },
    })),
    useI18n: vi.fn(() => ({ locale: ref("en") })),
  }
})

describe("useRandomByIngredients", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("should initialize with empty state", async () => {
    const { useRandomByIngredients } = await import("./useRandomByIngredients")
    const { loading, error, allIngredients, matchedRecipes } = useRandomByIngredients()
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(allIngredients.value).toEqual([])
    expect(matchedRecipes.value).toEqual([])
  })
  it("should return empty array when no ingredients found", async () => {
    const { useRandomByIngredients } = await import("./useRandomByIngredients")
    const { fetchAllIngredients } = useRandomByIngredients()
    const mockFrom = vi.fn(() => ({ select: vi.fn(() => ({ limit: vi.fn(() => Promise.resolve({ data: null, error: null })) })) }))
    const { useNuxtApp } = await import("vue")
    ;(useNuxtApp as any).mockImplementation(() => ({ $supabase: { from: mockFrom } }))
    const result = await fetchAllIngredients()
    expect(result).toEqual([])
  })
  it("should clear matched recipes when empty ingredients provided", async () => {
    const { useRandomByIngredients } = await import("./useRandomByIngredients")
    const { fetchRecipesByIngredients, matchedRecipes } = useRandomByIngredients()
    const result = await fetchRecipesByIngredients([])
    expect(result).toEqual([])
    expect(matchedRecipes.value).toEqual([])
  })
  it("should get random recipe from matched recipes", async () => {
    const { useRandomByIngredients } = await import("./useRandomByIngredients")
    const { getRandomRecipe, matchedRecipes } = useRandomByIngredients()
    matchedRecipes.value = [{ id: "1", title: "Recipe 1" } as any, { id: "2", title: "Recipe 2" } as any]
    const randomRecipe = getRandomRecipe()
    expect(randomRecipe).toBeDefined()
    expect(["1", "2"]).toContain(randomRecipe!.id)
  })

  it("should return null when no matched recipes", async () => {
    const { useRandomByIngredients } = await import("./useRandomByIngredients")
    const { getRandomRecipe } = useRandomByIngredients()
    const randomRecipe = getRandomRecipe()
    expect(randomRecipe).toBeNull()
  })
})
