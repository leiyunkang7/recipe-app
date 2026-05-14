# 智能标签推荐系统设计

## 1. 概述

智能标签推荐系统旨在根据菜谱的内容（标题、描述、食材、分类、菜系等）自动推荐相关标签，提升用户打标签的体验和标签覆盖率。

### 核心目标

| 目标 | 描述 | 优先级 |
|------|------|--------|
| 提升标签覆盖率 | 新增菜谱时自动建议标签 | P0 |
| 降低用户输入成本 | 一键添加推荐标签 | P0 |
| 保持标签一致性 | 避免同义标签（如"鸡"和"鸡肉"） | P1 |
| 发现潜在标签 | 基于食材/烹饪方式的隐含标签 | P1 |

## 2. 推荐策略

### 2.1 基于食材的标签推荐

食材是标签推荐的最强信号。系统维护一个 **食材-标签映射表**：

```
牛肉 → [red-meat, protein, iron-rich]
鸡肉 → [white-meat, protein, lean]
米饭 → [staple, carbohydrate, gluten-free]
番茄 → [vegetable, vitamin-c, antioxidant]
```

**权重规则**:
- 主料（按用量排序前3）: ×2.0
- 辅料: ×1.0
- 调料: ×0.5（弱信号）

### 2.2 基于分类/菜系的标签推荐

```
category: "main-dish" → [easy, everyday, family-friendly]
cuisine: "sichuan" → [spicy, bold-flavor, chili]
cuisine: "japanese" → [umami, delicate, seafood]
```

### 2.3 基于标题/描述的 NLP 推荐

使用关键词提取识别隐含标签：

| 菜谱标题 | 提取关键词 | 推荐标签 |
|---------|-----------|---------|
| "番茄炒蛋" | 番茄, 炒, 蛋 | [quick, beginner-friendly, 10-min] |
| "红烧肉" | 红烧, 肉, 慢炖 | [slow-cooked, comfort-food, hearty] |
| "清蒸鲈鱼" | 清蒸, 鱼 | [steamed, healthy, low-fat] |

### 2.4 基于相似菜谱的标签推荐

找到内容相似（食材重叠率高）的菜谱，复制其标签作为候选。

```
相似度 > 0.6: 采用全部相似菜谱的标签
相似度 0.3-0.6: 采用高频标签（出现 > 50%）
```

## 3. 数据模型

### 3.1 标签知识库表

```sql
CREATE TABLE tag_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50),
  synonyms TEXT[],
  keywords TEXT[],
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tag_knowledge_category ON tag_knowledge(category);
CREATE INDEX idx_tag_knowledge_keywords ON tag_knowledge USING GIN(keywords);
```

### 3.2 食材-标签映射表

```sql
CREATE TABLE ingredient_tag_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_name VARCHAR(255) NOT NULL,
  tag VARCHAR(100) NOT NULL REFERENCES tag_knowledge(tag),
  weight FLOAT DEFAULT 1.0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_ingredient_tag ON ingredient_tag_mapping(ingredient_name, tag);
CREATE INDEX idx_ingredient_tag_weight ON ingredient_tag_mapping(ingredient_name, weight DESC);
```

### 3.3 菜系-标签映射表

```sql
CREATE TABLE cuisine_tag_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuisine VARCHAR(100) NOT NULL,
  tag VARCHAR(100) NOT NULL REFERENCES tag_knowledge(tag),
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_cuisine_tag ON cuisine_tag_mapping(cuisine, tag);
```

## 4. 推荐算法

### TagRecommendationService

```typescript
interface TagRecommendationRequest {
  title?: string;
  description?: string;
  category?: string;
  cuisine?: string;
  ingredients?: Array<{ name: string; amount: number; unit: string }>;
  existingTags?: string[];
  limit?: number;
}

interface TagRecommendationResponse {
  tags: Array<{
    tag: string;
    score: number;
    source: 'ingredient' | 'cuisine' | 'title' | 'similar';
    reason?: string;
  }>;
}
```

### 推荐流程

```
1. 初始化候选标签集
2. 食材匹配 → 添加标签 + 权重
3. 菜系匹配 → 添加标签 + 权重
4. 标题NLP提取 → 添加标签 + 权重
5. 相似菜谱 → 添加标签 + 权重
6. 去重 + 排序
7. 过滤已存在标签
8. 返回 Top N
```

### 权重计算公式

```
final_score = Σ(source_weight × match_quality × tag_weight)

source_weight:
  - ingredient (主料): 3.0
  - ingredient (辅料): 1.5
  - ingredient (调料): 0.5
  - cuisine: 2.0
  - title_nlp: 1.0
  - similar_recipe: 1.5

match_quality:
  - 完全匹配: 1.0
  - 部分匹配: 0.6

tag_weight: 来自知识库，默认 1.0
```

## 5. API 设计

### POST /api/tags/recommend

**Request:**
```json
{
  "title": "红烧肉",
  "category": "main-dish",
  "cuisine": "chinese",
  "ingredients": [
    { "name": "五花肉", "amount": 500, "unit": "g" },
    { "name": "生抽", "amount": 30, "unit": "ml" }
  ],
  "existingTags": ["chinese"],
  "limit": 8
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tags": [
      { "tag": "slow-cooked", "score": 4.5, "source": "ingredient", "reason": "五花肉 (主料)" },
      { "tag": "comfort-food", "score": 3.2, "source": "cuisine", "reason": "中餐经典" },
      { "tag": "hearty", "score": 2.8, "source": "title", "reason": "红烧" },
      { "tag": "beginner-friendly", "score": 2.1, "source": "similar", "reason": "85% 相似菜谱使用" }
    ]
  }
}
```

