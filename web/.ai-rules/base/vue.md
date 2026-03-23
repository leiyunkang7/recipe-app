# Vue 组件基础规范

## 文件结构
- 页面组件：放置于 `pages/` 目录
- 可复用组件：放置于 `components/` 目录
- Composable：放置于 `composables/` 目录
- 工具函数：放置于 `utils/` 目录

## 命名规范
- 组件文件名：PascalCase（如 `RecipeCard.vue`）
- 组件变量名：PascalCase
- CSS 类名：kebab-case

## Script Setup 规范
- 必须使用 `<script setup lang="ts">`
- 必须为 props 定义类型
- 优先使用 `ref` 和 `reactive`
- `computed` 用于派生状态

## Template 规范
- 每个组件最多一个根元素
- 避免在模板中使用复杂表达式
- 事件处理使用箭头函数或方法引用
