import { describe, it, expect } from 'vitest'
import { 
  spacing, 
  colors, 
  typography, 
  breakpoints, 
  responsive, 
  shadows, 
  borderRadius,
  transitions,
  theme 
} from '../app/theme/tokens'

describe('Theme Tokens', () => {
  describe('spacing', () => {
    it('should have correct numeric spacing values', () => {
      expect(spacing[0]).toBe(0)
      expect(spacing[1]).toBe('2px')
      expect(spacing[2]).toBe('4px')
      expect(spacing[3]).toBe('8px')
      expect(spacing[4]).toBe('12px')
      expect(spacing[5]).toBe('16px')
      expect(spacing[6]).toBe('24px')
      expect(spacing[7]).toBe('32px')
      expect(spacing[8]).toBe('40px')
      expect(spacing[9]).toBe('48px')
      expect(spacing[10]).toBe('64px')
    })

    it('should have semantic spacing aliases', () => {
      expect(spacing.xs).toBe('4px')
      expect(spacing.sm).toBe('8px')
      expect(spacing.md).toBe('16px')
      expect(spacing.lg).toBe('24px')
      expect(spacing.xl).toBe('32px')
      expect(spacing['2xl']).toBe('48px')
      expect(spacing['3xl']).toBe('64px')
    })

    it('should follow 4px base unit system', () => {
      // All numeric spacing should be multiples of 2px (half base unit)
      for (let i = 1; i <= 10; i++) {
        const value = parseInt(spacing[i] as string)
        expect(value % 2).toBe(0)
      }
    })
  })

  describe('colors', () => {
    it('should have primary color palette with correct structure', () => {
      expect(colors.primary).toHaveProperty('50')
      expect(colors.primary).toHaveProperty('100')
      expect(colors.primary).toHaveProperty('500')
      expect(colors.primary).toHaveProperty('main')
      expect(colors.primary).toHaveProperty('light')
      expect(colors.primary).toHaveProperty('dark')
    })

    it('should have neutral color palette', () => {
      expect(colors.neutral).toHaveProperty('50')
      expect(colors.neutral).toHaveProperty('500')
      expect(colors.neutral).toHaveProperty('900')
      expect(colors.neutral).toHaveProperty('main')
    })

    it('should have background colors', () => {
      expect(colors.background).toHaveProperty('main')
      expect(colors.background).toHaveProperty('paper')
      expect(colors.background).toHaveProperty('elevated')
      expect(colors.background).toHaveProperty('overlay')
    })

    it('should have text colors with proper hierarchy', () => {
      expect(colors.text).toHaveProperty('primary')
      expect(colors.text).toHaveProperty('secondary')
      expect(colors.text).toHaveProperty('disabled')
      expect(colors.text).toHaveProperty('hint')
    })

    it('should have state colors for feedback', () => {
      expect(colors.state).toHaveProperty('error')
      expect(colors.state).toHaveProperty('success')
      expect(colors.state).toHaveProperty('warning')
      expect(colors.state).toHaveProperty('info')
    })

    it('should have valid hex color values', () => {
      const hexRegex = /^#[0-9a-fA-F]{3,6}$/
      // Check primary colors
      expect(colors.primary.main).toMatch(hexRegex)
      expect(colors.primary.light).toMatch(hexRegex)
      expect(colors.primary.dark).toMatch(hexRegex)
      // Check state colors
      expect(colors.state.error).toMatch(hexRegex)
      expect(colors.state.success).toMatch(hexRegex)
    })
  })

  describe('typography', () => {
    it('should have font families defined', () => {
      expect(typography.fontFamily).toHaveProperty('sans')
      expect(typography.fontFamily).toHaveProperty('display')
      expect(typography.fontFamily).toHaveProperty('mono')
      expect(Array.isArray(typography.fontFamily.sans)).toBe(true)
    })

    it('should have font sizes with line heights', () => {
      expect(typography.fontSize).toHaveProperty('xs')
      expect(typography.fontSize).toHaveProperty('sm')
      expect(typography.fontSize).toHaveProperty('base')
      expect(typography.fontSize).toHaveProperty('lg')
      expect(typography.fontSize).toHaveProperty('xl')
      
      expect(Array.isArray(typography.fontSize.xs)).toBe(true)
      expect(typeof typography.fontSize.xs[1]).toBe('object')
      expect(typography.fontSize.xs[1]).toHaveProperty('lineHeight')
    })

    it('should have font weights defined', () => {
      expect(typography.fontWeight).toHaveProperty('light')
      expect(typography.fontWeight).toHaveProperty('normal')
      expect(typography.fontWeight).toHaveProperty('medium')
      expect(typography.fontWeight).toHaveProperty('semibold')
      expect(typography.fontWeight).toHaveProperty('bold')
    })

    it('should have heading styles defined', () => {
      expect(typography).toHaveProperty('h1')
      expect(typography).toHaveProperty('h2')
      expect(typography).toHaveProperty('h3')
      expect(typography).toHaveProperty('h4')
      
      // h1 should have required properties
      expect(typography.h1).toHaveProperty('fontSize')
      expect(typography.h1).toHaveProperty('lineHeight')
      expect(typography.h1).toHaveProperty('fontWeight')
    })
  })

  describe('breakpoints', () => {
    it('should have all required breakpoint values', () => {
      expect(breakpoints).toHaveProperty('xs')
      expect(breakpoints).toHaveProperty('sm')
      expect(breakpoints).toHaveProperty('md')
      expect(breakpoints).toHaveProperty('lg')
      expect(breakpoints).toHaveProperty('xl')
      expect(breakpoints).toHaveProperty('2xl')
    })

    it('should have ascending breakpoint values', () => {
      expect(breakpoints.xs).toBe(0)
      expect(breakpoints.sm).toBeGreaterThan(breakpoints.xs)
      expect(breakpoints.md).toBeGreaterThan(breakpoints.sm)
      expect(breakpoints.lg).toBeGreaterThan(breakpoints.md)
      expect(breakpoints.xl).toBeGreaterThan(breakpoints.lg)
      expect(breakpoints['2xl']).toBeGreaterThan(breakpoints.xl)
    })

    it('should have standard breakpoint widths', () => {
      expect(breakpoints.sm).toBe(640)
      expect(breakpoints.md).toBe(768)
      expect(breakpoints.lg).toBe(1024)
      expect(breakpoints.xl).toBe(1280)
    })
  })

  describe('responsive', () => {
    it('should have column configurations for all breakpoints', () => {
      expect(responsive.columns).toHaveProperty('xs')
      expect(responsive.columns).toHaveProperty('sm')
      expect(responsive.columns).toHaveProperty('md')
      expect(responsive.columns).toHaveProperty('lg')
      expect(responsive.columns).toHaveProperty('xl')
    })

    it('should have container max widths', () => {
      expect(responsive.container).toHaveProperty('sm')
      expect(responsive.container).toHaveProperty('md')
      expect(responsive.container).toHaveProperty('lg')
      expect(responsive.container).toHaveProperty('xl')
      expect(responsive.container).toHaveProperty('2xl')
    })
  })

  describe('shadows', () => {
    it('should have shadow values for all levels', () => {
      expect(shadows).toHaveProperty('none')
      expect(shadows).toHaveProperty('xs')
      expect(shadows).toHaveProperty('sm')
      expect(shadows).toHaveProperty('md')
      expect(shadows).toHaveProperty('lg')
      expect(shadows).toHaveProperty('xl')
      expect(shadows).toHaveProperty('2xl')
      expect(shadows).toHaveProperty('inner')
    })

    it('should have none shadow as no shadow', () => {
      expect(shadows.none).toBe('none')
    })
  })

  describe('borderRadius', () => {
    it('should have border radius values for all levels', () => {
      expect(borderRadius).toHaveProperty('none')
      expect(borderRadius).toHaveProperty('xs')
      expect(borderRadius).toHaveProperty('sm')
      expect(borderRadius).toHaveProperty('md')
      expect(borderRadius).toHaveProperty('lg')
      expect(borderRadius).toHaveProperty('full')
    })

    it('should have full radius as maximum value', () => {
      expect(borderRadius.full).toBe('9999px')
    })
  })

  describe('transitions', () => {
    it('should have duration values', () => {
      expect(transitions.duration).toHaveProperty('fast')
      expect(transitions.duration).toHaveProperty('normal')
      expect(transitions.duration).toHaveProperty('slow')
      expect(transitions.duration).toHaveProperty('slower')
    })

    it('should have easing functions', () => {
      expect(transitions.easing).toHaveProperty('default')
      expect(transitions.easing).toHaveProperty('in')
      expect(transitions.easing).toHaveProperty('out')
      expect(transitions.easing).toHaveProperty('bounce')
    })

    it('should have valid easing values', () => {
      // All easing should be valid CSS cubic-bezier or named values
      const easingValues = Object.values(transitions.easing)
      easingValues.forEach(easing => {
        expect(typeof easing).toBe('string')
        expect(easing.length).toBeGreaterThan(0)
      })
    })
  })

  describe('theme object', () => {
    it('should export complete theme object', () => {
      expect(theme).toHaveProperty('spacing')
      expect(theme).toHaveProperty('colors')
      expect(theme).toHaveProperty('typography')
      expect(theme).toHaveProperty('breakpoints')
      expect(theme).toHaveProperty('responsive')
      expect(theme).toHaveProperty('shadows')
      expect(theme).toHaveProperty('borderRadius')
      expect(theme).toHaveProperty('transitions')
    })
  })
})
