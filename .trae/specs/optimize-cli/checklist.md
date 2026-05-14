# CLI 优化检查清单

## 工具模块检查项

- [x] `cli/src/types/index.ts` 已创建，包含 GlobalOptions、OutputFormat、CliError 类型定义
- [x] `cli/src/utils/logger.ts` 已创建，Logger 类支持 debug/info/warn/error 级别
- [x] `cli/src/utils/output.ts` 已创建，支持 table/json/csv 三种格式输出
- [x] `cli/src/utils/error-handler.ts` 已创建，包含错误代码枚举和全局错误处理器
- [x] `cli/src/utils/spinner.ts` 已创建，封装 ora 支持 no-color 选项
- [x] `cli/src/utils/validation.ts` 已创建，使用 Zod 验证命令参数
- [x] `cli/src/utils/index.ts` 已创建，统一导出所有工具函数

## 入口文件检查项

- [x] `cli/src/index.ts` 添加了 `--verbose` / `-v` 全局选项
- [x] `cli/src/index.ts` 添加了 `--debug` 全局选项
- [x] `cli/src/index.ts` 添加了 `--no-color` 全局选项
- [x] `cli/src/index.ts` 添加了 `--format` 全局选项
- [x] `cli/src/index.ts` 实现了全局错误处理器（uncaughtException/unhandledRejection）
- [x] `cli/src/index.ts` 全局选项可以正确传递给命令

## 配置管理检查项

- [x] `cli/src/config.ts` 添加了配置验证函数
- [x] `cli/src/config.ts` 添加了 `saveConfig()` 函数
- [x] `cli/src/commands/config.ts` 已创建
- [x] `recipe config` 命令可以显示所有配置
- [x] `recipe config get <key>` 命令可以获取指定配置
- [x] `recipe config set <key> <value>` 命令可以设置配置
- [x] `recipe config validate` 命令可以验证配置有效性

## 命令重构检查项

- [x] `add.ts` 使用新的 logger 工具输出日志
- [x] `add.ts` 使用新的错误处理方式
- [x] `list.ts` 使用新的 output 格式化工具
- [x] `list.ts` 支持 `--format` 选项
- [x] `get.ts` 使用新的 output 格式化工具
- [x] `get.ts` 支持 `--format` 选项
- [x] `update.ts` 使用新的 logger 工具
- [x] `update.ts` 使用新的错误处理方式
- [x] `delete.ts` 使用新的 logger 工具
- [x] `delete.ts` 使用新的错误处理方式
- [x] `search.ts` 使用新的 output 格式化工具
- [x] `search.ts` 支持 `--format` 选项
- [x] `export.ts` 使用新的 logger 工具
- [x] `export.ts` 统一错误处理
- [x] `import.ts` 使用新的 logger 工具
- [x] `import.ts` 统一错误处理
- [x] `deleteMany.ts` 使用新的 logger 工具
- [x] `deleteMany.ts` 统一错误处理
- [x] `image.ts` 使用新的 logger 工具
- [x] `image.ts` 统一错误处理

## 测试检查项

- [x] 所有现有命令测试通过
- [x] 测试覆盖率保持 100%

## 功能验证检查项

- [x] `recipe --help` 显示全局选项
- [x] `recipe --verbose <command>` 输出详细日志
- [x] `recipe --debug <command>` 输出调试信息
- [x] `recipe --no-color <command>` 禁用颜色输出
- [x] `recipe --format json list` 以 JSON 格式输出
- [x] `recipe --format csv list` 以 CSV 格式输出
- [x] 错误信息格式统一，包含错误代码
- [x] 所有命令正常工作，无回归问题

## 代码质量检查项

- [x] 所有 TypeScript 类型正确，无 `any` 类型
- [x] 代码通过 lint 检查
- [x] 无重复代码，公共逻辑已提取到工具模块
- [x] 错误处理统一，无分散的 try-catch 块
