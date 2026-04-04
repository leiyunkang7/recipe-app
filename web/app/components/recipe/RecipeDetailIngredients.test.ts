import { describe, it, expect, vi, beforeEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"
import type { Recipe } from "~/types"

vi.mock("~/composables/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: "zh" },
  }),
}))

vi.mock("~/components/icons/CheckIcon.vue", () => ({
  default: { name: "CheckIcon", template: "<svg />" },
}))

const createMockRecipe = (): Recipe => ({
  id: "recipe-1",
  title: "Test Recipe",
  category: "main",
  servings: 4,
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  difficulty: "easy",
  ingredients: [
    { name: "Flour", amount: 2, unit: "cups" },
    { name: "Sugar", amount: 1, unit: "cup" },
    { name: "Salt", amount: 0.5, unit: "tsp" },
  ],
  steps: [
    { stepNumber: 1, instruction: "Mix" },
    { stepNumber: 2, instruction: "Bake" },
  ],
})

describe("RecipeDetailIngredients", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("should render all ingredients", async () => {
    const RecipeDetailIngredients = await import("./RecipeDetailIngredients.vue")
    const wrapper = mount(RecipeDetailIngredients.default, {
      props: { recipe: createMockRecipe(), selectedIngredients: new Set() },
    })
    await flushPromises()
    expect(wrapper.findAll("li")).toHaveLength(3)
  })

  it("should display amounts and units", async () => {
    const RecipeDetailIngredients = await import("./RecipeDetailIngredients.vue")
    const wrapper = mount(RecipeDetailIngredients.default, {
      props: { recipe: createMockRecipe(), selectedIngredients: new Set() },
    })
    await flushPromises()
    expect(wrapper.text()).toContain("2 cups")
    expect(wrapper.text()).toContain("1 cup")
  })

  it("should emit toggleIngredient on click", async () => {
    const RecipeDetailIngredients = await import("./RecipeDetailIngredients.vue")
    const wrapper = mount(RecipeDetailIngredients.default, {
      props: { recipe: createMockRecipe(), selectedIngredients: new Set() },
    })
    await flushPromises()
    await wrapper.find("li").trigger("click")
    expect(wrapper.emitted("toggleIngredient")).toBeTruthy()
  })

  it("should apply selected styling for selected ingredients", async () => {
    const RecipeDetailIngredients = await import("./RecipeDetailIngredients.vue")
    const wrapper = mount(RecipeDetailIngredients.default, {
      props: { recipe: createMockRecipe(), selectedIngredients: new Set(["Flour"]) },
    })
    await flushPromises()
    expect(wrapper.findAll("li")[0].classes()).toContain("bg-green-50")
  })

  it("should show counter in mobile mode", async () => {
    const RecipeDetailIngredients = await import("./RecipeDetailIngredients.vue")
    const wrapper = mount(RecipeDetailIngredients.default, {
      props: { recipe: createMockRecipe(), selectedIngredients: new Set(["Flour"]), isMobile: true },
    })
    await flushPromises()
    expect(wrapper.text()).toContain("1/3")
  })

  it("should handle empty ingredients array", async () => {
    const RecipeDetailIngredients = await import("./RecipeDetailIngredients.vue")
    const wrapper = mount(RecipeDetailIngredients.default, {
      props: { recipe: { ...createMockRecipe(), ingredients: [] }, selectedIngredients: new Set() },
    })
    await flushPromises()
    expect(wrapper.findAll("li")).toHaveLength(0)
  })
})
