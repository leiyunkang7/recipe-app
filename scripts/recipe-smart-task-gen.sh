#!/bin/bash
#============================================
# 食谱APP智能任务生成器
# Smart Task Generator based on Code Analysis
#============================================

set -e

APP_DIR="/root/code/recipe-app"
WEB_DIR="$APP_DIR/web"
OUTPUT_FILE="$APP_DIR/.recipe-flywheel-tasks.md"

log() { echo "[$(date '+%H:%M:%S')] $1"; }

analyze_code() {
    log "🔍 分析代码库..."
    
    local tasks=""
    
    # 1. 检查大文件 (>300行)
    log "📊 检查大文件..."
    local large_files=$(find "$WEB_DIR" -name "*.vue" -exec wc -l {} + 2>/dev/null | sort -rn | awk '$1 > 300 {print $2 " (" $1 "行)"}' | head -5)
    
    if [[ -n "$large_files" ]]; then
        tasks="$tasks
### 📦 组件拆分任务 (大文件)
"
        while IFS= read -r file; do
            tasks="$tasks
- [ ] 拆分 $(basename "$file") 组件
"
        done <<< "$large_files"
    fi
    
    # 2. 检查缺失的功能
    log "🔧 检查功能完整性..."
    
    # SEO检查
    if ! grep -q "og:description\|ogDescription" "$WEB_DIR"/*.vue 2>/dev/null; then
        tasks="$tasks
### 🔍 SEO优化
- [ ] 添加 Open Graph meta 标签
- [ ] 添加 Twitter Card meta 标签
- [ ] 生成 sitemap.xml
"
    fi
    
    # 错误处理检查
    local has_error_boundary=$(find "$WEB_DIR" -name "*Error*" -o -name "*error*" 2>/dev/null | wc -l)
    if [[ $has_error_boundary -lt 2 ]]; then
        tasks="$tasks
### 🛡️ 错误处理
- [ ] 添加全局错误边界组件
- [ ] 添加API错误处理拦截器
"
    fi
    
    # 3. 性能优化
    log "⚡ 检查性能优化点..."
    
    local has_virtual_scroll=$(grep -r "virtual\|Virtual" "$WEB_DIR" --include="*.vue" 2>/dev/null | wc -l)
    if [[ $has_virtual_scroll -eq 0 ]]; then
        tasks="$tasks
### 🚀 性能优化
- [ ] 实现虚拟滚动优化长列表
- [ ] 添加图片懒加载
- [ ] 实现骨架屏loading
"
    fi
    
    # 4. 移动端适配
    log "📱 检查移动端适配..."
    local has_mobile=$(grep -r "mobile\|touch\|responsive" "$WEB_DIR" --include="*.vue" 2>/dev/null | wc -l)
    if [[ $has_mobile -lt 5 ]]; then
        tasks="$tasks
### 📱 移动端适配
- [ ] 优化移动端触摸事件
- [ ] 添加响应式图片
- [ ] 优化移动端导航
"
    fi
    
    # 5. 用户体验
    log "✨ 检查用户体验..."
    tasks="$tasks
### ✨ 用户体验
- [ ] 添加页面过渡动画
- [ ] 添加空状态组件
- [ ] 添加加载状态指示器
"
    
    # 6. 代码质量
    log "🔨 检查代码质量..."
    local unused_imports=$(grep -r "import.*from" "$WEB_DIR" --include="*.vue" 2>/dev/null | wc -l)
    if [[ $unused_imports -gt 50 ]]; then
        tasks="$tasks
### 🔨 代码质量
- [ ] 清理未使用的import
- [ ] 添加组件文档注释
- [ ] 优化prop-types定义
"
    fi
    
    # 7. 自我循环任务
    tasks="$tasks
### 🔄 自循环任务
- [ ] 分析构建输出，优化bundle大小
- [ ] 检查npm依赖，清理未使用的包
- [ ] 扫描代码识别技术债务
- [ ] 监控系统性能指标
"
    
    echo "$tasks"
}

generate_task_pool() {
    local timestamp=$(date '+%Y-%m-%d %H:%M')
    
    cat > "$OUTPUT_FILE" << HEADER
# 食谱APP自我进化任务池

> 🤖 自动生成 $(date '+%Y-%m-%d %H:%M')
> 基于代码分析+热点追踪+质量监控

## 🔥 高优先级 (用户影响大)

$(analyze_code | grep -A 20 "### 📦")

## ⚡ 中优先级 (体验提升)

$(analyze_code | grep -A 10 "### 🔍")
$(analyze_code | grep -A 10 "### 🚀")
$(analyze_code | grep -A 10 "### ✨")

## 🛠️ 低优先级 (代码质量)

$(analyze_code | grep -A 10 "### 🔨")

## 🔄 自循环 (飞轮自动执行)

$(analyze_code | grep -A 10 "### 🔄")

---
*由 recipe-smart-task-gen.sh 自动生成*
HEADER

    log "✅ 任务池已更新: $OUTPUT_FILE"
}

# 执行
generate_task_pool
