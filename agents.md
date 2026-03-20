# 食谱 APP - Agent 迭代指南

> 本项目使用 Agent Team 持续迭代，自动化改进代码质量和功能。

## 技术栈

| 组件 | 工具 |
|------|------|
| 包管理器 | **Bun** (v1.3.9+) |
| 前端框架 | Nuxt 3 + Vue 3 |
| 后端 | Supabase |
| 样式 | TailwindCSS |

## 包管理命令

```bash
# 安装依赖
bun install

# 添加依赖
bun add <package>

# 运行开发服务器
bun run dev

# 构建生产版本
bun run build

# 运行测试
bun run test

# Lint
bun run lint
```

## Agent Team 架构

```
每 5 分钟 cron 触发
    ↓
recipe-app-iterator.sh
    ↓
┌─────────────────────────────────────┐
│  🔍 Explore  → 发现改进机会            │
│  ⚒️ Hephaestus → 执行代码修改        │
│  📋 Prometheus → 规划 + 补充任务池    │
│  🧭 Sisyphus → 协调 + 监控           │
└─────────────────────────────────────┘
    ↓
opencode run "修复/改进 xxx"
    ↓
git commit + push
    ↓
自动生成下一个任务
    ↓
循环 🔄
```

## 迭代任务池

任务池位置：`.recipe-iteration-tasks.md`

### 任务来源

| 来源 | 说明 |
|------|------|
| Explore Agent 自动发现 | 代码质量/性能/功能改进机会 |
| Prometheus 规划 | 根据项目需求规划 |
| 手动添加 | 开发者直接添加 |

### 任务优先级

| 标记 | 优先级 | 说明 |
|------|--------|------|
| 🔴 | P0 | 必须修复，影响核心功能 |
| 🟡 | P1 | 重要，应该处理 |
| 🟢 | P2 | 低优先级，可延迟 |

## 开发规范

### 提交规范

```
feat: 新功能
fix: 修复 bug
refactor: 重构
perf: 性能优化
test: 添加测试
docs: 文档更新
chore: 构建/工具变更
```

### 测试要求

- 单元测试覆盖率目标：>50%
- 关键业务逻辑必须有测试
- 使用 Vitest + Vue Test Utils

### 代码风格

- 使用 TypeScript strict 模式
- ESLint + Prettier
- 组件文件不超过 200 行

## 自动化

### 定时任务

| 任务 | 频率 | 说明 |
|------|------|------|
| 迭代器 | */5 * * * * | 每 5 分钟检查并执行改进 |
| Git 自动提交 | @hourly | 提交未保存更改 |

### Git Hooks

- `pre-commit`: ESLint + Prettier 检查
- `pre-push`: 运行测试

## UI/UX 设计规范

本项目使用 **uiux-pro-max** 技能进行前端设计和交互优化。

### 设计原则

- 使用 uiux-pro-max 技能生成设计建议
- 组件开发前先咨询 uiux-pro-max 获取设计指导
- 重要 UI 变更需要设计评审

### 使用方式

```bash
# 在 OpenClaw 中使用 skill
skill uiux-pro-max

# 或者在任务描述中包含 "设计" 关键词
```

## 相关文件

- `package.json` - 依赖管理
- `bun.lock` - Bun 锁文件
- `.recipe-iteration-tasks.md` - 迭代任务池
- `scripts/recipe-app-iterator.sh` - 迭代脚本
- `web/tests/` - 测试文件

## 语言规范

**⚠️ 所有输出必须使用中文**

- 飞轮报告 → 中文
- Agent 输出 → 中文
- 提交信息 → 中文
- 日志记录 → 中文

## 联系方式

项目 Owner: 雷云康

---

*最后更新: 2026-03-21*
