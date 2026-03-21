#!/bin/bash
#============================================
# 食谱APP飞轮v2 Cron触发器
# 每5分钟自动触发（带冷却机制）
#============================================

APP_DIR="/root/code/recipe-app"
LOG_FILE="$APP_DIR/logs/recipe-flywheel-v2.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🚀 触发飞轮v2..."

# 检查是否正在运行
if pgrep -f "recipe-flywheel-v2.sh" > /dev/null; then
    log "⚠️ 飞轮已在运行，跳过"
    exit 0
fi

# 执行（2轮，带冷却）
cd "$APP_DIR"
timeout 180 bash scripts/recipe-flywheel-v2.sh once 2>&1 | tee -a "$LOG_FILE"

log "✅ 飞轮v2执行完成"
