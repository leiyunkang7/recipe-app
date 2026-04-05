# Recipe App - DeepWiki 文档索引

> 全栈食谱管理系统的完整技术文档

---

## 📚 文档导航

### 1. 项目概述

| 主题 | 描述 | 文档链接 |
|------|------|----------|
| 项目简介 | 功能特性、技术栈、快速开始 | [README.md](./README.md) |
| 项目总结 | 开发历程、质量评估、统计信息 | [docs/PROJECT_SUMMARY.md](./docs/PROJECT_SUMMARY.md) |
| Agent 指南 | AI 编码助手开发规范 | [AGENTS.md](./AGENTS.md) |

### 2. 技术架构

| 组件 | 技术 | 版本 |
|------|------|------|
| 包管理器 | Bun | v1.3.9+ |
| 语言 | TypeScript | v6.0.2 (strict mode) |
| Monorepo | Bun Workspaces | - |
| 数据库 | PostgreSQL + Drizzle ORM | v0.39.3 |
| Web 框架 | Nuxt 4 + Vue 3 | v4.3.1 / v3.5.28 |
| CLI | Commander.js | v11.1.0 |
| 验证 | Zod | v3.22.4 |
| 测试 | Vitest + Playwright | v4.1.2 / v1.58.2 |
| 样式 | TailwindCSS | - |
| i18n | @nuxtjs/i18n | v10.2.3 |
| PWA | @vite-pwa/nuxt | v1.1.1 |

---

## 🏗️ 项目结构

```
recipe-app/
├── cli/                          # CLI 工具 (Commander.js)
│   └── src/
│       ├── commands/             # CLI 命令实现
│       │   ├── add.ts            # 创建食谱
│       │   ├── list.ts           # 列出食谱
│       │   ├── get.ts            # 获取详情
│       │   ├── update.ts         # 更新食谱
│       │   ├── delete.ts         # 删除食谱
│       │   ├── delete-many.ts    # 批量删除
│       │   ├── search.ts         # 搜索功能
│       │   ├── import.ts         # 导入 JSON
│       │   ├── export.ts         # 导出 JSON
│       │   └── image.ts          # 图片上传
│       ├── __tests__/            # 单元测试
│       ├── types/                # CLI 特定类型
│       ├── config.ts             # 配置加载器
│       └── index.ts              # 入口文件
│
├── database/                     # 数据库 Schema 和迁移
│   └── src/
│       └── schema/               # Drizzle ORM Schemas
│           ├── recipes.ts        # 核心食谱表
│           ├── i18n.ts           # 翻译表
│           ├── taxonomy.ts       # 分类和菜系
│           ├── favorites.ts      # 收藏和评分
│           └── index.ts          # Schema 导出
│
├── services/                     # 服务层
│   ├── recipe/                   # 食谱 CRUD 服务
│   │   └── src/
│   │       ├── service.ts        # 核心业务逻辑
│   │       └── index.ts          # 服务导出
│   ├── image/                    # 图片上传服务
│   ├── search/                   # 搜索服务
│   └── video/                    # 视频处理服务
│
├── shared/
│   └── types/                    # 共享 TypeScript 类型
│       └── src/
│           ├── index.ts          # 所有 Zod Schemas
│           └── __tests__/        # Schema 测试
│
├── web/                          # Nuxt 4 Web 应用
│   ├── app/
│   │   ├── components/           # Vue 组件
│   │   ├── pages/                # 页面路由
│   │   │   ├── index.vue         # 首页
│   │   │   ├── recipes/          # 食谱详情
│   │   │   ├── favorites.vue     # 收藏页
│   │   │   └── admin/            # 管理后台
│   │   ├── composables/          # Vue Composables
│   │   └── layouts/              # 页面布局
│   ├── server/
│   │   └── api/                  # API 端点
│   ├── e2e/                      # Playwright E2E 测试
│   ├── locales/                  # i18n 翻译文件
│   ├── public/                   # 静态资源
│   └── assets/                   # CSS 和其他资源
│
├── docs/                         # 项目文档
├── migrations/                   # 数据库迁移
├── scripts/                      # 工具脚本
└── skills/                       # AI Skills
```

---

## 📖 核心模块文档

### CLI 命令

