# CLI 优化规格文档

## Why
当前CLI虽然功能完整，但在用户体验、代码质量和可维护性方面存在改进空间。通过系统性的优化，可以提升开发者和用户的使用体验，减少重复代码，增强错误处理能力。

## What Changes

### 1. 统一的错误处理机制
- **BREAKING**: 所有命令将使用统一的错误处理流程，错误信息格式保持一致
- 引入全局错误处理器，避免在每个命令中重复处理错误
- 添加错误代码体系，便于问题定位

### 2. 输入验证增强
- 所有命令参数添加 Zod  schema 验证
- 提供清晰的验证错误提示
- 支持交互式补全和验证

### 3. 日志和调试系统
- 添加 `--verbose` / `-v` 全局选项控制日志级别
- 添加 `--debug` 选项输出详细调试信息
- 统一日志格式，包含时间戳和日志级别

### 4. 输出格式改进
- 支持 `--format` 选项控制输出格式 (table/json/csv)
- 添加 `--no-color` 选项禁用颜色输出
- 改进表格输出，支持自适应列宽

### 5. 代码重构
- 提取公共逻辑到共享模块
- 统一的服务调用模式
- 减少代码重复

### 6. 配置管理增强
- 支持 `recipe config` 命令管理配置
- 支持查看和设置配置项
- 配置文件验证

### 7. 交互体验优化
- 添加命令自动补全支持
- 改进进度指示器
- 添加操作确认提示

### 8. 帮助文档完善
- 为每个命令添加详细示例
- 添加使用提示

## Impact

### Affected Specs
- CLI命令执行流程
- 错误处理规范
- 配置管理规范

### Affected Code
- `cli/src/index.ts` - 全局选项和错误处理
- `cli/src/commands/*.ts` - 所有命令文件
- `cli/src/config.ts` - 配置管理
- 新增 `cli/src/utils/` - 工具函数
- 新增 `cli/src/types/` - 类型定义

## ADDED Requirements

### Requirement: 全局错误处理
The system SHALL provide a unified error handling mechanism for all CLI commands.

#### Scenario: 命令执行出错
- **GIVEN** 用户执行任意命令
- **WHEN** 命令执行过程中发生错误
- **THEN** 系统应显示格式统一的错误信息
- **AND** 错误信息应包含错误代码和友好提示
- **AND** 使用 `--verbose` 时应显示详细错误堆栈

### Requirement: 全局选项支持
The system SHALL support global command-line options.

#### Scenario: 使用全局选项
- **GIVEN** 用户执行任意命令
- **WHEN** 使用 `--verbose` 或 `-v` 选项
- **THEN** 系统应输出详细的执行日志

- **WHEN** 使用 `--debug` 选项
- **THEN** 系统应输出调试信息

- **WHEN** 使用 `--no-color` 选项
- **THEN** 系统应禁用所有颜色输出

- **WHEN** 使用 `--format <format>` 选项
- **THEN** 系统应按指定格式输出结果 (table/json/csv)

### Requirement: 配置管理命令
The system SHALL provide `recipe config` command for configuration management.

#### Scenario: 查看配置
- **GIVEN** 用户执行 `recipe config`
- **WHEN** 不带任何参数
- **THEN** 系统应显示当前所有配置项

#### Scenario: 设置配置
- **GIVEN** 用户执行 `recipe config set <key> <value>`
- **WHEN** 配置项有效
- **THEN** 系统应保存配置并确认

#### Scenario: 获取配置
- **GIVEN** 用户执行 `recipe config get <key>`
- **THEN** 系统应显示指定配置项的值

### Requirement: 输入验证
The system SHALL validate all command inputs using Zod schemas.

#### Scenario: 参数验证失败
- **GIVEN** 用户提供了无效的参数
- **WHEN** 命令执行前
- **THEN** 系统应显示清晰的验证错误信息
- **AND** 不应执行命令逻辑

### Requirement: 输出格式控制
The system SHALL support multiple output formats.

#### Scenario: JSON格式输出
- **GIVEN** 用户使用 `--format json`
- **WHEN** 执行 list/get/search 命令
- **THEN** 系统应以JSON格式输出结果

#### Scenario: CSV格式输出
- **GIVEN** 用户使用 `--format csv`
- **WHEN** 执行 list 命令
- **THEN** 系统应以CSV格式输出结果

## MODIFIED Requirements

### Requirement: 现有命令重构
所有现有命令 SHALL 使用新的工具函数和错误处理机制。

#### Scenario: 命令执行
- **GIVEN** 用户执行任意命令
- **WHEN** 命令需要数据库连接
- **THEN** 使用统一的 `getDb()` 函数

- **WHEN** 命令需要显示加载状态
- **THEN** 使用统一的 `createSpinner()` 函数

- **WHEN** 命令需要输出结果
- **THEN** 使用统一的输出格式化函数

## REMOVED Requirements

### Requirement: 分散的错误处理
**Reason**: 统一使用全局错误处理器
**Migration**: 删除各命令中的 try-catch 块，改为抛出错误由全局处理器处理

### Requirement: 硬编码的输出格式
**Reason**: 支持多种输出格式
**Migration**: 使用新的输出格式化工具函数
