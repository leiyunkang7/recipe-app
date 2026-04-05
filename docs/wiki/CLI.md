# CLI 使用指南

> Recipe App 命令行工具完整使用手册

---

## 1. 概述

Recipe CLI 是一个功能完整的命令行工具，提供食谱的增删改查、搜索、批量操作等功能。

### 1.1 安装

```bash
# 克隆项目
git clone https://github.com/your-repo/recipe-app.git
cd recipe-app

# 安装依赖
bun install

# 构建项目
bun run build

# 运行 CLI
bun run cli
```

### 1.2 配置

创建配置文件 `.credentials/recipe-app-db.txt`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app
UPLOAD_DIR=./uploads
```

或设置环境变量：

```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app
```

---

## 2. 基础命令

### 2.1 查看帮助

```bash
recipe --help
recipe -h
```

输出：
```
Usage: recipe [options] [command]

Recipe Management CLI

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  add             Add a new recipe
  list            List all recipes
  get <id>        Get a recipe by ID
  update <id>     Update a recipe
  delete <id>     Delete a recipe
  search <query>  Search recipes
  import <file>   Import recipes from JSON
  export          Export recipes to JSON
  image           Image operations
  help [command]  display help for command
```

---

## 3. CRUD 操作

### 3.1 创建食谱 (add)

交互式创建新食谱。

```bash
recipe add
```

**交互流程**:

```
? Enter recipe title: 番茄炒蛋
? Enter description: 经典家常菜
? Select category: dinner
? Select cuisine: chinese
? Enter servings: 2
? Enter prep time (minutes): 10
? Enter cook time (minutes): 15
? Select difficulty: easy

? Add ingredient? Yes
? Ingredient name: 番茄
? Amount: 2
? Unit: 个

? Add another ingredient? Yes
? Ingredient name: 鸡蛋
? Amount: 3
? Unit: 个

? Add another ingredient? No

? Add step? Yes
? Step 1 instruction: 番茄切块，鸡蛋打散
? Duration (minutes, optional): 5

? Add another step? Yes
? Step 2 instruction: 热锅下油，炒鸡蛋
? Duration (minutes, optional): 3

? Add another step? No

? Add tags? (comma separated): 家常,快手
? Image URL (optional): 
? Source (optional): 家传菜谱

✅ Recipe created successfully!
ID: 550e8400-e29b-41d4-a716-446655440000
```

---

### 3.2 列出食谱 (list)

列出所有食谱，支持筛选。

```bash
# 列出所有食谱
recipe list

# 按分类筛选
recipe list --category dinner

# 按难度筛选
recipe list --difficulty easy

# 按菜系筛选
recipe list --cuisine chinese

# 组合筛选
recipe list --category dinner --difficulty easy

