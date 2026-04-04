import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

// ---------------------------------------------------------------------------
// i18n Mock (mock vue-i18n since Nuxt i18n wraps it)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// i18n Mock (mock vue-i18n since Nuxt i18n wraps it)
// ---------------------------------------------------------------------------

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    'search.allCategories': '全部'
  }
  return translations[key] || key
}

vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: mockT,
  })),
}))

// ---------------------------------------------------------------------------
// Types & Helpers
// ---------------------------------------------------------------------------

type Categories = Array<{ id: number; name: string; displayName: string }>

const createMockCategories = (): Categories => [
  { id: 1, name: 'main', displayName: '主菜' },
  { id: 2, name: 'dessert', displayName: '甜点' },
  { id: 3, name: 'soup', displayName: '汤' }
]

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Rendering Tests
// ---------------------------------------------------------------------------

describe('CategoryNav rendering', () => {
  it('should render all categories', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const wrapper = mount(CategoryNav.default, {
      props: { categories: createMockCategories(), selected: '' },
      global: { stubs: { Teleport: true } },
    })
    await flushPromises()
    vi.advanceTimersByTime(200)

    const buttons = wrapper.findAll('button')
    // left scroll + 全部 + 3 categories + right scroll = 6 buttons
    expect(buttons.length).toBe(6)
  })

  it('should render correct category display names', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const wrapper = mount(CategoryNav.default, {
      props: { categories: createMockCategories(), selected: '' },
      global: { stubs: { Teleport: true } },
    })
    await flushPromises()
    vi.advanceTimersByTime(200)

    const buttons = wrapper.findAll('button')
    // buttons: [leftScroll, 全部, 主菜, 甜点, 汤, rightScroll]
    expect(buttons[1].text()).toBe('全部')
    expect(buttons[2].text()).toBe('主菜')
    expect(buttons[3].text()).toBe('甜点')
    expect(buttons[4].text()).toBe('汤')
  })

  it('should render left and right scroll buttons on mobile', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const wrapper = mount(CategoryNav.default, {
      props: { categories: createMockCategories(), selected: '' },
      global: { stubs: { Teleport: true } },
    })
    await flushPromises()
    vi.advanceTimersByTime(200)

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(6)
  })
})

// ---------------------------------------------------------------------------
// Selection Behavior
// ---------------------------------------------------------------------------

describe('CategoryNav selection', () => {
  it('should emit select with empty string when All is clicked', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const wrapper = mount(CategoryNav.default, {
      props: { categories: createMockCategories(), selected: 'main' },
      global: { stubs: { Teleport: true } },
    })
    await flushPromises()
    vi.advanceTimersByTime(200)

    const allButton = wrapper.findAll('button')[1] // skip left scroll
    await allButton.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    const selectEvents = wrapper.emitted('select') as any[]
    expect(selectEvents[0][0]).toBe('')
  })

  it('should emit select with category name when category is clicked', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const wrapper = mount(CategoryNav.default, {
      props: { categories: createMockCategories(), selected: '' },
      global: { stubs: { Teleport: true } },
    })
    await flushPromises()
    vi.advanceTimersByTime(200)

    const categoryButton = wrapper.findAll('button')[2] // [left, all, main, ...]
    await categoryButton.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    const selectEvents = wrapper.emitted('select') as any[]
    expect(selectEvents[0][0]).toBe('main')
  })

  it('should apply selected class to the selected category button', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const wrapper = mount(CategoryNav.default, {
      props: { categories: createMockCategories(), selected: 'dessert' },
      global: { stubs: { Teleport: true } },
    })
    await flushPromises()
    vi.advanceTimersByTime(200)

    // buttons: [leftScroll, all, main, dessert, soup, rightScroll]
    const dessertButton = wrapper.findAll('button')[3]
    expect(dessertButton.classes()).toContain('bg-gradient-to-r')
  })
})

// ---------------------------------------------------------------------------
// Scroll Behavior
// ---------------------------------------------------------------------------

describe('CategoryNav scroll', () => {
  it('should scroll left when left scroll button is clicked', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const wrapper = mount(CategoryNav.default, {
      props: { categories: createMockCategories(), selected: '' },
      global: { stubs: { Teleport: true } },
    })
    await flushPromises()
    vi.advanceTimersByTime(200)

    const scrollContainer = wrapper.find('[class*="overflow-x-auto"]')
    const scrollByMock = vi.fn()
    scrollContainer.element.scrollBy = scrollByMock

    const leftButton = wrapper.findAll('button')[0]
    await leftButton.trigger('click')

    expect(scrollByMock).toHaveBeenCalled()
  })

  it('should scroll right when right scroll button is clicked', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const wrapper = mount(CategoryNav.default, {
      props: { categories: createMockCategories(), selected: '' },
      global: { stubs: { Teleport: true } },
    })
    await flushPromises()
    vi.advanceTimersByTime(200)

    const scrollContainer = wrapper.find('[class*="overflow-x-auto"]')
    const scrollByMock = vi.fn()
    scrollContainer.element.scrollBy = scrollByMock

    const buttons = wrapper.findAll('button')
    const rightButton = buttons[buttons.length - 1]
    await rightButton.trigger('click')

    expect(scrollByMock).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Edge Cases
// ---------------------------------------------------------------------------

describe('CategoryNav edge cases', () => {
  it('should render only scroll buttons when categories is empty', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const wrapper = mount(CategoryNav.default, {
      props: { categories: [], selected: '' },
      global: { stubs: { Teleport: true } },
    })
    await flushPromises()
    vi.advanceTimersByTime(200)

    // left scroll + all + right scroll = 3 buttons
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(3)
  })

  it('should render correctly with a single category', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const wrapper = mount(CategoryNav.default, {
      props: { categories: [{ id: 1, name: 'main', displayName: '主菜' }], selected: '' },
      global: { stubs: { Teleport: true } },
    })
    await flushPromises()
    vi.advanceTimersByTime(200)

    // left scroll + all + main + right scroll = 4 buttons
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// Accessibility & Animation
// ---------------------------------------------------------------------------

describe('CategoryNav accessibility & animation', () => {
  it('should have correct aria-labels on scroll buttons', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const wrapper = mount(CategoryNav.default, {
      props: { categories: createMockCategories(), selected: '' },
      global: { stubs: { Teleport: true } },
    })
    await flushPromises()
    vi.advanceTimersByTime(200)

    const buttons = wrapper.findAll('button')
    const leftButton = buttons[0]
    const rightButton = buttons[buttons.length - 1]

    expect(leftButton.attributes('aria-label')).toBe('滚动左侧')
    expect(rightButton.attributes('aria-label')).toBe('滚动右侧')
  })

  it('should apply increasing animation delay to category buttons', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const wrapper = mount(CategoryNav.default, {
      props: { categories: createMockCategories(), selected: '' },
      global: { stubs: { Teleport: true } },
    })
    await flushPromises()
    vi.advanceTimersByTime(200)

    // buttons: [leftScroll, 全部, 主菜, 甜点, 汤, rightScroll]
    const categoryButtons = wrapper.findAll('button').slice(1, -1)
    categoryButtons.forEach((button, index) => {
      const style = button.attributes('style')
      expect(style).toContain(`animation-delay: ${index * 30}ms`)
    })
  })
})
