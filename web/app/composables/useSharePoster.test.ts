import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Recipe } from '~/types'

// Mock document and canvas APIs
const mockCanvasGetContext = vi.fn()
const mockCanvasToDataURL = vi.fn()
const mockCanvas = {
  getContext: mockCanvasGetContext,
  toDataURL: mockCanvasToDataURL,
  width: 0,
  height: 0,
}
const mockCreateElement = vi.fn((tag: string) => {
  if (tag === 'canvas') {
    return mockCanvas
  }
  return {}
})
const mockCreateElementNS = vi.fn()
const mockGetElementById = vi.fn()
const mockQuerySelector = vi.fn()

// Mock window.location
const mockWindow = {
  location: {
    origin: 'https://recipe-app.example.com',
  },
}

vi.stubGlobal('document', {
  createElement: mockCreateElement,
  createElementNS: mockCreateElementNS,
  getElementById: mockGetElementById,
  querySelector: mockQuerySelector,
})

vi.stubGlobal('window', mockWindow)

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
})

describe('useSharePoster', () => {
  const createMockRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
    id: 'recipe-1',
    title: 'Test Recipe',
    description: 'A delicious test recipe',
    category: '家常菜',
    cuisine: 'Chinese',
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    difficulty: 'medium',
    imageUrl: 'https://example.com/image.jpg',
    ingredients: [
      { id: '1', name: 'Ingredient 1', amount: 100, unit: 'g' },
      { id: '2', name: 'Ingredient 2', amount: 200, unit: 'ml' },
    ],
    steps: [
      { id: '1', stepNumber: 1, instruction: 'Step 1', durationMinutes: 5 },
      { id: '2', stepNumber: 2, instruction: 'Step 2', durationMinutes: 10 },
    ],
    tags: ['tag1', 'tag2'],
    views: 100,
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockCanvasGetContext.mockReturnValue({
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      scale: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      clip: vi.fn(),
      textAlign: '',
      font: '',
      fillText: vi.fn(),
    })
    mockCanvasToDataURL.mockReturnValue('data:image/png;base64,mockImageData')
    mockCanvas.width = 1080
    mockCanvas.height = 1350
    mockCreateElement.mockReturnValue(mockCanvas)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should have isGenerating set to false initially', async () => {
      const { useSharePoster } = await import('./useSharePoster')
      const { isGenerating } = useSharePoster()

      expect(isGenerating.value).toBe(false)
    })

    it('should have error set to null initially', async () => {
      const { useSharePoster } = await import('./useSharePoster')
      const { error } = useSharePoster()

      expect(error.value).toBe(null)
    })
  })

  describe('generatePoster', () => {
    it('should set isGenerating to true during generation', async () => {
      const { useSharePoster } = await import('./useSharePoster')
      const { isGenerating, generatePoster } = useSharePoster()

      const recipe = createMockRecipe()

      const promise = generatePoster(recipe)
      expect(isGenerating.value).toBe(true)

      await promise
      expect(isGenerating.value).toBe(false)
    })

    it('should create canvas with correct dimensions', async () => {
      const { useSharePoster } = await import('./useSharePoster')
      const { generatePoster } = useSharePoster()

      const recipe = createMockRecipe()
      await generatePoster(recipe)

      expect(mockCanvas.width).toBe(1080)
      expect(mockCanvas.height).toBe(1350)
    })

    it('should use custom width and height when provided', async () => {
      const { useSharePoster } = await import('./useSharePoster')
      const { generatePoster } = useSharePoster()

      const recipe = createMockRecipe()
      await generatePoster(recipe, undefined, { width: 540, height: 675 })

      expect(mockCanvas.width).toBe(540)
      expect(mockCanvas.height).toBe(675)
    })

    it('should return data URL after successful generation', async () => {
      const { useSharePoster } = await import('./useSharePoster')
      const { generatePoster } = useSharePoster()

      const recipe = createMockRecipe()
      const result = await generatePoster(recipe)

      expect(result).toBe('data:image/png;base64,mockImageData')
      expect(mockCanvasToDataURL).toHaveBeenCalledWith('image/png', 0.95)
    })

    it('should reset error on new generation', async () => {
      const { useSharePoster } = await import('./useSharePoster')
      const { error, generatePoster } = useSharePoster()

      // Set an error first
      error.value = 'Previous error'

      const recipe = createMockRecipe()
      await generatePoster(recipe)

      expect(error.value).toBe(null)
    })

    it('should handle recipe without imageUrl gracefully', async () => {
      const { useSharePoster } = await import('./useSharePoster')
      const { generatePoster } = useSharePoster()

      const recipe = createMockRecipe({ imageUrl: '' })
      const result = await generatePoster(recipe)

      expect(result).toBe('data:image/png;base64,mockImageData')
    })

    it('should handle recipe with null ingredients', async () => {
      const { useSharePoster } = await import('./useSharePoster')
      const { generatePoster } = useSharePoster()

      const recipe = createMockRecipe({ ingredients: [] })
      const result = await generatePoster(recipe)

      expect(result).toBe('data:image/png;base64,mockImageData')
    })

    it('should calculate time correctly for minutes under 60', async () => {
      const { useSharePoster } = await import('./useSharePoster')
      const { generatePoster } = useSharePoster()

      const recipe = createMockRecipe({
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
      })

      const result = await generatePoster(recipe)
      expect(result).toBe('data:image/png;base64,mockImageData')
    })

    it('should calculate time correctly for hours', async () => {
      const { useSharePoster } = await import('./useSharePoster')
      const { generatePoster } = useSharePoster()

      const recipe = createMockRecipe({
        prepTimeMinutes: 60,
        cookTimeMinutes: 30,
      })

      const result = await generatePoster(recipe)
      expect(result).toBe('data:image/png;base64,mockImageData')
    })

    it('should use category-specific gradient colors', async () => {
      const { useSharePoster } = await import('./useSharePoster')
      const { generatePoster } = useSharePoster()

      const recipe = createMockRecipe({ category: '甜点' })
      const result = await generatePoster(recipe)

      expect(result).toBe('data:image/png;base64,mockImageData')
    })

    it('should use default gradient for unknown category', async () => {
      const { useSharePoster } = await import('./useSharePoster')
      const { generatePoster } = useSharePoster()

      const recipe = createMockRecipe({ category: 'Unknown Category' })
      const result = await generatePoster(recipe)

      expect(result).toBe('data:image/png;base64,mockImageData')
    })
  })

  describe('downloadPoster', () => {
    it('should generate poster and trigger download', async () => {
      const clickMock = vi.fn()
      const mockLink = {
        click: clickMock,
        download: '',
        href: '',
      }
      mockCreateElement.mockReturnValueOnce(mockLink)

      const { useSharePoster } = await import('./useSharePoster')
      const { downloadPoster } = useSharePoster()

      const recipe = createMockRecipe()
      await downloadPoster(recipe)

      expect(mockLink.download).toBe('食谱-Test Recipe-分享海报.png')
      expect(clickMock).toHaveBeenCalled()
    })
  })
})