# recipe-app AI 菜谱推荐功能设计方案

> 版本：v1.0 | 日期：2026-05-04 | 状态：Draft

---

## 一、推荐算法设计

### 1.1 现有系统分析

当前 `services/recommendation/src/service.ts` 已实现基础推荐：

| 类型 | 策略 | 数据来源 |
|------|------|---------|
| `similar` | 食材+标签+类别+菜系相似度评分 | `recipe_ingredients`, `recipe_tags`, `recipes` |
| `popular` | 收藏数+浏览量加权 | `favorites`, `views` |
| `seasonal` | 按季节标签过滤 | `recipe_tags` (spring/summer/autumn/winter) |
| `personalized` | 协同过滤（评分≥4的用户口味匹配） | `recipe_ratings` |

**当前痛点：**
- `personalized` 仅依赖显式评分（稀疏数据，新用户冷启动差）
- `similar` 为规则匹配，无法理解语义（如"辣味素食"）
- 无食材约束推荐（"用冰箱里的菜做一顿饭"）
- 无口味/健康偏好学习

---

### 1.2 增强推荐策略（混合架构）

```
推荐引擎 = LLM语义层 + 规则引擎层 + 协同过滤层
```

#### 四类推荐场景

**① 语义相似推荐（新增）**
- 基于 LLM 理解用户查询意图
- 示例：「想吃酸的」→ 识别酸味食材（醋、柠檬、酸菜）
- 示例：「减肥餐」→ 低卡、高蛋白、蔬食类标签

**② 食材约束推荐（新增）**
- 用户输入现有食材列表
- LLM 推理可用菜谱，或从数据库按食材覆盖率匹配
- 支持排除特定食材（过敏）

**③ 口味偏好推荐（增强）**
- 结合显式评分 + 隐式行为（浏览、收藏、跳过）
- 建立用户口味画像向量
- 冷启动时用问卷 + 热门数据填充

**④ 场景感知推荐（新增）**
- 时间（早餐/午餐/晚餐/宵夜）
- 季节 + 当日气温
- 节日/节气（春节、中秋、端午等）
- 用户历史活跃时段

---

### 1.3 推荐流程图

```
用户请求 → Intent Classification（是什么场景？）
    ├── 食材约束查询 → Ingredient Constraint Engine
    ├── 语义搜索查询 → LLM Semantic Parser → Vector Search
    ├── 个性化请求   → User Preference Profile → Collaborative Filter
    ├── 相似食谱请求 → Similar Recipe Engine（已有，可增强）
    └── 热门/季节   → Rule-based Engine（已有）
                        ↓
              Score Fusion（多策略加权融合）
                        ↓
              Diversity Boost（保证类目多样性）
                        ↓
              候选食谱 → Rank → Top N 返回
```

---

### 1.4 冷启动方案

| 用户状态 | 策略 |
|---------|------|
| 新用户（无评分/收藏） | 问卷引导（5题：口味偏好/过敏/烹饪能力）+ 热门 + 季节 |
| 新食谱（无评分） | 基于食材+标签相似度 + 早期曝光点击率 |
| 整体 | 全局热门兜底 |

---

## 二、LLM 集成方案

### 2.1 LLM 使用场景

| 场景 | 用途 | 调用方式 |
|------|------|---------|
| **意图分类** | 判断用户请求类型（食材约束/语义搜索/闲聊） | 轻量 Prompt → 快速返回 |
| **食谱改编** | 根据用户约束生成/改编食谱（"把这份宫保鸡丁改成素食版"） | 中等 Prompt → 返回结构化 JSON |
| **食谱生成** | 完全从头生成新食谱（"为4人设计一套春节家宴"） | 重 Prompt → 返回完整食谱结构 |
| **食材匹配解释** | 为每个推荐结果提供「为什么推荐」的自然语言理由 | 轻量 Prompt |
| **口味画像提取** | 从用户历史行为中提取口味偏好文字描述 | 中等 Prompt |

### 2.2 推荐食谱生成 vs. 改编

**食谱改编（推荐优先）：**
```
用户约束：素食版宫保鸡丁
↓ LLM 识别核心元素（花生风味、麻辣、勾芡）
↓ 从现有宫保鸡丁食谱结构改编
↓ 替换鸡胸肉 → 豆腐干/杏鲍菇
↓ 保持烹饪手法和调味比例
→ 输出结构化食谱 JSON
```

**食谱生成（补充场景）：**
- 当数据库中无匹配食谱时，作为兜底
- 适用于"节日特供"、"用户自定义场景"等无现有数据的情况
- 生成结果可选择「仅展示」或「保存到数据库」（需审核）

### 2.3 LLM Provider 集成

