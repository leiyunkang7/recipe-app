# RULES.md - 食谱 APP 硬约束
> 本文件定义了 AI Agent 必须遵守的硬约束，不可绕过。

## 🔴 FATAL - 禁止触碰

### 安全
- ❌ 禁止硬编码任何 API Key / Secret / Token
- ❌ 禁止将用户输入直接插入 HTML（使用 v-html）
- ❌ 禁止在客户端暴露数据库连接信息

### 架构
- ❌ 禁止修改 `composables/` 外的全局状态
- ❌ 禁止在 `pages/` 目录创建非页面组件
- ❌ 禁止删除 `middleware/` 目录

## 🟡 WARN - 需要小心

### 性能
- ⚠️ 图片必须指定 width/height 或 loading="lazy"
- ⚠️ 大列表（>50项）必须分页或虚拟滚动
- ⚠️ 避免在模板中写复杂表达式

### 代码质量
- ⚠️ props 必须定义 TypeScript 类型
- ⚠️ API 调用必须使用 $fetch 或 useFetch
- ⚠️ 组件必须使用 `<script setup lang="ts">`

## 🟢 INFO - 最佳实践

- ✅ 使用 TailwindCSS 原子化样式
- ✅ 优先使用 `ref` 而非 `reactive`
- ✅ 复杂逻辑抽取到 composables
- ✅ 使用 Pinia 管理全局状态

## 违规处理

违反 FATAL 规则 → 立即回滚 + 报警
违反 WARN 规则 → 生成修复建议 + PR reviewer 确认
