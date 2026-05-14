---
name: migrate-supabase-to-local-db
overview: 将 recipe-app 从 Supabase 完全迁移到本地 PostgreSQL，使用 pg/drizzle-orm 替代 @supabase/supabase-js，使用本地文件系统替代 Supabase Storage，暂时禁用认证相关功能。
todos:
  - id: init-database-workspace
    content: 创建 database/ 工作区包，定义 drizzle schema、连接工厂和迁移配置
    status: completed
  - id: rewrite-services-cli
    content: 重写 4 个 Services（recipe/search/image/video）和 CLI config 使用 drizzle-orm + 本地文件系统
    status: completed
    dependencies:
      - init-database-workspace
  - id: create-web-api-routes
    content: 创建 Nuxt Server API 路由（recipes CRUD、search、categories、文件上传）
    status: completed
    dependencies:
      - init-database-workspace
  - id: migrate-web-composables
    content: 迁移 Web composables 从 Supabase 客户端改为 API 调用，禁用 auth 功能，更新 mocks
    status: completed
    dependencies:
      - create-web-api-routes
  - id: cleanup-supabase
    content: 移除所有 Supabase 依赖、配置、PWA 规则，更新文档和环境变量模板
    status: completed
    dependencies:
      - rewrite-services-cli
      - migrate-web-composables
---

## Product Overview

将 Recipe App 从 Supabase 完全迁移到本地 PostgreSQL 数据库，移除所有 Supabase SDK 依赖。涉及 CLI 工具、Services 层、Web 前端/后端的全面重构。

## Core Features

- 使用 drizzle-orm 替代 @supabase/supabase-js 连接 PostgreSQL
- 使用本地文件系统替代 Supabase Storage
- 为 Web 端创建 Nuxt Server API 路由替代 Supabase PostgREST
- 暂时禁用依赖 Supabase Auth 的功能（favorites/ratings）
- CLI 工具改用 PostgreSQL 连接字符串配置
- 更新所有测试和 mock 以适配新架构

## Tech Stack Selection

- **ORM**: drizzle-orm (类型安全的 TypeScript ORM，与项目 Zod 模式契合)
- **PostgreSQL 驱动**: pg (node-postgres)
- **文件上传**: multiparty (Nuxt/Nitro 兼容的 multipart 解析)
- **文件存储**: 本地文件系统 (`server/uploads/` 目录)
- **Web API**: Nuxt Server Routes (Nitro event handlers)
- **数据库迁移**: drizzle-kit

## Implementation Approach

采用自底向上分层迁移策略：先建立数据库层，再逐层向上替换（Services -> CLI -> Web Server API -> Web Composables），最后清理。每层替换后保持原有 `ServiceResponse<T>` 返回模式不变，减少上层改动。

**关键决策**:

1. **drizzle-orm 而非 pg 原生查询**: 项目已重度使用 TypeScript + Zod，drizzle-orm 提供类型安全的 schema 定义和查询构建，与现有代码风格一致。
2. **Web 端 API 路由而非直连数据库**: 当前 Web 端通过 Supabase 客户端直接访问数据库（PostgREST），迁移后改为通过 Nuxt Server API 路由访问，保持前后端分离架构。
3. **保留数据库表结构**: 包括 recipe_translations 等 i18n 表和 favorites/ratings 表（后者在 API 层禁用，不删除表结构，便于未来恢复）。
4. **Schema 合并策略**: 综合现有 schema.sql 和 SCHEMA-HINTS.md，recipes 表同时包含 `title`/`description` 列和 `recipe_translations` 关联表，兼容 CLI 和 Web 两种使用模式。

## Architecture Design

