# 用户注册功能 Checklist

## 数据库层
- [x] `users` 表包含所有必需字段 (id, email, username, password_hash, role, email_verified 等)
- [x] `email_verifications` 表包含验证码存储字段
- [x] 数据库迁移文件已生成并可正常执行
- [x] 用户表 email 和 username 有唯一索引

## 共享类型
- [x] `RegisterUserSchema` 验证邮箱格式、用户名格式、密码强度
- [x] `SendVerificationCodeSchema` 验证邮箱格式
- [x] 所有类型正确导出并可被其他模块引用
- [x] 单元测试覆盖所有验证场景

## 邮件服务
- [x] 验证码为 6 位数字
- [x] 验证码有效期 10 分钟
- [x] 同一邮箱 60 秒内只能发送一次验证码
- [x] 验证码发送 API 返回正确响应

## 注册 API
- [x] `POST /api/auth/register` 端点正常工作
- [x] 密码使用 bcrypt 加密 (cost factor 12)
- [x] 邮箱已存在时返回正确错误信息
- [x] 用户名已存在时返回正确错误信息
- [x] 验证码错误时返回正确错误信息
- [x] 注册成功后自动创建 "我的收藏" 和 "想做的菜" 收藏夹

## 前端页面
- [x] 注册页面 `/register` 正常渲染
- [x] 表单验证正确工作 (前端 Zod 验证)
- [x] 密码强度指示器显示正确
- [x] 验证码发送按钮有 60 秒倒计时
- [x] 中英文国际化文案完整
- [x] 注册成功后正确跳转

## 测试覆盖
- [x] 用户 Schema 单元测试通过
- [x] 注册 API 单元测试通过
- [x] E2E 注册流程测试通过
