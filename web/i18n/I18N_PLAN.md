# Recipe App i18n 方案

> 状态：框架已就绪，剩余 5% 扫尾工作
> 更新时间：2026-03-21

---

## 一、现状分析

### 1.1 已完成 ✅

| 模块 | 状态 | 说明 |
|------|------|------|
| 技术选型 | ✅ | `@nuxtjs/i18n@10.x` + Nuxt 3，原生集成 |
| 目录结构 | ✅ | `i18n/locales/{en,zh-CN}.json` |
| 语言切换组件 | ✅ | `LanguageSwitcher.vue`（下拉选择器） |
| 浏览器语言检测 | ✅ | `detectBrowserLanguage` 配置，cookie 持久化 |
| 路由策略 | ✅ | `prefix_except_default`（英文无前缀，中文 `/zh-CN`） |
| UI 文本 | ✅ | 80%+ 组件已使用 `t('key')` |
| 表单/验证消息 | ✅ | `validation.*`, `form.*` 分组完善 |
| Toast/提示消息 | ✅ | `message.*` 分组完善 |
| 错误边界 | ✅ | `errorBoundary.*` 分组完善 |

### 1.2 未完成 ❌（剩余 hardcoded 中文）

#### 页面注释（`index.vue`）
```vue
/**
 * 首页 - 现代化重新设计 v2   ← 注释
 * 设计风格：...              ← 注释
 */
```

#### `recipes/[id].vue` 硬编码（桌面端营养信息区域）
```vue
<!-- 营养信息区域 -->
<h3 class="text-sm font-semibold text-gray-600 dark:text-stone-400 mb-3">📊 营养信息</h3>   ← 硬编码
<div class="text-xs text-gray-500 dark:text-stone-400">卡路里</div>                      ← 硬编码
<div class="text-xs text-gray-500 dark:text-stone-400">蛋白质</div>                       ← 硬编码
<div class="text-xs text-gray-500 dark:text-stone-400">碳水</div>                          ← 硬编码
<div class="text-xs text-gray-500 dark:text-stone-400">脂肪</div>                          ← 硬编码

<!-- aria-label -->
:aria-label="isFavorite ? '取消收藏' : '收藏'"   ← 硬编码
```

#### `MobileNavbar.vue` 部分 aria-label
```vue
ariaLabel: t('nav.homeAria', '首页')   ← fallback 是中文
ariaLabel: t('nav.bottomNavAria', '底部导航')   ← fallback 是中文
```

---

## 二、技术架构

### 2.1 技术选型

| 方案 | 选择 | 原因 |
|------|------|------|
| vue-i18n | ❌ 不选 | 需手动集成 |
| **@nuxtjs/i18n** | ✅ 选中 | Nuxt 3 原生模块，文件自动加载，路由自动处理 |
| i18n Ally (VSCode) | ✅ 推荐 | 翻译 key 的 VSCode 插件，提示未翻译 key |

### 2.2 目录结构（现状）

```
recipe-app/web/
├── i18n/
│   └── locales/
│       ├── en.json        # 英文翻译
│       └── zh-CN.json     # 中文翻译
├── app/
│   ├── components/
│   │   ├── LanguageSwitcher.vue   # 语言切换器（已有）
│   │   └── ...
│   └── pages/
│       ├── index.vue
│       └── recipes/[id].vue
└── nuxt.config.ts         # i18n 配置（已有）
```

### 2.3 Nuxt Config（现状）

```ts
i18n: {
  locales: [
    { code: 'en',      name: 'English',  file: 'en.json' },
    { code: 'zh-CN', name: '简体中文', file: 'zh-CN.json' }
  ],
  defaultLocale: 'zh-CN',
  strategy: 'prefix_except_default',   // /recipes/1 (en) vs /zh-CN/recipes/1
  langDir: 'locales',
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'i18n_locale',
    fallbackLocale: 'en',
    alwaysRedirect: true,
    redirectOn: 'root'
  }
}
```

---

## 三、内容分类

| 分类 | Key 前缀 | 示例 | 状态 |
|------|----------|------|------|
| 全局应用 | `app.*` | `app.title`, `app.subtitle` | ✅ |
| 导航 | `nav.*` | `nav.home`, `nav.admin` | ✅ |
| 搜索 | `search.*` | `search.placeholder` | ✅ |
| 食谱详情 | `recipe.*` | `recipe.ingredients`, `recipe.instructions` | ✅ |
| 难度 | `difficulty.*` | `difficulty.easy` | ✅ |
| 管理后台 | `admin.*` | `admin.title`, `admin.addRecipe` | ✅ |
| 表单 | `form.*` | `form.title`, `form.save` | ✅ |
| 验证 | `validation.*` | `validation.titleRequired` | ✅ |
| 消息提示 | `message.*` | `message.recipeCreated` | ✅ |
| 通用 | `common.*` | `common.back`, `common.edit` | ✅ |
| 图片上传 | `imageUpload.*` | `imageUpload.uploading` | ✅ |
| 错误边界 | `errorBoundary.*` | `errorBoundary.retry` | ✅ |
| 空状态 | `empty.*` | `empty.title`, `empty.noResults` | ✅ |
| **营养信息** | `nutrition.*` | `nutrition.calories`, `nutrition.protein` | ❌ 缺失 |
| **界面 aria** | `aria.*` | `aria.favorite`, `aria.back` | ❌ 部分缺失 |

