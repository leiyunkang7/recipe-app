# CLI 优化任务列表

## Task 1: 创建共享工具模块 ✅
创建统一的工具函数和类型定义，为后续命令重构提供基础支持。

- [x] SubTask 1.1: 创建 `cli/src/types/index.ts` 定义共享类型
  - 定义 `GlobalOptions` 类型（verbose, debug, noColor, format）
  - 定义 `OutputFormat` 联合类型
  - 定义 `CliError` 错误类型

- [x] SubTask 1.2: 创建 `cli/src/utils/logger.ts` 日志工具
  - 实现 `Logger` 类，支持不同日志级别
  - 实现 `createLogger(options)` 工厂函数
  - 支持 `--verbose` 和 `--debug` 选项

- [x] SubTask 1.3: 创建 `cli/src/utils/output.ts` 输出格式化工具
  - 实现 `formatOutput(data, format)` 函数
  - 支持 table/json/csv 三种格式
  - 实现 `--no-color` 支持

- [x] SubTask 1.4: 创建 `cli/src/utils/error-handler.ts` 错误处理
  - 实现全局错误处理器
  - 定义错误代码枚举
  - 实现 `handleError(error, options)` 函数

- [x] SubTask 1.5: 创建 `cli/src/utils/spinner.ts` 进度指示器
  - 封装 ora，支持 `--no-color` 选项
  - 实现 `createSpinner(text)` 函数

- [x] SubTask 1.6: 创建 `cli/src/utils/validation.ts` 验证工具
  - 实现命令参数验证函数
  - 使用 Zod schema 验证

## Task 2: 重构入口文件 ✅
重构 `cli/src/index.ts` 添加全局选项和错误处理。

- [x] SubTask 2.1: 添加全局选项定义
  - 添加 `--verbose` / `-v` 选项
  - 添加 `--debug` 选项
  - 添加 `--no-color` 选项
  - 添加 `--format` 选项

- [x] SubTask 2.2: 实现全局错误处理
  - 添加 `process.on('uncaughtException')` 处理器
  - 添加 `process.on('unhandledRejection')` 处理器
  - 集成错误处理工具

- [x] SubTask 2.3: 更新 `getDb()` 和 `getConfig()` 函数
  - 支持全局选项传递
  - 添加调试日志输出

## Task 3: 增强配置管理 ✅
扩展配置管理功能，添加配置命令。

- [x] SubTask 3.1: 重构 `cli/src/config.ts`
  - 添加配置项验证
  - 添加 `saveConfig(config)` 函数
  - 添加配置类型定义

- [x] SubTask 3.2: 创建 `cli/src/commands/config.ts` 配置命令
  - 实现 `recipe config` 查看所有配置
  - 实现 `recipe config get <key>` 获取配置
  - 实现 `recipe config set <key> <value>` 设置配置
  - 实现 `recipe config validate` 验证配置

## Task 4: 重构现有命令 ✅
使用新的工具函数重构所有现有命令。

- [x] SubTask 4.1: 重构 `add.ts` 命令
  - 使用新的 logger 工具
  - 使用新的错误处理方式
  - 添加 `--format` 支持

- [x] SubTask 4.2: 重构 `list.ts` 命令
  - 使用新的输出格式化工具
  - 支持 `--format` 选项
  - 改进表格输出

- [x] SubTask 4.3: 重构 `get.ts` 命令
  - 使用新的输出格式化工具
  - 支持 `--format` 选项

- [x] SubTask 4.4: 重构 `update.ts` 命令
  - 使用新的 logger 工具
  - 使用新的错误处理方式

- [x] SubTask 4.5: 重构 `delete.ts` 命令
  - 使用新的 logger 工具
  - 使用新的错误处理方式

- [x] SubTask 4.6: 重构 `search.ts` 命令
  - 使用新的输出格式化工具
  - 支持 `--format` 选项

- [x] SubTask 4.7: 重构 `export.ts` 命令
  - 使用新的 logger 工具
  - 统一错误处理

- [x] SubTask 4.8: 重构 `import.ts` 命令
  - 使用新的 logger 工具
  - 统一错误处理

- [x] SubTask 4.9: 重构 `deleteMany.ts` 命令
  - 使用新的 logger 工具
  - 统一错误处理

- [x] SubTask 4.10: 重构 `image.ts` 命令
  - 使用新的 logger 工具
  - 统一错误处理

## Task 5: 更新测试 ✅
确保所有重构后的代码有完整的测试覆盖。

- [x] SubTask 5.1: 为新的工具模块添加测试
  - 测试 logger 工具
  - 测试 output 格式化工具
  - 测试 error-handler
  - 测试 validation 工具

- [x] SubTask 5.2: 更新现有命令测试
  - 更新 `add.test.ts`
  - 更新 `list.test.ts`
  - 更新 `get.test.ts`
  - 更新其他命令测试

- [x] SubTask 5.3: 添加配置命令测试
  - 测试 `config` 命令的各个子命令

## Task 6: 验证和文档 ✅
验证所有功能正常工作，更新相关文档。

- [x] SubTask 6.1: 运行所有测试
  - 确保单元测试通过
  - 确保没有回归问题

- [x] SubTask 6.2: 手动验证 CLI 功能
  - 测试全局选项
  - 测试每个命令
  - 测试错误处理

- [x] SubTask 6.3: 更新帮助文档
  - 为命令添加使用示例

# Task Dependencies

- Task 2 依赖 Task 1（使用共享工具）
- Task 3 依赖 Task 1（使用 logger 工具）
- Task 4 依赖 Task 1 和 Task 2（使用共享工具和全局选项）
- Task 5 依赖 Task 4（测试重构后的命令）
- Task 6 依赖 Task 5（验证测试通过）

# Parallelizable Work

以下任务可以并行执行：
- SubTask 1.1 ~ 1.6（创建工具模块）
- SubTask 4.1 ~ 4.10（重构命令，在工具模块完成后）
- SubTask 5.1 ~ 5.3（测试，在对应实现完成后）
