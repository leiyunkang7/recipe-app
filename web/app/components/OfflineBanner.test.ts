import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

// Mock useOfflineStatus composable
const mockIsOffline = ref(false)
vi.mock('~/composables/useOfflineStatus', () => ({
  useOfflineStatus: () => ({
    isOffline: mockIsOffline,
  }),
}))

describe('OfflineBanner', () => {
  beforeEach(() => {
    mockIsOffline.value = false
    vi.clearAllMocks()
  })

  it('should not render when online', async () => {
    const OfflineBanner = await import('./OfflineBanner.vue')
    const wrapper = mount(OfflineBanner.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.html()).toBe('')
  })

  it('should render banner when offline', async () => {
    mockIsOffline.value = true

    const OfflineBanner = await import('./OfflineBanner.vue')
    const wrapper = mount(OfflineBanner.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.html()).toContain('离线')
    expect(wrapper.html()).toContain('📡')
  })

  it('should update visibility when offline status changes', async () => {
    const OfflineBanner = await import('./OfflineBanner.vue')
    const wrapper = mount(OfflineBanner.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.html()).toBe('')

    mockIsOffline.value = true
    await wrapper.vm.$nextTick()

    expect(wrapper.html()).toContain('离线')

    mockIsOffline.value = false
    await wrapper.vm.$nextTick()

    expect(wrapper.html()).toBe('')
  })
})