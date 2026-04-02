import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { FavoriteFolder } from '~/composables/useFavorites'

const mockT = (key: string) => key
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({ t: mockT }),
}))

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
})

describe('FavoriteFolders', () => {
  const createTestFolders = (): FavoriteFolder[] => [
    { id: '1', name: '早餐', color: '#ff6b6b', recipeIds: ['r1', 'r2'], createdAt: new Date().toISOString() },
    { id: '2', name: '晚餐', color: '#4ecdc4', recipeIds: ['r3'], createdAt: new Date().toISOString() },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should render the component', async () => {
      const FavoriteFolders = await import('./FavoriteFolders.vue')
      const wrapper = mount(FavoriteFolders.default, {
        props: {
          folders: createTestFolders(),
          selectedFolderId: null,
        },
        global: {
          stubs: {
            FolderModal: true,
          },
        },
      })
      expect(wrapper.find('.mb-6').exists()).toBe(true)
    })

    it('should render "All Favorites" button', async () => {
      const FavoriteFolders = await import('./FavoriteFolders.vue')
      const wrapper = mount(FavoriteFolders.default, {
        props: {
          folders: createTestFolders(),
          selectedFolderId: null,
        },
        global: {
          stubs: {
            FolderModal: true,
          },
        },
      })

      const allFavoritesBtn = wrapper.find('button')
      expect(allFavoritesBtn.text()).toBe('favorites.allFavorites')
    })

    it('should render folder buttons for each folder', async () => {
      const FavoriteFolders = await import('./FavoriteFolders.vue')
      const folders = createTestFolders()
      const wrapper = mount(FavoriteFolders.default, {
        props: {
          folders,
          selectedFolderId: null,
        },
        global: {
          stubs: {
            FolderModal: true,
          },
        },
      })

      // All Favorites + 2 folder buttons + Create button = 4 buttons
      const buttons = wrapper.findAll('button')
      expect(buttons.length).toBe(4)
    })

    it('should render add folder button with SVG icon', async () => {
      const FavoriteFolders = await import('./FavoriteFolders.vue')
      const wrapper = mount(FavoriteFolders.default, {
        props: {
          folders: createTestFolders(),
          selectedFolderId: null,
        },
        global: {
          stubs: {
            FolderModal: true,
          },
        },
      })

      const addBtn = wrapper.findAll('button').at(-1)
      expect(addBtn?.text()).toContain('favorites.createFolder')
      expect(addBtn?.find('svg').exists()).toBe(true)
    })
  })

  describe('selection behavior', () => {
    it('should emit select with null when All Favorites is clicked', async () => {
      const FavoriteFolders = await import('./FavoriteFolders.vue')
      const wrapper = mount(FavoriteFolders.default, {
        props: {
          folders: createTestFolders(),
          selectedFolderId: null,
        },
        global: {
          stubs: {
            FolderModal: true,
          },
        },
      })

      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')?.[0]).toEqual([null])
    })

    it('should apply orange background to selected All Favorites button', async () => {
      const FavoriteFolders = await import('./FavoriteFolders.vue')
      const wrapper = mount(FavoriteFolders.default, {
        props: {
          folders: createTestFolders(),
          selectedFolderId: null,
        },
        global: {
          stubs: {
            FolderModal: true,
          },
        },
      })

      const allFavoritesBtn = wrapper.find('button')
      expect(allFavoritesBtn.classes()).toContain('bg-orange-500')
      expect(allFavoritesBtn.classes()).toContain('text-white')
    })

    it('should apply custom color to selected folder', async () => {
      const FavoriteFolders = await import('./FavoriteFolders.vue')
      const folders = createTestFolders()
      const wrapper = mount(FavoriteFolders.default, {
        props: {
          folders,
          selectedFolderId: '1',
        },
        global: {
          stubs: {
            FolderModal: true,
          },
        },
      })

      const folderBtn = wrapper.findAll('button').at(1)
      expect(folderBtn?.attributes('style')).toContain('#ff6b6b')
    })

    it('should emit select with folder id when folder button is clicked', async () => {
      const FavoriteFolders = await import('./FavoriteFolders.vue')
      const folders = createTestFolders()
      const wrapper = mount(FavoriteFolders.default, {
        props: {
          folders,
          selectedFolderId: null,
        },
        global: {
          stubs: {
            FolderModal: true,
          },
        },
      })

      const folderBtns = wrapper.findAll('button')
      await folderBtns[1].trigger('click')
      expect(wrapper.emitted('select')?.[0]).toEqual(['1'])
    })
  })

  describe('create folder modal', () => {
    it('should open create modal when add button is clicked', async () => {
      const FavoriteFolders = await import('./FavoriteFolders.vue')
      const wrapper = mount(FavoriteFolders.default, {
        props: {
          folders: createTestFolders(),
          selectedFolderId: null,
        },
        global: {
          stubs: {
            FolderModal: {
              template: '<div class="folder-modal-mock" :data-mode="mode"></div>',
              props: ['mode', 'visible'],
            },
          },
        },
      })

      const addBtn = wrapper.findAll('button').at(-1)
      await addBtn?.trigger('click')

      const modal = wrapper.find('.folder-modal-mock')
      expect(modal.exists()).toBe(true)
      expect(modal.attributes('data-mode')).toBe('create')
    })
  })

  describe('responsive layout', () => {
    it('should have horizontal scroll container', async () => {
      const FavoriteFolders = await import('./FavoriteFolders.vue')
      const wrapper = mount(FavoriteFolders.default, {
        props: {
          folders: createTestFolders(),
          selectedFolderId: null,
        },
        global: {
          stubs: {
            FolderModal: true,
          },
        },
      })

      const scrollContainer = wrapper.find('.overflow-x-auto')
      expect(scrollContainer.exists()).toBe(true)
    })

    it('should have scrollbar-hide class', async () => {
      const FavoriteFolders = await import('./FavoriteFolders.vue')
      const wrapper = mount(FavoriteFolders.default, {
        props: {
          folders: createTestFolders(),
          selectedFolderId: null,
        },
        global: {
          stubs: {
            FolderModal: true,
          },
        },
      })

      const scrollContainer = wrapper.find('.scrollbar-hide')
      expect(scrollContainer.exists()).toBe(true)
    })
  })
})