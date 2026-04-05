/**
 * Form utilities - 表单相关的工具函数
 *
 * 集中管理表单相关的工具函数，避免在多个组件中重复定义
 */

import type { Locale } from '~/types'

/**
 * Base translation interface with locale
 */
interface BaseTranslation {
  locale: Locale
}

/**
 * Generate a unique temporary ID for form items
 * 用于在保存前标识表单中的临时项目
 */
export function generateTempId(prefix = 'form'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Get a translation value by locale from a translations array
 * Falls back to the default field if translation is not found
 */
export function getTranslation<T extends BaseTranslation>(
  translations: T[] | undefined,
  locale: Locale,
  defaultField: keyof T
): string {
  const translation = translations?.find(t => t.locale === locale)
  return translation ? String(translation[defaultField] || '') : ''
}

/**
 * Set a translation value by locale in a translations array
 * Creates the translation entry if it doesn't exist
 * Also updates the default field when locale is 'en'
 */
export function setTranslation<T extends BaseTranslation>(
  translations: T[] | undefined,
  locale: Locale,
  defaultField: keyof T,
  value: string
): T[] {
  const newTranslations = translations ? [...translations] : []
  const transIndex = newTranslations.findIndex(t => t.locale === locale)

  if (transIndex >= 0) {
    (newTranslations[transIndex] as Record<string, unknown>)[defaultField] = value
  } else {
    newTranslations.push({ locale, [defaultField]: value } as T)
  }

  if (locale === 'en') {
    // For English, also update the default field on the parent object
    // This is handled by the caller since we don't have a reference to the parent
  }

  return newTranslations
}