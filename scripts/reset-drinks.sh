#!/bin/bash
# 完整的饮品食谱重置脚本
# 1. 删除旧的9个饮品食谱
# 2. 上传图片到 Supabase Storage
# 3. 创建新的9个饮品食谱并关联图片

echo "🥤 饮品食谱重置工具"
echo "===================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查环境变量
if [ -z "$SUPABASE_URL" ]; then
    export SUPABASE_URL="https://euucwcmtzlpoywszphsd.supabase.co"
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    export SUPABASE_ANON_KEY="sb_publishable_ZLyfaEVO4pLHKpw2vDsUWg_fNGIIP9E"
fi

echo "📋 操作计划:"
echo "1. 删除旧的9个饮品食谱"
echo "2. 上传图片到 Supabase Storage"
echo "3. 创建新的9个饮品食谱"
echo ""

# 询问确认
read -p "确认执行以上操作? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ 操作已取消"
    exit 0
fi

echo ""
echo "🚀 开始执行..."
echo ""

# 第1步: 删除旧的9个饮品食谱
echo "📌 第1步: 删除旧的9个饮品食谱"
echo "----------------------------------------"

# 使用 Node.js 脚本执行数据库操作
cat > /tmp/delete-drinks.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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
];

async function deleteDrinks() {
  console.log('搜索并删除饮品食谱...\n');
  
  let deletedCount = 0;
  
  for (const name of drinkNames) {
    // 搜索食谱
    const { data: recipes, error: searchError } = await supabase
      .from('recipes')
      .select('id, title')
      .ilike('title', `%${name}%`);
    
    if (searchError) {
      console.log(`❌ 搜索 "${name}" 失败: ${searchError.message}`);
      continue;
    }
    
    if (recipes && recipes.length > 0) {
      for (const recipe of recipes) {
        // 删除食谱
        const { error: deleteError } = await supabase
          .from('recipes')
          .delete()
          .eq('id', recipe.id);
        
        if (deleteError) {
          console.log(`❌ 删除 "${recipe.title}" 失败: ${deleteError.message}`);
        } else {
          console.log(`✅ 已删除: "${recipe.title}" (ID: ${recipe.id})`);
          deletedCount++;
        }
      }
    } else {
      console.log(`⚠️ 未找到: "${name}"`);
    }
  }
  
  console.log(`\n📊 删除完成: 共删除 ${deletedCount} 个食谱`);
}

deleteDrinks().catch(console.error);
EOF

cd /root/code/recipe-app/web && node /tmp/delete-drinks.js

echo ""
echo "✅ 第1步完成"
echo ""

# 第2步: 上传图片到 Supabase Storage
echo "📌 第2步: 上传图片到 Supabase Storage"
echo "----------------------------------------"

echo "⚠️ 注意: 需要图片文件"
echo ""
echo "请提供图片文件的路径，例如:"
echo "  - /tmp/drinks.jpg (单张合集图)"
echo "  - /tmp/drinks/ (包含9张单独图片的目录)"
echo ""

# 检查是否有图片路径参数
if [ -z "$1" ]; then
    echo "❌ 未提供图片路径"
    echo ""
    echo "使用方法:"
    echo "  $0 /path/to/image.jpg"
    echo ""
    echo "或者设置环境变量:"
    echo "  export DRINKS_IMAGE_PATH=/path/to/image.jpg"
    echo "  $0"
    exit 1
fi

IMAGE_PATH="$1"

echo "📁 图片路径: $IMAGE_PATH"
echo ""

# 检查文件是否存在
if [ ! -f "$IMAGE_PATH" ]; then
    echo "❌ 文件不存在: $IMAGE_PATH"
    exit 1
fi

# 上传图片到 Supabase Storage
cat > /tmp/upload-image.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const imagePath = process.argv[2];

