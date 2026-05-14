import { describe, it, expect, vi } from "vitest"
import { mount } from "@vue/test-utils"

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string) => key,
    locale: { value: 'zh-CN' },
  })),
}))

describe("RecipeCardBadges", () => {
  const mountBadges = (props = {}) => {
    const RecipeCardBadges = require("./RecipeCardBadges.vue").default
    return mount(RecipeCardBadges, {
      props: {
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        servings: 4,
        ...props,
      },
    })
  }

  it("should render total time badge", () => {
    const wrapper = mountBadges()
    expect(wrapper.text()).toContain("recipe.min")
  })

  it("should render servings badge", () => {
    const wrapper = mountBadges()
    expect(wrapper.text()).toContain("4")
    expect(wrapper.text()).toContain("recipe.servings")
  })

  it("should not render views badge when views is 0", () => {
    const wrapper = mountBadges({ views: 0 })
    expect(wrapper.text()).not.toContain("0")
  })

  it("should render views badge when views is set", () => {
    const wrapper = mountBadges({ views: 100 })
    expect(wrapper.text()).toContain("100")
  })

  it("should not render rating badge when no rating", () => {
    const wrapper = mountBadges({ averageRating: 0, ratingCount: 0 })
    const badges = wrapper.findAll("span")
    // Only time + servings = 2 badges minimum
    expect(badges.length).toBeLessThanOrEqual(3)
  })

  it("should render rating badge when rating exists", () => {
    const wrapper = mountBadges({ averageRating: 4.5, ratingCount: 10 })
    expect(wrapper.text()).toContain("5")
    expect(wrapper.text()).toContain("(10)")
  })

  it("should not render calories badge when calories is 0", () => {
    const wrapper = mountBadges({ calories: 0 })
    // Should not show 0 calories
    const spans = wrapper.findAll("span")
    const hasZeroCalorie = spans.some(s => s.text().includes("0"))
    expect(hasZeroCalorie).toBe(false)
  })

  it("should render calories badge when calories is set", () => {
    const wrapper = mountBadges({ calories: 350 })
    expect(wrapper.text()).toContain("350")
  })

  it("should correctly round decimal calories", () => {
    const wrapper = mountBadges({ calories: 350.7 })
    expect(wrapper.text()).toContain("351")
  })
})
