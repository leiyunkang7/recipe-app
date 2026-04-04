import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock i18n
const mockLocales = [
  { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '中文' },
]

vi.mock('#imports', () => ({
  useI18n: vi.fn(() => ({
    locale: 'zh-CN',
    locales: mockLocales,
    setLocale: vi.fn(),
  })),
}))

describe('LanguageSwitcher', () => {
  it('should render a select element', async () => {
    const LanguageSwitcher = await import('../app/components/LanguageSwitcher.vue')
    const wrapper = mount(LanguageSwitcher.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)
  })

  it('should have correct aria-label for accessibility', async () => {
    const LanguageSwitcher = await import('../app/components/LanguageSwitcher.vue')
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

  it('should have data-testid for testing', async () => {
    const LanguageSwitcher = await import('../app/components/LanguageSwitcher.vue')
    const wrapper = mount(LanguageSwitcher.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const select = wrapper.find('[data-testid="language-switcher"]')
    expect(select.exists()).toBe(true)
  })

  it('should render all locale options', async () => {
    const LanguageSwitcher = await import('../app/components/LanguageSwitcher.vue')
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
    expect(options[1].text()).toBe('中文')
    expect(options[1].attributes('value')).toBe('zh-CN')
  })

  it('should have correct styling classes', async () => {
    const LanguageSwitcher = await import('../app/components/LanguageSwitcher.vue')
    const wrapper = mount(LanguageSwitcher.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const select = wrapper.find('select')
    expect(select.classes()).toContain('appearance-none')
    expect(select.classes()).toContain('bg-white')
    expect(select.classes()).toContain('border')
    expect(select.classes()).toContain('rounded-lg')
    expect(select.classes()).toContain('px-4')
    expect(select.classes()).toContain('py-2')
    expect(select.classes()).toContain('cursor-pointer')
  })

  it('should have dropdown arrow indicator', async () => {
    const LanguageSwitcher = await import('../app/components/LanguageSwitcher.vue')
    const wrapper = mount(LanguageSwitcher.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const arrowContainer = wrapper.find('.absolute.inset-y-0.right-0')
    expect(arrowContainer.exists()).toBe(true)

    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.classes()).toContain('w-4')
    expect(svg.classes()).toContain('h-4')
  })

  it('should have hover and focus states', async () => {
    const LanguageSwitcher = await import('../app/components/LanguageSwitcher.vue')
    const wrapper = mount(LanguageSwitcher.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const select = wrapper.find('select')
    expect(select.classes()).toContain('hover:border-orange-500')
    expect(select.classes()).toContain('focus:outline-none')
    expect(select.classes()).toContain('focus:ring-2')
    expect(select.classes()).toContain('focus:ring-orange-500')
  })

  it('should have correct minimum touch target height', async () => {
    const LanguageSwitcher = await import('../app/components/LanguageSwitcher.vue')
    const wrapper = mount(LanguageSwitcher.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const select = wrapper.find('select')
    expect(select.classes()).toContain('min-h-[44px]')
  })
})
