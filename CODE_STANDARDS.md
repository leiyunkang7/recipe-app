# Recipe App 代码规范

> 本文档定义了 Recipe App 项目的代码编写标准和最佳实践。

## 目录

- [TypeScript 规范](#typescript-规范)
- [Vue 组件规范](#vue-组件规范)
- [服务层规范](#服务层规范)
- [数据库规范](#数据库规范)
- [测试规范](#测试规范)
- [命名规范](#命名规范)
- [代码格式](#代码格式)

---

## TypeScript 规范

### 严格模式

所有 TypeScript 配置必须启用严格模式。

### 类型定义

- 使用显式类型，避免 any
- 使用 unknown 代替 any 当类型未知时
- 使用 Zod Schemas 进行运行时验证

### Zod Schema 模式

```typescript
import { z } from "zod";

export const RecipeSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  prepTimeMinutes: z.number().int().min(0),
  cookTimeMinutes: z.number().int().min(0),
  difficulty: z.enum(["easy", "medium", "hard"]),
  ingredients: z.array(z.string()).min(1),
  steps: z.array(z.object({
    order: z.number().int().positive(),
    instruction: z.string().min(1)
  })).min(1)
});

export type Recipe = z.infer<typeof RecipeSchema>;
```

---

## Vue 组件规范

### 组件结构顺序

1. 类型导入
2. Props / Emits 定义
3. Composables 使用
4. 响应式状态
5. 计算属性
6. 方法
7. 生命周期钩子

### Props 定义

使用 withDefaults 和 defineProps：

```typescript
interface Props {
  title: string;
  count?: number;
  items: string[];
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  items: () => []
});
```

---

## 服务层规范

### ServiceResponse 模式

所有服务必须返回 ServiceResponse<T> 类型：

```typescript
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function successResponse<T>(data: T): ServiceResponse<T> {
  return { success: true, data };
}

export function errorResponse<T>(code: string, message: string, details?: unknown): ServiceResponse<T> {
  return { success: false, error: { code, message, details } };
}
```

### 错误码规范

| 错误码 | 描述 | HTTP 状态码 |
|--------|------|-------------|
| VALIDATION_ERROR | 数据验证失败 | 400 |
| INVALID_ID | 无效的 ID 格式 | 400 |
| NOT_FOUND | 资源不存在 | 404 |
| UNAUTHORIZED | 未授权 | 401 |
| FORBIDDEN | 权限不足 | 403 |
| DB_ERROR | 数据库错误 | 500 |
| INTERNAL_ERROR | 内部错误 | 500 |

---

## 数据库规范

### 命名约定

| 层级 | 风格 | 示例 |
|------|------|------|
| TypeScript | camelCase | prepTimeMinutes |
| Database | snake_case | prep_time_minutes |
| 文件 | kebab-case | recipe-service.ts |

---

## 测试规范

### 测试文件位置

| 类型 | 位置 | 命名 |
|------|------|------|
| 单元测试 | 同目录或 __tests__/ | *.test.ts |
| E2E 测试 | web/e2e/ | *.spec.ts |

### 覆盖率要求

- 行覆盖率：100%
- 函数覆盖率：100%
- 分支覆盖率：100%
- 语句覆盖率：100%

---

## 命名规范

### 文件命名

| 类型 | 风格 | 示例 |
|------|------|------|
| TypeScript 文件 | kebab-case | recipe-service.ts |
| Vue 组件 | PascalCase | RecipeCard.vue |
| 测试文件 | 同名+.test | recipe-service.test.ts |

### 变量和函数

| 类型 | 风格 | 示例 |
|------|------|------|
| 变量 | camelCase | recipeId, isLoading |
| 函数 | camelCase | createRecipe, findById |
| 类 | PascalCase | RecipeService |
| 常量 | UPPER_SNAKE | DEFAULT_LOCALE |

### Vue 特定

| 类型 | 风格 | 示例 |
|------|------|------|
| Composables | camelCase + use 前缀 | useRecipes, useAuth |
| 组件 | PascalCase | RecipeCard |
| Props | camelCase | recipeId, isActive |
| 事件 | kebab-case | recipe-updated |

---

## 代码格式

### 格式化命令

```bash
cd web && bun run format    # 格式化
cd web && bun run lint      # Lint 检查
```

### 提交前检查

```bash
bun run build && bun run test:run && cd web && bun run lint && bun run format
```

---

## 相关文档

- [CONTRIBUTING.md](./CONTRIBUTING.md) - 贡献指南
- [AGENTS.md](./AGENTS.md) - AI 编码规范
- [CLAUDE.md](./CLAUDE.md) - 项目概述
