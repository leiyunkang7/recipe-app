# Recipe App - QA 测试计划

> 测试执行时间: 2026-02-22
> 测试人员: Agent (recipe-qa-tester)
> 项目版本: v1.0.0

---

## 📋 测试范围

### 被测组件
- **CLI工具** (`~/code/recipe-app/cli/`)
  - TypeScript + Commander.js
  - Supabase Backend集成
  - 全CRUD操作 + 搜索 + 批量操作

- **Web应用** (`~/code/recipe-app/web/`)
  - Nuxt 3 + Vue 3 + Tailwind CSS
  - Public页面: 首页 + 详情页
  - Admin页面: Dashboard + CRUD表单

- **数据库** (Supabase PostgreSQL)
  - 7张表: recipes, recipe_ingredients, recipe_steps, recipe_tags, categories, cuisines, storage
  - 2个示例菜谱: 番茄炒蛋、鱼香肉丝

---

## 🎯 Phase 1: 功能测试清单

### 1.1 CLI CRUD操作
- [ ] `list` - 列出所有菜谱
- [ ] `get <id>` - 查看菜谱详情
- [ ] `add` - 添加新菜谱（交互式）
- [ ] `update <id>` - 更新菜谱
- [ ] `delete <id>` - 删除菜谱
- [ ] `search <query>` - 搜索菜谱
- [ ] `export` - 导出JSON
- [ ] `delete-many <pattern>` - 批量删除

### 1.2 Web Public页面
**首页 (`/`)**
- [ ] 菜谱卡片正确显示
- [ ] 响应式布局（mobile/tablet/desktop）
- [ ] 搜索功能工作
- [ ] 分类筛选工作
- [ ] 点击卡片跳转到详情页
- [ ] 加载状态显示
- [ ] 空状态处理

**详情页 (`/recipes/[id]`)**
- [ ] 菜谱信息完整显示
- [ ] 食材列表正确
- [ ] 步骤编号清晰
- [ ] 营养信息显示
- [ ] 标签显示正确
- [ ] 返回按钮工作

### 1.3 Web Admin页面
**Dashboard (`/admin`)**
- [ ] 菜谱列表显示
- [ ] 搜索功能工作
- [ ] 编辑按钮跳转正确
- [ ] 删除按钮确认并生效

**创建/编辑表单 (`/admin/recipes/new`, `/admin/recipes/[id]/edit`)**
- [ ] 表单字段验证
- [ ] 添加/删除食材
- [ ] 添加/删除步骤
- [ ] 步骤自动编号
- [ ] 保存成功并跳转
- [ ] 取消并返回

### 1.4 搜索和筛选
- [ ] CLI搜索功能
- [ ] Web首页搜索
- [ ] 分类筛选
- [ ] 搜索结果一致性（CLI = Web）

### 1.5 数据验证
- [ ] 必填字段验证
- [ ] 数据类型验证（数字、正数）
- [ ] 外键约束（食材、步骤关联正确菜谱）
- [ ] 删除级联（删除菜谱→食材、步骤、标签同步删除）

---

## 🧪 Phase 2: 测试用例设计

### 2.1 正常场景

**CLI - 添加菜谱**
```bash
recipe add
# 输入完整菜谱信息
# 预期: 成功创建，返回ID
```

**CLI - 列出菜谱**
```bash
recipe list
# 预期: 显示所有菜谱（包括2个示例 + 新添加的）
```

**Web - 首页浏览**
```
访问 http://localhost:3000
# 预期: 显示菜谱卡片网格
```

**Web - 添加菜谱**
```
访问 /admin/recipes/new
填写表单 → Save
# 预期: 创建成功，跳转到Dashboard
```

### 2.2 边界情况

**空数据库**
```bash
# 删除所有菜谱后
recipe list
# 预期: 显示"暂无菜谱"消息
```

**超长输入**
```bash
recipe add
# Title: 255字符（最大长度）
# Description: 10000字符
# 预期: 正确处理或友好错误提示
```

**数值边界**
```bash
recipe add
# Servings: 1 (最小)
# Prep time: 0 (最小)
# Cook time: 0 (最小)
# 预期: 接受合法边界值
```

**特殊字符**
```bash
recipe add
# Title: "测试<script>alert('xss')</script>"
# Description: 包含emoji、特殊符号
# 预期: 安全处理，XSS防护
```

### 2.3 错误处理

**无效ID**
```bash
recipe get 00000000-0000-0000-0000-000000000000
# 预期: 友好错误提示 "菜谱不存在"
```

**数据库连接失败**
```bash
# 断开Supabase连接
recipe list
# 预期: 清晰错误消息，不崩溃
```

**无效JSON导入**
```bash
recipe import invalid.json
# 预期: 解析错误提示
```

**必填字段缺失**
```bash
recipe add
# 留空title
# 预期: 验证错误 "标题为必填项"
```

---

## 📊 Phase 3: 测试数据准备

