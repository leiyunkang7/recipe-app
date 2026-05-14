/**
 * Shared Component Prop Types
 *
 * Centralized prop type definitions for consistent component APIs.
 */

// ============ Size Variants ============

export const SIZE_VARIANTS = ['sm', 'md', 'lg'] as const
export type SizeVariant = typeof SIZE_VARIANTS[number]

export const SIZE_CLASSES: Record<SizeVariant, { button: string; icon: string }> = {
  sm: {
    button: 'min-w-[44px] min-h-[44px] w-8 h-8',
    icon: 'w-4 h-4',
  },
  md: {
    button: 'min-w-[44px] min-h-[44px] w-10 h-10',
    icon: 'w-5 h-5',
  },
  lg: {
    button: 'min-w-[44px] min-h-[44px] w-12 h-12',
    icon: 'w-6 h-6',
  },
}

// ============ Icon Props ============

export interface BaseIconProps {
  class?: string
}

export interface FilledIconProps extends BaseIconProps {
  filled?: boolean
}

// ============ Action Props ============

export interface Action {
  label: string
  onClick?: () => void
  to?: string
  variant?: 'primary' | 'secondary'
}

export interface ActionProps {
  action?: Action
  secondaryAction?: Action
}

// ============ Illustration Variants ============

export const ILLUSTRATION_VARIANTS = ['plate', 'heart', 'search', 'custom'] as const
export type IllustrationVariant = typeof ILLUSTRATION_VARIANTS[number]

// ============ Loading Props ============

export interface LoadingProps {
  size?: SizeVariant
}

// ============ Empty State Props ============

export interface EmptyStateProps {
  title?: string
  description?: string
  icon?: string
  illustration?: IllustrationVariant
  customIllustration?: boolean
}

// ============ Form Field Props ============

export interface FormFieldProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

// ============ Badge Props ============

export const BADGE_VARIANTS = ['default', 'success', 'warning', 'error'] as const
export type BadgeVariant = typeof BADGE_VARIANTS[number]

// ============ Button Props ============

export const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const
export type ButtonVariant = typeof BUTTON_VARIANTS[number]

// ============ Pagination Props ============

export interface PaginationProps {
  page: number
  limit: number
  total: number
  totalPages?: number
}

// ============ Recipe Card Props ============

export interface RecipeCardProps {
  recipeId: string
  title: string
  imageUrl?: string
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  category?: string
  tags?: string[]
}
