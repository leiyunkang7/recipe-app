---
name: recipe-creator
description: |
  交互式食谱创建工具。当用户想要：
  - 添加新食谱、新增菜谱、创建食谱、录入食谱、添加菜谱
  - 上传食谱截图、从截图识别食谱、截图识别
  - 使用 /add-recipe 命令
  
  触发此技能，通过对话方式收集信息并创建食谱。支持多张截图上传，自动识别提取食谱信息。
license: MIT
---

# Recipe Creator

交互式食谱创建工具。通过对话方式引导用户上传截图，自动识别提取食谱信息并创建到数据库。

## 工作流程

### 1. 接收请求
识别用户意图，支持以下触发方式：
- 自然语言：添加食谱、新增菜谱、创建食谱、录入食谱、从截图识别等
- 斜杠命令：`/add-recipe`

### 2. 请求截图
引导用户上传食谱截图：
```
好的！请上传食谱截图，我会帮你识别提取信息。
支持上传多张截图（如：封面+食材+步骤）。
```

### 3. 分析截图
使用视觉能力分析截图：

**识别App来源**（参考 app_patterns.md）：
- 下厨房：绿色主题，用料/步骤分区
- 小红书：图片为主，文字在下方
- 美食杰：详细步骤图
- 豆果美食：橙色主题
- 其他通用食谱App

**提取信息**：
| 字段 | 说明 | 必需 |
|------|------|------|
| title | 食谱标题 | ✓ |
| description | 简介/描述 | |
| category | 分类（家常菜、快手菜等） | ✓ |
| cuisine | 菜系（中式、西式等） | |
| servings | 份量（几人份） | ✓ |
| prepTimeMinutes | 准备时间（分钟） | ✓ |
| cookTimeMinutes | 烹饪时间（分钟） | ✓ |
| difficulty | 难度（easy/medium/hard） | ✓ |
| ingredients | 食材列表 | ✓ |
| steps | 步骤列表 | ✓ |
| tags | 标签 | |
| nutritionInfo | 营养信息 | |
| imageUrl | 封面图URL | |

**自动检测语言**：
- 识别截图中的主要语言
- 设置正确的 locale（en 或 zh-CN）
- 自动填充 translations 字段

**智能推断分类和菜系**：
- 根据菜品特征推断 category
- 根据烹饪风格推断 cuisine

### 4. 展示结果
格式化显示提取的食谱信息：

```
我已识别并提取以下信息：

📖 **番茄炒蛋**
分类: 家常菜 | 菜系: 中式 | 难度: 简单
⏱️ 准备10分钟 | 烹饪15分钟 | 2人份

🥗 食材:
• 番茄 2个
• 鸡蛋 3个
• 葱花 适量

📝 步骤:
1. 番茄切块，鸡蛋打散备用
2. 热锅冷油，倒入蛋液炒至凝固盛出
3. 锅中放油，下番茄翻炒出汁
4. 倒入炒蛋翻炒均匀，加盐调味

🏷️ 标签: 快手菜、下饭菜

确认创建？或需要修改哪些内容？
```

### 5. 确认/修正
- 用户确认：`确认`、`没问题`、`创建吧`
- 用户修改：`把份量改成3人份`、`加个标签"素食"`
- 修改后再次确认

### 6. 创建食谱
确认后，调用 `scripts/create_recipe.ts` 创建食谱到 Supabase。

### 7. 保存截图
将原始截图上传到 Supabase Storage，关联到食谱。

### 8. 返回结果
```
✅ 食谱创建成功！
查看地址: /recipes/{recipe-id}
截图已保存到图库。
```

## 数据格式

参考 `references/recipe_schema.md` 了解完整的数据模型。

### CreateRecipeDTO 结构

```typescript
{
  title: string                    // 食谱标题
  description?: string             // 描述
  category: string                 // 分类（必需）
  cuisine?: string                 // 菜系
  servings: number                 // 份量
  prepTimeMinutes: number          // 准备时间
  cookTimeMinutes: number          // 烹饪时间
  difficulty: 'easy' | 'medium' | 'hard'  // 难度
  ingredients: Array<{             // 食材列表
    name: string
    amount: number
    unit: string
    translations?: Array<{locale: string, name: string}>
  }>
  steps: Array<{                   // 步骤列表
    stepNumber: number
    instruction: string
    durationMinutes?: number
    translations?: Array<{locale: string, instruction: string}>
  }>
  tags?: string[]                  // 标签
  nutritionInfo?: {                // 营养信息
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
    fiber?: number
  }
  imageUrl?: string                // 封面图URL
  source?: string                  // 来源
  translations?: Array<{           // 多语言翻译
    locale: 'en' | 'zh-CN'
    title: string
    description?: string
  }>
}
```

## 常见App识别指南

参考 `references/app_patterns.md` 了解常见食谱App的截图特征和识别策略。

## 脚本使用

### create_recipe.ts
创建食谱到数据库：

```bash
bun run skills/recipe-creator/scripts/create_recipe.ts '{
  "title": "番茄炒蛋",
  "category": "家常菜",
  "servings": 2,
  ...
}'
```

### upload_image.ts
上传截图到 Storage：

```bash
bun run skills/recipe-creator/scripts/upload_image.ts /path/to/image.png
```

## 示例对话

### 示例1：单张截图

```
用户: 帮我添加一个新食谱

AI: 好的！请上传食谱截图，我会帮你识别提取信息。

用户: [上传截图]

AI: 我已识别并提取以下信息：
    [显示提取结果]
    确认创建？

用户: 确认

AI: ✅ 食谱创建成功！
    查看地址: /recipes/abc-123
```

### 示例2：多张截图

```
用户: /add-recipe

AI: 好的！请上传食谱截图，支持多张。

用户: [上传3张截图：封面、食材、步骤]

AI: 我已从3张截图中识别并提取以下信息：
    [显示合并后的提取结果]
    确认创建？

用户: 把难度改成中等

AI: ✅ 已修改难度为"中等"。确认创建？

用户: 确认

AI: ✅ 食谱创建成功！
```

### 示例3：修正识别结果

```
用户: 从这张截图帮我录入食谱
用户: [上传截图]

AI: 我已识别并提取以下信息：
    📖 **红烧肉**
    ...
    
用户: 食材漏了一个八角

AI: 好的，我已添加：
    🥗 食材:
    • 五花肉 500g
    • 八角 2个    ← 新增
    • 生抽 2勺
    ...
    
    确认创建？

用户: 确认

AI: ✅ 食谱创建成功！
```

## 错误处理

| 错误 | 处理方式 |
|------|----------|
| 无法识别截图 | 提示用户提供更清晰的截图或手动输入 |
| 缺少必需字段 | 提示用户补充缺失信息 |
| 创建失败 | 显示错误原因，提供重试选项 |
| 图片上传失败 | 仍创建食谱，提示稍后可添加图片 |

## 注意事项

1. **必需字段**：title、category、servings、prepTimeMinutes、cookTimeMinutes、difficulty、ingredients（至少1个）、steps（至少1个）
2. **语言检测**：优先使用截图中的原始语言，同时生成对应 locale 的翻译
3. **分类映射**：如果推断的分类不在数据库中，询问用户是否使用现有分类或创建新的
4. **图片存储**：截图保存到 `recipe-screenshots` bucket，关联到食谱的 `source_images` 字段
