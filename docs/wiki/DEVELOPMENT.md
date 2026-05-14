# 开发指南

> Recipe App 开发者完整指南

---

## 1. 开发环境设置

### 1.1 系统要求

| 软件 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | JavaScript 运行时 |
| Bun | 1.3.9+ | 包管理器 |
| PostgreSQL | 14+ | 数据库 |
| Git | 2.x | 版本控制 |

### 1.2 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/your-repo/recipe-app.git
cd recipe-app

# 2. 安装 Bun (如果未安装)
curl -fsSL https://bun.sh/install | bash

# 3. 安装依赖
bun install

# 4. 配置数据库
cp .env.example .env
# 编辑 .env 设置 DATABASE_URL

# 5. 初始化数据库
psql -d recipe_app -f schema.sql
# 或
cd database && bun run db:push

# 6. 构建项目
bun run build

# 7. 启动开发服务器
cd web && bun run dev
```

---

## 2. 项目结构

### 2.1 Monorepo 结构

```
recipe-app/
├── cli/                    # CLI 应用
│   ├── src/
│   │   ├── commands/       # CLI 命令
│   │   ├── __tests__/      # 测试
│   │   └── index.ts        # 入口
│   └── package.json
│
├── database/               # 数据库层
│   ├── src/
│   │   └── schema/         # Drizzle schemas
│   └── package.json
│
├── services/               # 服务层
│   ├── recipe/            # 食谱服务
│   ├── image/             # 图片服务
│   ├── search/            # 搜索服务
│   └── video/             # 视频服务
│
├── shared/
│   └── types/             # 共享类型
│       ├── src/
│       │   ├── index.ts   # Zod schemas
│       │   └── __tests__/
│       └── package.json
│
├── web/                    # Web 应用
│   ├── app/               # Nuxt app
│   ├── server/            # API
│   ├── e2e/               # E2E 测试
│   └── package.json
│
├── docs/                   # 文档
├── migrations/             # 迁移文件
└── package.json           # 根 package.json
```

### 2.2 工作空间配置

```json
// package.json
{
  "workspaces": [
    "shared/*",
    "services/*",
    "cli",
    "database"
  ]
}
```

---

## 3. 编码规范

### 3.1 TypeScript 规范

```typescript
// 使用显式类型，避免 any
function processData(data: Recipe): ProcessedRecipe {
  // ...
}

// 使用 Zod 进行运行时验证
const result = RecipeSchema.safeParse(data);
if (!result.success) {
  return errorResponse('VALIDATION_ERROR', result.error.message);
}

// 使用类型推导
type Recipe = z.infer<typeof RecipeSchema>;
```

### 3.2 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| 类型/接口 | PascalCase | `Recipe`, `ServiceResponse` |
| 函数 | camelCase | `createRecipe`, `findById` |
| 变量 | camelCase | `recipeId`, `totalCount` |
| 常量 | UPPER_SNAKE | `DEFAULT_LOCALE` |
| 文件 | kebab-case | `recipe-service.ts` |
| 组件 | PascalCase | `RecipeCard.vue` |

### 3.3 导入顺序

```typescript
// 1. 外部依赖
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

// 2. 内部别名
import { Recipe, ServiceResponse } from '@recipe-app/shared-types';
import { recipes } from '@recipe-app/database';

// 3. 相对导入
import { helper } from './utils';
import type { LocalType } from './types';
```

### 3.4 JSDoc 注释

```typescript
/**
 * 创建新食谱
 * @param dto - 创建食谱的数据传输对象
 * @returns 包含创建的食谱或错误的服务响应
 */
async create(dto: CreateRecipeDTO): Promise<ServiceResponse<Recipe>> {
  // ...
}
```

---

## 4. 服务层开发

### 4.1 创建新服务

1. 创建服务目录:

```bash
mkdir -p services/new-service/src
```

2. 创建 `package.json`:

```json
{
  "name": "@recipe-app/new-service",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@recipe-app/shared-types": "workspace:*",
    "@recipe-app/database": "workspace:*"
  }
}
```

3. 实现服务:

```typescript
// services/new-service/src/service.ts
import { ServiceResponse, successResponse, errorResponse } from '@recipe-app/shared-types';
import { Database } from '@recipe-app/database';

export class NewService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async doSomething(): Promise<ServiceResponse<void>> {
    try {
      // 业务逻辑
      return successResponse(undefined);
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'An error occurred', error);
    }
  }
}
```

4. 导出服务:

```typescript
// services/new-service/src/index.ts
export { NewService } from './service';
```

---

## 5. CLI 开发

### 5.1 添加新命令

1. 创建命令文件:

```typescript
// cli/src/commands/new-command.ts
import { Command } from 'commander';
import { RecipeService } from '@recipe-app/recipe-service';

