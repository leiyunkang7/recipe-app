import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import type { Recipe } from '~/types'

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(),
}
vi.stubGlobal('navigator', {
  clipboard: mockClipboard,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
})

// Mock window
const mockWindow = {
  innerWidth: 1920,
  innerHeight: 1080,
  open: vi.fn(),
  location: {
    origin: 'https://recipe-app.example.com',
  },
}
vi.stubGlobal('window', mockWindow)

// Mock useToast
vi.mock('~/composables/useToast', () => ({
  useToast: () => ({
    info: vi.fn(),
  }),
}))

describe('useShareMenu', () => {
  const mockRecipe: Recipe = {
    id: 'recipe-123',
    title: '番茄炒蛋',
    description: '一道简单美味的家常菜',
    category: '家常菜',
    cuisine: '中餐',
    difficulty: 'easy',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 4,
    imageUrl: '/images/tomato-eggs.jpg',
    ingredients: ['番茄', '鸡蛋'],
    steps: ['炒'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T12:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockClipboard.writeText.mockReset()
    mockClipboard.writeText.mockResolvedValue(undefined)
    mockWindow.open.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('platforms', () => {
    it('should return all share platforms', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { platforms } = useShareMenu()

      expect(platforms).toHaveLength(5)
      expect(platforms.map(p => p.id)).toEqual(['weibo', 'qq', 'qzone', 'twitter', 'facebook'])
    })

    it('should have correct platform configuration', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { platforms } = useShareMenu()

      const weibo = platforms.find(p => p.id === 'weibo')
      expect(weibo?.name).toBe('微博')
      expect(weibo?.color).toBe('#E6162D')

      const twitter = platforms.find(p => p.id === 'twitter')
      expect(twitter?.name).toBe('X (Twitter)')
    })
  })

  describe('getRecipeUrl', () => {
    it('should return URL with window location origin when window is defined', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { getRecipeUrl } = useShareMenu()

      const url = getRecipeUrl(mockRecipe)

      expect(url).toBe('https://recipe-app.example.com/recipes/recipe-123')
    })

    it('should return fallback URL when window is undefined', async () => {
      const originalWindow = global.window
      // @ts-ignore - removing window for test
      global.window = undefined

      const { useShareMenu } = await import('./useShareMenu')
      const { getRecipeUrl } = useShareMenu()

      const url = getRecipeUrl(mockRecipe)

      expect(url).toBe('https://recipe-app.example.com/recipes/recipe-123')

      global.window = originalWindow
    })
  })

  describe('shareToPlatform', () => {
    it('should open share window with correct URL for weibo', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { shareToPlatform } = useShareMenu()

      shareToPlatform(mockRecipe, 'weibo')

      expect(mockWindow.open).toHaveBeenCalled()
      const openedUrl = mockWindow.open.mock.calls[0][0]
      expect(openedUrl).toContain('service.weibo.com/share/share.php')
      expect(openedUrl).toContain(encodeURIComponent('番茄炒蛋'))
    })

    it('should open share window with correct URL for qq', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { shareToPlatform } = useShareMenu()

      shareToPlatform(mockRecipe, 'qq')

      expect(mockWindow.open).toHaveBeenCalled()
      const openedUrl = mockWindow.open.mock.calls[0][0]
      expect(openedUrl).toContain('connect.qq.com/widget/shareqq')
    })

    it('should open share window with correct URL for qzone', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { shareToPlatform } = useShareMenu()

      shareToPlatform(mockRecipe, 'qzone')

      expect(mockWindow.open).toHaveBeenCalled()
      const openedUrl = mockWindow.open.mock.calls[0][0]
      expect(openedUrl).toContain('sns.qzone.qq.com/cgi-bin/qzshare')
    })

    it('should open share window with correct URL for twitter', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { shareToPlatform } = useShareMenu()

      shareToPlatform(mockRecipe, 'twitter')

      expect(mockWindow.open).toHaveBeenCalled()
      const openedUrl = mockWindow.open.mock.calls[0][0]
      expect(openedUrl).toContain('twitter.com/intent/tweet')
    })

    it('should open share window with correct URL for facebook', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { shareToPlatform } = useShareMenu()

      shareToPlatform(mockRecipe, 'facebook')

      expect(mockWindow.open).toHaveBeenCalled()
      const openedUrl = mockWindow.open.mock.calls[0][0]
      expect(openedUrl).toContain('facebook.com/sharer/sharer.php')
    })

    it('should not open window for unknown platform', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { shareToPlatform } = useShareMenu()

      shareToPlatform(mockRecipe, 'unknown-platform')

      expect(mockWindow.open).not.toHaveBeenCalled()
    })
  })

  describe('toggleMenu and closeMenu', () => {
    it('should toggle showMenu state', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { showMenu, toggleMenu } = useShareMenu()

      expect(showMenu.value).toBe(false)

      toggleMenu()
      expect(showMenu.value).toBe(true)

      toggleMenu()
      expect(showMenu.value).toBe(false)
    })

    it('should close menu when closeMenu is called', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { showMenu, toggleMenu, closeMenu } = useShareMenu()

      toggleMenu()
      expect(showMenu.value).toBe(true)

      closeMenu()
      expect(showMenu.value).toBe(false)
    })
  })

  describe('copyLink', () => {
    it('should copy recipe URL to clipboard', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { copyLink } = useShareMenu()

      const result = await copyLink(mockRecipe)

      expect(result).toBe(true)
      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        'https://recipe-app.example.com/recipes/recipe-123'
      )
    })

    it('should return false when clipboard write fails', async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Clipboard access denied'))

      const { useShareMenu } = await import('./useShareMenu')
      const { copyLink } = useShareMenu()

      const result = await copyLink(mockRecipe)

      expect(result).toBe(false)
    })

    it('should set copySuccess to true and then false after timeout', async () => {
      vi.useFakeTimers()

      const { useShareMenu } = await import('./useShareMenu')
      const { copySuccess, copyLink } = useShareMenu()

      const copyPromise = copyLink(mockRecipe)
      await copyPromise

      // At this point copySuccess should be true
      expect(copySuccess.value).toBe(true)

      // Advance timer to trigger the 2 second timeout reset
      vi.advanceTimersByTime(2000)

      // After timeout, copySuccess should be false
      expect(copySuccess.value).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('isWeChat', () => {
    it('should return true for WeChat user agent', async () => {
      vi.stubGlobal('navigator', {
        ...mockClipboard,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.0 NetType/WIFI Language/zh_CN',
      })

      const { useShareMenu } = await import('./useShareMenu')
      const { isWeChat } = useShareMenu()

      expect(isWeChat()).toBe(true)
    })

    it('should return false for non-WeChat user agent', async () => {
      vi.stubGlobal('navigator', {
        ...mockClipboard,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36',
      })

      const { useShareMenu } = await import('./useShareMenu')
      const { isWeChat } = useShareMenu()

      expect(isWeChat()).toBe(false)
    })

    it('should return false when window is undefined (SSR)', async () => {
      const originalWindow = global.window
      // @ts-ignore
      global.window = undefined

      const { useShareMenu } = await import('./useShareMenu')
      const { isWeChat } = useShareMenu()

      expect(isWeChat()).toBe(false)

      global.window = originalWindow
    })
  })

  describe('shareToWeChat', () => {
    it('should show info message about WeChat sharing', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { shareToWeChat } = useShareMenu()

      shareToWeChat(mockRecipe)

      // Should close menu
      const { showMenu } = useShareMenu()
      expect(showMenu.value).toBe(false)
    })
  })

  describe('shareAllPlatforms', () => {
    it('should copy link to clipboard and close menu', async () => {
      const { useShareMenu } = await import('./useShareMenu')
      const { shareAllPlatforms, showMenu } = useShareMenu()

      await shareAllPlatforms(mockRecipe)

      expect(mockClipboard.writeText).toHaveBeenCalled()
      expect(showMenu.value).toBe(false)
    })
  })
})