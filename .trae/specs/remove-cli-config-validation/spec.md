# CLI 移除配置校验 Spec

## Why
当前 CLI 在启动时会强制校验配置文件（`DATABASE_URL` 环境变量或配置文件），如果不存在会直接退出。用户希望运行 CLI 时不需要校验权限，即允许 CLI 在没有配置的情况下启动，只有当实际执行需要数据库的命令时才需要配置。

## What Changes
- 修改 `cli/src/config.ts` 中的 `loadConfig()` 函数，使其在没有配置时返回 `null` 而不是直接退出
- 修改 `cli/src/index.ts`，延迟数据库连接创建，改为按需创建
- 为需要数据库的命令添加配置校验，如果缺少配置则提示用户
- **BREAKING**: CLI 现在可以在没有配置的情况下启动，但执行数据库相关命令时会报错

## Impact
- 受影响文件: `cli/src/config.ts`, `cli/src/index.ts`, 所有命令文件
- 用户体验: CLI 帮助信息可以正常显示，无需配置

## ADDED Requirements
### Requirement: 延迟配置校验
The system SHALL allow CLI to start without configuration.

#### Scenario: 显示帮助信息
- **WHEN** 用户运行 `recipe --help`
- **THEN** CLI 正常显示帮助信息，无需配置文件

#### Scenario: 执行需要数据库的命令
- **WHEN** 用户运行 `recipe list` 但没有配置
- **THEN** CLI 提示用户缺少配置并优雅退出

## MODIFIED Requirements
### Requirement: 配置加载
原要求: 启动时必须存在配置，否则退出
新要求: 启动时允许缺少配置，命令执行时按需校验

#### Scenario: 缺少配置时返回 null
- **WHEN** `loadConfig()` 被调用且没有配置
- **THEN** 返回 `null` 而不是调用 `process.exit(1)`

#### Scenario: 配置存在时正常返回
- **WHEN** `loadConfig()` 被调用且配置存在
- **THEN** 正常返回 `Config` 对象

## REMOVED Requirements
无