export function registerNewCommand(program: Command) {
  program
    .command('new-command <arg>')
    .description('Description of the command')
    .option('-o, --option <value>', 'Option description')
    .action(async (arg, options) => {
      const service = new RecipeService(db);
      // 命令逻辑
    });
}
```

2. 注册命令:

```typescript
// cli/src/index.ts
import { registerNewCommand } from './commands/new-command';

// ...
registerNewCommand(program);
```

3. 添加测试:

```typescript
// cli/src/__tests__/new-command.test.ts
import { describe, it, expect } from 'vitest';

describe('new-command', () => {
  it('should do something', async () => {
    // 测试逻辑
  });
});
```

---

## 6. Web 开发

### 6.1 添加新页面

1. 创建页面文件:

```vue
<!-- web/app/pages/new-page.vue -->
<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div>
    <h1>{{ t('newPage.title') }}</h1>
  </div>
</template>
```

2. 添加翻译:

```json
// web/locales/zh-CN.json
{
  "newPage": {
    "title": "新页面"
  }
}
```

### 6.2 添加新组件

```vue
<!-- web/app/components/NewComponent.vue -->
<script setup lang="ts">
interface Props {
  title: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
});

const emit = defineEmits<{
  click: [value: string];
}>();
</script>

<template>
  <div class="new-component">
    <h2>{{ title }}</h2>
    <button @click="emit('click', 'clicked')">
      Click me
    </button>
  </div>
</template>
```

### 6.3 添加新 API

```typescript
// web/server/api/new-endpoint.ts
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  // 业务逻辑
  
  return {
    success: true,
    data: result,
  };
});
```

---

## 7. 数据库开发

### 7.1 添加新表

```typescript
// database/src/schema/new-table.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const newTable = pgTable('new_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

### 7.2 添加关系

```typescript
export const newTableRelations = relations(newTable, ({ one }) => ({
  recipe: one(recipes, {
    fields: [newTable.recipeId],
    references: [recipes.id],
  }),
}));
```

### 7.3 生成迁移

```bash
cd database
bun run db:generate
bun run db:migrate
```

---

## 8. 测试

### 8.1 单元测试

```typescript
// __tests__/example.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('Example', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
```

### 8.2 E2E 测试

```typescript
// e2e/example.spec.ts
import { test, expect } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Recipe App/);
});
```

### 8.3 测试命令

```bash
# 运行所有单元测试
bun run test:run

# 运行特定测试文件
bun run vitest run cli/src/__tests__/add.test.ts

# E2E 测试
cd web && bun run test:e2e

# E2E UI 模式
cd web && bun run test:e2e:ui
```

---

## 9. Git 工作流

### 9.1 分支策略

```
main        # 生产分支
develop     # 开发分支
feature/*   # 功能分支
fix/*       # 修复分支
```

### 9.2 提交规范

```
feat: 添加新功能
fix: 修复 bug
refactor: 代码重构
perf: 性能优化
test: 添加测试
docs: 文档更新
chore: 构建/工具变更
style: 代码格式
```

### 9.3 提交示例

```bash
git add .
git commit -m "feat: 添加食谱评分功能"
git push origin feature/rating
```

---

## 10. 调试

### 10.1 CLI 调试

```bash
# 启用调试模式
DEBUG=* recipe list

# 使用 Node 调试器
bun --inspect run cli/dist/index.js list
```

### 10.2 Web 调试

```bash
# 开发模式自动热重载
cd web && bun run dev

# 查看服务端日志
# 日志输出到控制台
```

### 10.3 数据库调试

```bash
# 使用 Drizzle Studio
cd database && bun run db:studio

# 直接查询
psql -d recipe_app -c "SELECT * FROM recipes LIMIT 5;"
```

---

## 11. 常见问题

### 11.1 构建错误

**问题**: TypeScript 编译错误

**解决**:
```bash
# 清理并重新构建
rm -rf dist node_modules
bun install
bun run build
```

### 11.2 数据库连接错误

**问题**: `connection refused`

**解决**:
```bash
# 检查 PostgreSQL 是否运行
pg_isready

# 检查连接字符串
echo $DATABASE_URL
```

### 11.3 依赖问题

**问题**: 依赖版本冲突

**解决**:
```bash
# 清理并重新安装
rm -rf node_modules bun.lockb
bun install
```

---

## 12. 发布流程

### 12.1 版本更新

```bash
# 更新版本号
npm version patch  # 或 minor / major

# 推送标签
git push --tags
```

### 12.2 部署

```bash
# Web 部署到 Vercel
cd web
vercel deploy --prod

# CLI 发布到 npm
cd cli
npm publish
```

---

**文档版本**: 1.0  
**Commit**: [`adb26e9`](https://github.com/leiyunkang7/recipe-app/commit/adb26e9b72f7569283201b389feabc4f85279a36)  
**最后更新**: 2026-04-05

> 此文档与代码版本关联，用于增量更新。详见 [.version.md](./.version.md)
