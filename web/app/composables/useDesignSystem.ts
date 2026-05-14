/**
 * useDesignSystem - Design Token Access Composable
 *
 * Provides programmatic access to design tokens defined in design-tokens.css
 *
 * These tokens are the single source of truth for all design decisions.
 *
 * Usage:
 * const ds = useDesignSystem()
 * ds.token('color-primary-500')  // '#f97316'
 * ds.spacing('md')               // '16px'
 * ds.setVar('--custom-var', 'red') // Set CSS variable at runtime
 */

import { useTheme } from './useTheme'

export interface SpacingScale {
  xs: string
  sm: string
  md: string
  lg: string
  xl: string
  '2xl': string
  '3xl': string
  [key: string]: string
}

export interface ColorScale {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  main: string
  light: string
  dark: string
  [key: string]: string
}

export interface DesignTokens {
  color: {
    primary: ColorScale
    neutral: ColorScale
    bg: string
    bgPaper: string
    textPrimary: string
    textSecondary: string
    textDisabled: string
    border: string
    state: {
      error: string
      success: string
      warning: string
      info: string
    }
  }
  spacing: SpacingScale
  font: {
    family: {
      sans: string
      mono: string
    }
    size: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      '2xl': string
      '3xl': string
      '4xl': string
    }
    weight: {
      light: string
      normal: string
      medium: string
      semibold: string
      bold: string
    }
  }
  shadow: {
    sm: string
    md: string
    lg: string
  }
  elevation: {
    1: string
    2: string
    3: string
    4: string
    5: string
    6: string
  }
  radius: {
    sm: string
    md: string
    lg: string
    xl: string
    full: string
  }
  motion: {
    duration: {
      fast: string
      normal: string
      slow: string
    }
    easing: {
      default: string
      in: string
      out: string
      bounce: string
    }
  }
  z: {
    dropdown: number
    sticky: number
    overlay: number
    modal: number
    toast: number
  }
}

const TOKENS: DesignTokens = {
  color: {
    primary: {
      '50': '#fff7ed',
      '100': '#ffedd5',
      '200': '#fed7aa',
      '300': '#fdba74',
      '400': '#fb923c',
      '500': '#f97316',
      '600': '#ea580c',
      '700': '#c2410c',
      '800': '#9a3412',
      '900': '#7c2d12',
      main: '#f97316',
      light: '#fb923c',
      dark: '#ea580c',
    },
    neutral: {
      '50': '#fafaf9',
      '100': '#f5f5f4',
      '200': '#e7e5e4',
      '300': '#d6d3d1',
      '400': '#a8a29e',
      '500': '#78716c',
      '600': '#57534e',
      '700': '#44403c',
      '800': '#292524',
      '900': '#1c1917',
      main: '#78716c',
      light: '#a8a29e',
      dark: '#57534e',
    },
    bg: 'var(--color-bg)',
    bgPaper: 'var(--card-bg)',
    textPrimary: 'var(--color-text-primary)',
    textSecondary: 'var(--color-text-secondary)',
    textDisabled: 'var(--color-text-disabled)',
    border: 'var(--color-border)',
    state: {
      error: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b',
      info: '#3b82f6',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  font: {
    family: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'ui-monospace, monospace',
    },
    size: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    weight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.1)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
  },
  elevation: {
    1: '0 1px 3px rgba(0,0,0,0.08)',
    2: '0 2px 4px rgba(0,0,0,0.08)',
    3: '0 4px 6px rgba(0,0,0,0.08)',
    4: '0 6px 8px rgba(0,0,0,0.08)',
    5: '0 8px 10px rgba(0,0,0,0.08)',
    6: '0 10px 12px rgba(0,0,0,0.08)',
  },
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },
  motion: {
    duration: {
      fast: '100ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  z: {
    dropdown: 100,
    sticky: 200,
    overlay: 300,
    modal: 400,
    toast: 500,
  },
}

export function useDesignSystem() {
  const { isDark } = useTheme()

  /**
   * Get a CSS variable value from the document root
   */
  const token = (varName: string): string => {
    if (typeof window === 'undefined') return ''
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(`--${varName}`)
      .trim()
    return value || ''
  }

  /**
   * Set a CSS custom property at runtime
   */
  const setVar = (varName: string, value: string): void => {
    if (typeof window === 'undefined') return
    document.documentElement.style.setProperty(`--${varName}`, value)
  }

  /**
   * Get current spacing value
   */
  const spacing = (size: keyof SpacingScale): string => {
    return TOKENS.spacing[size] || TOKENS.spacing.md
  }

  /**
   * Get primary color by shade
   */
  const primaryColor = (shade: keyof ColorScale = 500): string => {
    return TOKENS.color.primary[shade] || TOKENS.color.primary.main
  }

  /**
   * Get text color variant
   */
  const textColor = (variant: 'primary' | 'secondary' | 'disabled' = 'primary'): string => {
    const map = {
      primary: TOKENS.color.textPrimary,
      secondary: TOKENS.color.textSecondary,
      disabled: TOKENS.color.textDisabled,
    }
    return map[variant]
  }

  /**
   * Get state color (error, success, warning, info)
   */
  const stateColor = (type: keyof typeof TOKENS.color.state): string => {
    return TOKENS.color.state[type]
  }

  /**
   * Get elevation shadow value
   */
  const elevation = (level: 1 | 2 | 3 | 4 | 5 | 6): string => {
    return TOKENS.elevation[level] || TOKENS.elevation[1]
  }

  /**
   * Check if dark mode is active (reactive)
   */
  const darkMode = computed(() => isDark.value)

  /**
   * Get class name for dark mode styling
   */
  const darkClass = computed(() => isDark.value ? 'dark' : '')

  return {
    // Direct token access
    token,
    setVar,
    // Convenience methods
    spacing,
    primaryColor,
    textColor,
    stateColor,
    elevation,
    // State
    darkMode,
    darkClass,
    // Full tokens object (read-only)
    tokens: TOKENS,
    // Direct access aliases for backward compatibility
    color: TOKENS.color,
    font: TOKENS.font,
    motion: TOKENS.motion,
    z: TOKENS.z,
    spacingScale: TOKENS.spacing,
    radius: TOKENS.radius,
    shadow: TOKENS.shadow,
  }
}
