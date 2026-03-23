import { describe, it, expect } from 'vitest'
import { useNavigation } from '../app/composables/useNavigation'

describe('useNavigation', () => {
  const { isActive } = useNavigation()

  describe('isActive', () => {
    describe('when path is root /', () => {
      it('should return true for exact root path', () => {
        expect(isActive('/', '/')).toBe(true)
      })

      it('should return true for recipe detail paths', () => {
        expect(isActive('/', '/recipes/123')).toBe(true)
        expect(isActive('/', '/recipes/abc-def')).toBe(true)
        expect(isActive('/', '/recipes/')).toBe(true)
      })

      it('should return false for admin path', () => {
        expect(isActive('/', '/admin')).toBe(false)
      })

      it('should return false for other non-recipe paths', () => {
        expect(isActive('/', '/about')).toBe(false)
        expect(isActive('/', '/contact')).toBe(false)
      })
    })

    describe('when path is /admin', () => {
      it('should return true for exact admin path', () => {
        expect(isActive('/admin', '/admin')).toBe(true)
      })

      it('should return true for admin subpaths', () => {
        expect(isActive('/admin', '/admin/recipes')).toBe(true)
        expect(isActive('/admin', '/admin/recipes/new')).toBe(true)
      })

      it('should return false for non-admin paths', () => {
        expect(isActive('/admin', '/')).toBe(false)
        expect(isActive('/admin', '/recipes')).toBe(false)
      })
    })

    describe('when path is /recipes', () => {
      it('should return true for /recipes and subpaths', () => {
        expect(isActive('/recipes', '/recipes')).toBe(true)
        expect(isActive('/recipes', '/recipes/123')).toBe(true)
      })

      it('should return false for root path', () => {
        expect(isActive('/recipes', '/')).toBe(false)
      })
    })
  })
})
