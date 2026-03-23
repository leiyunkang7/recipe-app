/**
 * Difficulty utilities - 难度等级相关的工具函数
 * 
 * 集中管理难度等级的配置，避免在多个组件中重复定义
 */

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface DifficultyConfig {
  /** 难度等级 */
  level: Difficulty
  /** CSS 背景色类名 */
  bgClass: string
  /** CSS 文字色类名 */
  textClass: string
  /** 暗色模式背景色类名 */
  darkBgClass: string
  /** 暗色模式文字色类名 */
  darkTextClass: string
  /** 海报/分享用颜色 (hex) */
  posterColor: string
  /** 中文标签 */
  labelZh: string
  /** 英文标签 */
  labelEn: string
}

/**
 * 难度等级配置映射
 */
export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    level: 'easy',
    bgClass: 'bg-green-100',
    textClass: 'text-green-800',
    darkBgClass: 'dark:bg-green-900/40',
    darkTextClass: 'dark:text-green-300',
    posterColor: '#22c55e',
    labelZh: '简单',
    labelEn: 'Easy',
  },
  medium: {
    level: 'medium',
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-800',
    darkBgClass: 'dark:bg-yellow-900/40',
    darkTextClass: 'dark:text-yellow-300',
    posterColor: '#f59e0b',
    labelZh: '中等',
    labelEn: 'Medium',
  },
  hard: {
    level: 'hard',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
    darkBgClass: 'dark:bg-red-900/40',
    darkTextClass: 'dark:text-red-300',
    posterColor: '#ef4444',
    labelZh: '困难',
    labelEn: 'Hard',
  },
}

/**
 * 获取难度等级的 CSS 类名
 */
export function getDifficultyClasses(difficulty: Difficulty, darkMode = true): string {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium
  return `${config.bgClass} ${config.textClass} ${darkMode ? config.darkBgClass : ''} ${darkMode ? config.darkTextClass : ''}`
}

/**
 * 获取难度等级的海报颜色
 */
export function getDifficultyPosterColor(difficulty: Difficulty): string {
  return DIFFICULTY_CONFIG[difficulty]?.posterColor || DIFFICULTY_CONFIG.medium.posterColor
}

/**
 * 获取难度等级的文字标签
 */
export function getDifficultyLabel(difficulty: Difficulty, locale = 'zh-CN'): string {
  const config = DIFFICULTY_CONFIG[difficulty]
  if (!config) return locale === 'zh-CN' ? '未知' : 'Unknown'
  return locale === 'zh-CN' ? config.labelZh : config.labelEn
}
