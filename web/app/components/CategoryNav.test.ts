import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Mock useI18n
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    'search.allCategories': '全部'
  }
  return translations[key] || key
}

vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: mockT,
  }),
}))

describe('CategoryNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockCategories = () => [
    { id: 1, name: 'main', displayName: '主菜' },
    { id: 2, name: 'dessert', displayName: '甜点' },
    { id: 3, name: 'soup', displayName: '汤' }
  ]

  it('should render all categories', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const categories = createMockCategories()

    const wrapper = mount(CategoryNav.default, {
      props: {
        categories,
        selected: ''
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()
    vi.advanceTimersByTime(200)

    // Should render "全部" + 3 categories = 4 buttons
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(4)
  })

  it('should emit select event with empty string when All is clicked', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const categories = createMockCategories()

    const wrapper = mount(CategoryNav.default, {
      props: {
        categories,
        selected: 'main'
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()
    vi.advanceTimersByTime(200)

    const allButton = wrapper.findAll('button')[0]
    await allButton.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    const selectEvents = wrapper.emitted('select') as any[]
    expect(selectEvents[0][0]).toBe('')
  })

  it('should emit select event with category name when category is clicked', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const categories = createMockCategories()

    const wrapper = mount(CategoryNav.default, {
      props: {
        categories,
        selected: ''
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()
    vi.advanceTimersByTime(200)

    const categoryButton = wrapper.findAll('button')[1]
    await categoryButton.trigger('click')

    expect(wrapper.emitted('select')).toBeTruthy()
    const selectEvents = wrapper.emitted('select') as any[]
    expect(selectEvents[0][0]).toBe('main')
  })

  it('should render left and right scroll buttons on mobile', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const categories = createMockCategories()

    const wrapper = mount(CategoryNav.default, {
      props: {
        categories,
        selected: ''
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()
    vi.advanceTimersByTime(200)

    const buttons = wrapper.findAll('button')
    // Should have: left scroll, all, category1, category2, category3, right scroll = 6
    expect(buttons.length).toBe(6)
  })

  it('should render category display names correctly', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const categories = createMockCategories()

    const wrapper = mount(CategoryNav.default, {
      props: {
        categories,
        selected: ''
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()
    vi.advanceTimersByTime(200)

    const buttons = wrapper.findAll('button')
    expect(buttons[0].text()).toBe('全部')
    expect(buttons[1].text()).toBe('主菜')
    expect(buttons[2].text()).toBe('甜点')
    expect(buttons[3].text()).toBe('汤')
  })

  it('should apply selected class to selected category', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const categories = createMockCategories()

    const wrapper = mount(CategoryNav.default, {
      props: {
        categories,
        selected: 'dessert'
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()
    vi.advanceTimersByTime(200)

    // The second category (index 1 in the scroll container, index 2 overall due to left scroll button)
    // should have the selected class
    const dessertButton = wrapper.findAll('button')[2]
    expect(dessertButton.classes()).toContain('bg-gradient-to-r')
  })

  it('should handle empty categories array', async () => {
    const CategoryNav = await import('./CategoryNav.vue')

    const wrapper = mount(CategoryNav.default, {
      props: {
        categories: [],
        selected: ''
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()
    vi.advanceTimersByTime(200)

    // Should only render: left scroll, all, right scroll = 3 buttons
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(3)
  })

  it('should handle single category', async () => {
    const CategoryNav = await import('./CategoryNav.vue')

    const wrapper = mount(CategoryNav.default, {
      props: {
        categories: [{ id: 1, name: 'main', displayName: '主菜' }],
        selected: ''
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()
    vi.advanceTimersByTime(200)

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(5) // left scroll, all, main, right scroll
  })

  it('should scroll left when left scroll button is clicked', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const categories = createMockCategories()

    const wrapper = mount(CategoryNav.default, {
      props: {
        categories,
        selected: ''
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()
    vi.advanceTimersByTime(200)

    const scrollContainer = wrapper.find('[class*="overflow-x-auto"]')
    const scrollByMock = vi.fn()
    scrollContainer.element.scrollBy = scrollByMock

    // Find and click the left scroll button (first button)
    const leftButton = wrapper.findAll('button')[0]
    await leftButton.trigger('click')

    expect(scrollByMock).toHaveBeenCalled()
  })

  it('should scroll right when right scroll button is clicked', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const categories = createMockCategories()

    const wrapper = mount(CategoryNav.default, {
      props: {
        categories,
        selected: ''
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()
    vi.advanceTimersByTime(200)

    const scrollContainer = wrapper.find('[class*="overflow-x-auto"]')
    const scrollByMock = vi.fn()
    scrollContainer.element.scrollBy = scrollByMock

    // Find and click the right scroll button (last button)
    const buttons = wrapper.findAll('button')
    const rightButton = buttons[buttons.length - 1]
    await rightButton.trigger('click')

    expect(scrollByMock).toHaveBeenCalled()
  })

  it('should apply animation delay to category buttons based on index', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const categories = createMockCategories()

    const wrapper = mount(CategoryNav.default, {
      props: {
        categories,
        selected: ''
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()
    vi.advanceTimersByTime(200)

    // Get all category buttons (excluding scroll buttons)
    const buttons = wrapper.findAll('button')
    const categoryButtons = buttons.slice(1, -1) // Exclude first (left scroll) and last (right scroll)

    // Each category should have different animation delay
    categoryButtons.forEach((button, index) => {
      const style = button.attributes('style')
      if (index === 0) {
        // "全部" button has delay of 0ms
        expect(style).toContain('animation-delay: 0ms')
      } else {
        // Category buttons have delay of (index) * 30ms
        expect(style).toContain(`animation-delay: ${index * 30}ms`)
      }
    })
  })

  it('should have correct aria-labels for scroll buttons', async () => {
    const CategoryNav = await import('./CategoryNav.vue')
    const categories = createMockCategories()

    const wrapper = mount(CategoryNav.default, {
      props: {
        categories,
        selected: ''
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()
    vi.advanceTimersByTime(200)

    const buttons = wrapper.findAll('button')
    const leftButton = buttons[0]
    const rightButton = buttons[buttons.length - 1]

    expect(leftButton.attributes('aria-label')).toBe('滚动左侧')
    expect(rightButton.attributes('aria-label')).toBe('滚动右侧')
  })
})