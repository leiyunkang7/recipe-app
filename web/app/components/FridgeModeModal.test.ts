import { describe, it, expect, vi, beforeEach } from "vitest"
import { mount, flushPromises } from "@vue/test-utils"

// Mock useI18n
vi.mock("~/composables/useI18n", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: { value: "zh" } }),
}))

describe("FridgeModeModal", () => {

  beforeEach(() => { vi.clearAllMocks() })

  it("should not render when visible is false", async () => {
    const FridgeModeModal = await import("./FridgeModeModal.vue")
    const wrapper = mount(FridgeModeModal.default, { props: { visible: false, recipes: [], loading: false, error: null } })
    expect(wrapper.find("div[ class*='fixed inset-0']").exists()).toBe(false)
  })

  it("should render when visible is true", async () => {
    const FridgeModeModal = await import("./FridgeModeModal.vue")
    const wrapper = mount(FridgeModeModal.default, { props: { visible: true, recipes: [], loading: false, error: null } })
    await flushPromises()
    expect(wrapper.find("div[ class*='fixed inset-0']").exists()).toBe(true)
  })

  it("should display loading spinner when loading is true", async () => {
    const FridgeModeModal = await import("./FridgeModeModal.vue")
    const wrapper = mount(FridgeModeModal.default, { props: { visible: true, recipes: [], loading: true, error: null } })
    await flushPromises()
    expect(wrapper.find(".animate-spin").exists()).toBe(true)
  })

  it("should display error message when error is present", async () => {
    const FridgeModeModal = await import("./FridgeModeModal.vue")
    const wrapper = mount(FridgeModeModal.default, { props: { visible: true, recipes: [], loading: false, error: "Test error" } })
    await flushPromises()
    expect(wrapper.text()).toContain("Test error")
  })
})