```mermaid
graph TD
    subgraph "Before (Supabase)"
        CLI[CLI Tool] --> SupabaseSDK[@supabase/supabase-js]
        WebComposables[Web Composables] --> SupabaseSDK
        SupabaseSDK --> SupabaseAPI[Supabase PostgREST API]
        SupabaseSDK --> SupabaseAuth[Supabase Auth]
        SupabaseSDK --> SupabaseStorage[Supabase Storage]
    end

    subgraph "After (Local PostgreSQL)"
        CLI2[CLI Tool] --> Services2[Services Layer]
        Services2 --> Drizzle[drizzle-orm]
        Drizzle --> PG[(Local PostgreSQL)]
        WebComposables2[Web Composables] --> APIFetch[$fetch / useFetch]
        APIFetch --> ServerAPI[Nuxt Server API Routes]
        ServerAPI --> Drizzle
        ServerAPI --> LocalFS[Local File System]
    end
```

## Directory Structure

```
recipe-app/
├── database/                          # [NEW] 数据库工作区包
│   ├── package.json                   # [NEW] @recipe-app/database 包定义
│   ├── tsconfig.json                  # [NEW] TypeScript 配置
│   ├── drizzle.config.ts              # [NEW] drizzle-kit 迁移配置
│   ├── src/
│   │   ├── index.ts                   # [NEW] 导出 schema, client, 连接工具
│   │   ├── schema/                    # [NEW] drizzle schema 定义
│   │   │   ├── index.ts               # [NEW] 统一导出
│   │   │   ├── recipes.ts             # [NEW] recipes, recipe_ingredients, recipe_steps, recipe_tags
│   │   │   ├── i18n.ts                # [NEW] recipe_translations, ingredient/step translations
│   │   │   ├── taxonomy.ts            # [NEW] categories, cuisines 及翻译表
│   │   │   ├── favorites.ts           # [NEW] favorites, favorite_folders, recipe_ratings
│   │   │   └── common.ts              # [NEW] 共享工具（uuid, timestamps）
│   │   ├── client.ts                  # [NEW] 数据库连接工厂
│   │   └── migrate.ts                 # [NEW] 迁移运行脚本
│   └── migrations/                    # [NEW] drizzle-kit 自动生成的迁移文件
│
├── cli/
│   └── src/
│       └── config.ts                  # [MODIFY] 读取 DATABASE_URL 替代 Supabase 凭证
│
├── services/
│   ├── recipe/src/
│   │   └── service.ts                 # [MODIFY] 使用 drizzle-orm 替代 Supabase client
│   ├── search/src/
│   │   └── service.ts                 # [MODIFY] 使用 drizzle-orm 替代 Supabase client
│   ├── image/src/
│   │   └── service.ts                 # [MODIFY] 使用本地文件系统替代 Supabase Storage
│   └── video/src/
│       └── service.ts                 # [MODIFY] 使用本地文件系统替代 Supabase Storage
│
├── web/
│   ├── nuxt.config.ts                 # [MODIFY] 移除 Supabase runtimeConfig, PWA 规则
│   ├── app/
│   │   ├── plugins/
│   │   │   └── supabase.ts            # [DELETE] 删除 Supabase 客户端插件
│   │   ├── composables/
│   │   │   ├── useRecipeQueries.ts    # [MODIFY] 改用 $fetch 调用 API
│   │   │   ├── useRecipeMutations.ts  # [MODIFY] 改用 $fetch 调用 API
│   │   │   ├── useFavorites.ts        # [MODIFY] 暂时禁用（添加早期返回）
│   │   │   ├── useRecipeRating.ts     # [MODIFY] 暂时禁用（添加早期返回）
│   │   │   ├── useImageUpload.ts      # [MODIFY] 改用 API 上传到本地
│   │   │   ├── useNutritionStats.ts   # [MODIFY] 改用 API 查询
│   │   │   ├── useBaseUrl.ts          # [MODIFY] 返回本地 API base URL
│   │   │   └── __mocks__/nuxtApp.ts   # [MODIFY] 替换 Supabase mock
│   │   └── utils/
│   │       └── recipeMapper.ts        # [MODIFY] 简化（API 已处理映射）
│   ├── server/
│   │   ├── api/                       # [NEW] Nuxt Server API 路由
│   │   │   ├── recipes/
│   │   │   │   ├── index.ts           # [NEW] GET (list) + POST (create)
│   │   │   │   └── [id].ts            # [NEW] GET (detail) + PATCH (update) + DELETE
│   │   │   ├── search.ts              # [NEW] GET 搜索
│   │   │   ├── categories.ts          # [NEW] GET 分类列表
│   │   │   ├── cuisines.ts            # [NEW] GET 菜系列表
│   │   │   └── uploads/
│   │   │       ├── image.ts           # [NEW] POST 图片上传
│   │   │       └── video.ts           # [NEW] POST 视频上传
│   │   ├── api/
│   │   │   ├── sitemap.ts             # [MODIFY] 使用 drizzle-orm 替代 Supabase
│   │   │   └── robots.ts              # [MODIFY] 移除 Supabase URL 引用
│   │   └── utils/
│   │       └── db.ts                  # [NEW] 服务端数据库连接实例
│   ├── server/
│   │   └── uploads/                   # [NEW] 本地文件存储目录（gitignore）
│   └── package.json                   # [MODIFY] 移除 @supabase/supabase-js
│
├── shared/types/src/
│   └── index.ts                       # [MODIFY] 移除 Supabase 类型引用（如有）
│
├── .env.example                       # [MODIFY] 更新环境变量模板
└── schema.sql                         # [KEEP] 保留作为参考文档
```

