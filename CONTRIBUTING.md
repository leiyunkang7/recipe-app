# Recipe App 贡献指南

感谢您对 Recipe App 的贡献！本文档提供了参与项目开发所需的完整指南。

## 目录

- [快速开始](#快速开始)
- [开发环境设置](#开发环境设置)
- [项目结构](#项目结构)
- [代码规范](#代码规范)
- [Git 工作流程](#git-工作流程)
- [测试要求](#测试要求)
- [提交信息规范](#提交信息规范)
- [问题报告](#问题报告)

---

## 快速开始

```bash
# 克隆项目
git clone https://github.com/your-fork/recipe-app.git
cd recipe-app

# 安装依赖
bun install

# 启动开发服务器
cd web && bun run dev
```

访问 http://localhost:3000 查看应用。

---

## 开发环境设置

### 环境要求

| 工具 | 版本要求 |
|------|----------|
| Node.js | 18+ |
| Bun | 1.3.9+ |
| PostgreSQL | 任意稳定版本 |

### 环境变量配置

复制 `.env.example` 并创建 `.env` 文件：

```bash
cp .env.example .env
```

或设置环境变量：

```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app
export SITE_URL=http://localhost:3000
```

### 数据库初始化

```bash
# 使用 schema.sql 初始化
psql -d recipe_app -f schema.sql

# 或使用 Drizzle ORM
cd database && bun run db:push
```

---

## 项目结构

```
recipe-app/
├── web/                      # Nuxt 4 前端应用
│   ├── app/
│   │   ├── pages/           # 页面 (index, recipes, admin, favorites)
│   │   ├── components/      # Vue 组件
│   │   │   ├── admin/       # 管理后台组件
│   │   │   ├── icons/       # SVG 图标组件
│   │   │   ├── recipe/      # 食谱详情组件
│   │   │   └── nutrition/   # 营养信息组件
│   │   ├── composables/     # Vue Composables (useXxx)
│   │   ├── layouts/         # 页面布局
│   │   └── types/           # TypeScript 类型定义
│   ├── server/
│   │   ├── api/             # API 端点
│   │   └── utils/           # 服务端工具函数
│   ├── locales/             # i18n 翻译文件 (en, zh-CN, ja)
│   └── e2e/                 # Playwright E2E 测试
├── cli/                      # Commander.js CLI 工具
│   └── src/commands/        # CLI 命令实现
├── database/                # Drizzle ORM Schema
│   └── src/schema/          # 数据库表定义
├── services/                # 业务服务层
│   ├── recipe/              # 食谱 CRUD 服务
│   ├── image/               # 图片处理服务
│   └── search/              # 搜索服务
└── shared/
    └── types/               # 共享类型和 Zod Schemas
```

---

## 代码规范

### TypeScript

项目使用 **TypeScript 严格模式**：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

**规则：**
- 使用显式类型，避免 `any`
- 使用 Zod Schemas 进行运行时验证
- 禁止使用 `as any` 跳过类型检查

```typescript
// 正确做法
interface Recipe {
  id: string;
  title: string;
  prepTimeMinutes: number;
}

// 避免这样做
const recipe: any = fetchRecipe();
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 类型/接口 | PascalCase | `Recipe`, `ServiceResponse` |
| 函数/变量 | camelCase | `createRecipe`, `recipeId` |
| 常量 | UPPER_SNAKE | `DEFAULT_LOCALE` |
| 文件 | kebab-case | `recipe-service.ts` |
| Vue 组件 | PascalCase | `RecipeCard.vue`, `CookingMode.vue` |
| Composables | camelCase (use 前缀) | `useRecipes`, `useAuth` |
| 测试文件 | 与源文件同名 | `useRecipes.test.ts` |

### Vue 组件规范

**组件结构顺序：**

```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup lang="ts">
// 1. 类型导入
// 2. Props / Emits 定义
// 3. Composables 使用
// 4. 响应式状态
// 5. 计算属性
// 6. 方法
// 7. 生命周期钩子
</script>

<style scoped>
/* 样式 */
</style>
```

**组件设计原则：**
- 单一职责：每个组件只做一件事
- Props 验证：使用 `defineProps` 和 `withDefaults`
- 事件命名：使用 kebab-case (`@recipe-updated`)
- 组件通信：优先使用 `provide`/`inject` 或 Pinia

```vue
<script setup lang="ts">
// Props 定义带验证
interface Props {
  recipe: Recipe;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
});

// Emits 定义
const emit = defineEmits<{
  (e: 'recipe-updated', id: string): void;
  (e: 'recipe-deleted', id: string): void;
}>();
</script>
```

### 服务层规范

所有服务返回 `ServiceResponse<T>` 统一格式：

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

function successResponse<T>(data: T): ServiceResponse<T>
function errorResponse<T>(code: string, message: string, details?: unknown): ServiceResponse<T>
```

### 数据库命名

| 层级 | 命名风格 | 示例 |
|------|----------|------|
| TypeScript | camelCase | `prepTimeMinutes` |
| Database | snake_case | `prep_time_minutes` |

映射在 service 层处理。

---

## Git 工作流程

### 分支命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 功能 | `feature/描述` | `feature/add-recipe-sharing` |
| 修复 | `fix/描述` | `fix/login-redirect-loop` |
| 重构 | `refactor/描述` | `refactor/recipe-service` |
| 文档 | `docs/描述` | `docs/update-api-docs` |

### 开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/add-recipe-export

# 2. 开发...
# 3. 保持主分支同步
git fetch origin
git rebase origin/master

# 4. 提交 (遵循 commit convention)
git commit -m "feat(recipe): add JSON export functionality"

# 5. 推送
git push origin feature/add-recipe-export

# 6. 创建 Pull Request
```

### Pull Request 要求

- 标题清晰描述变更内容
- 包含变更说明和动机
- 关联相关 Issue
- 通过所有 CI 检查
- 包含测试（如果适用）

---

## 测试要求

### 测试命令

```bash
# 单元测试
bun run test

# 运行所有测试 (CI)
bun run test:run

# 带覆盖率
bun run test:coverage

# E2E 测试
cd web && bun run test:e2e

# E2E UI 模式
cd web && bun run test:e2e:ui
```

### 测试规范

- 测试文件与源文件同名，位于 `__tests__` 目录或 `*.test.ts` 后缀
- 使用 Vitest 进行单元测试
- 使用 Playwright 进行 E2E 测试
- 新功能必须包含测试

```typescript
// 示例: composables/useRecipes.test.ts
import { describe, it, expect } from 'vitest';
import { useRecipes } from '../useRecipes';

describe('useRecipes', () => {
  it('should fetch recipes', async () => {
    const { recipes, fetchRecipes } = useRecipes();
    await fetchRecipes();
    expect(recipes.value).toBeDefined();
  });
});
```

### 提交前检查

```bash
# 1. 运行构建
bun run build

# 2. 运行测试
bun run test:run

# 3. 运行 Lint
cd web && bun run lint

# 4. 格式化代码
cd web && bun run format
```

---

## 提交信息规范

项目使用 **Conventional Commits** 格式：

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 类型 (Type)

| 类型 | 描述 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能）|
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具变更 |

### 范围 (Scope)

| 范围 | 描述 |
|------|------|
| `recipe-app` | 主应用 |
| `cli` | 命令行工具 |
| `web` | Web 应用 |
| `recipe` | 食谱功能 |
| `auth` | 认证 |
| `i18n` | 国际化 |

### 示例

```
feat(recipe): add recipe export to JSON format

Fix login redirect loop when session expires

chore(deps): upgrade Nuxt to v4.3.1
```

---

## 问题报告

### Bug 报告

请包含以下信息：

1. **问题描述** - 清晰描述问题
2. **复现步骤** - 逐步说明如何复现
3. **预期行为** - 应该发生什么
4. **实际行为** - 实际发生了什么
5. **环境信息** - OS、Node 版本、Bun 版本等
6. **日志/截图** - 相关错误信息

### 功能请求

请包含：

1. **用例** - 描述使用场景
2. **当前解决方案** - 现在如何实现
3. **建议方案** - 您希望如何实现
4. **替代方案** - 其他可能的方案

---

## 开发资源

- [CLAUDE.md](./CLAUDE.md) - AI 助手指南
- [AGENTS.md](./AGENTS.md) - AI 编码规范
- [DEEPWIKI.md](./DEEPWIKI.md) - 架构分析

---

## 许可证

通过贡献代码，您同意将您的作品按 MIT 许可证发布。
