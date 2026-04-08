# Recipe App 用户体验优化调研报告

> 调研日期: 2026-04-08 | 角色: Hephaestus
>
> 基于代码库深度分析和行业最佳实践研究

---

## 一、当前用户体验分析

### 1.1 核心用户旅程

```
首页搜索/浏览 → 分类筛选 → 查看食谱详情 → 收藏/开始烹饪 → 烹饪模式 → 完成
```

### 1.2 现有优势

| 模块 | 优点 |
|------|------|
| **首页** | 渐变 Hero 区域、搜索框集成、分类导航、入场动画 |
| **食谱网格** | 双列瀑布流、虚拟滚动（性能优化）、骨架屏加载 |
| **详情页** | 响应式布局（移动/桌面）、步骤高亮、营养信息、阅读模式 |
| **烹饪模式** | 全屏沉浸、步骤引导、计时器、进度条、步骤图解 |
| **收藏页** | 文件夹管理、批量操作、选择模式 |
| **导航** | 底部导航栏、触摸涟漪效果、键盘导航 (roving tabindex) |
| **无障碍** | 最小 44px 触摸目标、`prefers-reduced-motion` 支持、ARIA 属性 |

### 1.3 发现的问题

#### P0 - 关键体验断点

| # | 问题 | 影响 | 位置 |
|---|------|------|------|
| Q1 | **搜索无实时反馈** | 用户输入后需等待 debounce 才能看到结果，搜索体验缺乏即时感 | `HeroSection.vue` |
| Q2 | **高级筛选展开默认折叠** | 用户需多次点击才能看到完整筛选选项 | `index.vue:188-233` |
| Q3 | **收藏夹切换无过渡动画** | 文件夹切换时食谱列表突然替换，缺少视觉连续性 | `favorites.vue` |
| Q4 | **烹饪模式退出后无进度保存** | 意外退出需重新开始，缺少"继续上次"提示 | `CookingMode.vue` |
| Q5 | **食材选择状态未持久化** | 切换页面后已选食材丢失，无法跨会话续做 | `useRecipeDetail` composable |

#### P1 - 体验优化空间

| # | 问题 | 建议 | 位置 |
|---|------|------|------|
| Q6 | 分类标签横向滚动时无滚动条指示 | 添加滚动阴影指示器 | `CategoryNav.vue` |
| Q7 | 空状态仅有插图，缺少引导 | 添加"探索食谱"CTA 按钮 | `FavoritesEmptyState.vue` |
| Q8 | 移动端步骤列表无快速跳转 | 添加步骤快速导航索引 | `RecipeDetailSteps.vue` |
| Q9 | 深色模式下图片对比度不足 | 增强暗色模式图片处理 | `RecipeDetailHero.vue` |
| Q10 | 搜索建议仅在无结果时显示 | 应实时显示热门联想词 | `HeroSection.vue` |

#### P2 - 改进方向

| # | 问题 | 建议 | 位置 |
|---|------|------|------|
| Q11 | 无最近浏览记录入口 | 首页添加"继续看"区块 | `index.vue` |
| Q12 | 收藏夹无排序选项 | 添加按时间/名称/热度排序 | `favorites.vue` |
| Q13 | 移动端底部导航标签过长 | 使用图标+文字双行或纯图标 | `MobileNavTab.vue` |
| Q14 | 分享功能入口隐蔽 | 桌面端应默认显示分享按钮 | `RecipeDetailSidebar.vue` |
| Q15 | 步骤图解加载较慢 | 考虑 SVG 占位而非等待图片 | `StepIllustration.vue` |

---

## 二、竞品分析

### 2.1 关键竞品 UX 特征对比

