# Recipe App - 全栈食谱管理系统

一个完整的食谱管理系统，包含 **CLI 工具** 和 **Web 应用**，使用 TypeScript、Nuxt 4、PostgreSQL (Drizzle ORM) 和 Commander.js 构建。

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![Nuxt](https://img.shields.io/badge/Nuxt-4.3-green)](https://nuxt.com/)
[![Bun](https://img.shields.io/badge/Bun-1.3-orange)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 功能特性

### CLI 工具 🖥️
- **完整的 CRUD 操作** - 创建、读取、更新、删除食谱
- **交互式命令行** - 使用 inquirer 提供友好的交互体验
- **搜索功能** - 支持食谱和食材搜索
- **批量操作** - 导入/导出 JSON 格式
- **图片上传** - 支持图片上传和管理
- **类型安全** - TypeScript + Zod 验证

### Web 应用 🌐
- **公开页面** - 浏览和搜索食谱
- **管理后台** - 食谱管理（CRUD）
- **现代化 UI** - Tailwind CSS 响应式设计
- **实时搜索** - 即时过滤和搜索
- **动态表单** - 内联添加食材和步骤
- **国际化** - 支持中文和英文
- **PWA 支持** - 可安装为移动应用

## 🏗️ 项目架构

这是一个使用 `bun` workspaces 的 **monorepo** 项目：

```
recipe-app/
├── cli/                    # 命令行工具
│   └── src/
│       ├── commands/       # CLI 命令实现
│       ├── config.ts       # 配置加载器
│       └── index.ts        # 入口文件
├── database/               # 数据库 schema 和迁移
│   └── src/schema/         # Drizzle ORM schemas
│       ├── common.ts       # 通用工具和类型
│       ├── recipes.ts      # 核心食谱表
│       ├── i18n.ts         # 翻译表
│       ├── taxonomy.ts     # 分类和菜系
│       └── favorites.ts    # 收藏和评分
├── services/               # 服务层
│   ├── recipe/             # 食谱 CRUD 服务
│   ├── image/              # 图片上传服务
│   ├── search/             # 搜索服务
│   └── video/              # 视频处理服务
├── shared/
│   └── types/              # 共享 TypeScript 类型和 Zod schemas
└── web/                    # Nuxt 4 Web 应用
    ├── app/
    │   ├── components/     # Vue 组件
    │   ├── pages/          # 公开和管理页面
    │   ├── composables/    # Vue composables
    │   └── layouts/        # 页面布局
    ├── server/api/         # API 端点
    ├── e2e/                # Playwright E2E 测试
    └── locales/            # i18n 翻译文件
```

## 📋 环境要求

- **Node.js** 18+
- **Bun** 包管理器 (v1.3.9+)
- **PostgreSQL** 数据库

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /root/code/recipe-app
bun install
```

### 2. 配置数据库

创建 `.credentials/recipe-app-db.txt` 文件：

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app
UPLOAD_DIR=./uploads
```

或设置环境变量：

```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app
```

### 3. 初始化数据库

```bash
# 方式一：使用 schema.sql（推荐）
psql -d recipe_app -f schema.sql

# 方式二：使用 Drizzle Kit
cd database
bun run db:push
```

### 4. 构建项目

```bash
bun run build
```

### 5. 启动应用

```bash
# 启动 Web 应用
cd web
bun run dev

# 或使用 CLI
bun run cli
```

## ⚡ Quick Start

A full-stack recipe management system with **CLI tool** and **Web app**, built with TypeScript, Nuxt 4, PostgreSQL (Drizzle ORM), and Commander.js.

### Start Development

```bash
# Install dependencies
bun install

# Start web app (http://localhost:3000)
cd web && bun run dev
```

### Tech Stack

| Component | Tech |
|-----------|------|
| Package Manager | **Bun** v1.3.9+ |
| Language | TypeScript v6.0.2 |
| Database | PostgreSQL + **Drizzle ORM** v0.39.3 |
| Web Framework | Nuxt 4.3.1 + Vue 3.5.28 |
| CLI | Commander.js v11.1.0 |
| Validation | Zod v3.22.4 |
| Testing | Vitest v4.1.2 + Playwright v1.58.2 |
| Styling | TailwindCSS |
| i18n | @nuxtjs/i18n v10.2.3 (en, zh-CN) |

## 📖 使用指南

### CLI 命令

```bash
# 创建食谱（交互式）
recipe add

# 列出所有食谱
recipe list

# 带筛选条件列出
recipe list --category dinner --difficulty easy

# 获取食谱详情
recipe get <recipe-id>

# 更新食谱
recipe update <recipe-id>

# 删除食谱
recipe delete <recipe-id>

# 搜索食谱
recipe search "chicken"

# 批量操作
recipe import recipes.json
recipe export --output my-recipes.json
recipe delete-many "chicken"

# 图片操作
recipe image upload photo.jpg
```

### Web 应用页面

#### 公开页面
- **首页** (`/`) - 食谱网格，支持搜索和筛选
- **食谱详情** (`/recipes/[id]`) - 完整食谱视图
- **收藏** (`/favorites`) - 收藏的食谱

#### 管理页面
- **管理面板** (`/admin`) - 食谱管理表格
- **编辑食谱** (`/admin/recipes/[id]/edit`) - 创建/编辑表单
- **新建食谱** (`/admin/recipes/new`) - 新建表单

## 🗄️ 数据库架构

### 核心表

| 表名 | 描述 |
|------|------|
| `recipes` | 主食谱记录 |
| `recipe_ingredients` | 食谱食材 |
| `recipe_steps` | 烹饪步骤 |
| `recipe_tags` | 食谱标签 |

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

### 关键特性

- **全文搜索** - 使用 trigram 索引
- **行级安全 (RLS)** - 已启用
- **自动更新时间戳** - 触发器自动维护
- **JSONB** - 营养信息存储
- **外键约束** - 支持 CASCADE 删除

## 🧪 测试

### 单元测试

```bash
# 运行所有单元测试
bun run test:run

# 带覆盖率报告
bun run test:unit

# 监听模式
bun run test

# UI 模式
bun run test:ui

# 运行单个测试文件
bun run vitest run cli/src/__tests__/config.test.ts
```

### E2E 测试

```bash
cd web

# 运行 E2E 测试
bun run test:e2e

# UI 模式
bun run test:e2e:ui

# 调试模式
bun run test:e2e:debug
```

## 🔧 开发命令

### 根目录命令

```bash
# 构建所有工作空间
bun run build

# 构建特定工作空间
bun run build:shared      # 构建 shared/types
bun run build:database    # 构建 database
bun run build:services    # 构建所有服务
bun run build:cli         # 构建 CLI

# 开发模式
bun run dev               # 启动 CLI 开发模式
bun run cli               # 直接运行 CLI

# 代码检查
bun run lint              # 运行 oxlint
```

### Web 应用命令

```bash
cd web

bun run dev               # 启动 Nuxt 开发服务器
bun run build             # 生产构建
bun run preview           # 预览生产构建

# 测试
bun run test              # Vitest 单元测试
bun run test:coverage     # 带覆盖率

# E2E 测试
bun run test:e2e          # 运行 E2E 测试
bun run test:e2e:ui       # UI 模式

# 代码质量
bun run lint              # oxlint + i18n 检查
bun run format            # Prettier 格式化
```

### 数据库命令

```bash
cd database

bun run db:generate       # 生成迁移
bun run db:migrate        # 运行迁移
bun run db:push           # 推送 schema 到数据库
bun run db:studio         # 打开 Drizzle Studio
```

## 🌐 技术栈

| 组件 | 技术 |
|------|------|
| 包管理器 | **Bun** v1.3.9+ |
| 语言 | TypeScript v6.0.2 (strict mode) |
| Monorepo | Workspace-based |
| 数据库 | PostgreSQL + **Drizzle ORM** v0.39.3 |
| Web 框架 | Nuxt 4.3.1 + Vue 3.5.28 |
| CLI | Commander.js v11.1.0 |
| 验证 | Zod v3.22.4 |
| 测试 | Vitest v4.1.2 |
| E2E 测试 | Playwright v1.58.2 |
| 样式 | TailwindCSS |
| i18n | @nuxtjs/i18n v10.2.3 (en, zh-CN) |
| PWA | @vite-pwa/nuxt v1.1.1 |
| 图片 | @nuxt/image v2.0.0 |

## 📝 示例数据

schema.sql 包含两个示例食谱：

1. **番茄炒蛋** (Tomato and Egg Stir-fry)
   - 分类：晚餐 | 菜系：中式 | 难度：简单
   - 准备时间：10分钟 | 烹饪时间：15分钟

2. **鱼香肉丝** (Fish-Flavored Shredded Pork)
   - 分类：晚餐 | 菜系：中式 | 难度：中等
   - 准备时间：20分钟 | 烹饪时间：15分钟

## 🚀 部署

### 部署 Web 到 Vercel

```bash
cd web
bun run build
vercel deploy
```

### 环境变量

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app
UPLOAD_DIR=./uploads
SITE_URL=http://localhost:3000
```

## 🔧 故障排除

### 配置文件未找到

错误：`Config file not found`

解决方案：创建 `.credentials/recipe-app-db.txt` 文件或设置 `DATABASE_URL` 环境变量。

### 数据库连接错误

错误：`Failed to fetch recipes`

检查：
1. DATABASE_URL 是否正确
2. PostgreSQL 服务是否运行
3. 表是否已创建

### Schema 未找到

错误：`relation "recipes" does not exist`

解决方案：运行 `schema.sql` 或使用 `bun run db:push`。

## 📚 相关文档

- [AGENTS.md](./AGENTS.md) - AI 编码助手指南
- [Drizzle ORM 文档](https://orm.drizzle.team/docs/overview)
- [Nuxt 文档](https://nuxt.com)
- [Commander.js 文档](https://github.com/tj/commander.js)
- [Zod 文档](https://zod.dev)

## 📝 许可证

MIT

---

**使用 ❤️ 构建，基于 TypeScript、Nuxt 4 和 PostgreSQL**
