# 架构设计文档

> Recipe App 系统架构设计说明

---

## 1. 系统概述

Recipe App 是一个全栈食谱管理系统，采用 **Monorepo** 架构，包含 CLI 工具和 Web 应用两种交互方式。

### 1.1 设计目标

- **类型安全**: 全栈 TypeScript + Zod 验证
- **模块化**: 服务层分离，职责单一
- **可扩展**: 支持多语言、多平台
- **高性能**: 数据库优化、缓存策略

### 1.2 技术选型

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 运行时 | Bun | 快速、原生 TypeScript 支持 |
| 语言 | TypeScript 6.0 | 类型安全、开发体验 |
| 数据库 | PostgreSQL + Drizzle | 类型安全 ORM、性能优秀 |
| Web 框架 | Nuxt 4 + Vue 3 | SSR、文件路由、生态完善 |
| CLI 框架 | Commander.js | 成熟稳定、社区活跃 |
| 验证 | Zod | 运行时类型验证、类型推导 |

---

## 2. 架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Recipe App                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   CLI App    │    │   Web App    │    │   Future     │       │
│  │  (Commander) │    │   (Nuxt 4)   │    │   Mobile     │       │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┘       │
│         │                   │                                    │
│         └─────────┬─────────┘                                    │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Service Layer                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │  Recipe     │ │   Image     │ │   Search    │          │ │
│  │  │  Service    │ │  Service    │ │  Service    │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Shared Types                             │ │
│  │              (Zod Schemas + TypeScript)                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Database Layer                            │ │
│  │              (Drizzle ORM + PostgreSQL)                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Monorepo 结构

```
recipe-app/
├── cli/                    # CLI 应用层
├── web/                    # Web 应用层
├── services/               # 服务层
│   ├── recipe/            # 食谱服务
│   ├── image/             # 图片服务
│   ├── search/            # 搜索服务
│   └── video/             # 视频服务
├── shared/
│   └── types/             # 共享类型定义
├── database/              # 数据库层
└── docs/                  # 文档
```

---

## 3. 分层设计

### 3.1 应用层 (Application Layer)

#### CLI 应用

- **职责**: 命令行交互、用户输入处理
- **技术**: Commander.js + Inquirer
- **特点**: 
  - 交互式命令
  - 彩色输出
  - 进度显示

#### Web 应用

- **职责**: Web 界面、API 端点
- **技术**: Nuxt 4 + Vue 3
- **特点**:
  - SSR 渲染
  - 文件路由
  - 自动导入
  - i18n 国际化

### 3.2 服务层 (Service Layer)

服务层是业务逻辑的核心，所有业务规则在此实现。

#### RecipeService

```typescript
class RecipeService {
  create(dto: CreateRecipeDTO): Promise<ServiceResponse<Recipe>>
  findById(id: string): Promise<ServiceResponse<Recipe>>
  findAll(filters, pagination): Promise<ServiceResponse<PaginatedResult>>
  update(id: string, dto: UpdateRecipeDTO): Promise<ServiceResponse<Recipe>>
  delete(id: string): Promise<ServiceResponse<void>>
  batchImport(recipes: CreateRecipeDTO[]): Promise<ServiceResponse<BatchImportResult>>
}
```

#### ImageService

```typescript
class ImageService {
  upload(file: Buffer, options?: ImageUploadOptions): Promise<ServiceResponse<{ url: string }>>
  delete(url: string): Promise<ServiceResponse<void>>
}
```

#### SearchService

```typescript
class SearchService {
  search(query: string, scope: SearchScope): Promise<ServiceResponse<SearchResult[]>>
  getSuggestions(query: string): Promise<ServiceResponse<SearchSuggestion[]>>
}
```

### 3.3 类型层 (Types Layer)

共享类型定义，使用 Zod 实现运行时验证。

```typescript
// Schema 定义
export const RecipeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  // ...
});

// 类型推导
export type Recipe = z.infer<typeof RecipeSchema>;
```

### 3.4 数据库层 (Database Layer)

使用 Drizzle ORM 管理数据库交互。

```typescript
// Schema 定义
export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }),
  // ...
});

// 关系定义
export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  steps: many(recipeSteps),
}));
```

---

## 4. 数据流设计

### 4.1 创建食谱流程

```
用户输入 → CLI/Web
    │
    ▼
Zod Schema 验证
    │
    ▼
RecipeService.create()
    │
    ├──▶ 开启事务
    │
    ├──▶ 插入 recipes 表
    │
    ├──▶ 插入 recipe_ingredients 表
    │
    ├──▶ 插入 recipe_steps 表
    │
    ├──▶ 插入 recipe_tags 表
    │
    ├──▶ 提交事务
    │
    ▼
返回 ServiceResponse<Recipe>
```

