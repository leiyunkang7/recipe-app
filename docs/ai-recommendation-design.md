# AI 菜谱推荐功能设计

## 1. 概述

为 recipe-app 添加智能菜谱推荐功能，基于用户偏好、行为数据和内容相似度提供个性化推荐。

### 推荐策略

| 策略 | 描述 | 数据依赖 |
|------|------|---------|
| 协同过滤 | 喜欢这个菜谱的人也喜欢 | 用户评分/收藏 |
| 内容相似 | 基于食材/分类/标签相似 | 菜谱属性 |
| 热门推荐 | 高评分+高烹饪次数 | 评分/烹饪统计 |
| 时令推荐 | 基于季节的推荐 | 当前日期+菜谱属性 |
| 个性化首页 | 用户偏好+热门混合 | 全部数据 |

## 2. 类型定义

### RecommendationRequest
- type: personalized | similar | popular | seasonal
- recipeId: similar 类型必填
- limit: 默认 10
- excludeRecipeIds: 排除的菜谱
- userId: 个性化推荐用
- filters: 可选过滤条件

### RecommendationResponse
- recipes: RecipeListItem[]
- strategy: string
- reason: 推荐理由

## 3. 推荐服务

### RecommendationService (services/recommendation/src/service.ts)

**getSimilarRecipes** - 基于内容相似度
- 食材重叠 * 2
- 标签重叠 * 1.5
- 同分类 +3
- 同菜系 +2

**getCollaborativeRecommendations** - 协同过滤
- 找相似评分模式的用户群
- 推荐该群体喜欢但当前用户未评分的

**getPopularRecipes** - 热门推荐
- popularity_score = cooking_count + views * 0.1
- 结合平均评分排序

**getSeasonalRecipes** - 时令推荐
- 根据月份确定季节标签
- 匹配季节标签排序

## 4. API 端点

### GET /api/recommendations
- type: personalized | popular | similar | seasonal
- recipeId: similar 类型必填
- limit: 默认 10
- exclude: 逗号分隔的排除 ID

### GET /api/recommendations/home
- 返回多 section 配置供首页使用

## 5. 前端实现

### useRecommendations (web/app/composables/useRecommendations.ts)
- fetchRecommendations(type, options)
- recommendations ref
- isLoading / error state

### RecommendationSection (web/app/components/RecommendationSection.vue)
- 展示推荐标题、原因、菜谱列表
- 骨架屏加载状态
- 查看更多链接

## 6. 集成位置

- 首页 (index.vue): type=personalized
- 详情页 (recipes/[id].vue): type=similar  
- 收藏页 (favorites.vue): 发现更多

## 7. 实现优先级

| 阶段 | 功能 | 工作量 |
|------|------|--------|
| P0 | 相似菜谱推荐 | 中 |
| P0 | 热门推荐 | 小 |
| P1 | 首页综合推荐 | 中 |
| P1 | 时令推荐 | 小 |
| P2 | 协同过滤 | 大 |

## 8. 技术选型

- 实现: PostgreSQL SQL 查询
- 缓存: Redis (TTL: 5分钟)
- 降级: 回退到热门推荐