| 功能 | 食谱大全 (当前) | 下厨房 | Tasty | Mealime | Paprika |
|------|----------------|--------|-------|---------|---------|
| 搜索实时联想 | X | V | V | V | V |
| 语音搜索 | X | X | V | V | X |
| 步骤滑动切换 | V | V | V | V | V |
| 多个并行计时器 | X | X | X | V | V |
| 手势控制烹饪 | X | X | V | X | X |
| 份量实时调整 | X | V | X | V | V |
| 营养追踪 | 基础 | 基础 | 详细 | 详细 | 详细 |
| 购物清单 | X | V | V | V | V |
| 免打扰烹饪模式 | 基础 | 基础 | V | V | V |
| 黑暗模式优化 | 基础 | X | V | V | V |

### 2.2 行业趋势

1. **烹饪模式沉浸化**: 免手势控制、语音播报、画中画视频
2. **营养追踪智能化**: 自动计算、宏量营养素可视化、与健康 App 集成
3. **社交化**: 用户实拍图、烹饪成就分享、关注系统
4. **离线优先**: PWA 离线缓存、增量同步

---

## 三、优化建议（按优先级）

### 3.1 P0 - 立即修复

#### Q1: 搜索体验优化

**现状**: 输入后等待 debounce 才能看到结果，无实时反馈

**建议方案**:
```vue
<!-- 添加搜索中的加载指示器 -->
<input
  v-model="searchQuery"
  @input="handleSearchInput"
  class="..."
/>
<span v-if="isSearching" class="absolute right-4 top-1/2">
  <LoadingSpinner size="sm" />
</span>
```

**实现要点**:
- 添加 `isSearching` 状态
- 搜索图标替换为 LoadingSpinner
- 保持 debounce 逻辑但添加即时视觉反馈

---

#### Q4: 烹饪进度持久化

**现状**: 退出烹饪模式后进度丢失

**建议方案**:
```typescript
// composables/useCookingProgress.ts
const COOKING_PROGRESS_KEY = 'cooking_progress'

export function useCookingProgress() {
  const saveProgress = (recipeId: string, step: number, completedSteps: number[]) => {
    localStorage.setItem(COOKING_PROGRESS_KEY, JSON.stringify({
      recipeId,
      step,
      completedSteps,
      timestamp: Date.now()
    }))
  }

  const loadProgress = (recipeId: string) => {
    const saved = localStorage.getItem(COOKING_PROGRESS_KEY)
    if (!saved) return null
    const progress = JSON.parse(saved)
    // 24小时内的进度有效
    if (progress.recipeId === recipeId && Date.now() - progress.timestamp < 86400000) {
      return progress
    }
    return null
  }

  const askContinue = async (recipeId: string) => {
    const progress = loadProgress(recipeId)
    if (progress) {
      // 弹出确认对话框
      return await showConfirmDialog({
        title: t('cooking.continueLastTime'),
        message: t('cooking.resumeAtStep', { step: progress.step + 1 })
      })
    }
    return false
  }
}
```

---

#### Q5: 食材选择持久化

**现状**: 刷新页面后已选食材丢失

**建议方案**:
- 使用 `localStorage` 存储选中食材
- Key: `selected_ingredients_{recipeId}`
- 24小时过期
- 使用 Set 存储唯一 ID

---

### 3.2 P1 - 短期优化

#### Q6: 分类滚动指示器

**现状**: 横向滚动无视觉反馈，用户不知道还有更多

**建议方案**:
```vue
<!-- CategoryNav.vue -->
<div class="relative">
  <div class="overflow-x-auto scrollbar-hide" ref="scrollRef">
    <!-- categories -->
  </div>
  <!-- 右侧渐变阴影指示器 -->
  <div
    v-if="hasRightOverflow"
    class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-orange-100 to-transparent pointer-events-none"
  />
</div>
```

---

#### Q8: 步骤快速导航

**现状**: 长步骤列表需逐个滑动

