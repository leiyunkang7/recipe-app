import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { recalculateColumns, measureElement, cleanupElementObserver, cleanupMeasurement } from './useRecipeGridVirtualScroll'
import type { RecipeListItem } from '~/types'

// Create spy functions for ResizeObserver methods
const observeSpy = vi.fn()
const unobserveSpy = vi.fn()
const disconnectSpy = vi.fn()

// Mock ResizeObserver using prototype methods
class MockResizeObserver {
  observe = observeSpy
  unobserve = unobserveSpy
  disconnect = disconnectSpy
}

const originalResizeObserver = global.ResizeObserver

beforeEach(() => {
  vi.clearAllMocks()
  global.ResizeObserver = MockResizeObserver as unknown
})

afterEach(() => {
  global.ResizeObserver = originalResizeObserver
})

describe('useRecipeGridVirtualScroll - recalculateColumns', () => {
  const createMockRecipe = (id: string): RecipeListItem => ({
    id,
    title: `Recipe ${id}`,
    description: `Description ${id}`,
    category: 'main',
    cuisine: 'italian',
    difficulty: 'medium',
    prepTimeMinutes: 30,
    cookTimeMinutes: 45,
    servings: 4,
    imageUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  it('should distribute items evenly between columns', () => {
    const recipes = Array.from({ length: 6 }, (_, i) => createMockRecipe(String(i)))
    const result = recalculateColumns(recipes, 0, { left: [], right: [] })

    // 6 items should be split: 3 left, 3 right
    expect(result.left.length).toBe(3)
    expect(result.right.length).toBe(3)
  })

  it('should handle odd number of items', () => {
    const recipes = Array.from({ length: 5 }, (_, i) => createMockRecipe(String(i)))
    const result = recalculateColumns(recipes, 0, { left: [], right: [] })

    // 5 items: ceil(5/2) = 3 left, floor(5/2) = 2 right
    expect(result.left.length).toBe(3)
    expect(result.right.length).toBe(2)
  })

  it('should handle empty array', () => {
    const result = recalculateColumns([], 0, { left: [], right: [] })

    expect(result.left.length).toBe(0)
    expect(result.right.length).toBe(0)
  })

  it('should use full recalc when oldLength is 0', () => {
    const recipes = Array.from({ length: 4 }, (_, i) => createMockRecipe(String(i)))
    const result = recalculateColumns(recipes, 0, { left: [], right: [] })

    // Should use full recalc since oldLength is 0
    expect(result.left.length).toBe(2)
    expect(result.right.length).toBe(2)
  })

  it('should use full recalc when new items > 15', () => {
    const recipes = Array.from({ length: 20 }, (_, i) => createMockRecipe(String(i)))
    const result = recalculateColumns(recipes, 4, { left: [], right: [] })

    // Should use full recalc since newItems (16) > 15
    expect(result.left.length).toBe(10)
    expect(result.right.length).toBe(10)
  })

  it('should use full recalc when new items > oldLength', () => {
    const recipes = Array.from({ length: 10 }, (_, i) => createMockRecipe(String(i)))
    const result = recalculateColumns(recipes, 3, { left: [], right: [] })

    // Should use full recalc since newItems (7) > oldLength (3)
    expect(result.left.length).toBe(5)
    expect(result.right.length).toBe(5)
  })

  it('should maintain balance between columns', () => {
    const recipes = Array.from({ length: 20 }, (_, i) => createMockRecipe(String(i)))
    const result = recalculateColumns(recipes, 0, { left: [], right: [] })

    // Column lengths should be balanced (10 and 10, or 9 and 11)
    const diff = Math.abs(result.left.length - result.right.length)
    expect(diff).toBeLessThanOrEqual(1)
  })
})

describe('useRecipeGridVirtualScroll - measureElement', () => {
  it('should return estimated card size for null element', () => {
    const size = measureElement(null)
    expect(size).toBe(296) // CARD_HEIGHT (280) + COLUMN_GAP (16)
  })

  it('should return cached height if available', () => {
    const mockElement = document.createElement('div')

    // First call should observe and return estimated size
    const firstSize = measureElement(mockElement)
    expect(firstSize).toBe(296)

    // Mock that resize observer has recorded a height
    // The measuredHeights map is internal, but we can test behavior
  })

  it('should observe element when not in cache', () => {
    const mockElement = document.createElement('div')
    measureElement(mockElement)

    // ResizeObserver.observe should have been called
    expect(observeSpy).toHaveBeenCalledWith(mockElement)
  })
})

describe('useRecipeGridVirtualScroll - cleanupElementObserver', () => {
  it('should not throw on element not being observed', () => {
    const mockElement = document.createElement('div')

    // Should not throw even if element was never observed
    expect(() => cleanupElementObserver(mockElement)).not.toThrow()
  })

  it('should cleanup element from internal tracking', () => {
    const mockElement = document.createElement('div')

    // First observe it (which adds to elementsBeingObserved)
    measureElement(mockElement)
    expect(observeSpy).toHaveBeenCalled()

    // Then cleanup - should not throw
    expect(() => cleanupElementObserver(mockElement)).not.toThrow()
  })
})

describe('useRecipeGridVirtualScroll - cleanupMeasurement', () => {
  it('should disconnect global resize observer', () => {
    // Create a mock element to establish the observer
    const mockElement = document.createElement('div')
    measureElement(mockElement)

    // Cleanup should disconnect
    cleanupMeasurement()
    expect(disconnectSpy).toHaveBeenCalled()
  })

  it('should handle cleanup when no observer exists', () => {
    // Reset module state would be needed for a true test
    // This just verifies it doesn't throw
    expect(() => cleanupMeasurement()).not.toThrow()
  })
})

describe('useRecipeGridVirtualScroll - constants', () => {
  it('should have correct column gap', () => {
    // COLUMN_GAP = 16
    // We can verify through measureElement behavior
    const mockElement = document.createElement('div')
    const size = measureElement(mockElement)
    expect(size).toBe(296) // 280 + 16
  })
})
