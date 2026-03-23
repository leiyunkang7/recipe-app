/** Design System Tokens for Recipe App
 * 设计系统令牌
 * 
 * 使用方式：
 * - 间距: theme.spacing.sm / theme.spacing[4]
 * - 颜色: theme.colors.primary.main
 * - 字体: theme.typography.h1
 * - 断点: theme.breakpoints.md
 */

// 基础单位 (Base Unit)
const BASE_UNIT = 4;

// 间距系统 (Spacing Scale) - 4px倍数
export const spacing = {
  0: 0,
  1: `${BASE_UNIT * 0.5}px`,      // 2px
  2: `${BASE_UNIT * 1}px`,        // 4px
  3: `${BASE_UNIT * 2}px`,        // 8px
  4: `${BASE_UNIT * 3}px`,        // 12px
  5: `${BASE_UNIT * 4}px`,        // 16px
  6: `${BASE_UNIT * 6}px`,        // 24px
  7: `${BASE_UNIT * 8}px`,        // 32px
  8: `${BASE_UNIT * 10}px`,       // 40px
  9: `${BASE_UNIT * 12}px`,       // 48px
  10: `${BASE_UNIT * 16}px`,      // 64px
  // 语义化别名
  xs: `${BASE_UNIT * 1}px`,       // 4px
  sm: `${BASE_UNIT * 2}px`,       // 8px
  md: `${BASE_UNIT * 4}px`,       // 16px
  lg: `${BASE_UNIT * 6}px`,       // 24px
  xl: `${BASE_UNIT * 8}px`,       // 32px
  '2xl': `${BASE_UNIT * 12}px`,   // 48px
  '3xl': `${BASE_UNIT * 16}px`,   // 64px
} as const;

// 颜色系统 (Color System)
export const colors = {
  // 主色调 - 橙色 (温暖、食欲)
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // main
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    main: '#f97316',
    light: '#fb923c',
    dark: '#ea580c',
  },
  // 中性色 - 暖灰 (温和、自然)
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    main: '#78716c',
    light: '#a8a29e',
    dark: '#57534e',
  },
  // 背景色
  background: {
    main: '#fafaf9',    // stone-50
    paper: '#ffffff',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  // 文字色
  text: {
    primary: '#1c1917',   // stone-900
    secondary: '#57534e', // stone-600
    disabled: '#a8a29e', // stone-400
    hint: '#d6d3d1',      // stone-300
  },
  // 状态色
  state: {
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
} as const;

// 字体系统 (Typography)
export const typography = {
  // 字体族
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    display: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  // 字体大小
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],   // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
  },
  // 字重
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  // 标题样式
  h1: {
    fontSize: '1.875rem', // 30px
    lineHeight: '2.25rem',
    fontWeight: '700',
    letterSpacing: '-0.025em',
  },
  h2: {
    fontSize: '1.5rem', // 24px
    lineHeight: '2rem',
    fontWeight: '600',
    letterSpacing: '-0.025em',
  },
  h3: {
    fontSize: '1.25rem', // 20px
    lineHeight: '1.75rem',
    fontWeight: '600',
  },
  h4: {
    fontSize: '1.125rem', // 18px
    lineHeight: '1.75rem',
    fontWeight: '500',
  },
} as const;

// 断点系统 (Breakpoints)
export const breakpoints = {
  xs: 0,      // Mobile portrait
  sm: 640,    // Mobile landscape
  md: 768,    // Tablet
  lg: 1024,   // Desktop
  xl: 1280,   // Large desktop
  '2xl': 1536, // Extra large
} as const;

// 响应式工具
export const responsive = {
  // 列数映射
  columns: {
    xs: 1,  // 手机竖屏
    sm: 2,  // 手机横屏/小平板
    md: 2,  // 平板
    lg: 3,  // 桌面
    xl: 4,  // 大屏幕
  },
  // 间距映射
  gap: {
    xs: '12px',
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px',
  },
  // 容器最大宽度
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// 阴影系统 (Shadows)
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
} as const;

// 圆角系统 (Border Radius)
export const borderRadius = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',
} as const;

// 动画/过渡 (Transitions)
export const transitions = {
  duration: {
    fast: '100ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// 完整主题导出
export const theme = {
  spacing,
  colors,
  typography,
  breakpoints,
  responsive,
  shadows,
  borderRadius,
  transitions,
} as const;

// TypeScript类型
export type Theme = typeof theme;
export type Spacing = keyof typeof spacing;
export type Color = keyof typeof colors;
export type Breakpoint = keyof typeof breakpoints;
export type Shadow = keyof typeof shadows;
export type BorderRadius = keyof typeof borderRadius;
