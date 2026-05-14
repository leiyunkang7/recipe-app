import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"
import { ref } from "vue"

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string) => key,
    locale: ref('zh-CN'),
  })),
}))

// Mock useLocalePath
vi.mock('~/composables/useLocalePath', () => ({
  useLocalePath: vi.fn(() => (path: string) => path),
}))

// Mock AppImage component
vi.mock("~/components/AppImage.vue", () => ({
  default: { name: "AppImage", props: ["src", "alt", "class", "sizes", "quality"], template: "<div class=\"app-image-mock\">{{ src }}</div>" },
}))

// Mock RecipeCardBadges component
vi.mock("~/components/RecipeCardBadges.vue", () => ({
  default: {
    name: "RecipeCardBadges",
    props: ["prepTimeMinutes", "cookTimeMinutes", "servings", "views", "averageRating", "ratingCount", "calories"],
    template: '<div class="recipe-card-badges-mock">{{ prepTimeMinutes + cookTimeMinutes }}min | {{ servings }} servings</div>',
  },
}))

describe("RecipeCardLazy", () => {
  const createMockRecipe = (id: string, title: string) => ({
    id,
    title,
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 4,
    imageUrl: `/images/${id}.jpg`,
  })

  beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers() })
  afterEach(() => { vi.restoreAllMocks() })

  it("should render recipe title", async () => {
    const RecipeCardLazy = await import("./RecipeCardLazy.vue")
    const recipe = createMockRecipe("1", "Test Recipe")
    const wrapper = mount(RecipeCardLazy.default, { props: { recipe } })
    await flushPromises()
    expect(wrapper.find("h3").text()).toBe("Test Recipe")
  })

  it("should display total time", async () => {
    const RecipeCardLazy = await import("./RecipeCardLazy.vue")
    const recipe = createMockRecipe("1", "Test Recipe")
    const wrapper = mount(RecipeCardLazy.default, { props: { recipe } })
    await flushPromises()
    expect(wrapper.text()).toContain("30")
  })

  it("should display servings", async () => {
    const RecipeCardLazy = await import("./RecipeCardLazy.vue")
    const recipe = createMockRecipe("1", "Test Recipe")
    const wrapper = mount(RecipeCardLazy.default, { props: { recipe } })
    await flushPromises()
    expect(wrapper.text()).toContain("4")
  })

  it("should apply animation delay when enterDelay is set", async () => {
    const RecipeCardLazy = await import("./RecipeCardLazy.vue")
    const recipe = createMockRecipe("1", "Test Recipe")
    const wrapper = mount(RecipeCardLazy.default, { props: { recipe, enterDelay: 100 } })
    await flushPromises()
    const style = wrapper.attributes("style")
    expect(style).toContain("animationDelay")
  })

  it("should disable animation when disableAnimation is true", async () => {
    const RecipeCardLazy = await import("./RecipeCardLazy.vue")
    const recipe = createMockRecipe("1", "Test Recipe")
    const wrapper = mount(RecipeCardLazy.default, { props: { recipe, disableAnimation: true } })
    await flushPromises()
    expect(wrapper.classes()).not.toContain("recipe-card-enter")
  })

  it("should render NuxtLink with correct href", async () => {
    const RecipeCardLazy = await import("./RecipeCardLazy.vue")
    const recipe = createMockRecipe("abc123", "Test Recipe")
    const wrapper = mount(RecipeCardLazy.default, { props: { recipe } })
    await flushPromises()
    const link = wrapper.find("NuxtLink")
    expect(link.exists()).toBe(true)
  })
})