```typescript
// services/llm/llm-service.ts
interface LLMConfig {
  provider: 'openai' | 'claude' | 'deepseek' | 'local';
  model: string;
  apiKey: string; // 存储在 .credentials/ 中
  baseUrl?: string; // for local/自定义endpoint
}

// 推荐使用 Function Calling / Tool Use 模式
// 返回结构化 JSON，避免 JSON 解析失败
```

**Model 推荐：**
- 意图分类/解释生成 → GPT-4.1-mini 或 DeepSeek-Chat（低成本）
- 食谱生成/改编 → GPT-4o 或 Claude-3.5-Sonnet（有结构化输出）

### 2.4 Prompt 模板管理

```
services/prompts/
  ├── intent-classification.ts    # 用户意图分类
  ├── recipe-adaptation.ts       # 食谱改编
  ├── recipe-generation.ts       # 食谱生成
  ├── recommendation-reason.ts  # 推荐理由生成
  └── user-profile-extract.ts    # 口味画像提取
```

---

## 三、前端展示方案

### 3.1 推荐 Feed 布局

```
┌─────────────────────────────────────┐
│  🔥 为您推荐          [换一批] [⚙️] │
├─────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐    │
│ │  [图片]     │ │  [图片]     │    │
│ │  红烧肉     │ │  糖醋排骨   │    │
│ │  ⭐4.8 35min│ │  ⭐4.6 50min│    │
│ │  [辣][下饭] │ │  [甜][硬菜] │    │
│ └─────────────┘ └─────────────┘    │
│ ┌─────────────┐ ┌─────────────┐    │
│ │  [图片]     │ │  [图片]     │    │
│ │  ...        │ │  ...        │    │
│ └─────────────┘ └─────────────┘    │
└─────────────────────────────────────┘
```

### 3.2 推荐 Tab 架构

```
推荐页 /recommendations
├── 🔥 精选（个性化 + 热门融合）
├── ❄️ 今日主打（季节 + 时间感知）
├── 🔍 食材搜（输入食材 → 推荐可用食谱）
├── 👆 手气（随机探索，发现惊喜）
└── 📝 膳食计划（LLM 生成一周菜谱）
```

### 3.3 卡片设计（RecipeRecommendationCard）

```vue
<!-- components/RecipeRecommendationCard.vue -->
<template>
  <div class="recommendation-card">
    <div class="card-image">
      <img :src="recipe.imageUrl" :alt="recipe.title" />
      <span class="match-badge">{{ matchScore }}% 匹配</span>
    </div>
    <div class="card-content">
      <h3>{{ recipe.title }}</h3>
      <div class="meta">
        <span>⭐ {{ recipe.avgRating }}</span>
        <span>⏱ {{ totalTime }}min</span>
        <span>{{ recipe.difficulty }}</span>
      </div>
      <!-- 推荐理由（LLM生成） -->
      <p v-if="reason" class="reason">{{ reason }}</p>
      <!-- 匹配标签 -->
      <div class="tags">
        <span v-for="tag in matchTags" :key="tag">{{ tag }}</span>
      </div>
    </div>
  </div>
</template>
```

**卡片状态：**
- Default：正常展示
- Hover：轻微放大 + 显示快捷操作（收藏/开始烹饪）
- Loading：骨架屏
- Error：降级为无理由推荐

### 3.4 交互设计

| 操作 | 效果 |
|------|------|
| 点击卡片 | 跳转食谱详情 |
| 「换一批」 | 重新请求推荐（每次不同策略组合） |
| 长按/右键 | 不感兴趣 → 减少此类推荐 |
| 收藏 | 纳入口味训练正反馈 |
| 「不感兴趣」| 纳入负反馈 + 记录理由（可选） |
| 食材搜输入 | 实时 Autocomplete，支持「+食材」「-食材」语法 |

---

## 四、数据存储方案

### 4.1 用户偏好向量

**方案 A：Embedding 向量（精确）**

```sql
-- 用户口味向量（pgvector）
CREATE TABLE user_taste_vectors (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  taste_embedding vector(1536),  -- OpenAI embedding dim
  taste_keywords TEXT[],          -- LLM 提取的口味关键词
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_taste ON user_taste_vectors USING ivfflat(taste_embedding vector_cosine_ops);
```

**方案 B：口味标签 + JSON（实用）** ⭐ 推荐起步方案

