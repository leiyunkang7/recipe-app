# Recipe 数据模型

本文档描述食谱创建所需的数据结构和验证规则。

## 核心类型

### Locale
支持的语言：
- `en` - English
- `zh-CN` - 简体中文

### Difficulty
难度级别：
- `easy` - 简单
- `medium` - 中等
- `hard` - 困难

## CreateRecipeDTO

创建食谱的完整数据结构：

```typescript
interface CreateRecipeDTO {
  title: string                    // 食谱标题（必需）
  description?: string             // 简介描述
  category: string                 // 分类（必需）
  cuisine?: string                 // 菜系
  servings: number                 // 份量，几人份（必需，正整数）
  prepTimeMinutes: number          // 准备时间，分钟（必需，非负整数）
  cookTimeMinutes: number          // 烹饪时间，分钟（必需，非负整数）
  difficulty: 'easy' | 'medium' | 'hard'  // 难度（必需）
  ingredients: Ingredient[]        // 食材列表（必需，至少1个）
  steps: RecipeStep[]              // 步骤列表（必需，至少1个）
  tags?: string[]                  // 标签
  nutritionInfo?: NutritionInfo    // 营养信息
  imageUrl?: string                // 封面图URL
  source?: string                  // 来源
  translations?: Translation[]     // 多语言翻译
}
```

### Ingredient

```typescript
interface Ingredient {
  id?: string                      // UUID（创建时自动生成）
  name: string                     // 食材名称（必需）
  amount: number                   // 数量（必需，正数）
  unit: string                     // 单位（必需，如：克、个、勺、适量）
  translations?: IngredientTranslation[]  // 多语言翻译
}

interface IngredientTranslation {
  locale: 'en' | 'zh-CN'
  name: string                     // 该语言的食材名称
}
```

### RecipeStep

```typescript
interface RecipeStep {
  id?: string                      // UUID（创建时自动生成）
  stepNumber: number               // 步骤序号（必需，正整数）
  instruction: string              // 步骤说明（必需）
  durationMinutes?: number         // 该步骤耗时（分钟）
  translations?: StepTranslation[] // 多语言翻译
}

interface StepTranslation {
  locale: 'en' | 'zh-CN'
  instruction: string              // 该语言的步骤说明
}
```

### Translation

```typescript
interface Translation {
  locale: 'en' | 'zh-CN'
  title: string                    // 该语言的标题
  description?: string             // 该语言的描述
}
```

### NutritionInfo

```typescript
interface NutritionInfo {
  calories?: number                // 卡路里
  protein?: number                 // 蛋白质（克）
  carbs?: number                   // 碳水化合物（克）
  fat?: number                     // 脂肪（克）
  fiber?: number                   // 纤维（克）
}
```

## 常用分类 (category)

| 中文名 | 英文名 | 说明 |
|-------|--------|------|
| 家常菜 | home-style | 日常家庭烹饪 |
| 快手菜 | quick-easy | 简单快速 |
| 汤羹 | soup | 各类汤品 |
| 凉菜 | cold-dish | 凉拌菜 |
| 主食 | main-dish | 米面主食 |
| 烘焙 | baking | 面包蛋糕等 |
| 甜品 | dessert | 甜点 |
| 饮品 | beverage | 饮料 |

## 常用菜系 (cuisine)

| 中文名 | 英文名 |
|-------|--------|
| 中式 | Chinese |
| 川菜 | Sichuan |
| 粤菜 | Cantonese |
| 湘菜 | Hunan |
| 鲁菜 | Shandong |
| 西式 | Western |
| 日式 | Japanese |
| 韩式 | Korean |
| 东南亚 | Southeast-Asian |

## 常用标签 (tags)

- 快手菜、下饭菜、素食、低卡、减脂、增肌
- 早餐、午餐、晚餐、宵夜
- 儿童、老人、孕妇
- 节日、宴客、一人食

## 单位常用词 (unit)

### 重量
- 克、千克、斤、两、磅、盎司

### 体积
- 毫升、升、勺、茶匙、汤匙、杯

### 数量
- 个、只、条、块、片、根、把、颗、粒、瓣

### 其他
- 适量、少许、若干

## 数据库表结构

创建食谱时会在以下表中插入数据：

1. **recipes** - 主表，存储基本信息
2. **recipe_translations** - 标题和描述的翻译
3. **recipe_ingredients** - 食材列表
4. **ingredient_translations** - 食材名称翻译
5. **recipe_steps** - 步骤列表
6. **step_translations** - 步骤说明翻译
7. **recipe_tags** - 标签关联

## 验证规则

- `title`: 不能为空
- `category`: 不能为空
- `servings`: 必须是正整数
- `prepTimeMinutes`: 必须是非负整数
- `cookTimeMinutes`: 必须是非负整数
- `difficulty`: 只能是 easy/medium/hard 之一
- `ingredients`: 至少包含1个食材
- `steps`: 至少包含1个步骤
- `ingredients[].name`: 不能为空
- `ingredients[].amount`: 必须是正数
- `ingredients[].unit`: 不能为空
- `steps[].stepNumber`: 必须是正整数
- `steps[].instruction`: 不能为空
