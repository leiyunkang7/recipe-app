# Recipe App 产品需求迭代路线图 (2026)

> 基于项目现状分析，涵盖用户系统、社交、搜索、AI、移动端等 **20 个方向、120+ 条具体需求**
>
> 最后更新: 2026-04-05 | 当前版本: v1.x

---

## 目录

1. [用户系统与认证](#1-用户系统与认证) (P0 - 8条)
2. [社交与社区功能](#2-社交与社区功能) (P0 - 7条)
3. [搜索与发现增强](#3-搜索与发现增强) (P0 - 8条)
4. [内容管理与编辑器](#4-内容管理与编辑器) (P1 - 8条)
5. [烹饪模式升级](#5-烹饪模式升级) (P1 - 8条)
6. [营养与健康追踪](#6-营养与健康追踪) (P1 - 7条)
7. [智能推荐与个性化](#7-智能推荐与个性化) (P1 - 6条)
8. [多媒体增强](#8-多媒体增强) (P1 - 6条)
9. [数据导入导出扩展](#9-数据导入导出扩展) (P2 - 6条)
10. [CLI 工具链增强](#10-cli-工具链增强) (P2 - 6条)
11. [国际化与本地化扩展](#11-国际化与本地化扩展) (P2 - 5条)
12. [移动端 PWA 增强](#12-移动端-pwa-增强) (P1 - 7条)
13. [管理后台增强](#13-管理后台增强) (P1 - 7条)
14. [SEO 与增长优化](#14-seo-与增长优化) (P2 - 5条)
15. [性能优化](#15-性能优化) (P1 - 6条)
16. [测试覆盖率提升](#16-测试覆盖率提升) (P1 - 6条)
17. [DevOps 与部署](#17-devops-与部署) (P2 - 5条)
18. [无障碍访问 A11y](#18-无障碍访问-a11y) (P2 - 5条)
19. [安全性加固](#19-安全性加固) (P1 - 6条)
20. [数据分析与运营后台](#20-数据分析与运营后台) (P2 - 5条)

---

## 1. 用户系统与认证

> **优先级**: P0 (最高) | **现状**: 数据库有 `favorites`/`recipe_ratings` 表但 API 层未启用认证

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 1.01 | `AUTH-SIGNUP` | 用户注册功能 | 支持邮箱注册 + 密码 + 用户名；邮箱验证码机制；注册后默认创建"我的收藏""想做的菜"两个收藏夹 | `database/src/schema/users.ts`, `web/server/api/auth/` |
| 1.02 | `AUTH-LOGIN` | 多方式登录 | 邮箱+密码登录；Google OAuth 登录；微信扫码登录（中文环境）；记住登录状态（JWT Refresh Token） | `services/auth/`, `web/app/pages/login.vue` |
| 1.03 | `AUTH-PERSONAL-CENTER` | 个人资料页 | 头像上传/裁剪；昵称/简介编辑；饮食偏好设置（素食/过敏原/口味偏好）；烹饪水平自评 | `web/app/pages/settings/profile.vue` |
| 1.04 | `AUTH-PASSWORD-MGMT` | 密码管理 | 忘记密码 -> 邮箱重置链接；修改密码（需验证旧密码）；密码强度实时检测（Zod 验证） | `web/server/api/auth/password.ts` |
| 1.05 | `AUTH-ACTIVATION` | 收藏功能启用 | 启用 `favorites` 表 API；用户登录后才可收藏；收藏同步到云端（跨设备） | `web/server/api/favorites/`, `useFavorites.ts` |
| 1.06 | `AUTH-RATING-ENABLE` | 评分功能启用 | 启用 `recipe_ratings` 表 API；登录用户可 1-5 星评分 + 文字评价；评分需审核或即时展示（可配置） | `web/server/api/ratings/`, `RecipeRating.vue` |
| 1.07 | `AUTH-SESSION` | 会话管理 | 登录状态持久化（Cookie + localStorage 双保险）；Token 自动刷新；多设备登录管理（查看/踢出） | `web/app/composables/useAuth.ts`, middleware |
| 1.08 | `AUTH-RBAC` | 角色权限控制 | 三角色: admin/editor/user；admin 可管理所有食谱；editor 可创建/编辑自己的食谱；user 只可收藏/评论 | `shared/types/src/permissions.ts`, middleware |

---

## 2. 社交与社区功能

> **优先级**: P0 | **现状**: 仅本地 localStorage 收藏

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 2.01 | `SOCIAL-FEED` | 关注动态流 | 关注其他用户后看到其新食谱/收藏/评论动态；时间线排序（类似微博/Instagram Feed）；支持点赞互动 | `web/app/pages/feed/index.vue` |
| 2.02 | `SOCIAL-COMMENT` | 食谱评论区 | 每个食谱下方评论区；支持多级回复（@提及）；评论可包含图片；Markdown 格式支持 | `web/app/components/comment/`, `database/src/schema/comments.ts` |
| 2.03 | `SOCIAL-FOLLOW` | 关注/粉丝系统 | 关注用户；粉丝列表展示；关注后通知推送；可设置账户为公开/私密 | `services/social/`, `web/app/pages/[id]/followers.vue` |
| 2.04 | `SOCIAL-SHARE-ENHANCE` | 分享增强 | 生成精美食谱卡片图片分享到朋友圈/Instagram Story；嵌入小程序卡片（微信）；复制 Markdown 格式食谱文本 | `useSharePoster.ts`, `services/canvas-service/` |
| 2.05 | `SOCIAL-COOKBOOK` | 合集/菜谱书功能 | 用户可创建"周末早午餐合集"等自定义合集；将食谱加入合集；合集可公开分享/设为私有；合集约缩图自动生成 | `database/src/schema/cookbooks.ts`, `web/app/pages/cookbooks/` |
| 2.06 | `SOCIAL-NOTIFICATION` | 通知中心 | 新粉丝/点赞/评论/回复通知；未读红点标记；通知列表按时间分组（今天/更早）；批量已读 | `web/app/components/NotificationBell.vue` |
| 2.07 | `SOCIAL-REPORT` | 内容举报 | 举报食谱/评论（原因选择：抄袭/不当内容/错误信息）；管理员审核后台处理；举报记录留存审计 | `web/server/api/reports.ts`, admin panel |

---

## 3. 搜索与发现增强

> **优先级**: P0 | **现状**: 基于 ILIKE 的基础搜索 + 相关性评分算法

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 3.01 | `SEARCH-FULLTEXT` | 全文检索引擎 | 引入 PostgreSQL `tsvector` / `GIN` 索引；支持中文分词（pg_jieba 或 zhparser）；搜索结果高亮关键词匹配部分 | `database/migrations/`, `services/search/src/service.ts` |
| 3.02 | `SEARCH-FACETED` | 分面搜索（Faceted Search） | 左侧筛选面板：分类/菜系/难度/时间/热量多维度同时过滤；每个筛选项显示匹配数量；筛选条件 URL 化（可分享搜索结果） | `web/app/components/search/FacetedSearch.vue`, `web/app/pages/search/index.vue` |
| 3.03 | `SEARCH-AUTOCOMPLETE` | 搜索自动补全增强 | 输入时下拉显示联想结果；支持拼音搜索（输入 "jidan" 匹配 "鸡蛋"）；搜索历史记录（本地存储）；热门搜索词榜单 | `HeroSection.vue`, `services/search/src/service.ts` |
| 3.04 | `SEARCH-RELATED` | 相关食谱推荐 | 食谱详情页 "你可能还喜欢"；基于同分类/同菜系/同标签的协同过滤算法；点击即加载无需跳转 | `web/app/components/related/RelatedRecipes.vue` |
| 3.05 | `SEARCH-TRENDING` | 热门趋势 | 首页 "本周热门" 区块；基于浏览量/收藏量/近期新增的综合热度算法；按分类的热门榜单（如 "甜点 Top 10"） | `web/app/components/home/TrendingSection.vue` |
| 3.06 | `SEARCH-ADVANCED` | 高级搜索 | 搜索语法支持：排除词（-糖）、精确匹配（"宫保鸡丁"）、OR 逻辑（鸡肉 OR 鸭肉）、范围筛选（时间<30min）；高级搜索展开面板 | `services/search/` |
| 3.07 | `SEARCH-RECENT` | 最近浏览记录 | 本地存储最近浏览的 50 条食谱记录；首页 "继续看" 快速入口；跨设备同步（登录用户） | `web/app/composables/useRecentHistory.ts` |
| 3.08 | `SEARCH-Voice` | 语音搜索（移动端） | 首页搜索框麦克风图标；调用 Web Speech API 语音转文字；支持中英文语音识别；语音搜索结果高亮 | `HeroSection.vue` |

---

## 4. 内容管理与编辑器

> **优先级**: P1 | **现状**: Web 表单 + CLI 交互式创建

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 4.01 | `EDITOR-RICH-STEP` | 富文本步骤编辑器 | 步骤描述支持加粗/斜体/有序列表；步骤内嵌套子步骤（如 "酱汁部分: 1.混合..."）；拖拽排序步骤顺序 | `admin/AdminRecipeSteps.vue`, 引入 TipTap |
| 4.02 | `EDITOR-IMAGE-IN-STEP` | 步骤配图上传 | 每个烹饪步骤可上传 1 张过程图；步骤列表显示缩略图；移动端步骤大图左右滑动查看；图片压缩至 800px 宽 | `AdminRecipeSteps.vue`, ImageService |
| 4.03 | `EDITOR-INGREDIENT-SUB` | 食材分组 | 将食材分为"主料""调料""酱汁"等组；每组小标题可自定义；前端按组渲染食材列表 | `database/src/schema/ingredient_groups.ts` |
| 4.04 | `EDITOR-INGREDIENT-LINK` | 食材关联与替换 | 食材库标准化（"番茄"="西红柿"自动归一化）；点击食材名查看含此食材的其他食谱；食材替代建议（无鸡蛋时用什么替） | `services/ingredient-library/` |
| 4.05 | `EDITOR-NUTRITION-AUTO` | 营养成分自动计算 | 根据食材和份量自动估算营养成分；接入营养数据库（USDA 或中文食物成分表）；允许手动修正自动计算值 | `services/nutrition-calculator/` |
| 4.06 | `EDITOR-DRAFT` | 草稿箱功能 | 自动保存草稿（每 30s 或离开页面时）；草稿列表管理；草稿可继续编辑或删除；发布前预览效果 | `web/app/composables/useDraft.ts`, database drafts table |
| 4.07 | `EDITOR-VERSION` | 食谱版本历史 | 每次修改保存一个版本；可查看历史版本差异（Diff 对比）；一键回滚到历史版本；版本变更日志记录 | `database/src/schema/recipe_versions.ts` |
| 4.08 | `EDITOR-BULK-IMPORT-ENHANCE` | 批量导入增强 | 支持 YAML/Markdown 格式导入；从网页 URL 抓取食谱（Recipe Schema.org 微数据）；Excel/CSV 批量导入模板下载；导入冲突处理策略（跳过/覆盖/重命名） | `cli/src/commands/import.ts` |

---

## 5. 烹饪模式升级

> **优先级**: P1 | **现状**: 全屏步骤引导 + 计时器 + 进度条

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 5.01 | `COOKING-VOICE-GUIDE` | 语音播报引导 | 每步切换时 TTS 语音朗读步骤说明；支持语速调节（0.5x - 2x）；支持中英文语音；后台播放不中断 | `CookingMode.vue`, Web Speech Synthesis API |
| 5.02 | `COOKING-TIMER-MULTI` | 多个并行计时器 | 同时运行多个计时器（如 "煮面 8min" + "调酱汁"）；计时器独立暂停/继续；计时结束时震动+声音提醒 | `CookingModeTimer.vue` |
| 5.03 | `COOKING-HANDS-FREE` | 免提模式（手势控制） | 下一步/上一步手势滑动切换；语音命令 "下一步"/"返回"/"重复"；防止误触的大按钮设计（触控目标 > 60px） | `CookingMode.vue`, gesture library |
| 5.04 | `COOKING-PROGRESS-PERSIST` | 烹饪进度持久化 | 刷新页面/意外关闭不丢失当前步骤和已完成勾选；重新进入烹饪模式时询问"继续上次？"；LocalStorage + IndexedDB 双写 | `CookingMode.vue`, useCookingProgress composable |
| 5.05 | `COOKING-STEP-VIDEO` | 步骤视频演示 | 关键步骤支持嵌入短视频（3-15秒 GIF/短视频）；视频自动循环播放；视频画中画模式（可边看边操作） | `CookingModeStep.vue`, VideoService |
| 5.06 | `COOKING-SERVINGS-ADJUSTER` | 份量实时调整 | 烹饪模式中快速调整份量（2人→4人）；食材用量自动换算（×2 显示）；换算结果四舍五入到合理单位 | `CookingMode.vue`, services/scale-calculator |
| 5.07 | `COOKING-COMPLETE-SUMMARY` | 完成总结页 | 全部步骤完成后的庆祝动画；"标记为已做"写入个人记录；一键分享烹饪成果到社交媒体（带成品图）；营养摄入汇总 | `CookingMode.vue`, `profile.vue` |
| 5.08 | `COOKING-DARK-MODE` | 烹饪模式暗色主题优化 | 纯黑背景减少夜间刺眼；高对比度白色文字（WCAG AAA）；橙色强调色保持品牌一致性；防蓝光暖色调滤镜 | `CookingMode.vue` CSS |

---

## 6. 营养与健康追踪

> **优先级**: P1 | **现状**: 基础营养统计（今日/本周）+ 手动标记已吃

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 6.01 | `NUTRITION-DAILY-TARGET` | 每日营养目标设定 | 自定义每日热量/蛋白质/碳水/脂肪/纤维目标；预设目标模板（减脂/增肌/维持/低碳）；根据身高体重年龄 BMR 自动推荐目标值 | `profile/nutrition-settings.vue` |
| 6.02 | `NUTRITION-MEAL-LOG` | 餐次记录细化 | 早餐/午餐/晚餐/加餐 分类记录；每餐添加备注（"今天多放了点油"）；餐次时间线视图；日历热力图展示记录完整性 | `profile.vue` 重构, `database/meal_logs.ts` |
| 6.03 | `NUTRITION-MACRO-PIE` | 宏量营养素饼图 | 今日蛋白质/碳水/脂肪占比环形图；与目标值对比偏差提示；交互式 tooltip 显示克数和百分比 | `nutrition/NutritionPieChart.vue`, ECharts/Chart.js |
| 6.04 | `NUTRITION-MICRO` | 微量营养素展示 | 展示维生素A/C/D/铁/钙/钠等微量营养素；颜色编码（绿色充足/黄色偏低/红色不足）；点击查看哪些食谱可补充该元素 | `nutrition/MicroNutrients.vue`, nutrition DB |
| 6.05 | `NUTRITION-WATER` | 饮水量追踪 | 每日饮水目标（默认 2000ml）；快捷按钮记录饮水量（200ml/杯）；今日饮水进度环；定时喝水提醒（通知） | `profile/WaterTracker.vue` |
| 6.06 | `NUTRITION-WEEKLY-REPORT` | 周报生成 | 每周日自动生成本周饮食周报；平均营养摄入 vs 目标；最爱食谱 TOP 5；下周饮食建议（基于不足项）；周报可分享 | `services/report-generator/` |
| 6.07 | `NUTRITION-ALLERGY-TAG` | 过敏原/饮食限制标记 | 用户设置过敏原（坚果/乳制品/麸质等）；食谱中含过敏原时醒目警告标签；素食/纯素/生酮/地中海等饮食模式筛选 | `user_preferences` table, recipe cards |

---

## 7. 智能推荐与个性化

> **优先级**: P1 | **现状**: 无任何推荐功能

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 7.01 | `REC-HOME-PERSONALIZED` | 首页千人千面 | 基于用户偏好的首页食谱排序（收藏多的分类权重更高）；季节性推荐（夏天推凉菜/冬天推汤锅）；时间段感知（早晨推早餐/傍晚推快手菜） | `useHomePage.ts`, recommendation service |
| 7.02 | `REC-YOU-MAY-LIKE` | "猜你喜欢" 区块 | 基于浏览历史的协同过滤推荐；冷启动时使用热门食谱填充；每次刷新不同结果增加新鲜感；推荐理由标签（"因为你喜欢宫保鸡丁"） | `web/app/components/YouMayLike.vue` |
| 7.03 | `REC-MENU-PLAN` | 智能菜单规划 | 一周菜单自动规划（考虑营养均衡/不重复/时间可行）；手动调整单天菜单；根据菜单一键生成购物清单；菜单模板（减脂周计划/快手工作餐） | `web/app/pages/planner/index.vue` |
| 7.04 | `REC-LEFTOVER` | 剩菜利用推荐 | 输入冰箱剩余食材 → 推荐可用这些食材做的食谱；优先推荐快过期的食材相关食谱；"清空冰箱"专题模式 | `FridgeModeModal.vue` enhance |
| 7.05 | `REC-SEASONAL` | 时令食材推荐 | 首页 "当季推荐" 区块；基于当前月份推荐应季食材及其食谱；食材日历（每月主打食材一览） | `web/app/components/SeasonalSection.vue` |
| 7.06 | `REC-AI-PAIR` | AI 菜品搭配推荐 | "这道菜搭配什么主食好？" AI 建议；完整一桌菜的搭配方案（3菜1汤+主食）；考虑风味互补/色彩搭配/烹饪器具复用 | `services/ai-recommender/` |

---

## 8. 多媒体增强

> **优先级**: P1 | **现状**: 单封面图 + 视频 URL 字段（未实际使用）

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 8.01 | `MULTI-IMAGE-GALLERY` | 食谱图片画廊 | 支持上传多张图片（封面+步骤图+成品图）；Lightbox 大图预览；左右滑动/键盘切换；图片懒加载+渐进式加载 | `RecipeDetailGallery.vue`, ImageService |
| 8.02 | `MULTI-VIDEO-EMBED` | 视频嵌入式播放 | 支持 YouTube/Bilibili 嵌入；视频全屏模式；播放进度与步骤联动（第 3 步开始播放视频某片段）；视频倍速播放 | `RecipeDetailVideo.vue` |
| 8.03 | `MULTI-VIDEO-UPLOAD` | 直传视频到 OSS/S3 | 替代本地文件存储为云存储（Aliyun OSS / AWS S3 / Cloudflare R2）；CDN 加速分发；视频转码为 HLS 流（多清晰度）；缩略图自动截取 | `VideoService` rewrite, cloud SDK |
| 8.04 | `MULTI-WEBP-AVIF` | 图片格式自动转换 | 上传 JPG/PNG 自动转 WebP/AVIF；响应式图片 `<picture>` 标签按设备提供不同格式；旧浏览器回退到 JPEG；图片 CDN 缓存策略 | `ImageService` enhance, Nuxt Image config |
| 8.05 | `MULTI-SCREENSHOT-OCR` | 截图识别食材 | 用户上传菜品照片/截图；OCR 识别图中文字提取食材清单；半结构化填入表单字段；支持中英文 OCR | `services/vision-service/`, Tesseract.js |
| 8.06 | `MULTI-LIVE-PHOTO` | 成品实拍相册 | 食谱详情底部展示 "大家做的" 用户实拍图；上传自己做后的成品照；点赞/鼓励评论；激励徽章体系 | `web/app/components/gallery/UserPhotos.vue` |

---

## 9. 数据导入导出扩展

> **优先级**: P2 | **现状**: CLI JSON 导入导出

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 9.01 | `EXPORT-RECIPE-Schema` | Recipe Schema.org 结构化数据 | 食谱页 JSON-LD 结构化标记；Google 富媒体搜索结果（星级/时间/卡路里）；提高搜索引擎展示丰富度 | `useRecipeSeo.ts` |
| 9.02 | `EXPORT-PDF` | PDF 食谱卡片导出 | 单食谱导出为精美 PDF 卡片（含图片/食材/步骤）；批量导出一周菜单为 PDF 小册子；PDF 模板可选（简约/卡片/详细） | `services/pdf-generator/`, Puppeteer/jsPDF |
| 9.03 | `EXPORT-ICAL` | 日历集成 | "加入日历" 按钮；烹饪时间写入 .ics 文件触发日历应用；提前 30min 提醒开始准备；一周菜单批量加入日历 | `services/calendar-export/` |
| 9.04 | `EXPORT-SHOPPING-LIST` | 购物清单导出 | 根据选中食谱的食材生成购物清单；自动合并相同食材数量（2个食谱各需 2个鸡蛋 → 共4个）；导出为文本/清单 App 兼容格式；打印友好版 | `web/app/composables/useShoppingList.ts` |
| 9.05 | `IMPORT-URL-SCRAPE` | URL 导入食谱 | 粘贴任意食谱网页 URL → 自动抓取结构化数据；解析 Schema.org/微数据/Open Graph 元素；抓取结果预览确认后再导入 | `cli/src/commands/scrape.ts`, Cheerio/Puppeteer |
| 9.06 | `IMPORT-API` | 开放 API 接口 | RESTful CRUD API（除 Web 外）；API Key 认证；Rate Limiting；Swagger/OpenAPI 文档；SDK 生成（支持 TypeScript/Python） | `web/server/api/v1/`, `docs/openapi.yaml` |

---

## 10. CLI 工具链增强

> **优先级**: P2 | **现状**: add/list/get/update/delete/deleteMany/search/import/export/image

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 10.01 | `CLI-STATS` | 数据统计命令 | `recipe stats` 显示总食谱数/总浏览量/分类占比/近30天新增；`recipe stats --category` 各分类数量柱状 ASCII 图；`recipe stats --export stats.json` 导出统计数据 | `cli/src/commands/stats.ts` |
| 10.02 | `CLI-DUPLICATE` | 重复食谱检测 | `recipe duplicate check` 基于标题相似度找重复；`recipe duplicate merge <id1> <id2>` 合并重复食谱（保留更多信息版）；批量去重确认流程 | `cli/src/commands/duplicate.ts` |
| 10.03 | `CLI-BACKUP` | 数据库备份 | `recipe db backup` 创建带时间戳的 SQL 备份；`recipe db restore <file>` 从备份恢复；备份文件压缩（gzip）；备份到云存储（S3/OSS 可选） | `cli/src/commands/backup.ts` |
| 10.04 | `CLI-SEED-ENHANCED` | 种子数据增强 | 更丰富的示例数据集（100+ 条多语言食谱）；真实图片 URL 占位符；覆盖所有分类/菜系/难度组合；营养数据完整填充 | `database/src/__tests__/seed.ts` |
| 10.05 | `CLI-VALIDATE` | 数据校验命令 | `recipe validate --all` 校验所有数据完整性；检查孤立记录（无食谱的食材/翻译缺失必填字段）；修复建议输出；`--fix` 自动修复简单问题 | `cli/src/commands/validate.ts` |
| 10.06 | `CLI-GENERATE` | 代码生成脚手架 | `recipe generate component <Name>` 生成组件骨架（含测试文件）；`recipe generate page <path>` 生成页面；`recipe generate migration <name>` 生成迁移文件模板 | `scripts/generators/` |

---

## 11. 国际化与本地化扩展

> **优先级**: P2 | **现状**: 中英双语 (zh-CN/en)，i18n 前缀路由策略

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 11.01 | `I18N-JA-KO` | 新增日语和韩语 | 新增日语 (ja) 和韩语 (ko) locale 文件；翻译全部 ~300 条 i18n key；UI 适配 CJK 字体混排（Noto Sans CJK）；日期/数字格式本地化 | `web/locales/ja.json`, `web/locales/ko.json` |
| 11.02 | `I18N-RTL` | 阿拉伯语 RTL 支持 | 阿拉伯语 (ar) 及 RTL 布局适配；Tailwind RTL 插件（tailwindcss-rtl）；导航栏/布局镜像翻转；阿拉伯语翻译 | `web/locales/ar.json`, Tailwind config |
| 11.03 | `I18N-CONTENT-TL` | 内容翻译工作流 | 管理后台内置翻译编辑界面（非 JSON 编辑）；翻译记忆库（相似句子复用之前翻译）；机器翻译辅助（DeepL/Google Translate API）；人工审校流程 | `admin/translations.vue` |
| 11.04 | `I18N-UNIT-LOCALIZE` | 计量单位本地化 | 公制(克/ml)/英制(oz/cup/fl oz) 自动转换单位；温度摄氏度/华氏度转换；烤箱档位本地化描述（"中火" ≈ "Medium Heat"）；份量表述本地化（"4人份" = "Serves 4"） | `services/unit-converter/` |
| 11.05 | `I18N-DYNAMIC-LOCALE-LOAD` | 按需加载语言包 | 非首屏渲染的语言包异步加载；切换语言时 Loading 骨架屏；语言包大小监控（超 50KB 告警）；语言包 Tree Shaking 未使用的 key | `nuxt.config.ts`, build optimization |

---

## 12. 移动端 PWA 增强

> **优先级**: P1 | **现状**: PWA 基础配置（manifest/sw/离线）

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 12.01 | `PWA-OFFLINE-RECIPE` | 离线食谱缓存 | 收藏的食谱自动离线缓存（IndexedDB）；离线时可查看已收藏食谱详情；离线编辑草稿（上线后同步）；离线状态指示器和操作引导 | `service-worker.ts`, IndexedDB |
| 12.02 | `PWA-INSTALL-PROMPT` | 安装引导优化 | 自定义安装弹窗（非浏览器原生）；安装利益点说明（"离线查看 / 全屏体验 / 快速启动"）；iOS Safari "添加到主屏幕" 引导横幅；安装后跟踪来源 | `web/app/components/InstallPrompt.vue` |
| 12.03 | `PWA-PUSH-NOTIF` | Push 通知 | 新食谱推送通知（订阅的分类有更新时）；烹饪模式计时结束通知；关注的用户发布了新食谱；通知偏好设置（可关闭某类通知） | `web/server/api/push/`, Web Push API |
| 12.04 | `PWA-SPLASH` | 启动画面优化 | 自定义 Splash Screen（品牌 Logo + 渐变背景）；启动耗时监控（>3s 需优化）；骨架屏先行（比 Spinner 更好的感知速度）；PWA 启动速度优化指南 | `app.html`, CSS |
| 12.05 | `PWA-SHARE-TARGET` | Share Target API | 从系统分享菜单直接接收内容；分享网址自动解析为食谱导入；分享图片作为食谱封面；分享文本解析为食材/步骤 | `sw.ts`, Share Target handler |
| 12.06 | `PWA-SCREENWAKELOCK` | 屏幕常亮强化 | 烹饪模式强制屏幕常亮（已有 WakeLock API）；异常退出时释放锁；低电量时降级提示；兼容性 fallback（视频伪播放法） | `useWakeLock.ts` enhance |
| 12.07 | `PWA-BADGE` | 应用图标角标 | 未读消息数显示在 App Icon 角标上；收藏数变化时 Badge 更新；Badging API + 降级方案 | `composables/useBadge.ts` |

---

## 13. 管理后台增强

> **优先级**: P1 | **现状**: 基础食谱 CRUD + 统计卡片

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 13.01 | `ADMIN-DASHBOARD` | 运营数据仪表盘 | DAU/MAU 曲线图；新增食谱/新增用户趋势；Top 10 热门食谱排行；搜索关键词词云；地图分布（如有地域数据） | `admin/dashboard.vue`, ECharts |
| 13.02 | `ADMIN-USER-MGMT` | 用户管理模块 | 用户列表（搜索/筛选/封禁）；用户详情（注册时间/食谱数/活跃度）；批量操作（发通知/重置密码/打标签）；用户分组（VIP/普通/新手） | `admin/users/index.vue` |
| 13.03 | `ADMIN-CONTENT-MOD` | 内容审核队列 | 待审核食谱列表（用户提交的新食谱）；审核操作（通过/拒绝/要求修改）；拒绝理由模板；审核员操作日志 | `admin/moderation/index.vue` |
| 13.04 | `ADMIN-CATEGORY-MGT` | 分类/菜系管理 | 可视化管理分类和菜系（增删改查/排序）；分类图标/颜色设置；分类翻译管理（多语言名称）；分类下食谱数量统计 | `admin/taxonomy/index.vue` |
| 13.05 | `ADMIN-TAG-MGT` | 标签管理 | 所有标签列表及使用频次；合并同义词标签（"西红柿"→"番茄"）；禁用不当标签；标签推荐（创建时自动提示现有标签） | `admin/tags/index.vue` |
| 13.06 | `ADMIN-IMPORT-UI` | Web 端批量导入 | 后台页面 Excel/CSV 文件上传导入；导入预览表格（逐行确认）；错误行高亮并支持行内编辑；导入进度条+结果报告 | `admin/tools/import.vue` |
| 13.07 | `ADMIN-ACTIVITY-LOG` | 操作日志审计 | 所有管理操作记录日志；按操作者/时间/类型筛选；关键操作（删除/封禁）二次确认；日志不可篡改（仅追加） | `admin/logs/activity.vue` |

---

## 14. SEO 与增长优化

> **优先级**: P2 | **现状**: Sitemap + robots.txt + 基本 Meta 标签

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 14.01 | `SEO-BREADCRUMB` | 面包屑导航 | 首页 > 分类 > 食谱详情 层级面包屑；Schema.org BreadcrumbList 结构化数据；每个层级都可点击跳转；移动端简洁版面包屑 | `components/Breadcrumb.vue` |
| 14.02 | `SEO-CANONICAL` | 规范链接强化 | 分页 canonical (`?page=2`)；带参数 URL 的 canonical 归一化；HTTP→HTTPS 301 跳转；www vs naked domain 统一 | `nuxt.config.ts`, server middleware |
| 14.03 | `SEO-OG-ENHANCE` | Open Graph 优化 | 食谱详情 og:type=article + published_time；og:image 使用高质量封面（最小 1200x630）；Twitter Card 类型选择（summary_large_image）；分享调试预览工具 | `useRecipeSeo.ts` |
| 14.04 | `SEO-INTERNAL-LINK` | 内链建设 | 食谱详情页 "更多 XX 分类食谱" 内链区块；相关菜系交叉链接；食材页聚合（点击 "鸡蛋" → 含鸡蛋的所有食谱）；自动内链建议工具 | `RecipeDetailSidebar.vue` |
| 14.05 | `SEO-PERFORMANCE` | Core Web Vitals 优化 | LCP < 2.5s（关键图片预加载）；FID < 100ms（JS 分包+延迟加载）；CLS < 0.1（尺寸预留+font display swap）；性能预算监控告警 | `nuxt.config.ts`, vite build |

---

## 15. 性能优化

> **优先级**: P1 | **现状**: 虚拟滚动 + Lazy 组件加载

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 15.01 | `PERF-ISR` | ISR 增量静态再生 | 食谱详情页 ISR（首次静态生成，后台定期刷新）；分类/列表页 ISR；Stale-While-Revalidate 策略；减少服务端实时渲染压力 | `nuxt.config.ts`, route rules |
| 15.02 | `PERF-EDGE` | Edge 缓存部署 | 静态资源 CDN 边缘缓存；API 响应边缘缓存（短 TTL）；图片 CDN 分发（多区域节点）；Cloudflare/CloudFront 配置 | deployment config |
| 15.03 | `PERF-IMAGE-LAZY` | 图片懒加载优化 | 骨架屏占位 → 模糊小图 → 高清大图的渐进式加载；Native loading=lazy 浏览器原生懒加载；Above-the-fold 图片立即加载（Hero 区域）；WebP/AVIF 响应式 | `AppImage.vue` enhance |
| 15.04 | `PERF-BUNDLE` | JS 包体积优化 | 分析 chunk size（rollup-plugin-visualizer）；第三方库按需引入（lodash-es/tree-shaking）；移除未使用的 i18n key；目标: 首屏 JS < 150KB gzipped | `vite.config.ts`, bundle analysis |
| 15.05 | `PERF-API-CACHE` | API 响应缓存 | 不常变数据 Redis/Memory 缓存（分类列表/菜系列表）；缓存失效策略（食谱变更时清除相关缓存）；客户端 SWR（stale-revalidate）；Cache-Control 头部设置 | `server/utils/cache.ts` |
| 15.06 | `PERF-DB-QUERY` | 数据库查询优化 | 慢查询日志分析（>100ms）；N+1 查询消除（JOIN 替代循环查询）；索引优化（EXPLAIN ANALYZE）；只查询必要字段（避免 SELECT *） | `database/migrations/`, query audit |

---

## 16. 测试覆盖率提升

> **优先级**: P1 | **现状**: 约 90%+ 单元测试覆盖，14 个 E2E 测试

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 16.01 | `TEST-E2E-FRIDGE` | 冰箱模式 E2E 测试 | FridgeModeModal 完整交互流程测试；食材输入/删除/搜索行为验证；空状态/有结果状态切换；移动端适配测试 | `web/e2e/fridge-mode.spec.ts` |
| 16.02 | `TEST-E2E-COOKING` | 烹饪模式 E2E 测试 | 进入/退出烹饪模式流程；步骤前进后退；计时器启动/暂停/完成；旋转屏幕适配；锁屏恢复测试 | `web/e2e/cooking-mode.spec.ts` |
| 16.03 | `TEST-E2E-ADMIN-FULL` | 管理后台 E2E 测试 | 创建食谱完整流程（填写→提交→验证→列表出现）；编辑已有食谱；删除确认流程；批量选择删除；搜索过滤 | `web/e2e/admin-full.spec.ts` |
| 16.04 | `TEST-E2E-I18N-COMPLETE` | 国际化完整 E2E 测试 | 中英文切换所有页面文案正确；URL 前缀正确切换（/en/, /zh-CN/）；语言切换后 API 请求携带正确 locale；RTL 语言布局（若已实现） | `web/e2e/i18n-complete.spec.ts` |
| 16.05 | `TEST-E2E-PWA` | PWA 功能 E2E 测试 | Service Worker 注册成功；离线模式下可访问已缓存页面；Install Prompt 触发条件；Add to Home Screen 流程 | `web/e2e/pwa.spec.ts` |
| 16.06 | `TEST-UNIT-SERVICE` | 服务层边界测试 | RecipeService 异常场景（数据库连接断开/约束违反）；SearchService 特殊字符注入测试；ImageService 恶意文件上传拦截；并发请求竞态条件测试 | `services/*/src/__tests__/` enhance |

---

## 17. DevOps 与部署

> **优先级**: P2 | **现状**: 本地开发 + 手动部署

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 17.01 | `CI-PIPELINE` | CI/CD Pipeline | GitHub Actions 工作流：lint → test(unit) → test(e2e) → build → deploy to staging；PR 自动触发 CI；Main 分支合并自动部署 Production；失败通知 Slack/钉钉/企微 | `.github/workflows/` |
| 17.02 | `DOCKER-DEPLOY` | Docker 容器化部署 | 多阶段构建 Dockerfile（build → production）；docker-compose.yml（app + postgres + redis）；环境变量 .env.example；生产级 docker-compose.prod.yml | `Dockerfile`, `docker-compose.yml` |
| 17.03 | `STAGING-ENV` | 预发布环境 | Staging 环境自动部署（main 分支）；域名/SSL 配置；数据库从生产环境定期同步脱敏数据；功能开关（Feature Flags） | deployment scripts |
| 17.04 | `MONITORING` | 监控告警 | 应用性能监控（APM - Sentry/Datadog）；错误追踪（自动捕获前后端异常）；性能指标 Dashboard（p95 延迟/QPS/错误率）；告警规则（错误率>1%/延迟>2s） | `nuxt.config.ts` Sentry module |
| 17.05 | `LOG-AGGREGATION` | 日志聚合 | 结构化 JSON 日志（Pino）；日志级别按环境区分（dev=debug, prod=warn）；日志集中收集（ELK/Loki/GCP Cloud Logging）；日志保留策略和归档 | `server/utils/logger.ts` |

---

## 18. 无障碍访问 A11y

> **优先级**: P2 | **现状**: 基础触摸目标规范 (44px min)

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 18.01 | `A11Y-KEYBOARD` | 完整键盘导航 | Tab 键顺序合理（视觉顺序一致）；Focus 可见轮廓明确；Escape 关闭模态框/抽屉；Skip Navigation 链接（跳到主内容） | 全局组件 |
| 18.02 | `A11Y-SCREEN-READER` | 屏幕阅读器优化 | 所有图标按钮添加 aria-label；食谱卡片语义化（article + heading）；动态内容的 aria-live 区域；表单错误与 input 的 aria-describedby 关联 | 全局组件 |
| 18.03 | `A11Y-COLOR` | 颜色对比度达标 | 所有文字 WCAG AA 级对比度（4.5:1）；橙色主题色在白底/深色底的对比度检测；重点操作按钮 AAA 级（7:1）；自动化回归检测（axe-core CI） | `assets/css/`, `web/tests/a11y-contrast.test.ts` |
| 18.04 | `A11Y-MOTION` | 动画减弱支持 | 尊重 `prefers-reduced-motion` 设置；关闭或减缓所有过渡动画；烹饪模式的计时器动画简化；Loading Spinner 用静态指示器替代 | 全局 CSS, `nuxt.config.ts` |
| 18.05 | `A11Y-FONT` | 字体缩放支持 | 支持 200%-400% 字体放大不失真/layout 不破坏；相对单位（rem/em）替代固定 px；行高 1.5+ 保证可读性；不依赖纯颜色传达信息（加图案/文字双通道） | Tailwind config, CSS variables |

---

## 19. 安全性加固

> **优先级**: P1 | **现状**: 基础 SQL 参数化（Drizzle ORM），无认证层

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 19.01 | `SEC-AUTH-MIDDLEWARE` | 认证中间件 | API 路由认证守卫；JWT Token 验证；Token 过期自动刷新；权限粒度控制（路由级+资源级） | `server/middleware/auth.ts` |
| 19.02 | `SEC-RATE-LIMIT` | 接口限流 | IP 级别 Rate Limiting（100 req/min）；用户级别限流（已登录 300 req/min）；敏感接口更低阈值（登录 5次/min，上传 10次/min）；限流响应头（X-RateLimit-Remaining） | `server/middleware/ratelimit.ts` |
| 19.03 | `SEC-CSRF` | CSRF 防护 | 写操作接口 CSRF Token 校验；Double Submit Cookie 模式；SameSite Cookie 属性设置；GET 请求免 CSRF | `server/middleware/csrf.ts` |
| 19.04 | `SEC-INPUT-SANITIZE` | 用户输入净化 | XSS 过滤（DOMPurify）；HTML 标签白名单（富文本字段）；SQL 注入防护（ORM 参数化已覆盖）；文件上传 MIME 类型服务端二次校验 | `server/utils/sanitize.ts` |
| 19.05 | `SEC-CORS` | CORS 策略精细化 | 明确允许的 Origin 白名单；预检请求缓存；凭证传递控制；API 版本路径隔离 `/api/v1/` | `nuxt.config.ts` runtimeConfig |
| 19.06 | `SEC-DEPENDENCY` | 依赖安全扫描 | 定期 `bun audit` / `npm audit`；GitHub Dependabot 自动 PR；锁定文件（bun.lock）提交版本控制；高危漏洞 SLA（24h 内修复） | `package.json`, GitHub settings |

---

## 20. 数据分析与运营后台

> **优先级**: P2 | **现状**: 仅管理后台基础统计卡片

| # | 需求ID | 需求标题 | 详细描述 | 涉及模块 |
|---|--------|---------|---------|----------|
| 20.01 | `ANALYTICS-EVENT` | 埋点事件体系 | 定义核心事件（搜索/查看/收藏/分享/烹饪完成/导出）；事件属性规范（recipe_id/category/device_type）；隐私合规（可匿名/可关闭）；对接分析平台（Umami/Mixpanel/自建） | `web/app/composables/useTracking.ts` |
| 20.02 | `ANALYTICS-FUNNEL` | 核心转化漏斗 | 首页搜索 → 详情查看 → 收藏 → 烹饪完成 漏斗；注册 → 首次收藏 → 首次烹饪 漏斗；各环节转化率监控；异常波动告警 | analytics dashboard |
| 20.03 | `ANALYTICS-ABTEST` | A/B 测试框架 | 测试管理后台（创建/配置/启停实验）；前端分流（用户 ID 哈希）；实验结果统计分析（置信度/P-value）；灰度发布能力 | `web/app/composables/useAbTest.ts`, admin |
| 20.04 | `ANALYTICS-CONTENT` | 内容质量分析 | 低质量内容识别（无图片/步骤过少/描述空白）；用户参与度指标（完读率/停留时长/跳出率）；内容质量打分排序；编辑推荐候选池 | content analysis service |
| 20.05 | `ANALYTICS-EXPORT` | 数据报表导出 | 运营日报/周报/月报自动生成；自定义时间范围报表；CSV/Excel 格式导出；报表定时邮件推送 | admin reports, cron job |

---

## 优先级矩阵总览

```
优先级   │ 数量  │ 方向                          │ 建议排期
─────────┼───────┼───────────────────────────────┼──────────
P0 必须 │ 23条  │ 用户认证 + 社交 + 搜索         │ Q1-Q2
P1 重要 │ 55条  │ 烹饪/营养/推荐/多媒体/PWA/管理 │ Q2-Q3
P2 优化 │ 42条  │ 导入导出/CLI/i18n/SEO/运维     │ Q3-Q4
─────────┼───────┼───────────────────────────────┼──────────
总计    │ 120条 │                              │ 全年
```

## 技术债务清理（Bonus 5 条）

| # | 需求ID | 标题 | 说明 |
|---|--------|------|------|
| D.01 | `DEBT-MOCK-DATA` | 移除 Mock Data 依赖 | E2E 测试使用 Mock Data 而非真实数据库，导致测试无法验证实际查询逻辑。应迁移到 Test Database Container 模式 |
| D.02 | `DEBT-TYPE-ANY` | 消除 `any` 类型 | `nuxt.config.ts` 中有多处 `as any` 强制类型断言（i18n/sitemap/pwa/head），应补充正确的类型声明文件 |
| D.03 | `DEBT-DUP-QUERY` | API 层查询逻辑重复 | `recipes/index.ts` 和 `recipes/[id].ts` 中的 recipe 映射逻辑高度重复，应抽取为共享的 `mapToRecipeResponse()` 函数 |
| D.04 | `DEBT-I18N-HARDCODE` | 消除硬编码中文 | 管理后台多处硬编码中文（如 "已选择 X 个食谱"、"批量删除"），未走 i18n t() 函数 |
| D.05 | `DEBT-ERROR-HANDLE` | 统一错误处理 | API 端点的 catch 块错误处理不一致，部分直接 return error message，部分包装为 { error }，需要统一错误响应中间件 |

---

## 参考与灵感

- **Yummly** - 智能推荐 + 饮食偏好 + 搜索体验
- **Tasty (BuzzFeed)** - 短视频步骤 + 社交分享 + 成品图社区
- **Kitchen Stories** - 精美视频 + 故事化食谱 + 社区氛围
- **Mealime** - 智能菜单规划 + 购物清单 + 家庭协作
- **Paprika Recipe Manager** - 菜谱管理 + 购物清单 + 跨平台同步
- **Cookpad** - UGC 社区 + 实拍图 + 家常菜氛围
- **下厨房** - 中文食谱社区标杆 - 步骤图文/菜单周历/食材百科

---

*本文档由 AI 辅助生成，基于代码库现状分析。需求优先级可根据业务目标调整。*
