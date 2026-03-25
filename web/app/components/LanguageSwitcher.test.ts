import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

// Mock useI18n
const mockLocale = ref('en')
const mockLocales = ref([
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '简体中文' },
])
const mockSetLocale = vi.fn()

vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    locale: mockLocale,
    locales: mockLocales,
    setLocale: mockSetLocale,
  }),
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocale.value = 'en'
    mockLocales.value = [
      { code: 'en', name: 'English' },
      { code: 'zh-CN', name: '简体中文' },
    ]
    mockSetLocale.mockResolvedValue(undefined)
  })

  it('should render language switcher select', async () => {
    const LanguageSwitcher = await import('./LanguageSwitcher.vue')
    const wrapper = mount(LanguageSwitcher.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)
    expect(select.attributes('data-testid')).toBe('language-switcher')
  })

  it('should display current locale as selected', async () => {
    mockLocale.value = 'zh-CN'

    const LanguageSwitcher = await import('./LanguageSwitcher.vue')
    const wrapper = mount(LanguageSwitcher.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const select = wrapper.find('select')
    expect((select.element as HTMLSelectElement).value).toBe('zh-CN')
  })

  it('should render all locale options', async () => {
    const LanguageSwitcher = await import('./LanguageSwitcher.vue')
    const wrapper = mount(LanguageSwitcher.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const options = wrapper.findAll('option')
    expect(options).toHaveLength(2)
    expect(options[0].text()).toBe('English')
    expect(options[0].attributes('value')).toBe('en')
    expect(options[1].text()).toBe('简体中文')
    expect(options[1].attributes('value')).toBe('zh-CN')
  })

  it('should call setLocale when selection changes', async () => {
    const LanguageSwitcher = await import('./LanguageSwitcher.vue')
    const wrapper = mount(LanguageSwitcher.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const select = wrapper.find('select')
    await select.setValue('zh-CN')
    await flushPromises()

    expect(mockSetLocale).toHaveBeenCalledWith('zh-CN')
  })

  it('should have proper accessibility attributes', async () => {
    const LanguageSwitcher = await import('./LanguageSwitcher.vue')
    const wrapper = mount(LanguageSwitcher.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const select = wrapper.find('select')
    expect(select.attributes('aria-label')).toBe('Select language')
  })

  it('should render dropdown arrow icon', async () => {
    const LanguageSwitcher = await import('./LanguageSwitcher.vue')
    const wrapper = mount(LanguageSwitcher.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const arrowIcon = wrapper.find('svg')
    expect(arrowIcon.exists()).toBe(true)
  })
})
