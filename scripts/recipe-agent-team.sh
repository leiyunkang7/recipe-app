#!/bin/bash
#===============================================================================
# 🌀 食谱APP Agent Team - 真正的并行自进化系统
#
# 架构: Sisyphus 协调者 + 4个专业执行者并行工作
# 模式: 7×24 全天候 + 5分钟间隔
#===============================================================================

set -e

APP_DIR="/root/code/recipe-app"
WEB_DIR="$APP_DIR/web/app"
LOG_FILE="$APP_DIR/logs/recipe-agent-team.log"
STATE_FILE="$APP_DIR/.recipe-agent-team-state.json"
TASK_POOL="$APP_DIR/.recipe-flywheel-tasks.md"

mkdir -p "$APP_DIR/logs"

#===============================================================================
# 日志函数
#===============================================================================
log() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}
logTeam() {
    echo "[$(date '+%H:%M:%S')] 🤖 $1" | tee -a "$LOG_FILE"
}

#===============================================================================
# Phase 1: IntentGate - 分析任务类型和复杂度
#===============================================================================
intent_gate() {
    local task="$1"
    
    if [[ "$task" =~ (重写|迁移|整个|完全重构|系统) ]]; then
        echo "super"
    elif [[ "$task" =~ (多个|模块|复杂|重构|拆分校) ]]; then
        echo "complex"
    elif [[ "$task" =~ (功能|组件|接口|优化|添加|实现|虚拟滚动|懒加载|SEO) ]]; then
        echo "medium"
    else
        echo "simple"
    fi
}

#===============================================================================
# Phase 2: Task Selector - 智能选择多个并行任务
#===============================================================================
select_parallel_tasks() {
    local max_tasks="${1:-4}"
    local intent="$2"
    
    # 从任务池选择适合并行的任务
    local tasks=()
    
    if [[ -f "$TASK_POOL" ]]; then
        while IFS= read -r line; do
            echo "$line" | grep -q "^\- \[ \]" || continue
            
            local task_content=$(echo "$line" | sed 's/^\- \[ \] //' | sed 's/\[.*\] //' | xargs)
            local task_intent=$(intent_gate "$task_content")
            
            # 匹配意图或选择任意合适任务
            if [[ -z "$intent" ]] || [[ "$task_intent" == "$intent" ]] || [[ "$task_intent" == "medium" ]]; then
                tasks+=("$task_content")
                [[ ${#tasks[@]} -ge $max_tasks ]] && break
            fi
        done < "$TASK_POOL"
    fi
    
    # 如果任务池为空，生成默认任务
    if [[ ${#tasks[@]} -eq 0 ]]; then
        tasks=(
            "优化食谱列表虚拟滚动性能"
            "添加图片懒加载组件"
            "完善移动端适配"
            "添加ESLint规则"
        )
    fi
    
    printf '%s\n' "${tasks[@]}"
}

#===============================================================================
# Phase 3: Agent Router - 智能分配Agent
#===============================================================================
router_agent() {
    local task="$1"
    
    case "$task" in
        *调研*|*研究*|*搜索*|*分析*)
            echo "Explore"
            ;;
        *优化*|*修复*|*重构*|*代码*|*组件*)
            echo "Hephaestus"
            ;;
        *设计*|*规划*|*架构*|*方案*)
            echo "Prometheus"
            ;;
        *)
            echo "Hephaestus"
            ;;
    esac
}

#===============================================================================
# Phase 4: Parallel Executor - 并行执行多个任务
#===============================================================================
execute_task_parallel() {
    local task="$1"
    local agent="$2"
    local label="$3"
    
    logTeam "📋 [$agent] 执行: $task"
    
    case "$agent" in
        Explore)
            sessions_spawn \
                --task "调研: $task | 工作目录: $APP_DIR | 输出: 发现和改进建议" \
                --label "recipe-$label" \
                --runtime "subagent" \
                --mode "run" \
                --runTimeoutSeconds 180 \
                2>/dev/null || true
            ;;
        Hephaestus)
            sessions_spawn \
                --task "执行代码任务: $task
工作目录: $APP_DIR
Web目录: $WEB_DIR
要求:
1. 使用 opencode 或直接编辑代码
2. 完成后验证构建: cd $WEB_DIR && npm run build
3. 确保代码质量
4. 如果需要，安装依赖: cd $WEB_DIR && bun install" \
                --label "recipe-$label" \
                --runtime "subagent" \
                --mode "run" \
                --runTimeoutSeconds 180 \
                2>/dev/null || true
            ;;
        Prometheus)
            sessions_spawn \
                --task "规划设计任务: $task | 工作目录: $APP_DIR | 输出: 设计方案和实现计划" \
                --label "recipe-$label" \
                --runtime "subagent" \
                --mode "run" \
                --runTimeoutSeconds 180 \
                2>/dev/null || true
            ;;
        *)
            sessions_spawn \
                --task "任务: $task | 工作目录: $APP_DIR" \
                --label "recipe-$label" \
                --runtime "subagent" \
                --mode "run" \
                --runTimeoutSeconds 180 \
                2>/dev/null || true
            ;;
    esac
    
    logTeam "✅ [$agent] 已分配任务: $task"
}