async function uploadImage() {
  console.log('上传图片到 Supabase Storage...\n');
  
  if (!imagePath || !fs.existsSync(imagePath)) {
    console.error('❌ 图片文件不存在:', imagePath);
    process.exit(1);
  }
  
  const fileName = path.basename(imagePath);
  const fileBuffer = fs.readFileSync(imagePath);
  
  console.log(`📁 文件名: ${fileName}`);
  console.log(`📊 文件大小: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
  console.log('');
  
  // 生成唯一文件名
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = path.extname(fileName) || '.jpg';
  const uniqueFileName = `drinks-collection-${timestamp}-${randomStr}${ext}`;
  
  console.log(`🚀 开始上传: ${uniqueFileName}`);
  
  // 上传到 Supabase Storage
  const { data, error } = await supabase.storage
    .from('recipe-images')
    .upload(uniqueFileName, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: false
    });
  
  if (error) {
    console.error('❌ 上传失败:', error.message);
    process.exit(1);
  }
  
  console.log('✅ 上传成功!');
  
  // 获取公共 URL
  const { data: { publicUrl } } = supabase.storage
    .from('recipe-images')
    .getPublicUrl(uniqueFileName);
  
  console.log('');
  console.log('🔗 图片 URL:');
  console.log(publicUrl);
  console.log('');
  
  // 保存 URL 到文件供后续使用
  const urlFile = '/tmp/drinks-image-url.txt';
  fs.writeFileSync(urlFile, publicUrl);
  console.log(`💾 URL 已保存到: ${urlFile}`);
}

uploadImage().catch(err => {
  console.error('❌ 错误:', err);
  process.exit(1);
});
EOF

cd /root/code/recipe-app/web && node /tmp/upload-image.js "$IMAGE_PATH"

echo ""
echo "✅ 第2步完成"
echo ""

# 第3步: 创建新的9个饮品食谱
echo "📌 第3步: 创建新的9个饮品食谱"
echo "----------------------------------------"

# 读取图片 URL
if [ -f /tmp/drinks-image-url.txt ]; then
    DRINKS_IMAGE_URL=$(cat /tmp/drinks-image-url.txt)
    echo "🔗 使用图片 URL: $DRINKS_IMAGE_URL"
    echo ""
else
    echo "⚠️ 未找到图片 URL，将创建不带图片的食谱"
    DRINKS_IMAGE_URL=""
fi

# 创建9个饮品食谱
cat > /tmp/create-drinks.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const drinksImageUrl = process.env.DRINKS_IMAGE_URL || '';

const drinks = [
  {
    name: '国宴豆浆',
    title: '国宴豆浆',
    description: '香浓丝滑的国宴级豆浆，营养丰富，口感细腻',
    category: 'beverage',
    cuisine: 'chinese',
    servings: 2,
    prepTime: 5,
    cookTime: 20,
    difficulty: 'easy',
    tags: ['豆浆', '早餐', '传统', '营养'],
    ingredients: [
      { name: '黄豆', amount: 50, unit: 'g' },
      { name: '水', amount: 800, unit: 'ml' },
      { name: '冰糖', amount: 20, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, instruction: '黄豆提前浸泡6-8小时或过夜', durationMinutes: 5 },
      { stepNumber: 2, instruction: '将泡好的黄豆和清水放入豆浆机', durationMinutes: 2 },
      { stepNumber: 3, instruction: '启动豆浆机，选择豆浆功能', durationMinutes: 20 },
      { stepNumber: 4, instruction: '过滤豆浆，加入冰糖调味即可', durationMinutes: 3 }
    ]
  },
  {
    name: '韩式南瓜羹',
    title: '韩式南瓜羹',
    description: '浓郁香甜的韩式南瓜羹，口感顺滑，温暖人心',
    category: 'beverage',
    cuisine: 'korean',
    servings: 2,
    prepTime: 10,
    cookTime: 25,
    difficulty: 'easy',
    tags: ['南瓜', '韩式', '甜品', '温暖'],
    ingredients: [
      { name: '南瓜', amount: 300, unit: 'g' },
      { name: '牛奶', amount: 200, unit: 'ml' },
      { name: '糯米粉', amount: 20, unit: 'g' },
      { name: '冰糖', amount: 15, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, instruction: '南瓜去皮切块，上锅蒸熟', durationMinutes: 15 },
      { stepNumber: 2, instruction: '将蒸熟的南瓜放入料理机', durationMinutes: 2 },
      { stepNumber: 3, instruction: '加入牛奶和糯米粉，打成细腻的南瓜泥', durationMinutes: 3 },
      { stepNumber: 4, instruction: '将南瓜泥倒入锅中，加入冰糖，小火煮至浓稠', durationMinutes: 10 },
      { stepNumber: 5, instruction: '盛出装盘，可撒上少许南瓜籽装饰', durationMinutes: 2 }
    ]
  }
  {
    name: '黑芝麻糊',
    title: '黑芝麻糊',
    description: '香浓顺滑的黑芝麻糊，滋补养生，暖胃暖心',
    category: 'beverage',
    cuisine: 'chinese',
    servings: 2,
    prepTime: 5,
    cookTime: 15,
    difficulty: 'easy',
    tags: ['黑芝麻', '甜品', '养生', '传统'],
    ingredients: [
      { name: '黑芝麻', amount: 50, unit: 'g' },
      { name: '糯米', amount: 30, unit: 'g' },
      { name: '水', amount: 500, unit: 'ml' },
      { name: '冰糖', amount: 20, unit: 'g' }
    ],
    steps: [
      { stepNumber: 1, instruction: '黑芝麻和糯米提前洗净浸泡2小时', durationMinutes: 5 },
      { stepNumber: 2, instruction: '将泡好的黑芝麻、糯米和水放入破壁机', durationMinutes: 2 },
      { stepNumber: 3, instruction: '打成细腻的黑芝麻糊', durationMinutes: 3 },
      { stepNumber: 4, instruction: '将黑芝麻糊倒入锅中，加入冰糖，小火加热至浓稠', durationMinutes: 10 },
      { stepNumber: 5, instruction: '盛出即可享用', durationMinutes: 1 }
    ]
  },
  {
    name: '五红汤',
    title: '五红汤',
    description: '传统养生五红汤，补血养颜，暖身暖胃',
    category: 'beverage',
    cuisine: 'chinese',
    servings: 2,
    prepTime: 10,
    cookTime: 40,
    difficulty: 'easy',
    tags: ['五红汤', '养生', '补血', '传统'],
    ingredients: [
      { name: '红豆', amount: 30, unit: 'g' },
      { name: '红枣', amount: 5, unit: '颗' },
      { name: '红皮花生', amount: 30, unit: 'g' },
      { name: '枸杞', amount: 10, unit: 'g' },
      { name: '红糖', amount: 20, unit: 'g' },
      { name: '水', amount: 800, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: '红豆和花生提前浸泡4小时或过夜', durationMinutes: 5 },
      { stepNumber: 2, instruction: '红枣去核洗净，枸杞洗净备用', durationMinutes: 3 },
      { stepNumber: 3, instruction: '将红豆、花生、红枣和水放入锅中', durationMinutes: 2 },
      { stepNumber: 4, instruction: '大火煮沸后转小火煮30分钟', durationMinutes: 30 },
      { stepNumber: 5, instruction: '加入枸杞和红糖，再煮5分钟即可', durationMinutes: 5 }
    ]
  },
  {
    name: '绿豆沙牛乳',
    title: '绿豆沙牛乳',
    description: '清凉解暑的绿豆沙牛乳，绵密顺滑，奶香浓郁',
    category: 'beverage',
    cuisine: 'chinese',
    servings: 2,
    prepTime: 5,
    cookTime: 30,
    difficulty: 'easy',
    tags: ['绿豆', '牛乳', '解暑', '夏日'],
    ingredients: [
      { name: '绿豆', amount: 100, unit: 'g' },
      { name: '牛奶', amount: 200, unit: 'ml' },
      { name: '冰糖', amount: 30, unit: 'g' },
      { name: '水', amount: 600, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: '绿豆提前浸泡2小时', durationMinutes: 5 },
      { stepNumber: 2, instruction: '将泡好的绿豆和水放入锅中', durationMinutes: 2 },
      { stepNumber: 3, instruction: '大火煮沸后转小火煮25分钟至绿豆开花', durationMinutes: 25 },
      { stepNumber: 4, instruction: '加入冰糖搅拌至融化', durationMinutes: 2 },
      { stepNumber: 5, instruction: '盛出后加入牛奶拌匀即可', durationMinutes: 1 }
    ]
  },
  {
    name: '杏仁露',
    title: '杏仁露',
    description: '香浓顺滑的杏仁露，润肺养颜，甜而不腻',
    category: 'beverage',
    cuisine: 'chinese',
    servings: 2,
    prepTime: 5,
    cookTime: 20,
    difficulty: 'easy',
    tags: ['杏仁', '甜品', '养颜', '传统'],
    ingredients: [
      { name: '杏仁粉', amount: 30, unit: 'g' },
      { name: '糯米', amount: 20, unit: 'g' },
      { name: '牛奶', amount: 250, unit: 'ml' },
      { name: '冰糖', amount: 20, unit: 'g' },
      { name: '水', amount: 200, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: '糯米提前浸泡2小时', durationMinutes: 5 },
      { stepNumber: 2, instruction: '将泡好的糯米、杏仁粉和水放入破壁机', durationMinutes: 2 },
      { stepNumber: 3, instruction: '打成细腻的杏仁浆', durationMinutes: 3 },
      { stepNumber: 4, instruction: '将杏仁浆倒入锅中，加入牛奶和冰糖', durationMinutes: 2 },
      { stepNumber: 5, instruction: '小火加热至冰糖融化，杏仁露变浓稠', durationMinutes: 10 },
      { stepNumber: 6, instruction: '盛出即可享用', durationMinutes: 1 }
    ]
  },
  {
    name: '花生酪',
    title: '花生酪',
    description: '香浓细腻的花生酪，入口即化，营养美味',
    category: 'beverage',
    cuisine: 'chinese',
    servings: 2,
    prepTime: 10,
    cookTime: 25,
    difficulty: 'easy',
    tags: ['花生', '甜品', '营养', '传统'],
    ingredients: [
      { name: '花生', amount: 100, unit: 'g' },
      { name: '糯米', amount: 30, unit: 'g' },
      { name: '牛奶', amount: 200, unit: 'ml' },
      { name: '冰糖', amount: 25, unit: 'g' },
      { name: '水', amount: 300, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: '花生提前浸泡4小时或过夜，去皮备用', durationMinutes: 10 },
      { stepNumber: 2, instruction: '糯米提前浸泡2小时', durationMinutes: 5 },
      { stepNumber: 3, instruction: '将泡好的花生、糯米和水放入破壁机', durationMinutes: 2 },
      { stepNumber: 4, instruction: '打成细腻的花生浆', durationMinutes: 3 },
      { stepNumber: 5, instruction: '将花生浆倒入锅中，加入牛奶和冰糖', durationMinutes: 2 },
      { stepNumber: 6, instruction: '小火加热至冰糖融化，花生酪变浓稠', durationMinutes: 10 },
      { stepNumber: 7, instruction: '盛出即可享用', durationMinutes: 1 }
    ]
  },
  {
    name: '香浓玉米汁',
    title: '香浓玉米汁',
    description: '香甜浓郁的玉米汁，营养丰富，老少皆宜',
    category: 'beverage',
    cuisine: 'chinese',
    servings: 2,
    prepTime: 5,
    cookTime: 20,
    difficulty: 'easy',
    tags: ['玉米', '饮品', '营养', '健康'],
    ingredients: [
      { name: '甜玉米', amount: 2, unit: '根' },
      { name: '牛奶', amount: 200, unit: 'ml' },
      { name: '冰糖', amount: 20, unit: 'g' },
      { name: '水', amount: 300, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: '玉米去皮洗净，用刀将玉米粒切下', durationMinutes: 5 },
      { stepNumber: 2, instruction: '将玉米粒和水放入锅中', durationMinutes: 2 },
      { stepNumber: 3, instruction: '大火煮沸后转小火煮15分钟至玉米熟透', durationMinutes: 15 },
      { stepNumber: 4, instruction: '将煮好的玉米和水一起倒入破壁机', durationMinutes: 2 },
      { stepNumber: 5, instruction: '加入牛奶和冰糖，打成细腻的玉米汁', durationMinutes: 3 },
      { stepNumber: 6, instruction: '过滤后倒入杯中即可享用', durationMinutes: 2 }
    ]
  },
  {
    name: '紫薯燕麦奶',
    title: '紫薯燕麦奶',
    description: '香甜绵密的紫薯燕麦奶，健康饱腹，适合早餐或下午茶',
    category: 'beverage',
    cuisine: 'chinese',
    servings: 2,
    prepTime: 5,
    cookTime: 20,
    difficulty: 'easy',
    tags: ['紫薯', '燕麦', '健康', '饱腹'],
    ingredients: [
      { name: '紫薯', amount: 150, unit: 'g' },
      { name: '燕麦', amount: 40, unit: 'g' },
      { name: '牛奶', amount: 300, unit: 'ml' },
      { name: '蜂蜜', amount: 15, unit: 'g' },
      { name: '水', amount: 200, unit: 'ml' }
    ],
    steps: [
      { stepNumber: 1, instruction: '紫薯去皮切块，燕麦洗净备用', durationMinutes: 5 },
      { stepNumber: 2, instruction: '将紫薯块、燕麦和水放入锅中', durationMinutes: 2 },
      { stepNumber: 3, instruction: '大火煮沸后转小火煮15分钟至紫薯软烂', durationMinutes: 15 },
      { stepNumber: 4, instruction: '将煮好的紫薯燕麦倒入破壁机', durationMinutes: 2 },
      { stepNumber: 5, instruction: '加入牛奶和蜂蜜，打成细腻的奶昔', durationMinutes: 3 },
      { stepNumber: 6, instruction: '倒入杯中即可享用', durationMinutes: 1 }
    ]
  }
];

async function createDrinks() {
  console.log('🥤 创建饮品食谱...\n');
  
  let createdCount = 0;
  
  for (const drink of drinks) {
    try {
      console.log(`➕ 创建: ${drink.title}`);
      
      // 准备食谱数据
      const recipeData = {
        category: drink.category,
        cuisine: drink.cuisine,
        servings: drink.servings,
        prep_time_minutes: drink.prepTime,
        cook_time_minutes: drink.cookTime,
        difficulty: drink.difficulty,
        image_url: drinksImageUrl,
        source: 'recipe-app',
        nutrition_info: null
      };
      
      // 插入食谱
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert(recipeData)
        .select()
        .single();
      
      if (recipeError) {
        throw new Error(`创建食谱失败: ${recipeError.message}`);
      }
      
      // 插入翻译
      const { error: transError } = await supabase
        .from('recipe_translations')
        .insert({
          recipe_id: recipe.id,
          locale: 'zh-CN',
          title: drink.title,
          description: drink.description
        });
      
      if (transError) {
        console.warn(`  ⚠️ 添加翻译失败: ${transError.message}`);
      }
      
      // 插入标签
      for (const tag of drink.tags) {
        const { error: tagError } = await supabase
          .from('recipe_tags')
          .insert({
            recipe_id: recipe.id,
            tag: tag
          });
        
        if (tagError) {
          console.warn(`  ⚠️ 添加标签 "${tag}" 失败: ${tagError.message}`);
        }
      }
      
      // 插入食材
      for (let i = 0; i < drink.ingredients.length; i++) {
        const ing = drink.ingredients[i];
        const { error: ingError } = await supabase
          .from('recipe_ingredients')
          .insert({
            recipe_id: recipe.id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            display_order: i + 1
          });
        
        if (ingError) {
          console.warn(`  ⚠️ 添加食材 "${ing.name}" 失败: ${ingError.message}`);
        }
      }
      
      // 插入步骤
      for (const step of drink.steps) {
        const { error: stepError } = await supabase
          .from('recipe_steps')
          .insert({
            recipe_id: recipe.id,
            step_number: step.stepNumber,
            instruction: step.instruction,
            duration_minutes: step.durationMinutes || null
          });
        
        if (stepError) {
          console.warn(`  ⚠️ 添加步骤 ${step.stepNumber} 失败: ${stepError.message}`);
        }
      }
      
      console.log(`✅ 创建成功: ${drink.title} (ID: ${recipe.id})`);
      createdCount++;
      
    } catch (err) {
      console.error(`❌ 创建 "${drink.title}" 失败:`, err.message);
    }
  }
  
  console.log(`\n📊 创建完成: 成功创建 ${createdCount}/${drinks.length} 个饮品食谱`);
  
  if (createdCount > 0 && drinksImageUrl) {
    console.log(`\n🔗 图片 URL: ${drinksImageUrl}`);
    console.log('所有新创建的食谱都已关联此图片。');
  }
}

createDrinks().catch(console.error);
EOF

# 运行创建脚本
cd /root/code/recipe-app/web && node /tmp/create-drinks.js

echo ""
echo "✅ 第3步完成"
echo ""

echo "🎉 所有步骤完成！"
echo "=================="
echo ""
echo "总结:"
echo "  - 已删除旧的饮品食谱"
echo "  - 已上传图片到 Supabase Storage"
echo "  - 已创建新的9个饮品食谱并关联图片"
echo ""
echo "你可以通过以下方式查看结果:"
echo "  1. 打开浏览器访问 http://localhost:3000"
echo "  2. 查看食谱列表，应该能看到新创建的饮品"
echo ""
