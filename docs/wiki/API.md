# API 接口文档

> Recipe App REST API 完整参考

---

## 1. 概述

### 1.1 基础信息

| 项目 | 值 |
|------|-----|
| 基础 URL | `http://localhost:3000/api` |
| 数据格式 | JSON |
| 字符编码 | UTF-8 |
| 认证方式 | 无 (公开 API) |

### 1.2 响应格式

#### 成功响应

```json
{
  "success": true,
  "data": { ... }
}
```

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": { ... }
  }
}
```

### 1.3 HTTP 状态码

| 状态码 | 描述 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 2. 食谱 API

### 2.1 获取食谱列表

获取分页的食谱列表，支持筛选。

**请求**

```
GET /api/recipes
```

**查询参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| limit | number | 否 | 每页数量，默认 20，最大 100 |
| category | string | 否 | 分类筛选 |
| cuisine | string | 否 | 菜系筛选 |
| difficulty | string | 否 | 难度筛选: easy, medium, hard |
| search | string | 否 | 搜索关键词 |
| maxPrepTime | number | 否 | 最大准备时间(分钟) |
| maxCookTime | number | 否 | 最大烹饪时间(分钟) |

**响应示例**

```json
{
  "success": true,
  "data": {
    "recipes": [
      {
        "id": "uuid",
        "title": "番茄炒蛋",
        "description": "经典家常菜",
        "category": "dinner",
        "cuisine": "chinese",
        "servings": 2,
        "prepTimeMinutes": 10,
        "cookTimeMinutes": 15,
        "difficulty": "easy",
        "imageUrl": "https://...",
        "ingredients": [...],
        "steps": [...],
        "tags": ["家常", "快手"],
        "nutritionInfo": {
          "calories": 200,
          "protein": 12
        },
        "createdAt": "2026-01-01T00:00:00Z",
        "updatedAt": "2026-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

---

### 2.2 获取单个食谱

根据 ID 获取食谱详情。

**请求**

```
GET /api/recipes/:id
```

**路径参数**

| 参数 | 类型 | 描述 |
|------|------|------|
| id | string (UUID) | 食谱 ID |

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "番茄炒蛋",
    "description": "经典家常菜，简单易做",
    "category": "dinner",
    "cuisine": "chinese",
    "servings": 2,
    "prepTimeMinutes": 10,
    "cookTimeMinutes": 15,
    "difficulty": "easy",
    "imageUrl": "https://example.com/image.jpg",
    "source": "家传菜谱",
    "ingredients": [
      {
        "id": "uuid-1",
        "name": "番茄",
        "amount": 2,
        "unit": "个"
      },
      {
        "id": "uuid-2",
        "name": "鸡蛋",
        "amount": 3,
        "unit": "个"
      }
    ],
    "steps": [
      {
        "id": "uuid-3",
        "stepNumber": 1,
        "instruction": "番茄切块，鸡蛋打散",
        "durationMinutes": 5
      },
      {
        "id": "uuid-4",
        "stepNumber": 2,
        "instruction": "热锅下油，炒鸡蛋",
        "durationMinutes": 3
      }
    ],
    "tags": ["家常", "快手", "素食"],
    "nutritionInfo": {
      "calories": 200,
      "protein": 12,
      "carbs": 15,
      "fat": 10
    },
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z"
  }
}
```

**错误响应**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Recipe with ID xxx not found"
  }
}
```

---

### 2.3 创建食谱

创建新的食谱。

**请求**

```
POST /api/recipes
```

**请求体**

```json
{
  "title": "番茄炒蛋",
  "description": "经典家常菜",
  "category": "dinner",
  "cuisine": "chinese",
  "servings": 2,
  "prepTimeMinutes": 10,
  "cookTimeMinutes": 15,
  "difficulty": "easy",
  "ingredients": [
    {
      "name": "番茄",
      "amount": 2,
      "unit": "个"
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "番茄切块"
    }
  ],
  "tags": ["家常"],
  "nutritionInfo": {
    "calories": 200
  }
}
```

**必填字段**

| 字段 | 类型 | 描述 |
|------|------|------|
| title | string | 食谱标题，非空 |
| category | string | 分类，非空 |
| servings | number | 份数，正整数 |
| prepTimeMinutes | number | 准备时间，非负整数 |
| cookTimeMinutes | number | 烹饪时间，非负整数 |
| difficulty | string | 难度: easy, medium, hard |
| ingredients | array | 食材数组，至少 1 个 |
| steps | array | 步骤数组，至少 1 个 |

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "番茄炒蛋",
    ...
  }
}
```

---

### 2.4 更新食谱

更新现有食谱。

**请求**

```
PUT /api/recipes/:id
```

**路径参数**

| 参数 | 类型 | 描述 |
|------|------|------|
| id | string (UUID) | 食谱 ID |

**请求体**

所有字段可选，只更新提供的字段。

```json
{
  "title": "新标题",
  "servings": 4,
  "ingredients": [
    {
      "name": "新食材",
      "amount": 1,
      "unit": "个"
    }
  ]
}
```

**响应示例**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "新标题",
    "servings": 4,
    ...
  }
}
```

---

### 2.5 删除食谱

删除指定食谱。

**请求**

