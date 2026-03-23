# Bug 修复计划

## 问题概述

根据 bug 报告，需要修复以下代码质量问题：

1. **index.vue 代码重复** - 未使用已创建的 `useRecipeLayout` composable
2. **useImageUpload.ts 未使用导入** - `createClient` 导入但未使用
3. **useImageUpload.ts 未使用变量** - `data` 变量未使用，应以 `_` 开头
4. **accessibility.spec.ts 正则表达式问题** - emoji 字符在正则字符类中可能导致问题

## 修复步骤

### 1. 修复 web/app/pages/index.vue

**当前问题**: 组件中直接实现了 `leftColumnRecipes`、`rightColumnRecipes` 和 `selectCategory` 逻辑，而未使用已创建的 composable。

**修复内容**:
- 导入 `useRecipeLayout` 和 `useCategorySelect` composables
- 使用 composables 替换重复逻辑
- 删除原有的 computed 属性和 selectCategory 函数

**代码变更**:
```typescript
// 添加导入
import { useRecipeLayout, useCategorySelect } from '~/composables/useRecipeLayout'

// 替换原有逻辑 (删除第44-54行)
const { leftColumnRecipes, rightColumnRecipes } = useRecipeLayout(() => recipes.value)
const { selectCategory } = useCategorySelect(
  () => selectedCategory.value,
  (value: string) => { selectedCategory.value = value }
)
```

### 2. 修复 web/app/composables/useImageUpload.ts

**当前问题**: 
- 第1行: `createClient` 导入但未使用
- 第35行: `data` 变量未使用

**修复内容**:
- 删除未使用的 `createClient` 导入
- 将 `data` 重命名为 `_data`

**代码变更**:
```typescript
// 删除第1行
// import { createClient } from '@supabase/supabase-js'

// 第35行修改
const { data: _data, error: uploadError } = await $supabase.storage
```

### 3. 修复 web/e2e/accessibility.spec.ts

**当前问题**: 第34行的正则表达式使用 emoji 字符在字符类中，可能导致 misleading character class 警告。

**修复内容**: 使用数组和 `includes` 方法替代正则表达式

**代码变更**:
```typescript
// 替换第34行
const iconEmojis = ['🗑️', '✏️', '×']
const hasText = text && text.trim().length > 0 && !iconEmojis.includes(text.trim())
```

## 验证计划

修复完成后，需要运行以下命令验证：

1. **运行 lint 检查**:
   ```bash
   cd /root/code/recipe-app/web && bun run lint
   ```

2. **运行单元测试**:
   ```bash
   cd /root/code/recipe-app/web && bun run test:unit
   ```

3. **运行 E2E 测试**:
   ```bash
   cd /root/code/recipe-app/web && bun run test:e2e
   ```

## 预期结果

- Lint 警告从 5 个减少到 0 个
- 所有单元测试通过 (18 个)
- 所有 E2E 测试通过 (69 个)
- 代码更清晰，维护性更好
