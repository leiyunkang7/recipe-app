# Recipe App - Supabase 设置指南

## 📋 当前状态
✅ Backend代码完成并编译通过
✅ Supabase CLI已安装 (v2.75.0)
⏳ 需要创建Supabase云项目

---

## 🚀 设置步骤（5分钟）

### Step 1: 创建Supabase项目

1. **访问Supabase**
   - 打开浏览器访问：https://supabase.com
   - 登录或注册账号

2. **创建新项目**
   - 点击 "New Project"
   - 项目名称：`recipe-db`
   - 数据库密码：**选择一个强密码并记住它**（以后需要）
   - 区域：`Southeast Asia (Singapore)`（离中国最近）
   - 等待项目创建完成（约2-3分钟）

3. **获取API凭证**
   - 项目创建后，点击左侧 **Settings** → **API**
   - 复制以下3个值：
     ```
     Project URL: https://xxxxx.supabase.co
     anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

### Step 2: 配置本地凭证

**方法1: 手动编辑**
```bash
nano ~/.openclaw/workspace/.credentials/recipe-app-supabase.txt
```
替换以下占位符：
- `SUPABASE_URL=https://YOUR-PROJECT.supabase.co`
- `SUPABASE_ANON_KEY=your-anon-key-here`
- `SUPABASE_SERVICE_KEY=your-service-role-key-here`

**方法2: 使用命令（替换为你的实际值）**
```bash
cat > ~/.openclaw/workspace/.credentials/recipe-app-supabase.txt << 'EOF'
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF
```

### Step 3: 执行数据库迁移

1. **在Supabase Dashboard中**
   - 点击左侧 **SQL Editor**
   - 点击 "New query"
   - 复制 `schema.sql` 的全部内容
   - 粘贴到编辑器
   - 点击 **Run** ▶️

2. **验证表创建**
   - 点击左侧 **Table Editor**
   - 应该看到7个表：
     ```
     ✓ recipes
     ✓ recipe_ingredients
     ✓ recipe_steps
     ✓ recipe_tags
     ✓ categories
     ✓ cuisines
     ✓ storage
     ```

### Step 4: 测试CLI

```bash
# 进入项目目录
cd ~/code/recipe-app

# 测试列出菜谱（应该看到2个示例菜谱）
recipe list

# 测试搜索
recipe search "tomato"

# 测试获取菜谱详情（复制上面的ID）
recipe get <recipe-id>
```

---

## 🔍 故障排查

### 问题1: Config file not found
**解决：** 确保 `.credentials/recipe-app-supabase.txt` 文件存在并包含正确的凭证

### 问题2: Failed to fetch recipes
**可能原因：**
- Supabase项目还在初始化（等2分钟）
- SUPABASE_URL不正确
- 数据库表未创建（检查SQL Editor执行结果）

### 问题3: Permission denied
**解决：** 确保使用了正确的key（anon用于读取，service_role用于写入）

---

## 📝 下一步

设置完成后，你可以：
1. ✅ 测试所有CLI命令
2. ✅ 添加你自己的菜谱
3. ✅ 测试搜索功能
4. ✅ 上传菜谱图片

**有问题随时告诉我！** 🐾
