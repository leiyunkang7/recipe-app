# 为 Git 暂存区代码改动生成测试用例计划

## 概述
本计划为 git 暂存区的三个 Vue 组件/页面改动生成对应的测试用例。

## 暂存区改动分析

### 1. 新增文件: `web/app/components/BottomNav.vue`
- 移动端底部导航栏组件
- 使用 `useI18n`, `useLocalePath`, `useRoute` 等 Nuxt composables
- 包含两个 tab：首页 `/` 和管理页 `/admin`
- 响应式设计，仅在移动端显示 (md:hidden)

### 2. 修改文件: `web/app/pages/admin/index.vue`
- 添加 `pb-16 md:pb-0` 为底部导航留出空间
- 响应式布局调整（隐藏次要元素、调整间距）
- 引入并使用 `<BottomNav />` 组件

### 3. 修改文件: `web/app/pages/index.vue`
- 布局从网格改为双列瀑布流 (masonry)
- 新增 `leftColumnRecipes` 和 `rightColumnRecipes` 计算属性
- 新增 `selectCategory` 函数实现分类选择
- 搜索框改为圆角胶囊样式
- 分类筛选改为横向可滚动按钮
- 添加 `<BottomNav />` 组件

## 测试策略

### 测试框架选择
- **E2E 测试**: 使用现有的 Playwright (`web/e2e/`)
- **单元测试**: 暂无 Vitest 配置，考虑添加或使用 Playwright 覆盖

### 测试用例设计

#### 1. BottomNav.vue 组件测试 (E2E)
- 测试移动端底部导航栏是否正确显示
- 测试导航链接是否正确跳转
- 测试活动状态样式是否正确
- 测试桌面端是否隐藏

#### 2. index.vue 首页测试 (E2E)
- 测试双列布局是否正确渲染
- 测试分类筛选功能是否正常工作
- 测试搜索功能
- 测试移动端底部导航显示

#### 3. admin/index.vue 管理页测试 (E2E)
- 测试移动端底部导航显示
- 测试响应式布局调整

## 实施步骤

### 步骤 1: 添加 BottomNav E2E 测试
- 创建 `web/e2e/bottom-nav.spec.ts`
- 测试移动端导航显示/隐藏
- 测试导航链接正确性

### 步骤 2: 更新 index.vue 首页测试
- 创建或更新 `web/e2e/home.spec.ts`
- 测试双列瀑布流布局
- 测试分类筛选交互
- 测试移动端底部导航

### 步骤 3: 更新 admin 页面测试
- 更新 `web/e2e/admin.spec.ts`
- 测试移动端底部导航

### 步骤 4: 运行测试验证
- 执行 `cd web && npx playwright test` 验证测试通过