---

## 四、语言切换机制

### 4.1 已实现

1. **浏览器自动检测** — 首次访问根据 `navigator.language` 自动跳转
2. **Cookie 持久化** — `i18n_locale` cookie 保存用户选择
3. **下拉切换** — `LanguageSwitcher.vue` 实时切换，`setLocale()` 无刷新更新
4. **路由前缀** — `strategy: 'prefix_except_default'` 确保 SEO 友好

### 4.2 扩展建议（可选）

```ts
// nuxt.config.ts 扩展
i18n: {
  // ... 现有配置
  lazy: true,           // 懒加载翻译文件（文件大时开启）
  compilation: {         // 生产关闭以减小包
    strictMessage: false
  }
}
```

---

## 五、实施步骤与优先级

### P0 — 立即修复（5 分钟）

**文件：`recipes/[id].vue`**
```json
// zh-CN.json 补充
"nutrition": {
  "info": "营养信息",
  "calories": "卡路里",
  "protein": "蛋白质",
  "carbs": "碳水化合物",
  "fat": "脂肪",
  "fiber": "纤维"
}

// en.json 补充
"nutrition": {
  "info": "Nutrition Info",
  "calories": "Calories",
  "protein": "Protein",
  "carbs": "Carbs",
  "fat": "Fat",
  "fiber": "Fiber"
}
```

```vue
<!-- recipes/[id].vue 修复 -->
<h3 class="...">📊 {{ t('nutrition.info') }}</h3>
<div class="text-xs text-gray-500">{{ t('nutrition.calories') }}</div>
<!-- 同样修复 protein/carbs/fat -->
```

**aria-label 修复：**
```vue
<!-- MobileNavbar.vue -->
ariaLabel: t('nav.homeAria')
ariaLabel: t('nav.bottomNavAria')

// zh-CN.json / en.json
"nav": {
  "homeAria": "首页导航",
  "bottomNavAria": "底部导航"
}
```

### P1 — 一天内完成

1. **补全 `nutrition.*` 所有 key** 到两个 locale 文件
2. **检查所有 Vue 组件**，确认 `t()` 覆盖所有文本（注释除外）
3. **运行 `npm run lint`** — 项目已有 `lint:i18n` 检查脚本

### P2 — 可选增强

| 功能 | 说明 |
|------|------|
| **Lazy loading** | `lazy: true`，大文件懒加载减少首屏体积 |
| **Pluralization** | `@nuxtjs/i18n` 内置复数支持，`{ n } ${t('recipe.min', { n })}` |
| **Date formatting** | 使用 `Intl.DateTimeFormat` 或 `vue-i18n` datetime 格式化 |
| **i18n Ally** | VSCode 安装插件，即时提示未翻译 key |
| **第三方翻译** | `i18n-ally` 可集成 DeepL/Google 翻译加速 |

---

## 六、验证检查清单

```bash
# 1. 确认两个语言文件 key 完全对齐
comm -12 <(jq -r 'keys[]' i18n/locales/en.json | sort) \
         <(jq -r 'keys[]' i18n/locales/zh-CN.json | sort) | wc -l
# 结果应等于两个文件各自 key 数量

# 2. 检查是否有硬编码中文字符串
grep -rn "[\u4e00-\u9fff]" app/pages/ app/components/ \
  --include="*.vue" | grep -v "t('" | grep -v "//" | grep -v "node_modules"

# 3. 端到端测试
npm run test:e2e -- category-i18n.spec.ts
npm run test:e2e -- i18n.spec.ts
```

---

## 七、结论

recipe-app 的 i18n 基础设施已非常完善，**80%+ 工作已完成**。剩余工作：

1. **P0（5 分钟）**：补充 `nutrition.*` 分组 + 修复 `aria.*` fallback
2. **P1（1 天）**：全量 grep 检查 + lint 验证
3. **P2（可选）**：lazy loading / pluralization / i18n Ally 配置

**不需要重启任何服务**，修改 JSON 文件后浏览器刷新即可生效。
