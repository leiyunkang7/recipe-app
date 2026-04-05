# 用户注册功能 Spec

## Why
当前应用没有用户认证系统，用户无法注册账号。数据库中已有 `favorites` 和 `recipe_ratings` 表但 API 层未启用认证。用户注册是 P0 最高优先级需求，是实现社交功能、个性化推荐、云端同步等高级功能的基础。

## What Changes
- 创建 `users` 数据库表存储用户信息
- 创建 `email_verifications` 表存储邮箱验证码
- 实现用户注册 API 端点
- 实现邮箱验证码发送与校验
- 注册成功后自动创建默认收藏夹
- 创建前端注册页面

## Impact
- Affected specs: 用户系统与认证模块
- Affected code:
  - `database/src/schema/users.ts` (新建)
  - `database/src/schema/index.ts` (修改)
  - `web/server/api/auth/register.ts` (新建)
  - `web/server/api/auth/verify-email.ts` (新建)
  - `web/app/pages/register.vue` (新建)
  - `shared/types/src/index.ts` (修改)
  - `database/migrations/` (新增迁移文件)

## ADDED Requirements

### Requirement: 用户注册数据模型
系统 SHALL 提供用户数据模型，包含以下字段：
- `id`: UUID 主键
- `email`: 唯一邮箱地址
- `username`: 唯一用户名 (3-20字符，字母数字下划线)
- `password_hash`: bcrypt 加密的密码哈希
- `display_name`: 显示名称
- `avatar_url`: 头像 URL (可选)
- `bio`: 个人简介 (可选)
- `role`: 用户角色 (admin/editor/user)
- `email_verified`: 邮箱验证状态
- `email_verified_at`: 邮箱验证时间
- `created_at`: 创建时间
- `updated_at`: 更新时间

#### Scenario: 用户表创建成功
- **WHEN** 执行数据库迁移
- **THEN** `users` 表被创建，包含所有必需字段和索引

### Requirement: 邮箱验证码机制
系统 SHALL 提供邮箱验证码功能：
- 生成 6 位数字验证码
- 验证码有效期 10 分钟
- 同一邮箱 60 秒内只能发送一次验证码
- 验证码存储在 `email_verifications` 表中

#### Scenario: 发送验证码成功
- **WHEN** 用户请求发送验证码
- **AND** 该邮箱在 60 秒内未请求过验证码
- **THEN** 系统生成验证码并发送邮件
- **AND** 验证码存储到数据库

#### Scenario: 验证码发送频率限制
- **WHEN** 用户请求发送验证码
- **AND** 该邮箱在 60 秒内已请求过验证码
- **THEN** 系统返回错误，提示稍后重试

### Requirement: 用户注册 API
系统 SHALL 提供用户注册 API 端点 `POST /api/auth/register`：
- 接收 `email`、`username`、`password`、`verificationCode` 字段
- 校验邮箱格式和唯一性
- 校验用户名格式和唯一性
- 校验密码强度 (至少 8 位，包含字母和数字)
- 校验验证码正确性
- 密码使用 bcrypt 加密存储
- 注册成功后自动创建默认收藏夹

#### Scenario: 注册成功
- **WHEN** 用户提交有效的注册信息
- **AND** 验证码正确且未过期
- **THEN** 系统创建用户账号
- **AND** 创建 "我的收藏" 和 "想做的菜" 两个收藏夹
- **AND** 返回成功响应

#### Scenario: 邮箱已存在
- **WHEN** 用户提交已注册的邮箱
- **THEN** 系统返回错误 "邮箱已被注册"

#### Scenario: 用户名已存在
- **WHEN** 用户提交已使用的用户名
- **THEN** 系统返回错误 "用户名已被使用"

#### Scenario: 验证码错误
- **WHEN** 用户提交错误的验证码
- **THEN** 系统返回错误 "验证码错误或已过期"

### Requirement: 密码安全规范
系统 SHALL 确保密码安全：
- 密码最小长度 8 位
- 必须包含至少一个字母和一个数字
- 使用 bcrypt 加密，cost factor 为 12
- 密码明文不记录到日志

#### Scenario: 密码强度校验
- **WHEN** 用户提交密码 "12345678"
- **THEN** 系统返回错误 "密码必须包含字母和数字"

### Requirement: 前端注册页面
系统 SHALL 提供用户注册页面 `/register`：
- 邮箱输入框 (带验证码发送按钮)
- 用户名输入框
- 密码输入框 (带强度指示器)
- 确认密码输入框
- 验证码输入框
- 注册按钮
- 支持中英文国际化

#### Scenario: 注册页面渲染
- **WHEN** 用户访问 `/register` 或 `/en/register`
- **THEN** 显示注册表单
- **AND** 所有文案使用对应语言

### Requirement: Zod 验证 Schema
系统 SHALL 在 `shared/types` 中提供用户相关验证 Schema：
- `RegisterUserSchema`: 注册请求验证
- `SendVerificationCodeSchema`: 发送验证码请求验证
- `VerifyEmailSchema`: 验证邮箱请求验证

## MODIFIED Requirements
无

## REMOVED Requirements
无
