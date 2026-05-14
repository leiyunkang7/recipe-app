# Tasks

- [x] Task 1: 创建用户数据库表和 Schema
  - [x] SubTask 1.1: 创建 `database/src/schema/users.ts` 用户表定义
  - [x] SubTask 1.2: 创建 `database/src/schema/email-verifications.ts` 邮箱验证码表
  - [x] SubTask 1.3: 更新 `database/src/schema/index.ts` 导出新表
  - [x] SubTask 1.4: 生成数据库迁移文件

- [x] Task 2: 创建共享类型定义
  - [x] SubTask 2.1: 在 `shared/types/src/index.ts` 添加用户相关 Zod Schema
  - [x] SubTask 2.2: 添加 `User`、`CreateUserDTO`、`RegisterUserDTO` 类型
  - [x] SubTask 2.3: 添加 `SendVerificationCodeDTO`、`VerifyEmailDTO` 类型
  - [x] SubTask 2.4: 运行单元测试验证 Schema 正确性

- [x] Task 3: 实现邮箱验证码服务
  - [x] SubTask 3.1: 创建 `services/email/src/service.ts` 邮件发送服务
  - [x] SubTask 3.2: 实现验证码生成逻辑 (6位数字)
  - [x] SubTask 3.3: 实现验证码存储和过期检查
  - [x] SubTask 3.4: 实现发送频率限制 (60秒)

- [x] Task 4: 实现用户注册 API
  - [x] SubTask 4.1: 创建 `web/server/api/auth/send-verification.post.ts` 发送验证码端点
  - [x] SubTask 4.2: 创建 `web/server/api/auth/register.post.ts` 注册端点
  - [x] SubTask 4.3: 实现密码 bcrypt 加密
  - [x] SubTask 4.4: 实现注册后自动创建默认收藏夹
  - [x] SubTask 4.5: 添加 API 错误处理和响应格式

- [x] Task 5: 创建前端注册页面
  - [x] SubTask 5.1: 创建 `web/app/pages/register.vue` 注册页面
  - [x] SubTask 5.2: 实现注册表单组件 (邮箱、用户名、密码、验证码)
  - [x] SubTask 5.3: 实现密码强度指示器
  - [x] SubTask 5.4: 添加 i18n 国际化文案 (中英文)
  - [x] SubTask 5.5: 添加表单验证和错误提示

- [x] Task 6: 添加单元测试和 E2E 测试
  - [x] SubTask 6.1: 添加用户 Schema 单元测试
  - [x] SubTask 6.2: 添加注册 API 单元测试
  - [x] SubTask 6.3: 添加 E2E 注册流程测试

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 2, Task 3]
- [Task 5] depends on [Task 4]
- [Task 6] depends on [Task 4, Task 5]
