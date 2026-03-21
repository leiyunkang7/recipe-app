#!/bin/bash
#============================================
# 食谱APP飞轮Cron触发器
# 每小时自动触发一次自我进化检查
#============================================

APP_DIR="/root/code/recipe-app"
LOG_FILE="$APP_DIR/logs/recipe-flywheel.log"
STATE_FILE="$APP_DIR/.recipe-flywheel-state.json"

# 确保日志目录存在
mkdir -p "$APP_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "🚀 触发食谱APP飞轮检查..."

# 检查是否有正在运行的飞轮
if pgrep -f "recipe-flywheel.sh" > /dev/null; then
    log "⚠️ 飞轮已在运行，跳过"
    exit 0
fi

# 检查时间（只在工作时间执行，每小时一次）
hour=$(date +%H)
if [[ $hour -lt 8 ]] || [[ $hour -gt 22 ]]; then
    log "🌙 非工作时间，跳过"
    exit 0
fi

# 执行飞轮（最多3个循环）
cd "$APP_DIR"
timeout 600 bash scripts/recipe-flywheel.sh --once 2>&1 | tee -a "$LOG_FILE"

# 更新状态
if [[ -f "$STATE_FILE" ]]; then
    # 更新最后运行时间
    jq ".last_cron_run = \"$(date -Iseconds)\"" "$STATE_FILE" > "${STATE_FILE}.tmp" 2>/dev/null
    mv "${STATE_FILE}.tmp" "$STATE_FILE" 2>/dev/null || true
fi

log "✅ 飞轮执行完成"