# 指定页码和数量
recipe list --page 2 --limit 10
```

**选项**:

| 选项 | 简写 | 描述 |
|------|------|------|
| --category | -c | 按分类筛选 |
| --cuisine | -C | 按菜系筛选 |
| --difficulty | -d | 按难度筛选 |
| --page | -p | 页码 (默认 1) |
| --limit | -l | 每页数量 (默认 20) |

**输出示例**:

```
┌──────────────────────────────────────────────────────────────┐
│ Recipe List (Page 1 of 5, Total: 100)                        │
├──────────────────────────────────────────────────────────────┤
│ #   Title            Category   Difficulty   Time           │
├──────────────────────────────────────────────────────────────┤
│ 1   番茄炒蛋         dinner     easy         25min          │
│ 2   鱼香肉丝         dinner     medium       35min          │
│ 3   宫保鸡丁         dinner     medium       30min          │
│ ...                                                          │
└──────────────────────────────────────────────────────────────┘
```

---

### 3.3 查看详情 (get)

查看单个食谱的完整信息。

```bash
recipe get <recipe-id>
```

**示例**:

```bash
recipe get 550e8400-e29b-41d4-a716-446655440000
```

**输出**:

```
┌─────────────────────────────────────────────────────────────┐
│ 番茄炒蛋                                                     │
├─────────────────────────────────────────────────────────────┤
│ ID: 550e8400-e29b-41d4-a716-446655440000                    │
│ Category: dinner | Cuisine: chinese | Difficulty: easy      │
│ Servings: 2 | Prep: 10min | Cook: 15min | Total: 25min     │
├─────────────────────────────────────────────────────────────┤
│ Description:                                                │
│ 经典家常菜，简单易做                                         │
├─────────────────────────────────────────────────────────────┤
│ Ingredients:                                                │
│   • 番茄 × 2 个                                             │
│   • 鸡蛋 × 3 个                                             │
│   • 盐 × 适量                                               │
├─────────────────────────────────────────────────────────────┤
│ Steps:                                                      │
│   1. 番茄切块，鸡蛋打散 (5min)                               │
│   2. 热锅下油，炒鸡蛋 (3min)                                 │
│   3. 加入番茄，翻炒 (5min)                                   │
│   4. 调味出锅 (2min)                                         │
├─────────────────────────────────────────────────────────────┤
│ Tags: 家常, 快手, 素食                                       │
│ Nutrition: 200 kcal | 12g protein | 15g carbs | 10g fat    │
│ Source: 家传菜谱                                             │
│ Created: 2026-01-01 10:00:00                                │
│ Updated: 2026-01-02 15:30:00                                │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.4 更新食谱 (update)

交互式更新现有食谱。

```bash
recipe update <recipe-id>
```

**示例**:

```bash
recipe update 550e8400-e29b-41d4-a716-446655440000
```

**交互流程**:

```
Current title: 番茄炒蛋
? Enter new title (press Enter to keep current): 番茄炒蛋（升级版）

Current servings: 2
? Enter new servings (press Enter to keep current): 4

? Update ingredients? Yes
? Keep existing ingredients? No

? Add ingredient? Yes
...
```

---

### 3.5 删除食谱 (delete)

删除指定食谱。

```bash
recipe delete <recipe-id>
```

**示例**:

```bash
recipe delete 550e8400-e29b-41d4-a716-446655440000
```

**确认提示**:

```
? Are you sure you want to delete "番茄炒蛋"? Yes
✅ Recipe deleted successfully!
```

---

## 4. 搜索功能

### 4.1 搜索食谱 (search)

全文搜索食谱和食材。

```bash
recipe search <query>
```

**示例**:

```bash
# 搜索包含"番茄"的食谱
recipe search 番茄

# 搜索包含"鸡肉"的食材
recipe search 鸡肉

# 搜索英文
recipe search chicken
```

**输出**:

```
┌─────────────────────────────────────────────────────────────┐
│ Search Results for "番茄" (5 found)                         │
├─────────────────────────────────────────────────────────────┤
│ #   Type      Title              Relevance                  │
├─────────────────────────────────────────────────────────────┤
│ 1   recipe    番茄炒蛋           0.95                       │
│ 2   recipe    番茄牛腩           0.89                       │
│ 3   recipe    番茄意面           0.85                       │
│ 4   ingredient 番茄              -                          │
│ 5   ingredient 小番茄            -                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 批量操作

### 5.1 导入食谱 (import)

从 JSON 文件批量导入食谱。

```bash
recipe import <file.json>
```

**JSON 格式**:

```json
[
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
      { "name": "番茄", "amount": 2, "unit": "个" },
      { "name": "鸡蛋", "amount": 3, "unit": "个" }
    ],
    "steps": [
      { "stepNumber": 1, "instruction": "番茄切块，鸡蛋打散" },
      { "stepNumber": 2, "instruction": "热锅下油，炒鸡蛋" }
    ],
    "tags": ["家常", "快手"]
  }
]
```

**输出**:

```
Importing recipes from recipes.json...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%

✅ Import completed!
   Total: 10
   Succeeded: 9
   Failed: 1