### 4.2 查询食谱流程

```
用户请求 → CLI/Web
    │
    ▼
RecipeService.findById(id)
    │
    ├──▶ 查询 recipes 表
    │
    ├──▶ 查询 recipe_ingredients 表
    │
    ├──▶ 查询 recipe_steps 表
    │
    ├──▶ 查询 recipe_tags 表
    │
    ▼
组装 Recipe 对象
    │
    ▼
返回 ServiceResponse<Recipe>
```

---

## 5. 错误处理设计

### 5.1 统一响应格式

```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### 5.2 错误码定义

| 错误码 | 描述 |
|--------|------|
| `NOT_FOUND` | 资源不存在 |
| `VALIDATION_ERROR` | 数据验证失败 |
| `DB_ERROR` | 数据库操作失败 |
| `UNKNOWN_ERROR` | 未知错误 |

### 5.3 错误处理示例

```typescript
async findById(id: string): Promise<ServiceResponse<Recipe>> {
  try {
    const recipe = await this.db.select()...;
    
    if (!recipe) {
      return errorResponse('NOT_FOUND', `Recipe ${id} not found`);
    }
    
    return successResponse(recipe);
  } catch (error) {
    return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', error);
  }
}
```

---

## 6. 国际化设计

### 6.1 支持的语言

- `en` - English
- `zh-CN` - 简体中文

### 6.2 翻译表设计

```
recipes (主表)
    │
    ├──▶ recipe_translations (食谱翻译)
    │
    ├──▶ ingredient_translations (食材翻译)
    │
    └──▶ step_translations (步骤翻译)
```

### 6.3 查询策略

```sql
-- 获取中文翻译
SELECT 
  r.id,
  COALESCE(rt.title, r.title) as title,
  COALESCE(rt.description, r.description) as description
FROM recipes r
LEFT JOIN recipe_translations rt 
  ON r.id = rt.recipe_id AND rt.locale = 'zh-CN'
```

---

## 7. 性能优化策略

### 7.1 数据库优化

- **索引**: title, category, cuisine 字段建立索引
- **全文搜索**: 使用 PostgreSQL trigram 索引
- **连接池**: 合理配置连接池大小

### 7.2 应用层优化

- **批量操作**: 使用事务批量插入
- **懒加载**: 按需加载关联数据
- **缓存**: 搜索结果缓存 (计划中)

### 7.3 Web 优化

- **SSR**: 服务端渲染首屏
- **代码分割**: 路由级别代码分割
- **图片优化**: @nuxt/image 自动优化

---

## 8. 安全设计

### 8.1 数据验证

- 所有输入通过 Zod Schema 验证
- SQL 注入防护 (Drizzle ORM 参数化查询)
- XSS 防护 (Vue 自动转义)

### 8.2 数据库安全

- Row Level Security (RLS) 已启用
- 外键约束 CASCADE 删除
- 敏感数据不记录日志

---

## 9. 部署架构

### 9.1 开发环境

```
Local Machine
    │
    ├──▶ PostgreSQL (本地)
    │
    ├──▶ CLI (bun run cli)
    │
    └──▶ Web Dev Server (bun run dev)
```

### 9.2 生产环境

```
Vercel (Web App)
    │
    ├──▶ PostgreSQL (Supabase/自建)
    │
    └──▶ Object Storage (图片/视频)
```

---

## 10. 扩展性设计

### 10.1 新增服务

1. 在 `services/` 创建新目录
2. 实现 Service 接口
3. 导出服务
4. 更新依赖

### 10.2 新增 CLI 命令

1. 在 `cli/src/commands/` 创建命令文件
2. 注册到 `cli/src/index.ts`
3. 添加测试

### 10.3 新增 API 端点

1. 在 `web/server/api/` 创建端点文件
2. 使用 defineEventHandler
3. 添加 E2E 测试

---

## 11. 监控与日志

### 11.1 日志策略

- CLI: 控制台输出
- Web: 服务端日志
- 错误: 详细堆栈信息

### 11.2 性能监控

- API 响应时间
- 数据库查询时间
- 页面加载时间

---

**文档版本**: 1.0  
**Commit**: [`adb26e9`](https://github.com/leiyunkang7/recipe-app/commit/adb26e9b72f7569283201b389feabc4f85279a36)  
**最后更新**: 2026-04-05

> 此文档与代码版本关联，用于增量更新。详见 [.version.md](./.version.md)
