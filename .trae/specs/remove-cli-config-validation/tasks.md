# Tasks

- [x] Task 1: 修改 config.ts 支持可选配置
  - [x] SubTask 1.1: 修改 `loadConfig()` 返回类型为 `Config | null`
  - [x] SubTask 1.2: 移除 `process.exit(1)` 调用，改为返回 `null`
  - [x] SubTask 1.3: 更新相关测试用例

- [x] Task 2: 修改 index.ts 延迟数据库连接
  - [x] SubTask 2.1: 修改程序启动逻辑，允许 `config` 为 `null`
  - [x] SubTask 2.2: 延迟创建数据库连接，改为按需创建

- [x] Task 3: 为命令添加配置校验
  - [x] SubTask 3.1: 修改 `list` 命令，在 action 中校验配置
  - [x] SubTask 3.2: 修改 `add` 命令，在 action 中校验配置
  - [x] SubTask 3.3: 修改 `get` 命令，在 action 中校验配置
  - [x] SubTask 3.4: 修改 `update` 命令，在 action 中校验配置
  - [x] SubTask 3.5: 修改 `delete` 命令，在 action 中校验配置
  - [x] SubTask 3.6: 修改 `search` 命令，在 action 中校验配置
  - [x] SubTask 3.7: 修改 `import` 命令，在 action 中校验配置
  - [x] SubTask 3.8: 修改 `export` 命令，在 action 中校验配置
  - [x] SubTask 3.9: 修改 `deleteMany` 命令，在 action 中校验配置
  - [x] SubTask 3.10: 修改 `image` 命令，在 action 中校验配置

- [x] Task 4: 运行测试验证
  - [x] SubTask 4.1: 运行 `bun run test:run` 确保所有测试通过

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 依赖 Task 3
