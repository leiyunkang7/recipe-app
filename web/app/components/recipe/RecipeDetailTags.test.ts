import { describe, it, expect, vi, beforeEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"

vi.mock("~/composables/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: "zh" },
  }),
}))

vi.mock("~/components/icons/TagIcon.vue", () => ({
  default: { name: "TagIcon", template: "<svg />" },
}))

describe("RecipeDetailTags", () => {
  beforeEach(() => { vi.clearAllMocks() })

  it("should render all tags", async () => {
    const RecipeDetailTags = await import("./RecipeDetailTags.vue")
    const wrapper = mount(RecipeDetailTags.default, {
      props: { tags: ["easy", "quick", "healthy"] },
    })
    await flushPromises()
    expect(wrapper.findAll("span")).toHaveLength(3)
  })

  it("should display tag text", async () => {
    const RecipeDetailTags = await import("./RecipeDetailTags.vue")
    const wrapper = mount(RecipeDetailTags.default, {
      props: { tags: ["easy", "quick"] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain("easy")
    expect(wrapper.text()).toContain("quick")
  })

  it("should render heading with label", async () => {
    const RecipeDetailTags = await import("./RecipeDetailTags.vue")
    const wrapper = mount(RecipeDetailTags.default, {
      props: { tags: ["easy"] },
    })
    await flushPromises()
    expect(wrapper.text()).toContain("recipe.tags")
  })

  it("should use mobile layout classes when isMobile is true", async () => {
    const RecipeDetailTags = await import("./RecipeDetailTags.vue")
    const wrapper = mount(RecipeDetailTags.default, {
      props: { tags: ["easy"], isMobile: true },
    })
    await flushPromises()
    expect(wrapper.find(".rounded-2xl").exists()).toBe(true)
    expect(wrapper.find(".shadow-sm").exists()).toBe(true)
  })

  it("should use desktop layout classes when isMobile is false", async () => {
    const RecipeDetailTags = await import("./RecipeDetailTags.vue")
    const wrapper = mount(RecipeDetailTags.default, {
      props: { tags: ["easy"], isMobile: false },
    })
    await flushPromises()
    expect(wrapper.find(".rounded-xl").exists()).toBe(true)
    expect(wrapper.find(".shadow-md").exists()).toBe(true)
  })

  it("should render empty when no tags", async () => {
    const RecipeDetailTags = await import("./RecipeDetailTags.vue")
    const wrapper = mount(RecipeDetailTags.default, {
      props: { tags: [] },
    })
    await flushPromises()
    expect(wrapper.findAll("span")).toHaveLength(0)
  })
})
