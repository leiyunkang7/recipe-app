import { describe, it, expect, vi, beforeEach } from "vitest"
import { mount } from "@vue/test-utils"

const mockToggleMenu = vi.fn()
const mockShowMenu = { value: false }
vi.mock("~/composables/useShareMenu", () => ({
  useShareMenu: () => ({
    showMenu: mockShowMenu,
    copySuccess: { value: false },
    platforms: [] as any[],
    shareToPlatform: vi.fn(),
    copyLink: vi.fn(),
    toggleMenu: mockToggleMenu,
    closeMenu: vi.fn(),
    shareToWeChat: vi.fn(),
  }),
}))

vi.mock("~/composables/useClickOutside", () => ({
  useClickOutside: vi.fn(),
}))

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key, locale: { value: "zh" } }),
}))

describe("RecipeShareMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShowMenu.value = false
  })

  it("should render share button", async () => {
    const RecipeShareMenu = await import("./RecipeShareMenu.vue")
    const wrapper = mount(RecipeShareMenu.default, {
      props: { recipe: { id: "1", title: "Test", ingredients: [], steps: [] } },
      global: { stubs: { teleport: true } },
    })
    expect(wrapper.find("button").exists()).toBe(true)
  })

  it("should call toggleMenu on button click", async () => {
    const RecipeShareMenu = await import("./RecipeShareMenu.vue")
    const wrapper = mount(RecipeShareMenu.default, {
      props: { recipe: { id: "1", title: "Test", ingredients: [], steps: [] } },
      global: { stubs: { teleport: true } },
    })
    await wrapper.find("button").trigger("click")
    expect(mockToggleMenu).toHaveBeenCalled()
  })
})
