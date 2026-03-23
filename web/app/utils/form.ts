/**
 * Form utilities - 表单相关的工具函数
 *
 * 集中管理表单相关的工具函数，避免在多个组件中重复定义
 */

/**
 * Generate a unique temporary ID for form items
 * 用于在保存前标识表单中的临时项目
 */
export function generateTempId(prefix = 'form'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}