Errors:
  - Recipe 5 "测试食谱": Invalid difficulty value
```

---

### 5.2 导出食谱 (export)

导出所有食谱到 JSON 文件。

```bash
# 导出到默认文件
recipe export

# 指定输出文件
recipe export --output my-recipes.json
```

**选项**:

| 选项 | 简写 | 描述 |
|------|------|------|
| --output | -o | 输出文件路径 |

**输出**:

```
Exporting recipes...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%

✅ Exported 100 recipes to recipes.json
```

---

### 5.3 批量删除 (delete-many)

批量删除匹配的食谱。

```bash
recipe delete-many <pattern>
```

**示例**:

```bash
# 删除标题包含"测试"的食谱
recipe delete-many 测试

# 删除特定分类的食谱
recipe delete-many --category test
```

**确认提示**:

```
Found 5 recipes matching "测试":
  1. 测试食谱1
  2. 测试食谱2
  3. 测试食谱3
  4. 测试食谱4
  5. 测试食谱5

? Delete all 5 recipes? Yes
✅ Deleted 5 recipes successfully!
```

---

## 6. 图片操作

### 6.1 上传图片 (image upload)

上传图片并获取 URL。

```bash
recipe image upload <file>
```

**选项**:

| 选项 | 描述 |
|------|------|
| --width | 目标宽度 |
| --height | 目标高度 |
| --quality | 图片质量 (1-100) |

**示例**:

```bash
# 基本上传
recipe image upload photo.jpg

# 调整尺寸
recipe image upload photo.jpg --width 800 --height 600

# 指定质量
recipe image upload photo.jpg --quality 90
```

**输出**:

```
Uploading photo.jpg...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%

✅ Image uploaded successfully!
   URL: https://storage.example.com/images/abc123.jpg
   Dimensions: 800x600
   Size: 150KB
```

---

## 7. 高级用法

### 7.1 管道操作

CLI 支持管道操作，方便脚本化。

```bash
# 导出并导入到另一个数据库
recipe export | recipe import

# 搜索并删除
recipe search "测试" --ids-only | xargs -I {} recipe delete {}
```

### 7.2 JSON 输出

使用 `--json` 标志输出 JSON 格式。

```bash
recipe list --json
recipe get <id> --json
recipe search "番茄" --json
```

### 7.3 静默模式

使用 `--quiet` 或 `-q` 减少输出。

```bash
recipe delete <id> --quiet
```

---

## 8. 错误处理

### 8.1 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| Config file not found | 配置文件不存在 | 创建 `.credentials/recipe-app-db.txt` |
| Database connection failed | 数据库连接失败 | 检查 DATABASE_URL |
| Recipe not found | 食谱不存在 | 检查 ID 是否正确 |
| Validation error | 数据验证失败 | 检查输入格式 |

### 8.2 调试模式

使用 `--debug` 标志查看详细日志。

```bash
recipe list --debug
```

---

## 9. 配置参考

### 9.1 环境变量

| 变量 | 描述 | 默认值 |
|------|------|--------|
| DATABASE_URL | 数据库连接字符串 | - |
| UPLOAD_DIR | 上传目录 | ./uploads |
| DEBUG | 调试模式 | false |

### 9.2 配置文件

位置: `.credentials/recipe-app-db.txt`

```
DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app
UPLOAD_DIR=./uploads
```

---

## 10. 快捷命令

在 `~/.bashrc` 或 `~/.zshrc` 中添加别名：

```bash
alias r='recipe'
alias radd='recipe add'
alias rlist='recipe list'
alias rsearch='recipe search'
alias rexport='recipe export'
```

---

**文档版本**: 1.0  
**Commit**: [`adb26e9`](https://github.com/leiyunkang7/recipe-app/commit/adb26e9b72f7569283201b389feabc4f85279a36)  
**最后更新**: 2026-04-05

> 此文档与代码版本关联，用于增量更新。详见 [.version.md](./.version.md)
