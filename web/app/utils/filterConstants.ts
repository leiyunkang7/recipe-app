/**
 * Shared filter constants for recipe filtering components.
 * Extracted from RecipeFilters.vue and AdvancedSearchFilters.vue to avoid duplication.
 */

export const TIME_PRESETS = [
  { label: '15min', value: 15 },
  { label: '30min', value: 30 },
  { label: '60min', value: 60 },
  { label: '90min', value: 90 },
] as const

export const DIFFICULTY_OPTIONS = [
  { value: 'easy' as const, labelKey: 'difficulty.easy' },
  { value: 'medium' as const, labelKey: 'difficulty.medium' },
  { value: 'hard' as const, labelKey: 'difficulty.hard' },
] as const

export const TASTE_OPTIONS = [
  { value: 'spicy' as const, labelKey: 'taste.spicy', emoji: '🌶️' },
  { value: 'sweet' as const, labelKey: 'taste.sweet', emoji: '🍬' },
  { value: 'savory' as const, labelKey: 'taste.savory', emoji: '🍖' },
  { value: 'sour' as const, labelKey: 'taste.sour', emoji: '🍋' },
  { value: 'mild' as const, labelKey: 'taste.mild', emoji: '🌿' },
] as const

export const RATING_OPTIONS = [
  { value: 4, label: '4+ ⭐⭐⭐⭐' },
  { value: 3, label: '3+ ⭐⭐⭐' },
  { value: 2, label: '2+ ⭐⭐' },
] as const

export type TimePreset = (typeof TIME_PRESETS)[number]
export type DifficultyOption = (typeof DIFFICULTY_OPTIONS)[number]
export type TasteOption = (typeof TASTE_OPTIONS)[number]
export type RatingOption = (typeof RATING_OPTIONS)[number]