## 6. 前端集成

### useTagRecommendations composable

```typescript
// web/app/composables/useTagRecommendations.ts
export function useTagRecommendations() {
  const recommendedTags = ref<TagRecommendation[]>([]);
  const isLoading = ref(false);

  async function fetchRecommendations(params: TagRecommendationRequest) {
    isLoading.value = true;
    try {
      const response = await $fetch('/api/tags/recommend', { method: 'POST', body: params });
      recommendedTags.value = response.data.tags;
    } finally {
      isLoading.value = false;
    }
  }

  return { recommendedTags, isLoading, fetchRecommendations };
}
```

### TagInput 组件

```vue
<template>
  <div class="tag-input">
    <div class="selected-tags">
      <TagChip v-for="tag in selectedTags" :key="tag" removable @remove="removeTag">
        {{ tag }}
      </TagChip>
    </div>

    <div v-if="showRecommendations" class="recommendations">
      <div class="recommendation-header">
        <span>推荐标签</span>
        <button @click="showRecommendations = false">收起</button>
      </div>
      <div class="tag-list">
        <TagChip
          v-for="rec in recommendations"
          :key="rec.tag"
          clickable
          :class="{ active: selectedTags.includes(rec.tag) }"
          @click="toggleTag(rec.tag)"
        >
          {{ rec.tag }}
          <span class="score">{{ rec.score.toFixed(1) }}</span>
        </TagChip>
      </div>
    </div>

    <button v-else @click="showRecommendations = true">
      查看推荐标签
    </button>
  </div>
</template>
```

## 7. 实现计划

### Phase 1: 基础标签推荐 (P0)

1. 创建 `tag_knowledge` 知识库表
2. 创建 `ingredient_tag_mapping` 映射表
3. 实现 `TagRecommendationService.getIngredientBasedTags()`
4. 实现 API 端点 `/api/tags/recommend`

### Phase 2: 增强推荐 (P1)

1. 创建 `cuisine_tag_mapping` 映射表
2. 添加标题 NLP 关键词提取
3. 添加相似菜谱标签推荐
4. 前端 TagInput 组件

### Phase 3: 智能化 (P2)

1. 用户标签反馈收集（点击/忽略行为）
2. 基于反馈调整标签权重
3. A/B 测试不同推荐策略

## 8. 种子数据

### 初始标签知识库

```sql
-- 难度/场景标签
INSERT INTO tag_knowledge (tag, category, keywords, weight) VALUES
('quick', 'difficulty', ARRAY['快', '简易', '10分钟'], 1.0),
('beginner-friendly', 'difficulty', ARRAY['简单', '新手', '入门'], 1.0),
('healthy', 'dietary', ARRAY['健康', '营养', '低脂'], 1.0),
('vegetarian', 'dietary', ARRAY['素', '素食'], 1.5),
('spicy', 'flavor', ARRAY['辣', '麻辣', '香辣'], 1.0),
('comfort-food', 'occasion', ARRAY['暖', '滋补', '家常'], 1.0);

-- 烹饪方式标签
INSERT INTO tag_knowledge (tag, category, keywords, weight) VALUES
('steamed', 'cooking-method', ARRAY['蒸', '清蒸'], 1.5),
('stir-fried', 'cooking-method', ARRAY['炒', '快炒'], 1.5),
('slow-cooked', 'cooking-method', ARRAY['炖', '红烧', '焖'], 1.5),
('grilled', 'cooking-method', ARRAY['烤', '烧烤'], 1.5),
('fried', 'cooking-method', ARRAY['炸', '煎'], 1.5);
```

### 食材-标签映射示例

```sql
INSERT INTO ingredient_tag_mapping (ingredient_name, tag, weight, is_primary) VALUES
('牛肉', 'red-meat', 2.0, true),
('牛肉', 'protein', 1.0, false),
('鸡肉', 'white-meat', 2.0, true),
('鸡肉', 'protein', 1.0, false),
('三文鱼', 'seafood', 2.0, true),
('三文鱼', 'omega-3', 1.5, false),
('米饭', 'staple', 2.0, true),
('米饭', 'carbohydrate', 1.0, false);
```

## 9. 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| NLP 关键词提取 | 内置规则 + 正则 | 避免外部依赖，菜品领域词汇有限 |
| 相似度计算 | PostgreSQL 数组交集 | 已有 recipe_ingredients 数组支持 |
| 缓存 | Redis (TTL: 1小时) | 热门标签推荐可缓存 |
| 知识库更新 | 管理员界面 | 支持动态调整标签和映射 |

## 10. 评估指标

| 指标 | 计算方式 | 目标 |
|------|---------|------|
| 标签覆盖率 | 有标签菜谱 / 总菜谱 | > 90% |
| 推荐采纳率 | 用户采纳推荐数 / 推荐总数 | > 40% |
| 推荐准确率 | 采纳标签满意度 / 采纳总数 | > 80% |
| 平均推荐响应时间 | API p99 延迟 | < 100ms |
