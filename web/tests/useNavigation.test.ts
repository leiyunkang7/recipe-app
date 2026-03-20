import { describe, it, expect } from 'vitest'
import { useNavigation } from '../app/composables/useNavigation'

describe('useNavigation', () => {
  describe('isActive', () => {
    const { isActive } = useNavigation()

    it('should return true when path equals currentPath', () => {
      expect(isActive('/recipes', '/recipes')).toBe(true)
      expect(isActive('/about', '/about')).toBe(true)
    })

    it('should return true for root path when current path is root', () => {
      expect(isActive('/', '/')).toBe(true)
    })

    it('should return true for root path when current path starts with /recipes/', () => {
      expect(isActive('/', '/recipes/123')).toBe(true)
      expect(isActive('/', '/recipes/some-slug')).toBe(true)
    })

    it('should return true when currentPath starts with path', () => {
      expect(isActive('/recipes', '/recipes/new')).toBe(true)
      expect(isActive('/recipes', '/recipes/123/edit')).toBe(true)
      expect(isActive('/about', '/about-us')).toBe(true)
    })

    it('should return false when currentPath does not start with path', () => {
      expect(isActive('/recipes', '/recipe')).toBe(false)
      expect(isActive('/recipes', '/about')).toBe(false)
    })

    it('should return false for non-root path with different base', () => {
      expect(isActive('/categories', '/category')).toBe(false)
    })

    it('should handle nested paths correctly', () => {
      expect(isActive('/settings', '/settings/profile')).toBe(true)
      expect(isActive('/settings', '/settings/profile/edit')).toBe(true)
      expect(isActive('/settings', '/settings/profile/edit/avatar')).toBe(true)
    })
  })
})
