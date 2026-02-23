import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.SUPABASE_URL || 'https://euucwcmtzlpoywszphsd.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_ZLyfaEVO4pLHKpw2vDsUWg_fNGIIP9E'

const supabase = createClient(supabaseUrl, supabaseKey)

// 9个饮品的中文名称
const drinkNames = [
  '国宴豆浆',
  '韩式南瓜羹',
  '黑芝麻糊',
  '五红汤',
  '绿豆沙牛乳',
  '杏仁露',
  '花生酪',
  '香浓玉米汁',
  '紫薯燕麦奶'
]

async function searchRecipes() {
  console.log('🔍 搜索数据库中的饮品食谱...\n')
  
  const foundRecipes = []
  
  for (const name of drinkNames) {
    // 搜索中文标题
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, title, translations')
      .ilike('title', `%${name}%`)
      .limit(1)
    
    if (error) {
      console.error(`❌ 搜索 "${name}" 时出错:`, error.message)
      continue
    }
    
    if (recipes && recipes.length > 0) {
      const recipe = recipes[0]
      foundRecipes.push({
        id: recipe.id,
        name: name,
        title: recipe.title
      })
      console.log(`✅ 找到 "${name}" - ID: ${recipe.id}, 标题: ${recipe.title}`)
    } else {
      console.log(`⚠️ 未找到 "${name}"`)
    }
  }
  
  console.log(`\n📊 搜索结果: 找到 ${foundRecipes.length}/${drinkNames.length} 个饮品\n`)
  return foundRecipes
}

// 主函数
async function main() {
  console.log('🥤 饮品图片关联工具\n')
  console.log('===================\n')
  
  const recipes = await searchRecipes()
  
  if (recipes.length === 0) {
    console.log('❌ 没有找到任何饮品食谱')
    console.log('\n提示: 请先在数据库中创建这9个饮品食谱，然后再运行此脚本。')
    process.exit(1)
  }
  
  console.log('下一步:')
  console.log('1. 准备9个饮品的截图文件（例如: guoyan-doujiang.png）')
  console.log('2. 将这些文件放在 /root/code/recipe-app/scripts/images/ 目录下')
  console.log('3. 运行上传脚本将图片上传到 Supabase Storage 并关联到食谱')
  console.log('\n或者，如果你已经有截图文件，告诉我路径，我可以帮你处理。')
}

main().catch(console.error)
