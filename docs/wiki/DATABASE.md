# 数据库设计文档

> Recipe App PostgreSQL 数据库完整设计

---

## 1. 概述

### 1.1 数据库信息

| 项目 | 值 |
|------|-----|
| 数据库类型 | PostgreSQL |
| ORM | Drizzle ORM v0.39.3 |
| 主键类型 | UUID v4 |
| 时区处理 | withTimezone: true |
| 命名约定 | snake_case (数据库) / camelCase (应用) |

### 1.2 Schema 文件位置

```
database/src/schema/
├── index.ts        # 导出所有 schema
├── recipes.ts      # 核心食谱表
├── i18n.ts         # 国际化翻译表
├── taxonomy.ts     # 分类和菜系表
└── favorites.ts    # 收藏和评分表
```

---

## 2. ER 图

```
┌─────────────────┐       ┌─────────────────────┐
│    recipes      │       │ recipe_translations │
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │───┐   │ id (PK)             │
│ title           │   │   │ recipe_id (FK)      │
│ description     │   └──▶│ locale              │
│ category        │       │ title               │
│ cuisine         │       │ description         │
│ servings        │       └─────────────────────┘
│ prep_time_min   │
│ cook_time_min   │       ┌─────────────────────┐
│ difficulty      │       │ recipe_ingredients  │
│ image_url       │       ├─────────────────────┤
│ nutrition_info  │───┐   │ id (PK)             │
│ views           │   │   │ recipe_id (FK)      │
│ created_at      │   └──▶│ name                │
│ updated_at      │       │ amount              │
└─────────────────┘       │ unit                │
        │                 └─────────────────────┘
        │
        │                 ┌─────────────────────┐
        │                 │   recipe_steps      │
        │                 ├─────────────────────┤
        ├──▶ ┌─────────────────────┐            │
        │    │ id (PK)             │            │
        │    │ recipe_id (FK)      │◀───────────┘
        │    │ step_number         │
        │    │ instruction         │
        │    │ duration_minutes    │
        │    └─────────────────────┘
        │
        │                 ┌─────────────────────┐
        │                 │    recipe_tags      │
        │                 ├─────────────────────┤
        └──▶ ┌─────────────────────┐            │
             │ id (PK)             │            │
             │ recipe_id (FK)      │◀───────────┘
             │ tag                 │
             └─────────────────────┘
```

---

## 3. 核心表

### 3.1 recipes (食谱主表)

主食谱记录表，存储食谱的基本信息。

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | uuid | PK, DEFAULT gen_random_uuid() | 主键 |
| title | varchar(255) | - | 标题 (可空，优先使用翻译表) |
| description | text | - | 描述 |
| category | varchar(100) | NOT NULL | 分类 |
| cuisine | varchar(100) | - | 菜系 |
| servings | integer | NOT NULL | 份数 |
| prep_time_minutes | integer | NOT NULL | 准备时间(分钟) |
| cook_time_minutes | integer | NOT NULL | 烹饪时间(分钟) |
| difficulty | varchar(20) | NOT NULL | 难度: easy/medium/hard |
| image_url | text | - | 图片 URL |
| source | text | - | 来源 |
| video_url | text | - | 视频 URL |
| source_url | text | - | 来源 URL |
| nutrition_info | jsonb | - | 营养信息 (JSON) |
| views | integer | NOT NULL, DEFAULT 0 | 浏览次数 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |
| updated_at | timestamptz | DEFAULT now() | 更新时间 |

**Drizzle Schema**

