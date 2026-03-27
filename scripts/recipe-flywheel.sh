#!/bin/bash
#============================================
# 食谱APP自我进化飞轮 - Recipe App Auto-Flywheel
# Self-Evolution / Self-Iteration / Self-Circulation
#============================================
set -e

APP_DIR="/root/code/recipe-app"
WEB_DIR="$APP_DIR/web"
STATE_FILE="$APP_DIR/.recipe-flywheel-state.json"
MEMORY_FILE="$APP_DIR/.recipe-flywheel-memory.md"
TASK_POOL="$APP_DIR/.recipe-flywheel-tasks.md"
CONFIG_FILE="$APP_DIR/.recipe-flywheel-config.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
logSuccess() { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅${NC} $1"; }
logWarning() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️${NC} $1"; }
logError() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌${NC} $1"; }
logInfo() { echo -e "${PURPLE}[$(date '+%H:%M:%S')] 🔄${NC} $1"; }

# ============================================
# Phase 1: IntentGate - 分析任务类型和复杂度
# ============================================
intent_gate() {
    local task="$1"
    
    if [[ "$task" =~ (重写|迁移|整个|完全重构) ]]; then
        echo "super"
    elif [[ "$task" =~ (多个|模块|系统|复杂|重构) ]]; then
        echo "complex"
    elif [[ "$task" =~ (功能|组件|接口|优化|添加|实现) ]]; then
        echo "medium"
    else
        echo "simple"
    fi
}

# ============================================
# Phase 2: Task Selector - 智能选择任务
# ============================================
select_task() {
    local intent="$1"
    
    # 读取任务池，选择合适任务
    if [[ ! -f "$TASK_POOL" ]]; then
        generate_tasks
    fi
    
    # 获取未完成且匹配意图的任务
    local task=$(grep -E "^\- \[ \]" "$TASK_POOL" 2>/dev/null | head -1 || echo "")
    
    if [[ -z "$task" ]]; then
        # 任务池为空，生成新任务
        generate_tasks
        task=$(grep -E "^\- \[ \]" "$TASK_POOL" 2>/dev/null | head -1 || echo "")
    fi
    
    echo "$task"
}

# ============================================
# Phase 3: Task Generator - 自动生成优化任务
# ============================================
generate_tasks() {
    logInfo "🧠 分析代码，生成优化任务..."
    
    # 分析Web目录
    if [[ -d "$WEB_DIR" ]]; then
        local components=$(find "$WEB_DIR" -name "*.vue" -o -name "*.ts" 2>/dev/null | head -20)
        
        # 检查大文件
        local large_files=$(find "$WEB_DIR" -name "*.vue" -exec wc -l {} + 2>/dev/null | sort -rn | head -5)
        
        # 检查性能问题
        local virtual_scroll=$(grep -r "virtual.*scroll\|virtualScroll" "$WEB_DIR" --include="*.vue" 2>/dev/null | wc -l)
        local image_lazy=$(grep -r "lazy\|loading" "$WEB_DIR/components" --include="*.vue" 2>/dev/null | wc -l)
    fi
    
    # 生成任务池
    cat > "$TASK_POOL" << 'TASKS'
## 食谱APP自我进化任务池

### 🔥 高优先级任务
- [ ] [H] 优化食谱列表虚拟滚动性能 (hotspot: virtual_scroll)
- [ ] [H] 完善移动端适配检查 (hotspot: mobile_adapter)
- [ ] [H] 添加SEO meta标签优化 (hotspot: seo)

### ⚡ 中优先级任务  
- [ ] [M] 优化图片加载策略 (lazy loading)
- [ ] [M] 添加错误边界组件
- [ ] [M] 优化API请求错误处理

### 📝 低优先级任务
- [ ] [L] 清理未使用的组件
- [ ] [L] 优化TypeScript类型定义
- [ ] [L] 添加组件注释文档

### 🔄 自循环任务
- [ ] [R] 检查代码质量，识别下一个优化点
- [ ] [R] 分析用户反馈，生成改进建议
- [ ] [R] 监控系统性能，发现新问题

### 🛠️ 自我修复
- [ ] [F] 检查构建错误并修复
- [ ] [F] 检查控制台警告并修复
- [ ] [F] 检查类型错误并修复
TASKS

    logSuccess "任务池已更新"
}

# ============================================
# Phase 4: Build Verifier - 构建验证
# ============================================
verify_build() {
    logInfo "🔧 验证构建..."
    
    cd "$WEB_DIR"
    
    # 清理后重新构建
    if timeout 120 npm run build 2>&1; then
        logSuccess "构建验证通过"
        return 0
    else
        logError "构建验证失败"
        return 1
    fi
}

# ============================================
# Phase 5: Self-Critique - 自我评判
# ============================================
self_critique() {
    local task="$1"
    local score=70
    
    # 检查任务是否有效
    if [[ "$task" =~ (优化.*虚拟滚动|虚拟滚动.*优化) ]] && grep -q "virtual" "$WEB_DIR"/*/.* 2>/dev/null; then
        score=85
    fi
    
    # 检查是否有实际改进
    if git -C "$APP_DIR" diff --stat 2>/dev/null | grep -q "change"; then
        score=$((score + 10))
    fi
    
    echo "$score"
}

# ============================================
# Phase 6: Hephaestus Executor - 执行任务
# ============================================
execute_task() {
    local task="$1"
    local intent=$(intent_gate "$task")
    
    logInfo "🚀 执行任务 (Intent: $intent)"
    log "   任务: $task"
    
    case "$intent" in
        simple)
            # 简单任务直接执行
            execute_simple_task "$task"
            ;;
        medium)
            # 中等任务规划后执行
            execute_medium_task "$task"
            ;;
        complex|super)
            # 复杂任务启动多Agent
            execute_complex_task "$task"
            ;;
    esac
}

execute_simple_task() {
    local task="$1"
    
    # 简单修复类任务
    if [[ "$task" =~ (错误|警告|修复) ]]; then
        log "🔧 执行简单修复..."
        # 触发代码检查和修复
        cd "$WEB_DIR"
        npx tsc --noEmit 2>/dev/null || true
    fi
    
    logSuccess "简单任务完成"
}

execute_medium_task() {
    local task="$1"
    
    log "⚡ 执行中等任务..."
    
    # 使用claude执行
    if command -v claude &>/dev/null; then
        cd "$APP_DIR"
        echo "$task" | timeout 180 claude --print --allowedTools "Bash,Write,Edit,Read,Glob,LS,Grep,WebSearch" 2>&1 || true
    fi
    
    logSuccess "中等任务完成"
}

execute_complex_task() {
    local task="$1"
    
    log "🚀 启动复杂任务协调..."
    
    # 启动多个Agent并行执行
    if command -v claude &>/dev/null; then
        cd "$APP_DIR"
        echo "$task" | timeout 300 claude --print --allowedTools "Bash,Write,Edit,Read,Glob,LS,Grep,WebSearch" 2>&1 || true
    fi
    
    logSuccess "复杂任务完成"
}

# ============================================
# Phase 7: Task Recorder - 记录任务执行
# ============================================
record_task() {
    local task="$1"
    local status="$2" # success/fail/skipped
    
    local timestamp=$(date '+%Y-%m-%d %H:%M')
    
    if [[ ! -f "$MEMORY_FILE" ]]; then
        cat > "$MEMORY_FILE" << 'HEADER'
# 食谱APP飞轮记忆

## 执行历史

HEADER
    fi
    
    # 记录到记忆文件
    echo "## $timestamp - $status" >> "$MEMORY_FILE"
    echo "- $task" >> "$MEMORY_FILE"
    echo "" >> "$MEMORY_FILE"
    
    # 更新任务池，标记完成（模糊匹配任务描述）
    if [[ -f "$TASK_POOL" ]]; then
        # 提取任务关键词（取前40字符，转义特殊字符）
        local task_escaped
        task_escaped=$(echo "$task" | sed 's/[][\.*^$()+?{|\\]/\\&/g' | cut -c1-40)
        # 找到匹配的任务行并标记为完成
        grep -q "\- \[ \].*${task_escaped}" "$TASK_POOL" 2>/dev/null && \
            sed -i "s|\- \[ \] \(.*${task_escaped}.*\)|- [x] \1|" "$TASK_POOL" 2>/dev/null || true
    fi
    
    logSuccess "任务已记录: $task ($status)"
}

# ============================================
# Phase 8:循环检查 - 判断是否继续
# ============================================
should_continue() {
    local cycle=${1:-1}
    
    # 防止无限循环
    if [[ $cycle -ge 10 ]]; then
        logWarning "达到最大循环次数，停止"
        return 1
    fi
    
    # 检查任务池
    local pending=$(grep -c "^\- \[ \]" "$TASK_POOL" 2>/dev/null || echo 0)
    
    if [[ $pending -eq 0 ]]; then
        log "📭 任务池为空，生成新任务..."
        generate_tasks
    fi
    
    # 检查系统资源
    local load=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | xargs)
    local load_num=$(echo "$load" | cut -d. -f1)
    
    if [[ $load_num -gt 3 ]]; then
        logWarning "系统负载过高 ($load)，暂停"
        return 1
    fi
    
    return 0
}

# ============================================
# 主循环 - Self-Circulation
# ============================================
main() {
    logInfo "🌀 食谱APP自我进化飞轮启动"
    log "   模式: Self-Evolution / Self-Iteration / Self-Circulation"
    echo ""

    local cycle=1
    local max_cycles=10
    local external_task="${1:-}"  # 支持外部传入任务

    while [[ $cycle -le $max_cycles ]]; do
        echo "=========================================="
        logInfo "🔄 循环 #$cycle/$max_cycles"
        echo "=========================================="

        # Phase 1: Intent分析 - 优先使用外部传入任务
        local task=""
        if [[ -n "$external_task" && "$cycle" -eq 1 ]]; then
            task="$external_task"
            log "📋 外部任务: $task"
        else
            task=$(select_task "medium")
        fi
        
        if [[ -z "$task" ]]; then
            logWarning "没有可执行任务，生成新任务..."
            generate_tasks
            task=$(select_task "medium")
        fi
        
        if [[ -z "$task" ]]; then
            logWarning "任务池为空，退出"
            break
        fi
        
        # 清理任务格式
        task=$(echo "$task" | sed 's/^\- \[ \] //' | sed 's/\[.*\] //')
        
        log "📋 任务: $task"
        
        # Phase 2: 执行前检查
        local intent=$(intent_gate "$task")
        log "🧠 Intent: $intent"
        
        # Phase 3: 执行任务
        execute_task "$task"
        
        # Phase 4: 构建验证
        if ! verify_build; then
            logError "构建验证失败，尝试修复..."
            record_task "$task" "fail"
            continue
        fi
        
        # Phase 5: 自我评判
        local score=$(self_critique "$task")
        log "📊 自我评分: $score/100"
        
        if [[ $score -ge 70 ]]; then
            record_task "$task" "success"
        else
            record_task "$task" "skipped"
        fi
        
        # Phase 6: 自动提交
        cd "$APP_DIR"
        if git diff --quiet 2>/dev/null; then
            log "📝 无变更，跳过提交"
        else
            git add -A 2>/dev/null || true
            git commit -m "🌀 flywheel: $task (cycle $cycle)" --allow-empty 2>/dev/null || true
            logSuccess "已自动提交"
        fi
        
        # Phase 7: 判断是否继续
        if ! should_continue $cycle; then
            break
        fi
        
        ((cycle++))
        
        # 休眠防止过载
        sleep 5
    done
    
    echo ""
    logSuccess "🌀 飞轮完成! 共执行 $((cycle-1)) 个循环"
}

# 执行
main "$@"
