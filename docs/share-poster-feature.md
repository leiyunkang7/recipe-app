# 🍳 食谱分享海报功能

> 一键生成精美食谱分享图片，方便社交传播

## 功能概述

用户可以在食谱详情页一键生成分享海报，下载后在微信、微博、朋友圈等平台分享。

## 海报设计

### 尺寸
- **1080 × 1350 像素** (Instagram 竖图 4:5 比例)

### 视觉元素

| 区域 | 内容 | 说明 |
|------|------|------|
| 顶部 | App Logo + 分类标签 | 品牌曝光 + 分类识别 |
| 主图区 | 食谱封面图 | 480px 高度，圆角设计 |
| 图像叠加 | 难度徽章 + 时间徽章 + 人数徽章 | 快速信息传递 |
| 标题区 | 食谱名称 + 简短描述 | 核心内容 |
| 食材卡 | 主要食材（最多5种） | 勾起食欲 |
| 底部 | QR码 + 品牌文案 + 浏览量 | 扫码转化 |

### 配色策略
- 根据食谱分类自动切换渐变色：
  - 家常菜：橙色 → 浅橙
  - 快手菜：青色 → 浅青
  - 甜点：粉色 → 浅粉
  - 饮品：紫色 → 浅紫
  - ...

## 文件结构

```
web/
├── app/
│   ├── components/recipe/
│   │   ├── RecipeSharePoster.vue      # 海报预览组件（Vue 模板）
│   │   └── ...
│   ├── composables/
│   │   └── useSharePoster.ts          # Canvas 海报生成器
│   └── pages/recipes/
│       └── [id].vue                   # 详情页（集成分享按钮）
├── i18n/locales/
│   ├── zh-CN.json                     # 中文翻译
│   └── en.json                       # 英文翻译
└── docs/
    └── share-poster-feature.md        # 本文档
```

## 使用方式

### 用户端

1. 打开任意食谱详情页
2. 点击顶部导航栏 📤 分享按钮
3. **移动端**：点击食谱标题卡下方的橙色「分享海报」按钮
4. **桌面端**：点击右上角「📤 分享海报」按钮 或 右侧边栏卡片按钮
5. 浏览器自动下载 `食谱-{名称}-分享海报.png`

### 开发调试

```bash
cd /root/code/recipe-app/web
bun run dev
# 访问 http://localhost:3000/recipes/{任意食谱ID}
```

## 技术实现

### 核心库
- **Canvas API** - 纯前端绘制，无需额外依赖
- **伪 QR 码** - 基于字符串哈希生成，用于视觉展示
  - 真实项目中建议接入 `qrcode` npm 包生成真实 QR 码

### 海报生成流程

```
用户点击分享按钮
    ↓
useSharePoster.downloadPoster(recipe)
    ↓
Canvas 绘制全流程:
    ↓ 绘制渐变背景 + 装饰圆形
    ↓ 绘制顶部栏（Logo + 分类）
    ↓ 绘制食谱封面图（或渐变占位）
    ↓ 绘制徽章（难度/时间/人数）
    ↓ 绘制标题 + 描述
    ↓ 绘制食材卡片（最多5种）
    ↓ 绘制底部 QR 码 + 品牌信息
    ↓ 绘制底部装饰线
    ↓ canvas.toDataURL() → PNG DataURL
    ↓
自动触发 <a download> 点击下载
```

### 纯 Canvas 绘制优势

| 对比项 | html2canvas | 纯 Canvas |
|--------|-------------|-----------|
| 依赖 | 需要安装 | 无外部依赖 |
| DOM 精度 | 可能出现字体/阴影偏差 | 像素级精确控制 |
| 图片加载 | 跨域图片需配置 | 可控的 crossOrigin |
| 包体积 | +45KB (gzip) | +0KB |
| SSR 兼容 | 需要客户端判断 | 天然支持 |

## 后续优化建议

- [ ] **真实 QR 码**：接入 `qrcode` 包生成可扫描的二维码
- [ ] **多尺寸支持**：添加 Instagram Story (1080×1920) 等尺寸选项
- [ ] **模板选择**：提供多套海报风格供用户选择
- [ **水印功能**：添加自定义水印（用户昵称等）
- [ ] **社交平台直传**：接入微博/小红书 API 实现一键发布
- [ ] **预览弹窗**：生成前先预览，允许用户调整

## 相关文件索引

| 文件 | 用途 |
|------|------|
| `app/composables/useSharePoster.ts` | Canvas 海报生成逻辑 |
| `app/components/recipe/RecipeSharePoster.vue` | 海报 Vue 模板组件（参考用） |
| `app/components/recipe/RecipeDetailHeader.vue` | 顶部导航（含分享按钮） |
| `app/components/recipe/RecipeDetailTitleCard.vue` | 移动端标题卡（含分享按钮） |
| `app/components/recipe/RecipeDetailSidebar.vue` | 桌面端侧边栏（含分享卡片） |
| `app/pages/recipes/[id].vue` | 详情页（事件绑定） |
| `i18n/locales/zh-CN.json` | 中文翻译 |

---

*功能上线日期: 2026-03-21 | 由爪爪 🐾 实现*
