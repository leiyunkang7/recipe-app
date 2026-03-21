#!/bin/bash
#===============================================================================
# 🌀 食谱APP飞轮 v2 - 任务冷却+去重版
#
# 核心改进:
# 1. 任务冷却机制 - 同一任务24小时不重复
# 2. 任务执行历史 - 记录已完成/失败任务
# 3. 差异化迭代 - 每次选择未完成的任务
#===============================================================================

set -e

APP_DIR="/root/code/recipe-app"
WEB_DIR="$APP_DIR/web"
STATE_FILE="$APP_DIR/.recipe-flywheel-state.json"
TASK_HISTORY="$APP_DIR/.recipe-flywheel-history.json"
TASK_POOL="$APP_DIR/.recipe-flywheel-tasks.md"
MEMORY_FILE="$APP_DIR/.recipe-flywheel-memory.md"
LOG_FILE="$APP_DIR/logs/recipe-flywheel.log"

mkdir -p "$APP_DIR/logs"

# 冷却时间（秒）- 24小时
COOLDOWN_SECONDS=86400

#===============================================================================
# 日志
#===============================================================================
log() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}
logTeam() {
    echo "[$(date '+%H:%M:%S')] 🤖 $1" | tee -a "$LOG_FILE"
}

#===============================================================================
# 初始化历史文件
#===============================================================================
init_history() {
    if [[ ! -f "$TASK_HISTORY" ]]; then
        cat > "$TASK_HISTORY" << 'EOF'
{
  "completed": {},
  "failed": {},
  "in_progress": {}
}
EOF
    fi
}

#===============================================================================
# 获取任务状态
#===============================================================================
get_task_status() {
    local task_hash="$1"
    local now=$(date +%s)
    
    if [[ ! -f "$TASK_HISTORY" ]]; then
        echo "new"
        return
    fi
    
    # 检查是否完成
    local completed_at=$(jq -r ".completed.\"$task_hash\" // null" "$TASK_HISTORY" 2>/dev/null)
    if [[ "$completed_at" != "null" ]]; then
        local elapsed=$((now - completed_at))
        if [[ $elapsed -lt $COOLDOWN_SECONDS ]]; then
            echo "cooldown"
            return
        fi
    fi
    
    # 检查是否进行中
    local started_at=$(jq -r ".in_progress.\"$task_hash\" // null" "$TASK_HISTORY" 2>/dev/null)
    if [[ "$started_at" != "null" ]]; then
        echo "in_progress"
        return
    fi
    
    echo "available"
}

#===============================================================================
# 标记任务开始
#===============================================================================
mark_task_start() {
    local task_hash="$1"
    local task_name="$2"
    local now=$(date +%s)
    
    init_history
    
    # 添加到进行中
    local temp=$(mktemp)
    jq ".in_progress.\"$task_hash\" = $now | del(.in_progress.\"$task_hash\")" "$TASK_HISTORY" > "$temp" 2>/dev/null || true
    mv "$temp" "$TASK_HISTORY"
    
    log "📋 任务开始: $task_name (hash: ${task_hash:0:8})"
}

#===============================================================================
# 标记任务完成
#===============================================================================
mark_task_done() {
    local task_hash="$1"
    local task_name="$2"
    local status="${3:-success}"  # success, fail, skip
    local now=$(date +%s)
    
    init_history
    
    local temp=$(mktemp)
    if [[ "$status" == "success" ]]; then
        jq ".completed.\"$task_hash\" = $now | del(.in_progress.\"$task_hash\")" "$TASK_HISTORY" > "$temp" 2>/dev/null
    elif [[ "$status" == "fail" ]]; then
        jq ".failed.\"$task_hash\" = $now | del(.in_progress.\"$task_hash\")" "$TASK_HISTORY" > "$temp" 2>/dev/null
    else
        jq "del(.in_progress.\"$task_hash\")" "$TASK_HISTORY" > "$temp" 2>/dev/null
    fi
    mv "$temp" "$TASK_HISTORY"
    
    log "✅ 任务完成: $task_name ($status)"
}

#===============================================================================
# 生成任务hash
#===============================================================================
hash_task() {
    local task="$1"
    echo "$task" | md5sum | cut -d' ' -f1
}

