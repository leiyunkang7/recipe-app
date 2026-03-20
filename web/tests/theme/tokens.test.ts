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
  theme,
} from '../app/theme/tokens'

describe('theme/tokens', () => {
  describe('spacing', () => {
    it('should have numeric keys as string pixel values', () => {
      expect(spacing['0']).toBe('0px')
      expect(spacing['1']).toBe('2px')
      expect(spacing['2']).toBe('4px')
    })

    it('should have semantic aliases', () => {
      expect(spacing.xs).toBe('4px')
      expect(spacing.sm).toBe('8px')
      expect(spacing.md).toBe('16px')
      expect(spacing.lg).toBe('24px')
      expect(spacing.xl).toBe('32px')
    })

    it('should follow 4px base unit pattern', () => {
      expect(spacing['3']).toBe('8px')   // 4 * 2
      expect(spacing['4']).toBe('12px')  // 4 * 3
      expect(spacing['5']).toBe('16px')  // 4 * 4
      expect(spacing['6']).toBe('24px')  // 4 * 6
    })
  })

  describe('colors', () => {
    it('should have primary color with required shades', () => {
      expect(colors.primary).toHaveProperty('50')
      expect(colors.primary).toHaveProperty('500')
      expect(colors.primary).toHaveProperty('main')
      expect(colors.primary).toHaveProperty('light')
      expect(colors.primary).toHaveProperty('dark')
    })

    it('should have primary.main as orange (#f97316)', () => {
      expect(colors.primary.main).toBe('#f97316')
    })

    it('should have neutral colors', () => {
      expect(colors.neutral).toHaveProperty('50')
      expect(colors.neutral).toHaveProperty('500')
      expect(colors.neutral).toHaveProperty('main')
    })

    it('should have background colors', () => {
      expect(colors.background).toHaveProperty('main')
      expect(colors.background).toHaveProperty('paper')
      expect(colors.background).toHaveProperty('overlay')
    })

    it('should have state colors', () => {
      expect(colors.state).toHaveProperty('error')
      expect(colors.state).toHaveProperty('success')
      expect(colors.state).toHaveProperty('warning')
      expect(colors.state).toHaveProperty('info')
    })

    it('should have valid hex color values', () => {
      const hexRegex = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i
      expect(colors.primary.main).toMatch(hexRegex)
      expect(colors.state.error).toMatch(hexRegex)
      expect(colors.state.success).toMatch(hexRegex)
    })
  })

  describe('typography', () => {
    it('should have font families', () => {
      expect(typography.fontFamily).toHaveProperty('sans')
      expect(typography.fontFamily).toHaveProperty('display')
      expect(typography.fontFamily).toHaveProperty('mono')
    })

    it('should have font sizes', () => {
      expect(typography.fontSize).toHaveProperty('xs')
      expect(typography.fontSize).toHaveProperty('sm')
      expect(typography.fontSize).toHaveProperty('base')
      expect(typography.fontSize).toHaveProperty('lg')
      expect(typography.fontSize).toHaveProperty('xl')
    })

    it('should have font weights', () => {
      expect(typography.fontWeight).toHaveProperty('light')
      expect(typography.fontWeight).toHaveProperty('normal')
      expect(typography.fontWeight).toHaveProperty('medium')
      expect(typography.fontWeight).toHaveProperty('semibold')
      expect(typography.fontWeight).toHaveProperty('bold')
    })

    it('should have heading styles', () => {
      expect(typography).toHaveProperty('h1')
      expect(typography).toHaveProperty('h2')
      expect(typography).toHaveProperty('h3')
      expect(typography).toHaveProperty('h4')
    })

    it('should have valid h1 style', () => {
      expect(typography.h1.fontSize).toBe('1.875rem')
      expect(typography.h1.fontWeight).toBe('700')
    })
  })

  describe('breakpoints', () => {
    it('should have ascending breakpoint values', () => {
      expect(breakpoints.xs).toBe(0)
      expect(breakpoints.sm).toBe(640)
      expect(breakpoints.md).toBe(768)
      expect(breakpoints.lg).toBe(1024)
      expect(breakpoints.xl).toBe(1280)
      expect(breakpoints['2xl']).toBe(1536)
    })

    it('should have numeric breakpoint values', () => {
      Object.values(breakpoints).forEach((bp) => {
        expect(typeof bp).toBe('number')
      })
    })
  })

  describe('responsive', () => {
    it('should have column mappings for each breakpoint', () => {
      expect(responsive.columns).toHaveProperty('xs')
      expect(responsive.columns).toHaveProperty('sm')
      expect(responsive.columns).toHaveProperty('md')
      expect(responsive.columns).toHaveProperty('lg')
    })

    it('should have gap values', () => {
      expect(responsive.gap).toHaveProperty('xs')
      expect(responsive.gap).toHaveProperty('sm')
      expect(responsive.gap).toHaveProperty('md')
      expect(responsive.gap).toHaveProperty('lg')
    })

    it('should have container max widths', () => {
      expect(responsive.container).toHaveProperty('sm')
      expect(responsive.container).toHaveProperty('md')
      expect(responsive.container).toHaveProperty('lg')
      expect(responsive.container).toHaveProperty('xl')
    })
  })

  describe('shadows', () => {
    it('should have shadow scale values', () => {
      expect(shadows).toHaveProperty('none')
      expect(shadows).toHaveProperty('xs')
      expect(shadows).toHaveProperty('sm')
      expect(shadows).toHaveProperty('md')
      expect(shadows).toHaveProperty('lg')
      expect(shadows).toHaveProperty('xl')
      expect(shadows).toHaveProperty('2xl')
    })

    it('should have valid shadow values', () => {
      expect(shadows.none).toBe('none')
      expect(shadows.sm).toContain('rgba')
      expect(shadows.md).toContain('rgba')
    })
  })

  describe('borderRadius', () => {
    it('should have radius scale values', () => {
      expect(borderRadius).toHaveProperty('none')
      expect(borderRadius).toHaveProperty('sm')
      expect(borderRadius).toHaveProperty('md')
      expect(borderRadius).toHaveProperty('lg')
      expect(borderRadius).toHaveProperty('full')
    })

    it('should have full radius as 9999px', () => {
      expect(borderRadius.full).toBe('9999px')
    })
  })

  describe('transitions', () => {
    it('should have duration values', () => {
      expect(transitions.duration).toHaveProperty('fast')
      expect(transitions.duration).toHaveProperty('normal')
      expect(transitions.duration).toHaveProperty('slow')
    })

    it('should have easing values', () => {
      expect(transitions.easing).toHaveProperty('default')
      expect(transitions.easing).toHaveProperty('in')
      expect(transitions.easing).toHaveProperty('out')
      expect(transitions.easing).toHaveProperty('bounce')
    })

    it('should have cubic-bezier easing values', () => {
      expect(transitions.easing.default).toContain('cubic-bezier')
      expect(transitions.easing.bounce).toContain('cubic-bezier')
    })
  })

  describe('theme', () => {
    it('should have all required sub-objects', () => {
      expect(theme).toHaveProperty('spacing')
      expect(theme).toHaveProperty('colors')
      expect(theme).toHaveProperty('typography')
      expect(theme).toHaveProperty('breakpoints')
      expect(theme).toHaveProperty('responsive')
      expect(theme).toHaveProperty('shadows')
      expect(theme).toHaveProperty('borderRadius')
      expect(theme).toHaveProperty('transitions')
    })

    it('should reference the same objects as individual exports', () => {
      expect(theme.spacing).toBe(spacing)
      expect(theme.colors).toBe(colors)
      expect(theme.typography).toBe(typography)
    })
  })
})