```sql
-- 用户偏好画像（轻量级，无需向量数据库）
CREATE TABLE user_taste_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  
  -- 显式偏好（用户主动设置）
  explicit_preferences JSONB DEFAULT '{}',
  -- 示例: { "spicy": 3, "sweet": 2, "vegetarian": true, "dislikes": ["香菜", "胡萝卜"] }
  
  -- 隐式偏好（从行为学习）
  implicit_preferences JSONB DEFAULT '{}',
  -- 示例: { "cuisines": {"川菜": 5, "粤菜": 3}, "categories": {"早餐": 2} }
  
  -- LLM 提取的自然语言描述
  taste_description TEXT,
  
  -- 行为统计
  behavior_stats JSONB DEFAULT '{}',
  -- 示例: { "total_ratings": 23, "total_favorites": 45, "viewed_cuisines": [...] }
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**推荐起步用方案 B**，原因：
- 不需要额外的向量数据库（Supabase 无 pgvector 插件需额外配置）
- 标签系统已可覆盖 80% 场景
- 可渐进升级到方案 A

### 4.2 食谱 Embedding（中期扩展）

```sql
-- 食谱语义向量（未来扩展）
CREATE TABLE recipe_embeddings (
  recipe_id UUID PRIMARY KEY REFERENCES recipes(id),
  embedding vector(1536),
  embedding_model VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_recipe_emb ON recipe_embeddings USING ivfflat(embedding vector_cosine_ops);
```

**时机：** 当用户量 > 1000 且发现标签匹配召回率 < 70% 时启用。

### 4.3 推荐日志（效果追踪）

```sql
-- 推荐曝光/点击日志（只写，增量分析，不JOIN主库）
CREATE TABLE recommendation_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  request_id UUID,              -- 每次推荐请求的唯一ID
  recipe_id UUID,
  position INTEGER,             -- 第几位
  strategy TEXT,                -- 'personalized' | 'similar' | 'llm_semantic' | ...
  score REAL,                   -- 模型打分
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  clicked BOOLEAN,
  favorited BOOLEAN,
  cooked BOOLEAN                -- 用户做了这道菜
);

-- 分析用视图
CREATE MATERIALIZED VIEW mv_recommendation_stats AS
SELECT 
  strategy,
  DATE_TRUNC('day', shown_at) as day,
  COUNT(*) as impressions,
  COUNT(*) FILTER (WHERE clicked) as clicks,
  COUNT(*) FILTER (WHERE favorited) as favorites,
  COUNT(*) FILTER (WHERE cooked) as cooks,
  ROUND(COUNT(*) FILTER (WHERE clicked)::numeric / COUNT(*), 4) as ctr