| 命令 | 描述 | 用法 |
|------|------|------|
| `add` | 交互式创建食谱 | `recipe add` |
| `list` | 列出所有食谱 | `recipe list [--category] [--difficulty]` |
| `get` | 获取食谱详情 | `recipe get <id>` |
| `update` | 更新食谱 | `recipe update <id>` |
| `delete` | 删除食谱 | `recipe delete <id>` |
| `delete-many` | 批量删除 | `recipe delete-many <pattern>` |
| `search` | 搜索食谱/食材 | `recipe search <query>` |
| `import` | 导入 JSON | `recipe import <file.json>` |
| `export` | 导出 JSON | `recipe export [--output]` |
| `image` | 图片上传 | `recipe image upload <file>` |

### 服务层 API

#### RecipeService

```typescript
interface RecipeService {
  create(dto: CreateRecipeDTO): Promise<ServiceResponse<Recipe>>;
  findById(id: string): Promise<ServiceResponse<Recipe>>;
  findAll(filters?: RecipeFilters, pagination?: Pagination): Promise<ServiceResponse<Recipe[]>>;
  update(id: string, dto: UpdateRecipeDTO): Promise<ServiceResponse<Recipe>>;
  delete(id: string): Promise<ServiceResponse<void>>;
  search(query: string, options?: SearchOptions): Promise<ServiceResponse<SearchResult[]>>;
}
```

#### ImageService

```typescript
interface ImageService {
  upload(file: Buffer, options?: ImageUploadOptions): Promise<ServiceResponse<{ url: string }>>;
  delete(url: string): Promise<ServiceResponse<void>>;
}
```

#### SearchService

```typescript
interface SearchService {
  search(query: string, scope: SearchScope): Promise<ServiceResponse<SearchResult[]>>;
  getSuggestions(query: string): Promise<ServiceResponse<SearchSuggestion[]>>;
}
```

---

## 🗄️ 数据库架构

### 核心表

| 表名 | 描述 | 主要字段 |
|------|------|----------|
| `recipes` | 主食谱记录 | id, title, description, category, cuisine, servings, prep_time_minutes, cook_time_minutes, difficulty |
| `recipe_ingredients` | 食谱食材 | id, recipe_id, name, amount, unit |
| `recipe_steps` | 烹饪步骤 | id, recipe_id, step_number, instruction, duration_minutes |
| `recipe_tags` | 食谱标签 | id, recipe_id, tag |

### i18n 表

| 表名 | 描述 |
|------|------|
| `recipe_translations` | 食谱标题/描述翻译 |
| `ingredient_translations` | 食材名称翻译 |
| `step_translations` | 步骤说明翻译 |
| `category_translations` | 分类名称翻译 |
| `cuisine_translations` | 菜系名称翻译 |

### 分类表

| 表名 | 描述 |
|------|------|
| `categories` | 预定义分类 |
| `cuisines` | 预定义菜系 |

### 用户相关表

| 表名 | 描述 |
|------|------|
| `favorites` | 用户收藏 |
| `favorite_folders` | 收藏文件夹 |
| `recipe_ratings` | 食谱评分 |

---

## 🔧 类型系统

### 核心 Zod Schemas

```typescript
// 食谱 Schema
export const RecipeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Recipe title is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  cuisine: z.string().optional(),
  servings: z.number().int().positive('Servings must be positive'),
  prepTimeMinutes: z.number().int().nonnegative(),
  cookTimeMinutes: z.number().int().nonnegative(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  ingredients: z.array(IngredientSchema).min(1),
  steps: z.array(RecipeStepSchema).min(1),
  tags: z.array(z.string()).optional(),
  nutritionInfo: NutritionInfoSchema.optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  source: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  translations: z.array(TranslationSchema).optional(),
});

// 服务响应
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

---

## 🌐 Web 应用

### 页面路由

| 路由 | 描述 | 类型 |
|------|------|------|
| `/` | 首页 - 食谱网格 | 公开 |
| `/recipes/[id]` | 食谱详情页 | 公开 |
| `/favorites` | 收藏页面 | 公开 |
| `/admin` | 管理面板 | 管理 |
| `/admin/recipes/[id]/edit` | 编辑食谱 | 管理 |
| `/admin/recipes/new` | 新建食谱 | 管理 |

### API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/recipes` | GET | 获取食谱列表 |
| `/api/recipes` | POST | 创建食谱 |
| `/api/recipes/[id]` | GET | 获取单个食谱 |
| `/api/recipes/[id]` | PUT | 更新食谱 |
| `/api/recipes/[id]` | DELETE | 删除食谱 |
| `/api/search` | GET | 搜索食谱 |

