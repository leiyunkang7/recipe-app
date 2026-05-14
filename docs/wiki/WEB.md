# Web 应用文档

> Recipe App Nuxt 4 Web 应用完整指南

---

## 1. 概述

### 1.1 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Nuxt | 4.3.1 | 全栈框架 |
| Vue | 3.5.28 | UI 框架 |
| TailwindCSS | - | 样式框架 |
| @nuxtjs/i18n | 10.2.3 | 国际化 |
| @vite-pwa/nuxt | 1.1.1 | PWA 支持 |
| @nuxt/image | 2.0.0 | 图片优化 |

### 1.2 项目结构

```
web/
├── app/
│   ├── components/       # Vue 组件
│   ├── pages/            # 页面路由
│   ├── composables/      # 组合式函数
│   ├── layouts/          # 页面布局
│   └── app.vue           # 根组件
├── server/
│   ├── api/              # API 端点
│   └── utils/            # 服务端工具
├── e2e/                  # E2E 测试
├── locales/              # i18n 翻译文件
├── public/               # 静态资源
├── assets/               # 样式和资源
├── nuxt.config.ts        # Nuxt 配置
└── playwright.config.ts  # Playwright 配置
```

---

## 2. 页面路由

### 2.1 公开页面

| 路由 | 文件 | 描述 |
|------|------|------|
| `/` | `pages/index.vue` | 首页 - 食谱网格 |
| `/recipes/[id]` | `pages/recipes/[id].vue` | 食谱详情页 |
| `/favorites` | `pages/favorites.vue` | 收藏页面 |

### 2.2 管理页面

| 路由 | 文件 | 描述 |
|------|------|------|
| `/admin` | `pages/admin/index.vue` | 管理面板 |
| `/admin/recipes/new` | `pages/admin/recipes/new.vue` | 新建食谱 |
| `/admin/recipes/[id]/edit` | `pages/admin/recipes/[id]/edit.vue` | 编辑食谱 |

### 2.3 路由守卫

管理页面需要认证 (计划中):

```typescript
// middleware/admin.ts
export default defineNuxtRouteMiddleware((to) => {
  const isAuthenticated = useState('isAuthenticated');
  
  if (!isAuthenticated.value) {
    return navigateTo('/login');
  }
});
```

---

## 3. 组件

### 3.1 核心组件

#### RecipeCard

食谱卡片组件，显示食谱概览。

```vue
<template>
  <RecipeCard
    :recipe="recipe"
    :show-actions="true"
    @click="goToDetail"
    @edit="goToEdit"
    @delete="confirmDelete"
  />
</template>
```

**Props**:

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| recipe | Recipe | required | 食谱对象 |
| showActions | boolean | false | 显示操作按钮 |
| compact | boolean | false | 紧凑模式 |

**Events**:

| 事件 | 参数 | 描述 |
|------|------|------|
| click | recipe | 点击卡片 |
| edit | recipe | 点击编辑 |
| delete | recipe | 点击删除 |

---

#### RecipeForm

食谱表单组件，用于创建和编辑。

```vue
<template>
  <RecipeForm
    :initial-data="recipe"
    :is-editing="true"
    @submit="handleSubmit"
    @cancel="handleCancel"
  />
</template>
```

**Props**:

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| initialData | Recipe | null | 初始数据 |
| isEditing | boolean | false | 编辑模式 |

**Events**:

| 事件 | 参数 | 描述 |
|------|------|------|
| submit | CreateRecipeDTO | 提交表单 |
| cancel | - | 取消 |

---

#### IngredientList

食材列表组件。

```vue
<template>
  <IngredientList
    :ingredients="ingredients"
    :editable="true"
    @add="addIngredient"
    @remove="removeIngredient"
  />
</template>
```

---

#### StepList

步骤列表组件。

```vue
<template>
  <StepList
    :steps="steps"
    :editable="true"
    @add="addStep"
    @remove="removeStep"
    @reorder="reorderSteps"
  />
</template>
```

---

### 3.2 UI 组件

#### AppHeader

应用头部导航。

```vue
<template>
  <AppHeader
    :show-search="true"
    :show-language-switch="true"
  />
</template>
```

---

#### SearchBar

搜索栏组件。

```vue
<template>
  <SearchBar
    v-model="searchQuery"
    :placeholder="$t('search.placeholder')"
    @search="handleSearch"
  />
</template>
```

---

#### FilterPanel

筛选面板组件。

```vue
<template>
  <FilterPanel
    v-model:category="filters.category"
    v-model:cuisine="filters.cuisine"
    v-model:difficulty="filters.difficulty"
    @reset="resetFilters"
  />
</template>
```

---

## 4. Composables

### 4.1 useRecipes

食谱数据管理。

```typescript
const {
  recipes,
  currentRecipe,
  loading,
  error,
  fetchRecipes,
  fetchRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} = useRecipes();

// 获取列表
await fetchRecipes({ category: 'dinner' });

// 获取详情
await fetchRecipe(id);

// 创建
await createRecipe({
  title: '新食谱',
  category: 'dinner',
  // ...
});

// 更新
await updateRecipe(id, { servings: 4 });

// 删除
await deleteRecipe(id);
```

---

### 4.2 useSearch

搜索功能。

