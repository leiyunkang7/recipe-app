import { describe, it, expect, vi, beforeEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"
import type { Recipe } from "~/types"

vi.mock("~/composables/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: "zh" },
  }),
}))

vi.mock("~/components/icons/ClockIcon.vue", () => ({
  default: { name: "ClockIcon", template: "<svg />" },
}))

const createMockRecipe = (): Recipe => ({
  id: "recipe-1",
  title: "Test Recipe",
  category: "main",
  servings: 4,
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  difficulty: "easy",
  ingredients: [{ name: "Flour", amount: 2, unit: "cups" }],
  steps: [
    { stepNumber: 1, instruction: "Mix dry ingredients", durationMinutes: 5 },
    { stepNumber: 2, instruction: "Add wet ingredients", durationMinutes: 10 },
    { stepNumber: 3, instruction: "Bake at 350F" },
  ],
})

describe("RecipeDetailSteps", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("should render all steps", async () => {
    const RecipeDetailSteps = await import("./RecipeDetailSteps.vue")
    const wrapper = mount(RecipeDetailSteps.default, {
      props: { recipe: createMockRecipe(), currentStep: 0, expandedSteps: new Set<number>() },
    })
    await flushPromises()
    expect(wrapper.findAll("li")).toHaveLength(3)
  })

  it("should display step instructions", async () => {
    const RecipeDetailSteps = await import("./RecipeDetailSteps.vue")
    const wrapper = mount(RecipeDetailSteps.default, {
      props: { recipe: createMockRecipe(), currentStep: 0, expandedSteps: new Set<number>() },
    })
    await flushPromises()
    expect(wrapper.text()).toContain("Mix dry ingredients")
    expect(wrapper.text()).toContain("Add wet ingredients")
  })

  it("should display step numbers", async () => {
    const RecipeDetailSteps = await import("./RecipeDetailSteps.vue")
    const wrapper = mount(RecipeDetailSteps.default, {
      props: { recipe: createMockRecipe(), currentStep: 0, expandedSteps: new Set<number>() },
    })
    await flushPromises()
    expect(wrapper.text()).toContain("1")
    expect(wrapper.text()).toContain("2")
    expect(wrapper.text()).toContain("3")
  })

  it("should emit update:currentStep when clicking a step", async () => {
    const RecipeDetailSteps = await import("./RecipeDetailSteps.vue")
    const wrapper = mount(RecipeDetailSteps.default, {
      props: { recipe: createMockRecipe(), currentStep: 0, expandedSteps: new Set<number>() },
    })
    await flushPromises()
    await wrapper.find("li").trigger("click")
    expect(wrapper.emitted("update:currentStep")).toBeTruthy()
  })

  it("should highlight current step", async () => {
    const RecipeDetailSteps = await import("./RecipeDetailSteps.vue")
    const wrapper = mount(RecipeDetailSteps.default, {
      props: { recipe: createMockRecipe(), currentStep: 1, expandedSteps: new Set<number>() },
    })
    await flushPromises()
    const items = wrapper.findAll("li")
    expect(items[1]?.classes()).toContain("bg-orange-50")
  })

  it("should display duration when available", async () => {
    const RecipeDetailSteps = await import("./RecipeDetailSteps.vue")
    const wrapper = mount(RecipeDetailSteps.default, {
      props: { recipe: createMockRecipe(), currentStep: 0, expandedSteps: new Set<number>() },
    })
    await flushPromises()
    expect(wrapper.text()).toContain("5")
    expect(wrapper.text()).toContain("10")
  })

  it("should use mobile layout when isMobile is true", async () => {
    const RecipeDetailSteps = await import("./RecipeDetailSteps.vue")
    const wrapper = mount(RecipeDetailSteps.default, {
      props: { recipe: createMockRecipe(), currentStep: 0, expandedSteps: new Set<number>(), isMobile: true },
    })
    await flushPromises()
    expect(wrapper.find(".rounded-2xl").exists()).toBe(true)
  })

  it("should use desktop layout when isMobile is false", async () => {
    const RecipeDetailSteps = await import("./RecipeDetailSteps.vue")
    const wrapper = mount(RecipeDetailSteps.default, {
      props: { recipe: createMockRecipe(), currentStep: 0, expandedSteps: new Set<number>(), isMobile: false },
    })
    await flushPromises()
    expect(wrapper.find(".rounded-xl").exists()).toBe(true)
  })
})