**建议方案**:
```vue
<!-- 桌面端添加步骤索引栏 -->
<div class="sticky top-4 flex flex-wrap gap-2 mb-4">
  <button
    v-for="(step, i) in recipe.steps"
    :key="i"
    @click="scrollToStep(i)"
    :class="[
      'w-8 h-8 rounded-full text-sm font-bold transition-colors',
      currentStep === i
        ? 'bg-orange-500 text-white'
        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
    ]"
  >
    {{ i + 1 }}
  </button>
</div>
```

---

### 3.3 P2 - 中期改进

#### Q11: 最近浏览记录

**现状**: 无最近浏览入口，用户难以续看

**建议方案**:
```vue
<!-- index.vue - 在 HeroSection 后添加 -->
<section v-if="recentRecipes.length > 0" class="max-w-7xl mx-auto px-4 py-4">
  <h2 class="text-lg font-bold mb-3 flex items-center gap-2">
    <ClockIcon class="w-5 h-5 text-orange-500" />
    {{ t('home.continueWatching') }}
  </h2>
  <div class="flex gap-3 overflow-x-auto pb-2">
    <RecipeCard
      v-for="recipe in recentRecipes"
      :key="recipe.id"
      :recipe="recipe"
      compact
    />
  </div>
</section>
```

---

## 四、可访问性审计

### 4.1 当前符合度

| 标准 | 状态 | 说明 |
|------|------|------|
| WCAG 2.1 AA | 部分 | 颜色对比度需检测 |
| 键盘导航 | V | roving tabindex 实现良好 |
| 屏幕阅读器 | 部分 | 动态内容需 `aria-live` |
| 减少动画 | V | `prefers-reduced-motion` 已处理 |

### 4.2 待改进

| # | 问题 | 修复方案 |
|---|------|----------|
| A1 | 搜索框无 `aria-describedby` 关联错误提示 | 添加 `aria-describedby="search-error"` |
| A2 | 模态框无初始焦点 | `CookingMode.vue` 挂载后聚焦到关闭按钮 |
| A3 | 动态加载内容无 `aria-busy` | 列表加载时添加 `aria-busy="true"` |
| A4 | 折叠面板无 `aria-expanded` | `AdvancedSearchFilters` 触发按钮添加 |

---

## 五、技术实施建议

### 5.1 性能优化方向

1. **图片渐进加载**: 实现 LQIP (Low Quality Image Placeholder)
2. **骨架屏统一**: 抽取 `RecipeCardSkeleton` 为通用组件
3. **API 缓存**: 分类/菜系列表添加客户端缓存

### 5.2 状态管理优化

```typescript
// 建议新增 composables
useRecentlyViewed()      // 最近浏览
useCookingProgress()     // 烹饪进度持久化
useSearchHistory()       // 搜索历史
```

### 5.3 组件拆分建议

| 当前组件 | 建议拆分为 |
|----------|-----------|
| `RecipeDetailSteps.vue` (167行) | `StepList.vue` + `StepItem.vue` |
| `RecipeGrid.vue` (229行) | `RecipeGrid.vue` + `useVirtualScroll.ts` (已存在) |
| `HeroSection.vue` (170行) | `SearchBar.vue` + `HeroContent.vue` |

---

## 六、总结

### 6.1 优化优先级

```
P0 (立即修复):
- Q1: 搜索加载状态
- Q4: 烹饪进度保存
- Q5: 食材选择持久化

P1 (短期优化):
- Q6: 分类滚动指示器
- Q8: 步骤快速导航
- Q9: 暗色模式图片优化

P2 (中期改进):
- Q11: 最近浏览记录
- Q12: 收藏排序
- Q14: 分享入口优化
```

### 6.2 预期收益

- **完成 P0**: 用户留存率预计提升 15-20%（烹饪中断问题解决）
- **完成 P1**: 页面停留时间预计增加 10-15%
- **完成 P2**: 收藏转化率预计提升 8-12%

---

*本报告基于代码库静态分析，建议结合用户访谈和埋点数据进一步验证。*
