import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'

const mockT = (key: string) => key
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({ t: mockT }),
}))

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
})

describe('FolderModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should not render when visible is false', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: false,
          mode: 'create',
        },
      })

      expect(wrapper.find('div[role="dialog"]').exists()).toBe(false)
    })

    it('should render when visible is true', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'create',
        },
      })

      expect(wrapper.find('div[role="dialog"]').exists()).toBe(true)
    })

    it('should have correct title for create mode', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'create',
        },
      })

      expect(wrapper.find('h3').text()).toContain('favorites.createFolder')
    })

    it('should have correct title for rename mode', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'rename',
        },
      })

      expect(wrapper.find('h3').text()).toContain('favorites.renameFolder')
    })
  })

  describe('folder name input', () => {
    it('should have input element with correct placeholder', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'create',
        },
      })

      const input = wrapper.find('input#folder-name')
      expect(input.exists()).toBe(true)
      expect(input.attributes('placeholder')).toBe('favorites.folderNamePlaceholder')
    })

    it('should accept user input', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'create',
          folderName: '',
        },
      })

      const input = wrapper.find('input#folder-name')
      await input.setValue('My Folder')

      expect(wrapper.vm.localName).toBe('My Folder')
    })

    it('should use folderName prop as initial value', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'rename',
          folderName: 'Initial Name',
        },
      })

      const input = wrapper.find('input#folder-name')
      expect((input.element as HTMLInputElement).value).toBe('Initial Name')
    })
  })

  describe('color picker', () => {
    it('should show color picker in create mode', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'create',
        },
      })

      // Should have 8 color buttons
      const colorButtons = wrapper.findAll('button')
      // 2 action buttons + 8 color buttons = 10 buttons total
      expect(colorButtons.length).toBe(10)
    })

    it('should hide color picker in rename mode', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'rename',
        },
      })

      // Should only have 2 action buttons (Cancel + Confirm)
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(2)
    })

    it('should select color when color button is clicked', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'create',
        },
      })

      const colorButtons = wrapper.findAll('button')
      // First color button is at index 2 (after Cancel and Confirm)
      await colorButtons[2]!.trigger('click')

      expect(wrapper.vm.localColor).toBe('#EF4444')
    })
  })

  describe('confirm button', () => {
    it('should be disabled when folder name is empty', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'create',
          folderName: '',
        },
      })

      const confirmBtn = wrapper.findAll('button').at(-1)
      expect(confirmBtn?.attributes('disabled')).toBeDefined()
    })

    it('should be enabled when folder name is not empty', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'create',
          folderName: 'Test',
        },
      })

      const confirmBtn = wrapper.findAll('button').at(-1)
      expect(confirmBtn?.attributes('disabled')).toBeUndefined()
    })

    it('should emit confirm with name and color in create mode', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'create',
          folderName: 'Test Folder',
          folderColor: '#F97316',
        },
      })

      const confirmBtn = wrapper.findAll('button').at(-1)
      await confirmBtn?.trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
      expect(wrapper.emitted('confirm')?.[0]).toEqual(['Test Folder', '#F97316'])
    })

    it('should emit confirm with only name in rename mode', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'rename',
          folderName: 'Renamed Folder',
        },
      })

      const confirmBtn = wrapper.findAll('button').at(-1)
      await confirmBtn?.trigger('click')

      expect(wrapper.emitted('confirm')).toBeTruthy()
      expect(wrapper.emitted('confirm')?.[0]).toEqual(['Renamed Folder'])
    })
  })

  describe('cancel button', () => {
    it('should emit close when cancel is clicked', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'create',
        },
      })

      const cancelBtn = wrapper.findAll('button').at(0)
      await cancelBtn?.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('keyboard interaction', () => {
    it('should emit confirm on Enter key press', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'create',
          folderName: 'Test',
        },
      })

      const input = wrapper.find('input#folder-name')
      await input.trigger('keyup.enter')

      expect(wrapper.emitted('confirm')).toBeTruthy()
    })
  })

  describe('click outside to close', () => {
    it('should emit close when clicking outside modal', async () => {
      const FolderModal = await import('./FolderModal.vue')
      const wrapper = mount(FolderModal.default, {
        props: {
          visible: true,
          mode: 'create',
        },
      })

      const backdrop = wrapper.find('.bg-black\\/50')
      await backdrop.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })
})