---

## 🧪 测试

### 单元测试 (Vitest)

```bash
# 运行所有测试
bun run test:run

# 监听模式
bun run test

# 带覆盖率
bun run test:unit

# UI 模式
bun run test:ui

# 单个测试文件
bun run vitest run cli/src/__tests__/add.test.ts
```

### E2E 测试 (Playwright)

```bash
cd web

# 运行 E2E 测试
bun run test:e2e

# UI 模式
bun run test:e2e:ui

# 调试模式
bun run test:e2e:debug
```

---

## 🚀 开发命令

### 根目录

```bash
# 构建所有工作空间
bun run build

# 构建特定模块
bun run build:shared      # shared/types
bun run build:database    # database
bun run build:services    # 所有服务
bun run build:cli         # CLI

# 开发模式
bun run dev               # CLI 开发模式
bun run cli               # 直接运行 CLI

# 代码检查
bun run lint              # oxlint
```

### Web 应用

```bash
cd web

bun run dev               # 启动开发服务器
bun run build             # 生产构建
bun run preview           # 预览构建

# 测试
bun run test              # 单元测试
bun run test:coverage     # 带覆盖率
bun run test:e2e          # E2E 测试

# 代码质量
bun run lint              # oxlint + i18n 检查
bun run format            # Prettier 格式化
```

### 数据库

```bash
cd database

bun run db:generate       # 生成迁移
bun run db:migrate        # 运行迁移
bun run db:push           # 推送 Schema
bun run db:studio         # Drizzle Studio
```

---

## 📋 环境配置

### 环境变量

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app
UPLOAD_DIR=./uploads
SITE_URL=http://localhost:3000
```

### CLI 配置文件

位置: `.credentials/recipe-app-db.txt`

---

## 📚 DeepWiki 文档库

### 核心技术文档

| 文档 | 描述 |
|------|------|
| [docs/wiki/ARCHITECTURE.md](./docs/wiki/ARCHITECTURE.md) | 架构设计文档 - 系统架构、分层设计、数据流 |
| [docs/wiki/API.md](./docs/wiki/API.md) | API 接口文档 - REST API 完整参考 |
| [docs/wiki/DATABASE.md](./docs/wiki/DATABASE.md) | 数据库设计文档 - 表结构、关系、索引 |
| [docs/wiki/CLI.md](./docs/wiki/CLI.md) | CLI 使用指南 - 命令行工具完整手册 |
| [docs/wiki/WEB.md](./docs/wiki/WEB.md) | Web 应用文档 - Nuxt 4 应用开发指南 |
| [docs/wiki/DEVELOPMENT.md](./docs/wiki/DEVELOPMENT.md) | 开发指南 - 开发者完整指南 |

### 项目文档

| 文档 | 描述 |
|------|------|
| [AGENTS.md](./AGENTS.md) | AI 编码助手开发指南 |
| [docs/PROJECT_SUMMARY.md](./docs/PROJECT_SUMMARY.md) | 项目总结报告 |
| [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) | 测试指南 |
| [docs/SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) | 安装配置指南 |
| [docs/DELIVERABLES.md](./docs/DELIVERABLES.md) | 交付物清单 |
| [web/README.md](./web/README.md) | Web 应用文档 |

---

## 🔗 外部资源

- [Drizzle ORM 文档](https://orm.drizzle.team/docs/overview)
- [Nuxt 文档](https://nuxt.com)
- [Vue 3 文档](https://vuejs.org)
- [Commander.js 文档](https://github.com/tj/commander.js)
- [Zod 文档](https://zod.dev)
- [Vitest 文档](https://vitest.dev)
- [Playwright 文档](https://playwright.dev)

---

## 📋 版本信息

| 项目 | 值 |
|------|-----|
| **Commit** | [`adb26e9`](https://github.com/leiyunkang7/recipe-app/commit/adb26e9b72f7569283201b389feabc4f85279a36) |
| **生成时间** | 2026-04-05 |
| **文档版本** | 1.0 |

> 详见 [docs/wiki/.version.md](./docs/wiki/.version.md) 获取完整版本信息和增量更新说明。

---

**使用 ❤️ 构建，基于 TypeScript、Nuxt 4 和 PostgreSQL**