## Key Code Structures

### 数据库连接工厂 (database/src/client.ts)

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

export function createDb(connectionString: string) {
  const pool = new pg.Pool({ connectionString });
  return drizzle(pool);
}
```

### Drizzle Schema 示例 (database/src/schema/recipes.ts)

```typescript
import { pgTable, uuid, varchar, integer, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  cuisine: varchar('cuisine', { length: 100 }),
  servings: integer('servings').notNull(),
  prepTimeMinutes: integer('prep_time_minutes').notNull(),
  cookTimeMinutes: integer('cook_time_minutes').notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  imageUrl: text('image_url'),
  source: text('source'),
  videoUrl: text('video_url'),
  sourceUrl: text('source_url'),
  nutritionInfo: jsonb('nutrition_info'),
  views: integer('views').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

### API 路由示例 (web/server/api/recipes/index.ts)

```typescript
export default defineEventHandler(async (event) => {
  const method = event.method;
  if (method === 'GET') { /* list recipes */ }
  if (method === 'POST') { /* create recipe */ }
});
```

## Implementation Notes

1. **ServiceResponse 模式保持不变**: 所有 service 方法仍返回 `ServiceResponse<T>`，上层代码改动最小。
2. **snake_case 映射**: drizzle-orm 原生支持 `snake_case` 列名映射到 `camelCase` TypeScript 属性，通过 `columns` 配置实现。
3. **事务支持**: drizzle-orm 原生支持 `db.transaction()`，可替代当前 service 层的手动 rollback 补偿逻辑，提升数据一致性。
4. **文件上传**: Nuxt/Nitro 使用 `readMultipartFormData()` 解理上传文件，存储到 `server/uploads/` 目录，通过 `/uploads/` 路径提供公开访问。
5. **环境变量**: `DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app`，`UPLOAD_DIR=server/uploads`。
6. **PWA 缓存**: 移除 `supabase.co`/`supabase.in` 域名的 CacheFirst 规则，替换为本地 API 域名。
7. **测试**: 更新 `__mocks__/nuxtApp.ts` 移除 Supabase mock；services 测试需要 mock drizzle-orm 的 `db` 实例。
8. **向后兼容**: `mapToRecipe()` 在 service 层使用 drizzle 的列映射自动处理 snake_case -> camelCase；`recipeMapper.ts` 在前端可简化。

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 在迁移过程中搜索和定位所有 Supabase 相关代码引用，确保无遗漏
- Expected outcome: 生成完整的 Supabase 引用清单，涵盖代码、配置、测试、文档