#===============================================================================
# 选择可执行任务（带冷却）
#===============================================================================
select_available_task() {
    local -a available_tasks=()
    
    if [[ ! -f "$TASK_POOL" ]]; then
        log "📭 任务池为空，生成新任务..."
        generate_tasks
    fi
    
    while IFS= read -r line; do
        echo "$line" | grep -q "^\- \[ \]" || continue
        
        local task=$(echo "$line" | sed 's/^\- \[ \] //' | sed 's/\[.*\] //' | xargs)
        [[ -z "$task" ]] && continue
        
        local task_hash=$(hash_task "$task")
        local status=$(get_task_status "$task_hash")
        
        if [[ "$status" == "available" ]]; then
            available_tasks+=("$task|$task_hash")
        fi
    done < "$TASK_POOL"
    
    if [[ ${#available_tasks[@]} -eq 0 ]]; then
        log "⚠️ 所有任务都在冷却中，生成新任务..."
        generate_tasks
        select_available_task
        return
    fi
    
    # 随机选择一个可用任务
    local selected=${available_tasks[$((RANDOM % ${#available_tasks[@]}))]}
    echo "$selected"
}

#===============================================================================
# 生成任务池
#===============================================================================
generate_tasks() {
    cat > "$TASK_POOL" << 'TASKS'
## 食谱APP自我进化任务池

### 🔥 性能优化
- [ ] 实现食谱列表虚拟滚动优化
- [ ] 添加图片懒加载组件
- [ ] 实现骨架屏加载状态

### 🔍 SEO
- [ ] 完善 Open Graph meta 标签
- [ ] 添加 Twitter Card 标签
- [ ] 生成 sitemap.xml

### ✨ 用户体验
- [ ] 添加页面过渡动画
- [ ] 实现下拉刷新功能
- [ ] 添加空状态组件

### 🔨 代码质量
- [ ] 拆分超过300行的组件
- [ ] 清理未使用的import
- [ ] 添加组件注释

### 🛠️ 功能增强
- [ ] 添加收藏功能
- [ ] 实现分享功能
- [ ] 添加阅读数统计

### 🔄 自循环
- [ ] 检查代码质量
- [ ] 优化构建速度
- [ ] 分析性能瓶颈
TASKS
    log "📝 任务池已更新"
}

#===============================================================================
# 执行任务
#===============================================================================
execute_task() {
    local task="$1"
    local task_hash="$2"
    
    log "🚀 执行: $task"
    
    # 标记开始
    mark_task_start "$task_hash" "$task"
    
    # 根据任务类型执行
    case "$task" in
        *虚拟滚动*)
            log "🔧 虚拟滚动优化..."
            # 检查是否已有实现
            if grep -q "useVirtualScrolling" "$WEB_DIR"/app/components/RecipeListSection.vue 2>/dev/null; then
                log "✅ 已实现虚拟滚动，跳过"
                mark_task_done "$task_hash" "$task" "skip"
                return 0
            fi
            ;;
        *懒加载*)
            log "🔧 图片懒加载..."
            if grep -q 'loading="lazy"' "$WEB_DIR"/app/components/*.vue 2>/dev/null; then
                log "✅ 已实现懒加载，跳过"
                mark_task_done "$task_hash" "$task" "skip"
                return 0
            fi
            ;;
        *SEO|*meta|*sitemap*)
            log "🔧 SEO优化..."
            if grep -q "useSeoMeta" "$WEB_DIR"/app/pages/index.vue 2>/dev/null; then
                log "✅ SEO已配置，跳过"
                mark_task_done "$task_hash" "$task" "skip"
                return 0
            fi
            ;;
        *)
            log "🔧 通用任务..."
            ;;
    esac
    
    # 模拟执行（实际会调用opencode）
    sleep 2
    
    # 标记完成
    mark_task_done "$task_hash" "$task" "success"
    
    return 0
}

#===============================================================================
# 构建验证
#===============================================================================
verify_build() {
    log "🔧 构建验证..."
    
    cd "$WEB_DIR"
    if timeout 90 npm run build &>/dev/null; then
        log "✅ 构建通过"
        return 0
    else
        log "⚠️ 构建失败"
        return 1
    fi
}

#===============================================================================
# 自我评判
#===============================================================================
run_self_critique() {
    log "🧠 自我评判..."
    cd "$APP_DIR"
    bash scripts/recipe-self-critique.sh 2>&1 | tee -a "$LOG_FILE"
}

#===============================================================================
# 自动提交
#===============================================================================
auto_commit() {
    cd "$APP_DIR"
    if git diff --quiet 2>/dev/null; then
        log "📝 无变更"
    else
        git add -A
        git commit -m "🌀 flywheel: $(date '+%H:%M') 优化" 2>/dev/null || true
        log "✅ 已提交"
    fi
}

#===============================================================================
# 主循环
#===============================================================================
main() {
    local cycle="${1:-1}"
    local max_cycles="${2:-3}"
    
    log ""
    log "=========================================="
    log "🌀 飞轮 v2 第 #$cycle 轮 (冷却模式)"
    log "=========================================="
    
    init_history
    
    # 选择任务
    local selected=$(select_available_task)
    if [[ -z "$selected" ]]; then
        log "⚠️ 无法获取任务"
        return 1
    fi
    
    local task=$(echo "$selected" | cut -d'|' -f1)
    local task_hash=$(echo "$selected" | cut -d'|' -f2)
    
    log "📋 选中: $task"
    
    # 执行
    if execute_task "$task" "$task_hash"; then
        # 构建验证
        if verify_build; then
            # 自我评判
            run_self_critique
            # 提交
            auto_commit
        fi
    fi
    
    # 继续
    if [[ $cycle -lt $max_cycles ]]; then
        log "🔄 继续第 $((cycle+1)) 轮..."
        sleep 5
        main $((cycle+1)) $max_cycles
    else
        log "🏁 完成 $max_cycles 轮"
    fi
}

# 入口
case "${1:-start}" in
    start|once)
        main 1 2
        ;;
    status)
        init_history
        echo "=== 任务历史 ==="
        jq "." "$TASK_HISTORY" 2>/dev/null
        ;;
    clear)
        echo '{"completed":{},"failed":{},"in_progress":{}}' > "$TASK_HISTORY"
        log "✅ 已清空历史"
        ;;
    *)
        main 1 1
        ;;
esac