```typescript
const {
  results,
  suggestions,
  loading,
  search,
  getSuggestions,
} = useSearch();

// 搜索
await search('番茄');

// 获取建议
await getSuggestions('番');
```

---

### 4.3 useFavorites

收藏功能。

```typescript
const {
  favorites,
  isFavorite,
  addFavorite,
  removeFavorite,
} = useFavorites();

// 检查是否收藏
const isFav = isFavorite(recipeId);

// 添加收藏
await addFavorite(recipeId);

// 移除收藏
await removeFavorite(recipeId);
```

---

### 4.4 useI18n

国际化。

```typescript
const {
  locale,
  t,
  setLocale,
} = useI18n();

// 获取翻译
const title = t('recipes.title');

// 切换语言
setLocale('zh-CN');
```

---

## 5. API 集成

### 5.1 服务端 API

所有 API 端点位于 `server/api/`:

```
server/api/
├── recipes/
│   ├── index.ts      # GET, POST /api/recipes
│   └── [id].ts       # GET, PUT, DELETE /api/recipes/:id
├── categories.ts     # GET /api/categories
├── cuisines.ts       # GET /api/cuisines
├── search.ts         # GET /api/search
└── uploads/
    ├── image.ts      # POST /api/uploads/image
    └── video.ts      # POST /api/uploads/video
```

### 5.2 数据获取

使用 `$fetch` 进行 API 调用:

```typescript
// 获取列表
const recipes = await $fetch('/api/recipes', {
  query: { category: 'dinner' }
});

// 创建
const newRecipe = await $fetch('/api/recipes', {
  method: 'POST',
  body: recipeData
});

// 更新
const updated = await $fetch(`/api/recipes/${id}`, {
  method: 'PUT',
  body: updateData
});

// 删除
await $fetch(`/api/recipes/${id}`, {
  method: 'DELETE'
});
```

---

## 6. 国际化

### 6.1 支持的语言

- `en` - English
- `zh-CN` - 简体中文

### 6.2 翻译文件

```
locales/
├── en.json
└── zh-CN.json
```

### 6.3 使用示例

```vue
<template>
  <h1>{{ $t('recipes.title') }}</h1>
  <p>{{ $t('recipes.description', { count: recipes.length }) }}</p>
</template>

<script setup>
const { t } = useI18n();
const title = t('recipes.create');
</script>
```

### 6.4 翻译结构

```json
// locales/zh-CN.json
{
  "common": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑"
  },
  "recipes": {
    "title": "食谱",
    "create": "创建食谱",
    "ingredients": "食材",
    "steps": "步骤"
  },
  "search": {
    "placeholder": "搜索食谱...",
    "noResults": "未找到结果"
  }
}
```

---

## 7. 样式系统

### 7.1 Tailwind 配置

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          500: '#f97316',
          600: '#ea580c',
        }
      }
    }
  }
}
```

### 7.2 常用样式类

```vue
<template>
  <!-- 卡片 -->
  <div class="bg-white rounded-lg shadow-md p-4">
    <!-- 标题 -->
    <h2 class="text-xl font-semibold text-gray-800">
      食谱标题
    </h2>
    
    <!-- 按钮 -->
    <button class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded">
      保存
    </button>
    
    <!-- 输入框 -->
    <input class="border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-primary-500">
  </div>
</template>
```

---

## 8. PWA 配置

### 8.1 功能

- 离线支持
- 添加到主屏幕
- 推送通知 (计划中)

### 8.2 配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@vite-pwa/nuxt'],
  
  pwa: {
    manifest: {
      name: 'Recipe App',
      short_name: 'Recipes',
      theme_color: '#f97316',
      display: 'standalone',
    },
    workbox: {
      offline: true,
    }
  }
});
```

---

## 9. 开发命令

### 9.1 开发服务器

```bash
cd web
bun run dev
```

访问 http://localhost:3000

### 9.2 构建生产版本

```bash
bun run build
```

### 9.3 预览生产版本

```bash
bun run preview
```

### 9.4 测试

```bash
# 单元测试
bun run test

# E2E 测试
bun run test:e2e

# E2E UI 模式
bun run test:e2e:ui
```

---

## 10. 部署

### 10.1 Vercel 部署

```bash
# 安装 Vercel CLI
bun i -g vercel

# 部署
cd web
vercel deploy
```

### 10.2 环境变量

在 Vercel 中设置:

```
DATABASE_URL=postgresql://...
NUXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## 11. 性能优化

### 11.1 图片优化

使用 `@nuxt/image`:

```vue
<template>
  <NuxtImg
    :src="recipe.imageUrl"
    :alt="recipe.title"
    width="400"
    height="300"
    format="webp"
    loading="lazy"
  />
</template>
```

### 11.2 代码分割

Nuxt 自动进行路由级代码分割。

### 11.3 缓存策略

```typescript
// server/api/recipes/index.ts
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=3600');
  // ...
});
```

---

**文档版本**: 1.0  
**Commit**: [`adb26e9`](https://github.com/leiyunkang7/recipe-app/commit/adb26e9b72f7569283201b389feabc4f85279a36)  
**最后更新**: 2026-04-05

> 此文档与代码版本关联，用于增量更新。详见 [.version.md](./.version.md)
