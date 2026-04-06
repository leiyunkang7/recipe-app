import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(),
}
vi.stubGlobal('navigator', {
  clipboard: mockClipboard,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
})

// Mock window for openShareWindow
const mockOpen = vi.fn()
vi.stubGlobal('window', {
  open: mockOpen,
  innerWidth: 1024,
  innerHeight: 768,
  location: {
    origin: 'https://recipe-app.example.com',
  },
})

vi.stubGlobal('alert', vi.fn())

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
})

describe('useShareMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClipboard.writeText.mockReset()
    mockOpen.mockReset()
  })

  describe('initial state', () => {
    it('should have showMenu as false initially', async () => {
      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { showMenu } = useShareMenu()

      expect(showMenu.value).toBe(false)
    })

    it('should have copySuccess as false initially', async () => {
      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { copySuccess } = useShareMenu()

      expect(copySuccess.value).toBe(false)
    })
  })

  describe('platforms', () => {
    it('should have 5 share platforms defined', async () => {
      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { platforms } = useShareMenu()

      expect(platforms).toHaveLength(5)
      expect(platforms.map(p => p.id)).toEqual(['weibo', 'qq', 'qzone', 'twitter', 'facebook'])
    })

    it('should have correct platform names', async () => {
      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { platforms } = useShareMenu()

      const weibo = platforms.find(p => p.id === 'weibo')
      expect(weibo?.name).toBe('微博')
      expect(weibo?.color).toBe('#E6162D')
    })
  })

  describe('getRecipeUrl', () => {
    it('should return correct URL when window is available', async () => {
      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { getRecipeUrl } = useShareMenu()

      const recipe = { id: 'recipe-123', title: 'Test Recipe', description: 'Test' } as unknown
      const url = getRecipeUrl(recipe)

      expect(url).toBe('https://recipe-app.example.com/recipes/recipe-123')
    })
  })

  describe('toggleMenu', () => {
    it('should toggle showMenu from false to true', async () => {
      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { showMenu, toggleMenu } = useShareMenu()

      expect(showMenu.value).toBe(false)
      toggleMenu()
      expect(showMenu.value).toBe(true)
    })

    it('should toggle showMenu from true to false', async () => {
      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { showMenu, toggleMenu } = useShareMenu()

      showMenu.value = true
      toggleMenu()
      expect(showMenu.value).toBe(false)
    })
  })

  describe('closeMenu', () => {
    it('should set showMenu to false', async () => {
      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { showMenu, closeMenu } = useShareMenu()

      showMenu.value = true
      closeMenu()
      expect(showMenu.value).toBe(false)
    })
  })

  describe('copyLink', () => {
    it('should return true when clipboard write succeeds', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined)

      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { copyLink } = useShareMenu()

      const recipe = { id: 'recipe-123', title: 'Test Recipe', description: 'Test' } as unknown
      const result = await copyLink(recipe)

      expect(result).toBe(true)
      expect(mockClipboard.writeText).toHaveBeenCalledWith('https://recipe-app.example.com/recipes/recipe-123')
    })

    it('should return false when clipboard write fails', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'))

      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { copyLink } = useShareMenu()

      const recipe = { id: 'recipe-123', title: 'Test Recipe', description: 'Test' } as unknown
      const result = await copyLink(recipe)

      expect(result).toBe(false)
    })
  })

  describe('isWeChat', () => {
    it('should return true when user agent contains MicroMessenger', async () => {
      vi.stubGlobal('navigator', {
        ...vi.stubGlobal('navigator'),
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.0',
      })

      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { isWeChat } = useShareMenu()

      expect(isWeChat()).toBe(true)
    })

    it('should return false when user agent does not contain MicroMessenger', async () => {
      vi.stubGlobal('navigator', {
        ...vi.stubGlobal('navigator'),
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36',
      })

      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { isWeChat } = useShareMenu()

      expect(isWeChat()).toBe(false)
    })

    it('should return false on server side (window undefined)', async () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { isWeChat } = useShareMenu()

      expect(isWeChat()).toBe(false)

      global.window = originalWindow
    })
  })

  describe('shareToPlatform', () => {
    it('should open share window with correct URL for weibo', async () => {
      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { shareToPlatform } = useShareMenu()

      const recipe = { id: 'recipe-123', title: 'Test Recipe', description: 'Test desc' } as unknown
      shareToPlatform(recipe, 'weibo')

      expect(mockOpen).toHaveBeenCalled()
      const [url, target, features] = mockOpen.mock.calls[0]
      expect(url).toContain('service.weibo.com')
      expect(url).toContain('recipe-123')
      expect(target).toBe('weibo')
      expect(features).toContain('width=600')
    })

    it('should open share window with correct URL for twitter', async () => {
      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { shareToPlatform } = useShareMenu()

      const recipe = { id: 'recipe-123', title: 'Test Recipe', description: 'Test desc' } as unknown
      shareToPlatform(recipe, 'twitter')

      expect(mockOpen).toHaveBeenCalled()
      const [url, target] = mockOpen.mock.calls[0]
      expect(url).toContain('twitter.com/intent/tweet')
      expect(url).toContain('Test%20Recipe')
      expect(target).toBe('twitter')
    })

    it('should not open window for unknown platform', async () => {
      const { useShareMenu } = await import('../app/composables/useShareMenu')
      const { shareToPlatform } = useShareMenu()

      const recipe = { id: 'recipe-123', title: 'Test Recipe', description: 'Test desc' } as unknown
      shareToPlatform(recipe, 'unknown-platform')

      expect(mockOpen).not.toHaveBeenCalled()
    })
  })
})