```typescript
export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  cuisine: varchar('cuisine', { length: 100 }),
  servings: integer('servings').notNull(),
  prepTimeMinutes: integer('prep_time_minutes').notNull(),
  cookTimeMinutes: integer('cook_time_minutes').notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull(),
  imageUrl: text('image_url'),
  source: text('source'),
  videoUrl: text('video_url'),
  sourceUrl: text('source_url'),
  nutritionInfo: jsonb('nutrition_info').$type<Record<string, number>>(),
  views: integer('views').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

---

### 3.2 recipe_ingredients (食材表)

存储食谱所需的食材。

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| recipe_id | uuid | FK → recipes.id, ON DELETE CASCADE | 食谱 ID |
| name | varchar(255) | NOT NULL | 食材名称 |
| amount | numeric(10,2) | NOT NULL | 数量 |
| unit | varchar(50) | NOT NULL | 单位 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

**Drizzle Schema**

```typescript
export const recipeIngredients = pgTable('recipe_ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

---

### 3.3 recipe_steps (步骤表)

存储烹饪步骤。

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| recipe_id | uuid | FK → recipes.id, ON DELETE CASCADE | 食谱 ID |
| step_number | integer | NOT NULL | 步骤序号 |
| instruction | text | NOT NULL | 步骤说明 |
| duration_minutes | integer | - | 持续时间(分钟) |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

**Drizzle Schema**

```typescript
export const recipeSteps = pgTable('recipe_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(),
  instruction: text('instruction').notNull(),
  durationMinutes: integer('duration_minutes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

---

### 3.4 recipe_tags (标签表)

存储食谱标签。

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| recipe_id | uuid | FK → recipes.id, ON DELETE CASCADE | 食谱 ID |
| tag | varchar(100) | NOT NULL | 标签名称 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

**Drizzle Schema**

```typescript
export const recipeTags = pgTable('recipe_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  tag: varchar('tag', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

---

## 4. i18n 翻译表

### 4.1 recipe_translations (食谱翻译)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| recipe_id | uuid | FK → recipes.id | 食谱 ID |
| locale | varchar(10) | NOT NULL | 语言代码: en, zh-CN |
| title | varchar(255) | NOT NULL | 翻译标题 |
| description | text | - | 翻译描述 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |
| updated_at | timestamptz | DEFAULT now() | 更新时间 |

**唯一约束**: (recipe_id, locale)

---

### 4.2 ingredient_translations (食材翻译)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| ingredient_id | uuid | FK → recipe_ingredients.id | 食材 ID |
| locale | varchar(10) | NOT NULL | 语言代码 |
| name | varchar(255) | NOT NULL | 翻译名称 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

**唯一约束**: (ingredient_id, locale)

---

### 4.3 step_translations (步骤翻译)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| step_id | uuid | FK → recipe_steps.id | 步骤 ID |
| locale | varchar(10) | NOT NULL | 语言代码 |
| instruction | text | NOT NULL | 翻译说明 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

**唯一约束**: (step_id, locale)

---

### 4.4 category_translations (分类翻译)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| category_id | integer | FK → categories.id | 分类 ID |
| locale | varchar(10) | NOT NULL | 语言代码 |
| name | varchar(100) | NOT NULL | 翻译名称 |
| description | text | - | 翻译描述 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

**唯一约束**: (category_id, locale)

---

### 4.5 cuisine_translations (菜系翻译)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| cuisine_id | integer | FK → cuisines.id | 菜系 ID |
| locale | varchar(10) | NOT NULL | 语言代码 |
| name | varchar(100) | NOT NULL | 翻译名称 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

**唯一约束**: (cuisine_id, locale)

---

## 5. 分类表

### 5.1 categories (分类表)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | serial | PK | 主键 |
| name | varchar(100) | NOT NULL, UNIQUE | 分类名称 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

---

### 5.2 cuisines (菜系表)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | serial | PK | 主键 |
| name | varchar(100) | NOT NULL, UNIQUE | 菜系名称 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

---

## 6. 用户相关表

### 6.1 favorites (收藏表)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| user_id | uuid | NOT NULL | 用户 ID |
| recipe_id | uuid | FK → recipes.id | 食谱 ID |
| folder_id | uuid | FK → favorite_folders.id | 文件夹 ID |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

---

### 6.2 favorite_folders (收藏文件夹)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| user_id | uuid | NOT NULL | 用户 ID |
| name | varchar(100) | NOT NULL | 文件夹名称 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

---

### 6.3 recipe_ratings (评分表)

| 字段 | 类型 | 约束 | 描述 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| user_id | uuid | NOT NULL | 用户 ID |
| recipe_id | uuid | FK → recipes.id | 食谱 ID |
| rating | integer | NOT NULL, CHECK (1-5) | 评分 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

---

## 7. 关系定义

### 7.1 Drizzle Relations

```typescript
// recipes 关系
export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
  steps: many(recipeSteps),
  tags: many(recipeTags),
}));

// recipe_ingredients 关系
export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, { 
    fields: [recipeIngredients.recipeId], 
    references: [recipes.id] 
  }),
}));

// recipe_steps 关系
export const recipeStepsRelations = relations(recipeSteps, ({ one }) => ({
  recipe: one(recipes, { 
    fields: [recipeSteps.recipeId], 
    references: [recipes.id] 
  }),
}));

// recipe_tags 关系
export const recipeTagsRelations = relations(recipeTags, ({ one }) => ({
  recipe: one(recipes, { 
    fields: [recipeTags.recipeId], 
    references: [recipes.id] 
  }),
}));
```

---

## 8. 索引策略

### 8.1 推荐索引

```sql
-- 食谱搜索索引
CREATE INDEX idx_recipes_title ON recipes(title);
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);

-- 全文搜索索引 (trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_recipes_title_trgm ON recipes USING gin(title gin_trgm_ops);
CREATE INDEX idx_recipes_description_trgm ON recipes USING gin(description gin_trgm_ops);

-- 外键索引
CREATE INDEX idx_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX idx_tags_recipe_id ON recipe_tags(recipe_id);

-- 翻译表索引
CREATE INDEX idx_recipe_translations_recipe_id ON recipe_translations(recipe_id);
CREATE INDEX idx_recipe_translations_locale ON recipe_translations(locale);
```

---

## 9. 数据迁移

### 9.1 生成迁移

```bash
cd database
bun run db:generate
```

### 9.2 运行迁移

```bash
cd database
bun run db:migrate
```

### 9.3 推送 Schema

```bash
cd database
bun run db:push
```

---

## 10. 查询示例

### 10.1 获取完整食谱

```typescript
const recipe = await db
  .select()
  .from(recipes)
  .where(eq(recipes.id, id))
  .limit(1);

const ingredients = await db
  .select()
  .from(recipeIngredients)
  .where(eq(recipeIngredients.recipeId, id));

const steps = await db
  .select()
  .from(recipeSteps)
  .where(eq(recipeSteps.recipeId, id))
  .orderBy(recipeSteps.stepNumber);

const tags = await db
  .select()
  .from(recipeTags)
  .where(eq(recipeTags.recipeId, id));
```

### 10.2 带翻译的查询

```typescript
const recipeWithTranslation = await db
  .select({
    id: recipes.id,
    title: sql`COALESCE(${recipeTranslations.title}, ${recipes.title})`,
    description: sql`COALESCE(${recipeTranslations.description}, ${recipes.description})`,
  })
  .from(recipes)
  .leftJoin(
    recipeTranslations,
    and(
      eq(recipeTranslations.recipeId, recipes.id),
      eq(recipeTranslations.locale, 'zh-CN')
    )
  );
```

---

**文档版本**: 1.0  
**Commit**: [`adb26e9`](https://github.com/leiyunkang7/recipe-app/commit/adb26e9b72f7569283201b389feabc4f85279a36)  
**最后更新**: 2026-04-05

> 此文档与代码版本关联，用于增量更新。详见 [.version.md](./.version.md)
