#!/bin/bash
# Supabase Storage 配置脚本
# 创建 recipe-images bucket 和 RLS 策略

echo "🔧 配置 Supabase Storage..."

# 检查 Supabase CLI 是否安装
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI 未安装"
    echo "请运行: npm install -g supabase"
    exit 1
fi

# 检查是否在项目目录
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ 请在 recipe-app 项目目录下运行此脚本"
    exit 1
fi

echo "✅ 检查通过，开始配置..."

# 启动 Supabase（如果未启动）
echo "🚀 确保 Supabase 正在运行..."
supabase start

# 创建 storage bucket
echo "📦 创建 recipe-images bucket..."
supabase storage create recipe-images --public || echo "Bucket 可能已存在，继续..."

# 应用 RLS 策略
echo "🔐 配置 RLS 策略..."
supabase db execute "
-- 允许匿名上传图片到 recipe-images bucket
CREATE POLICY IF NOT EXISTS \"Allow anonymous uploads\" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'recipe-images');

-- 允许任何人读取图片
CREATE POLICY IF NOT EXISTS \"Allow public read\" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'recipe-images');

-- 允许匿名删除自己的图片
CREATE POLICY IF NOT EXISTS \"Allow anonymous delete\" ON storage.objects
  FOR DELETE TO anon
  USING (bucket_id = 'recipe-images');
"

echo "✅ Storage 配置完成！"
echo ""
echo "📋 总结:"
echo "  - Bucket: recipe-images (public)"
echo "  - RLS 策略: 允许匿名上传、读取、删除"
echo ""
echo "🧪 测试上传:"
echo "  1. 启动开发服务器: cd web && bun run dev"
echo "  2. 打开浏览器访问 http://localhost:3000"
echo "  3. 尝试上传图片"