FROM recommendation_logs
GROUP BY strategy, DATE_TRUNC('day', shown_at);
```

---

## 五、Supabase 集成

### 5.1 与现有架构集成

```
┌──────────────────────────────────────────────────────────┐
│                   recipe-app 架构                        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Nuxt 3 Frontend (web/)                                  │
│      │                                                     │
│      │ /api/recommendations ←──── 当前入口                │
│      ↓                                                     │
│  server/api/recommendations/index.ts                      │
│      │                                                     │
│      ├── services/recommendation/    ← 基础推荐（已有）    │
│      ├── services/llm/               ← LLM 调用层（新增） │
│      └── services/vector/             ← 向量搜索（未来）   │
│                                                           │
│  Supabase PostgreSQL                                      │
│  ├── recipes, recipe_ingredients, recipe_tags  ← 主数据    │
│  ├── recipe_ratings, favorites            ← 行为数据      │
│  ├── user_taste_profiles                 ← 偏好画像（新增）│
│  └── recommendation_logs                ← 效果日志（新增）│
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 5.2 新增 API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/recommendations` | GET | 获取推荐（已有，增强） |
| `/api/recommendations/feed` | POST | 批量推荐（多策略融合） |
| `/api/recommendations/feedback` | POST | 推荐反馈（点击/收藏/不感兴趣） |
| `/api/recommendations/ingredient-search` | POST | 食材约束搜索（新增） |
| `/api/ai/recipe/generate` | POST | LLM 生成食谱（新增） |
| `/api/ai/recipe/adapt` | POST | LLM 改编食谱（新增） |
| `/api/user/taste-profile` | GET/PUT | 用户口味画像 |

### 5.3 Edge Functions（可选）

当需要 LLM 实时推理但不想暴露 API Key 时：
- `supabase/functions/ai-recipe-generate/`
- `supabase/functions/ai-semantic-search/`

优点：API Key 不暴露给前端
缺点：Edge Function 冷启动 + 额度限制

---

## 六、实施步骤

### Phase 1：基础设施（1-2周）

**目标：** 建立数据基础 + 修复现有 personalized

- [ ] 新增 `user_taste_profiles` 表（方案 B 起步）
- [ ] 新增 `recommendation_logs` 表
- [ ] 增强 `services/recommendation/` 个性化算法：
  - 融合口味标签匹配
  - 加入「不感兴趣」负反馈
- [ ] 新增 `/api/recommendations/feedback` 端点
- [ ] 前端：推荐页「换一批」按钮
- [ ] 前端：推荐卡片「不感兴趣」反馈

### Phase 2：食材约束搜索（1周）

**目标：** 差异化核心功能

- [ ] 新增 `/api/recommendations/ingredient-search` 端点
- [ ] 实现食材覆盖率算法：
  ```sql
  -- 伪代码
  SELECT r.*, 
    COUNT(ri.id) FILTER (WHERE ri.name = ANY(:user_ingredients)) * 1.0 / NULLIF(ARRAY_LENGTH(ri_ingredients, 1), 0) as coverage
  FROM recipes r
  JOIN recipe_ingredients ri ON ri.recipe_id = r.id
  WHERE ri.name = ANY(:user_ingredients) OR ri.name = ANY(:user_exclude_ingredients)
  GROUP BY r.id
  HAVING COUNT(ri.id) FILTER (WHERE ri.name = ANY(:user_exclude_ingredients)) = 0
  ORDER BY coverage DESC, r.cooking_count DESC
  ```
- [ ] 前端：「食材搜」Tab + Autocomplete
- [ ] 前端：「+食材」「-食材」语法支持

### Phase 3：LLM 集成（2-3周）

**目标：** 语义理解 + 推荐理由

- [ ] 新增 `services/llm/llm-service.ts`（统一 LLM 调用）
- [ ] 实现意图分类（3-4 个 intent 分类）
- [ ] 实现推荐理由生成（每张卡片附带自然语言解释）
- [ ] 实现食谱改编（素食版/低卡版/无坚果版）
- [ ] 新增 `/api/ai/recipe/adapt` 端点
- [ ] 前端：食谱改编请求 UI（"做成素食版"按钮）

### Phase 4：用户画像 + 优化（1-2周）

**目标：** 精准个性化

- [ ] 问卷引导（5题口味问卷，新用户冷启动）
- [ ] 隐式偏好学习（浏览→点击→收藏→完成烹饪，行为权重递进）
- [ ] 推荐多样性策略（保证类别/Cuisine 分散）
- [ ] A/B 测试框架（推荐日志 → 效果分析）
- [ ] Phase 1-3 回归测试 + 性能优化

---

## 七、技术选型建议

### 当前环境评估

| 项目 | 当前状态 | 建议 |
|------|---------|------|
| 前端 | Nuxt 3 + Vue 3 + Tailwind + TypeScript | ✅ 保持 |
| 后端 | Nuxt Server Routes (H3) | ✅ 保持 |
| 数据库 | PostgreSQL (Supabase) | ✅ 保持 |
| ORM | Drizzle ORM | ✅ 保持 |
| LLM | 尚未集成 | 建议 OpenAI GPT-4o-mini（性价比） |
| 向量数据库 | 无 | Phase 4 再考虑 |
| 推荐日志 | 无 | Phase 1 同步建立 |

### LLM Provider 选择

| 场景 | 推荐模型 | 理由 |
|------|---------|------|
| 意图分类/推荐理由 | GPT-4.1-mini / DeepSeek-Chat | 低延迟、低成本 |
| 食谱改编/生成 | GPT-4o / Claude-3.5-Sonnet | 强结构化输出能力 |
| 备选（国内） | 硅基流动 / 阿里通义 | 无境外 API 需求时 |

### 关键注意事项

1. **API Key 安全**：LLM API Key 必须存储在 `.credentials/`，不提交到 Git
2. **LLM 成本控制**：所有 LLM 调用加 Rate Limit；推荐理由批量生成 → 单次请求
3. **推荐日志优先**：Phase 1 就建立日志表，数据驱动优化比拍脑袋更有效
4. **渐进式升级**：Phase 1 用方案 B（标签），Phase 4 再考虑向量搜索
5. **Supabase 限制**：确认当前 Supabase 实例是否有 `pgvector` 插件（无则用方案 B）

---

## 八、与现有 recommendation service 的关系

现有 `services/recommendation/src/service.ts` 中的 4 种策略保留作为**规则引擎层**，新增 LLM 层作为**语义增强层**：

```
请求
  ↓
Intent Gate（判断：规则足够还是需要 LLM？）
  ├── 简单热门请求 → 直接走 rule-based（已有逻辑）
  ├── 季节/时间请求 → 直接走 rule-based（已有逻辑）
  └── 语义理解/食材约束/个性化 → 触发 LLM 层
                                              ↓
                               LLM 结果 → 与规则引擎结果 Score Fusion
                                              ↓
                                            返回
```

**不需要重构现有代码**，新增：
- `services/llm/` 目录
- `services/recommendation/llm-strategy.ts`（LLM 增强策略）
- `services/recommendation/fusion.ts`（多策略融合）
- API 端点增强

---

*文档状态：设计方案，待评审后进入 Phase 1 实施*