### 3.1 新菜谱数据（用于测试）

**测试菜谱1: 宫保鸡丁**
```json
{
  "title": "Kung Pao Chicken",
  "description": "Classic Sichuan dish with peanuts and chili peppers",
  "category": "Dinner",
  "cuisine": "Chinese",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 10,
  "difficulty": "medium",
  "ingredients": [
    {"name": "Chicken breast", "amount": 400, "unit": "grams"},
    {"name": "Peanuts", "amount": 80, "unit": "grams"},
    {"name": "Dried red chilies", "amount": 10, "unit": "pieces"}
  ],
  "steps": [
    {"instruction": "Cut chicken into cubes", "duration_minutes": 5},
    {"instruction": "Stir-fry chicken until white", "duration_minutes": 3}
  ],
  "tags": ["spicy", "sichuan", "quick"]
}
```

**测试菜谱2: 蔬菜沙拉（边界测试）**
```json
{
  "title": "Test Boundary Salad",
  "description": "A" + "a".repeat(200),  // 测试长描述
  "category": "Lunch",
  "cuisine": "Other",
  "servings": 1,
  "prep_time_minutes": 0,
  "cook_time_minutes": 0,
  "difficulty": "easy",
  "ingredients": [
    {"name": "Lettuce", "amount": 100, "unit": "grams"}
  ],
  "steps": [
    {"instruction": "Wash lettuce", "duration_minutes": 0}
  ],
  "tags": ["test", "boundary"]
}
```

**测试菜谱3: 错误输入测试**
```json
{
  "title": "",  // 空标题（应失败）
  "description": "Missing title test",
  "servings": -1,  // 负数（应失败）
  "prep_time_minutes": -5  // 负数（应失败）
}
```

### 3.2 边界值测试数据

| 字段 | 最小值 | 最大值 | 测试值 |
|------|--------|--------|--------|
| Title | - | 255字符 | 1, 255, 256字符 |
| Description | - | - | 0, 1000, 10000字符 |
| Servings | 1 | - | 1, 100 |
| Prep time | 0 | - | 0, 999 |
| Cook time | 0 | - | 0, 999 |
| Difficulty | easy/medium/hard | - | easy, medium, hard, invalid |

### 3.3 错误输入测试数据

| 测试项 | 输入值 | 预期结果 |
|--------|--------|----------|
| 空标题 | "" | 验证错误 |
| 负数份数 | -1 | 验证错误 |
| 负数时间 | -10 | 验证错误 |
| 无效难度 | "super hard" | 验证错误 |
| 无效类别 | "Invalid Category" | 可能接受或警告 |
| 空食材列表 | [] | 接受或警告 |
| 空步骤列表 | [] | 接受或警告 |

---

## ⏱️ 测试时间分配

| Phase | 任务 | 预计时间 | 实际时间 |
|-------|------|----------|----------|
| Phase 1 | 创建测试计划 | 15分钟 | - |
| Phase 2 | CLI功能测试 | 30分钟 | - |
| Phase 3 | Web功能测试 | 40分钟 | - |
| Phase 4 | 集成测试 | 20分钟 | - |
| Phase 5 | 性能测试 | 15分钟 | - |
| Phase 6 | Bug报告 | 20分钟 | - |
| **总计** | | **140分钟** | **-** |

---

## 🎯 成功标准

### 功能完整性
- ✅ 所有CLI命令正常工作
- ✅ 所有Web页面可访问且功能正常
- ✅ CRUD操作完整验证

### 数据一致性
- ✅ CLI和Web数据同步
- ✅ 搜索结果一致
- ✅ 级联删除正确

### 用户体验
- ✅ 错误提示友好清晰
- ✅ 响应时间合理（<3s）
- ✅ 界面响应式适配

### 测试覆盖率
- ✅ 正常场景: 100%
- ✅ 边界情况: 80%+
- ✅ 错误处理: 70%+

---

## 📝 交付物清单

1. ✅ 测试计划文档 (`TEST_PLAN.md`) - 本文档
2. ⏳ 测试执行报告 (`TEST_REPORT.md`) - Phase 6完成
3. ⏳ Bug清单 (`BUGS.md`) - Phase 6完成
4. ⏳ 测试覆盖率统计 - Phase 6完成
5. ⏳ 性能指标报告 - Phase 5完成

---

## 🔄 测试执行流程

```
开始
  ↓
Phase 1: 创建测试计划 ✅
  ↓
Phase 2: CLI测试 → 记录结果
  ↓
Phase 3: Web测试 → 记录结果
  ↓
Phase 4: 集成测试 → 验证同步
  ↓
Phase 5: 性能测试 → 测量指标
  ↓
Phase 6: Bug报告 → 汇总问题
  ↓
完成 → 生成最终报告
```

---

*测试计划创建时间: 2026-02-22 01:45 AM*
*预计测试完成时间: 2026-02-22 04:00 AM*
