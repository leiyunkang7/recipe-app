#!/usr/bin/env bun
/**
 * 创建食谱到 Supabase
 * 
 * 用法:
 *   bun run scripts/create_recipe.ts '{"title":"番茄炒蛋",...}'
 *   bun run scripts/create_recipe.ts --file recipe.json
 * 
 * 环境变量:
 *   SUPABASE_URL - Supabase 项目 URL
 *   SUPABASE_ANON_KEY - Supabase 匿名密钥
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

interface Ingredient {
  name: string
  amount: number
  unit: string
  translations?: Array<{ locale: string; name: string }>
}

interface Step {
  stepNumber: number
  instruction: string
  durationMinutes?: number
  translations?: Array<{ locale: string; instruction: string }>
}

interface Translation {
  locale: 'en' | 'zh-CN'
  title: string
  description?: string
}

interface NutritionInfo {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
}

interface CreateRecipeDTO {
  title: string
  description?: string
  category: string
  cuisine?: string
  servings: number
  prepTimeMinutes: number
  cookTimeMinutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  ingredients: Ingredient[]
  steps: Step[]
  tags?: string[]
  nutritionInfo?: NutritionInfo
  imageUrl?: string
  source?: string
  translations?: Translation[]
  sourceImages?: string[]
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
// Use SERVICE_KEY for admin access (bypasses RLS), fallback to ANON_KEY for read-only
const supabaseKey = process.env.SUPABASE_SERVICE_KEY 
  || process.env.SUPABASE_ANON_KEY 
  || process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(JSON.stringify({
    success: false,
    error: {
      code: 'MISSING_ENV',
      message: '缺少 Supabase 配置。请设置 SUPABASE_URL 和 SUPABASE_SERVICE_KEY (或 SUPABASE_ANON_KEY) 环境变量'
    }
  }))
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

function parseArgs(): CreateRecipeDTO {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.error(JSON.stringify({
      success: false,
      error: {
        code: 'MISSING_ARGS',
        message: '请提供食谱数据。用法: create_recipe.ts <json> 或 --file <path>'
      }
    }))
    process.exit(1)
  }

  let jsonData: string
  
  if (args[0] === '--file' || args[0] === '-f') {
    if (!args[1]) {
      console.error(JSON.stringify({
        success: false,
        error: { code: 'MISSING_FILE', message: '请指定文件路径' }
      }))
      process.exit(1)
    }
    jsonData = fs.readFileSync(args[1], 'utf-8')
  } else {
    jsonData = args.join(' ')
  }

  try {
    return JSON.parse(jsonData)
  } catch (e) {
    console.error(JSON.stringify({
      success: false,
      error: { code: 'INVALID_JSON', message: 'JSON 解析失败', details: String(e) }
    }))
    process.exit(1)
  }
}

function validateRecipe(recipe: CreateRecipeDTO): string | null {
  if (!recipe.title) return '标题不能为空'
  if (!recipe.category) return '分类不能为空'
  if (!recipe.servings || recipe.servings < 1) return '份量必须是正整数'
  if (recipe.prepTimeMinutes === undefined || recipe.prepTimeMinutes < 0) return '准备时间不能为负'
  if (recipe.cookTimeMinutes === undefined || recipe.cookTimeMinutes < 0) return '烹饪时间不能为负'
  if (!['easy', 'medium', 'hard'].includes(recipe.difficulty)) return '难度必须是 easy/medium/hard'
  if (!recipe.ingredients || recipe.ingredients.length === 0) return '至少需要一个食材'
  if (!recipe.steps || recipe.steps.length === 0) return '至少需要一个步骤'
  
  for (const ing of recipe.ingredients) {
    if (!ing.name) return '食材名称不能为空'
    if (ing.amount === undefined || ing.amount <= 0) return `食材 "${ing.name}" 数量必须是正数`
    if (!ing.unit) return `食材 "${ing.name}" 单位不能为空`
  }
  
  for (const step of recipe.steps) {
    if (!step.stepNumber || step.stepNumber < 1) return '步骤序号必须是正整数'
    if (!step.instruction) return '步骤说明不能为空'
  }
  
  return null
}

async function createRecipe(recipe: CreateRecipeDTO) {
  const validationError = validateRecipe(recipe)
  if (validationError) {
    return {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: validationError }
    }
  }

  try {
    const { data: recipeData, error: recipeError } = await supabase
      .from('recipes')
      .insert({
        title: recipe.title,
        category: recipe.category,
        cuisine: recipe.cuisine || null,
        servings: recipe.servings,
        prep_time_minutes: recipe.prepTimeMinutes,
        cook_time_minutes: recipe.cookTimeMinutes,
        difficulty: recipe.difficulty,
        image_url: recipe.imageUrl || null,
        source: recipe.source || null,
        nutrition_info: recipe.nutritionInfo || null,
      })
      .select()
      .single()

    if (recipeError) throw recipeError

    const recipeId = recipeData.id

    if (recipe.translations && recipe.translations.length > 0) {
      const translations = recipe.translations.map(t => ({
        recipe_id: recipeId,
        locale: t.locale,
        title: t.title,
        description: t.description || null,
      }))

      const { error: transError } = await supabase
        .from('recipe_translations')
        .insert(translations)

      if (transError) throw transError
    } else {
      const locale = /[\u4e00-\u9fa5]/.test(recipe.title) ? 'zh-CN' : 'en'
      const { error: transError } = await supabase
        .from('recipe_translations')
        .insert({
          recipe_id: recipeId,
          locale,
          title: recipe.title,
          description: recipe.description || null,
        })

      if (transError) throw transError
    }

    for (const ing of recipe.ingredients) {
      const { data: ingredient, error: ingError } = await supabase
        .from('recipe_ingredients')
        .insert({
          recipe_id: recipeId,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        })
        .select()
        .single()

      if (ingError) throw ingError

      if (ing.translations && ing.translations.length > 0) {
        const ingTranslations = ing.translations.map(t => ({
          ingredient_id: ingredient.id,
          locale: t.locale,
          name: t.name,
        }))

        await supabase
          .from('ingredient_translations')
          .insert(ingTranslations)
      }
    }

    for (const step of recipe.steps) {
      const { data: stepData, error: stepError } = await supabase
        .from('recipe_steps')
        .insert({
          recipe_id: recipeId,
          step_number: step.stepNumber,
          instruction: step.instruction,
          duration_minutes: step.durationMinutes || null,
        })
        .select()
        .single()

      if (stepError) throw stepError

      if (step.translations && step.translations.length > 0) {
        const stepTranslations = step.translations.map(t => ({
          step_id: stepData.id,
          locale: t.locale,
          instruction: t.instruction,
        }))

        await supabase
          .from('step_translations')
          .insert(stepTranslations)
      }
    }

    if (recipe.tags && recipe.tags.length > 0) {
      const tags = recipe.tags.map(tag => ({
        recipe_id: recipeId,
        tag,
      }))

      const { error: tagsError } = await supabase
        .from('recipe_tags')
        .insert(tags)

      if (tagsError) throw tagsError
    }

    return {
      success: true,
      data: {
        id: recipeId,
        title: recipe.title,
        viewUrl: `/recipes/${recipeId}`,
      }
    }
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: err.message || '数据库操作失败',
        details: err,
      }
    }
  }
}

async function main() {
  const recipe = parseArgs()
  const result = await createRecipe(recipe)
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.success ? 0 : 1)
}

main()
