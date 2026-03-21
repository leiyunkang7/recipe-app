#!/bin/bash
#============================================
# 食谱APP Agent Team Cron触发器
# 每5分钟自动触发真正的并行Agent Team执行
#============================================

APP_DIR="/root/code/recipe-app"
LOG_FILE="$APP_DIR/logs/recipe-agent-team-cron.log"
STATE_FILE="$APP_DIR/.recipe-agent-team-state.json"

mkdir -p "$APP_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🚀 触发食谱APP Agent Team..."

# 检查是否有正在运行的Agent Team
if pgrep -f "recipe-agent-team.sh" > /dev/null; then
    log "⚠️ Agent Team已在运行，跳过"
    exit 0
fi

# 记录开始时间
START_TIME=$(date +%s)

# 执行Agent Team（1轮，使用并行）
cd "$APP_DIR"
timeout 600 bash scripts/recipe-agent-team.sh once 2>&1 | tee -a "$LOG_FILE"

# 计算耗时
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

# 更新状态
if [[ -f "$STATE_FILE" ]]; then
    jq ".last_run = \"$(date -Iseconds)\" | .last_elapsed_seconds = $ELAPSED" "$STATE_FILE" > "${STATE_FILE}.tmp" 2>/dev/null
    mv "${STATE_FILE}.tmp" "$STATE_FILE" 2>/dev/null || true
fi

log "✅ Agent Team执行完成 (耗时: ${ELAPSED}秒)"