#===============================================================================
# Phase 5: Self-Critique - 自我评判
#===============================================================================
run_self_critique() {
    logTeam "🧠 执行自我评判..."
    bash "$APP_DIR/scripts/recipe-self-critique.sh" 2>&1 | tee -a "$LOG_FILE"
}

#===============================================================================
# Phase 6: Commit - 自动提交
#===============================================================================
auto_commit() {
    cd "$APP_DIR"
    if git diff --quiet 2>/dev/null; then
        log "📝 无变更，跳过提交"
    else
        git add -A
        git commit -m "🤖 agent-team: $(date '+%H:%M') 自动优化" 2>/dev/null || true
        log "✅ 已自动提交"
    fi
}

#===============================================================================
# 主协调流程
#===============================================================================
main() {
    local cycle="${1:-1}"
    local max_cycles=3
    
    log ""
    logTeam "=========================================="
    logTeam "🌀 食谱APP Agent Team 开始第 #$cycle 轮"
    logTeam "=========================================="
    
    # Phase 1: 选择并行任务
    logTeam "📊 Phase 1: 选择并行任务..."
    local -a tasks=()
    while IFS= read -r task; do
        tasks+=("$task")
    done < <(select_parallel_tasks 4)
    
    logTeam "📋 选中 ${#tasks[@]} 个任务:"
    for i in "${!tasks[@]}"; do
        logTeam "   [$i] ${tasks[$i]}"
    done
    
    # Phase 2: 并行启动所有Agent
    logTeam "📊 Phase 2: 并行启动 ${#tasks[@]} 个Agent..."
    
    local pids=()
    for i in "${!tasks[@]}"; do
        local task="${tasks[$i]}"
        local agent=$(router_agent "$task")
        local label="team-$cycle-$i"
        
        # 并行执行（后台运行）
        execute_task_parallel "$task" "$agent" "$label" &
        pids+=($!)
    done
    
    logTeam "✅ 已启动 ${#pids[@]} 个并行Agent"
    
    # Phase 3: 等待所有Agent完成
    logTeam "⏳ 等待Agent完成..."
    for pid in "${pids[@]}"; do
        wait $pid 2>/dev/null || true
    done
    
    logTeam "✅ 所有Agent已完成"
    
    # Phase 4: 自我评判
    logTeam "📊 Phase 3: 自我评判..."
    run_self_critique
    
    # Phase 5: 自动提交
    logTeam "📊 Phase 4: 自动提交..."
    auto_commit
    
    # Phase 6: 判断是否继续
    if [[ $cycle -lt $max_cycles ]]; then
        logTeam "🔄 继续下一轮..."
        sleep 10
        main $((cycle + 1))
    else
        logTeam "🏁 完成 $max_cycles 轮Agent Team执行"
    fi
}

#===============================================================================
# 入口
#===============================================================================
case "${1:-start}" in
    start)
        main 1
        ;;
    once)
        main 1
        ;;
    daemon)
        while true; do
            main 1
            logTeam "😴 休眠5分钟后继续..."
            sleep 300
        done
        ;;
    status)
        if [[ -f "$STATE_FILE" ]]; then
            cat "$STATE_FILE"
        else
            echo "状态文件不存在"
        fi
        ;;
    *)
        echo "用法: $0 {start|once|daemon|status}"
        exit 1
        ;;
esac