```
DELETE /api/recipes/:id
```

**路径参数**

| 参数 | 类型 | 描述 |
|------|------|------|
| id | string (UUID) | 食谱 ID |

**响应示例**

```json
{
  "success": true,
  "data": null
}
```

---

## 3. 搜索 API

### 3.1 搜索食谱

全文搜索食谱和食材。

**请求**

```
GET /api/search
```

**查询参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| q | string | 是 | 搜索关键词 |
| scope | string | 否 | 搜索范围: recipes, ingredients, all (默认 all) |
| limit | number | 否 | 结果数量，默认 20 |

**响应示例**

```json
{
  "success": true,
  "data": [
    {
      "type": "recipe",
      "id": "uuid",
      "title": "番茄炒蛋",
      "snippet": "...番茄...",
      "relevanceScore": 0.95
    },
    {
      "type": "ingredient",
      "id": "uuid",
      "title": "番茄",
      "snippet": "出现在 5 个食谱中"
    }
  ]
}
```

---

## 4. 分类 API

### 4.1 获取所有分类

**请求**

```
GET /api/categories
```

**响应示例**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "breakfast",
      "translations": [
        { "locale": "zh-CN", "name": "早餐" }
      ]
    },
    {
      "id": 2,
      "name": "lunch",
      "translations": [
        { "locale": "zh-CN", "name": "午餐" }
      ]
    }
  ]
}
```

---

### 4.2 获取所有菜系

**请求**

```
GET /api/cuisines
```

**响应示例**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "chinese",
      "translations": [
        { "locale": "zh-CN", "name": "中式" }
      ]
    },
    {
      "id": 2,
      "name": "italian",
      "translations": [
        { "locale": "zh-CN", "name": "意式" }
      ]
    }
  ]
}
```

---

## 5. 上传 API

### 5.1 上传图片

**请求**

```
POST /api/uploads/image
```

**请求体**

`multipart/form-data`

| 字段 | 类型 | 描述 |
|------|------|------|
| file | File | 图片文件 |
| width | number | 可选，目标宽度 |
| height | number | 可选，目标高度 |
| quality | number | 可选，质量 1-100，默认 85 |

**响应示例**

```json
{
  "success": true,
  "data": {
    "url": "https://storage.example.com/images/uuid.jpg",
    "width": 800,
    "height": 600
  }
}
```

---

### 5.2 上传视频

**请求**

```
POST /api/uploads/video
```

**请求体**

`multipart/form-data`

| 字段 | 类型 | 描述 |
|------|------|------|
| file | File | 视频文件 |

**响应示例**

```json
{
  "success": true,
  "data": {
    "url": "https://storage.example.com/videos/uuid.mp4",
    "duration": 120
  }
}
```

---

## 6. SEO API

### 6.1 Sitemap

**请求**

```
GET /api/sitemap
```

**响应**

XML 格式的 sitemap

### 6.2 Robots.txt

**请求**

```
GET /api/robots
```

**响应**

```
User-agent: *
Allow: /
Sitemap: https://example.com/api/sitemap
```

---

## 7. 数据类型

### 7.1 Recipe 对象

```typescript
interface Recipe {
  id: string;                    // UUID
  title: string;                 // 标题
  description?: string;          // 描述
  category: string;              // 分类
  cuisine?: string;              // 菜系
  servings: number;              // 份数
  prepTimeMinutes: number;       // 准备时间
  cookTimeMinutes: number;       // 烹饪时间
  difficulty: 'easy' | 'medium' | 'hard';  // 难度
  imageUrl?: string;             // 图片 URL
  source?: string;               // 来源
  ingredients: Ingredient[];     // 食材列表
  steps: RecipeStep[];           // 步骤列表
  tags?: string[];               // 标签
  nutritionInfo?: NutritionInfo; // 营养信息
  createdAt?: Date;              // 创建时间
  updatedAt?: Date;              // 更新时间
}
```

### 7.2 Ingredient 对象

```typescript
interface Ingredient {
  id?: string;       // UUID
  name: string;      // 名称
  amount: number;    // 数量
  unit: string;      // 单位
}
```

### 7.3 RecipeStep 对象

```typescript
interface RecipeStep {
  id?: string;              // UUID
  stepNumber: number;       // 步骤序号
  instruction: string;      // 指令
  durationMinutes?: number; // 持续时间
}
```

### 7.4 NutritionInfo 对象

```typescript
interface NutritionInfo {
  calories?: number;  // 卡路里
  protein?: number;   // 蛋白质
  carbs?: number;     // 碳水化合物
  fat?: number;       // 脂肪
  fiber?: number;     // 纤维
}
```

---

## 8. 错误码参考

| 错误码 | HTTP 状态码 | 描述 |
|--------|-------------|------|
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 数据验证失败 |
| DB_ERROR | 500 | 数据库操作失败 |
| UNKNOWN_ERROR | 500 | 未知错误 |

---

**文档版本**: 1.0  
**Commit**: [`adb26e9`](https://github.com/leiyunkang7/recipe-app/commit/adb26e9b72f7569283201b389feabc4f85279a36)  
**最后更新**: 2026-04-05

> 此文档与代码版本关联，用于增量更新。详见 [.version.md](./.version.md)
