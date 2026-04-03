# CLAUDE.md - recipe-app

> Project context for AI coding assistants (Claude Code, etc.)

## 项目概述

- **项目**: 食谱管理应用 (Recipe App)
- **技术栈**: Nuxt 3 + Vue 3 + Supabase + TailwindCSS + Bun
- **线上地址**: https://web-mu-woad-35.vercel.app
- **状态**: Sprint 4 阶段，持续迭代中

## 目录结构

```
recipe-app/
├── web/                    # Nuxt 3 前端应用
│   ├── app/                 # Nuxt 3 应用目录 (app.vue, pages, components)
│   │   ├── pages/           # 页面 (首页、详情页、管理后台)
│   │   ├── components/      # Vue 组件
│   │   └── composables/    # Vue composables
│   ├── cli/                 # Commander.js CLI 工具
│   ├── services/            # 业务服务 (recipe, image, search)
│   ├── shared/              # 共享类型 + Zod schemas
│   └── supabase/            # Supabase 配置
```

## 构建命令

```bash
# 前端
cd web && bun install && bun run dev      # 开发 (localhost:3000)
cd web && bun run build                   # 生产构建
cd web && bun run preview                 # 预览构建

# 全量构建
bun run build
bun run test:run                          # 运行所有测试
```

## 代码规范

### TypeScript
- **严格模式** 启用
- 避免使用 `any`，使用显式类型
- Zod schemas 用于运行时验证

### 命名规范
| 类型 | 规范 | 示例 |
|------|------|------|
| 类型/接口 | PascalCase | `Recipe`, `ServiceResponse` |
| 函数/变量 | camelCase | `createRecipe`, `recipeId` |
| 常量 | UPPER_SNAKE | `DEFAULT_LOCALE` |
| 文件 | kebab-case | `recipe-service.ts` |

### 错误处理模式
所有服务返回 `ServiceResponse<T>`:
```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: any };
}

function successResponse<T>(data: T): ServiceResponse<T>
function errorResponse<T>(code: string, message: string, details?: any): ServiceResponse<T>
```

### 数据库命名
- TypeScript: camelCase (`prepTimeMinutes`)
- Database: snake_case (`prep_time_minutes`)
- 在 service 层做映射

## 关键文件

- `web/app.vue` - 根组件
- `web/app/pages/index.vue` - 首页
- `web/app/pages/recipes/[id].vue` - 食谱详情页
- `web/app/components/` - 可复用组件库
- `services/recipe/` - 食谱 CRUD 服务
- `shared/types/` - 共享类型定义

## 开发约定

1. **提交前检查**: 确保 `bun run build` 能通过
2. **测试**: 修改功能后运行 `bun run test:run`
3. **E2E 测试**: `cd web && bunx playwright test`
4. **环境变量**: 参考 `web/.env.example`

## Supabase

- 项目 URL: `https://xxx.supabase.co`
- 认证: Email + OAuth
- 存储: 图片上传到 Supabase Storage

## 迭代器状态

- **迭代器**: 运行中，每小时自动迭代
- **最近重点**: 组件优化 (CookingMode.vue 329行)
- **当前 Sprint**: Sprint 4

---

*此文件供 Claude Code 等 AI 工具读取，了解项目上下文*
