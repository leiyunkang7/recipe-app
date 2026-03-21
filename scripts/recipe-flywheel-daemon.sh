#!/bin/bash
#============================================
# 食谱APP飞轮守护进程
# Recipe App Flywheel Daemon
# 7x24 持续自我进化
#============================================

set -e

APP_DIR="/root/code/recipe-app"
PID_FILE="$APP_DIR/.recipe-flywheel.pid"
LOG_FILE="$APP_DIR/logs/recipe-flywheel-daemon.log"
STATE_FILE="$APP_DIR/.recipe-flywheel-state.json"

mkdir -p "$APP_DIR/logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查是否已在运行
is_running() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
    fi
    return 1
}

start_daemon() {
    if is_running; then
        log "⚠️ 飞轮守护进程已在运行 (PID: $(cat $PID_FILE))"
        return 1
    fi
    
    log "🚀 启动食谱APP飞轮守护进程..."
    
    # 后台运行
    nohup bash "$0" run >> "$LOG_FILE" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_FILE"
    
    log "✅ 守护进程已启动 (PID: $pid)"
}

stop_daemon() {
    if ! is_running; then
        log "⚠️ 守护进程未运行"
        return 1
    fi
    
    local pid=$(cat "$PID_FILE")
    log "🛑 停止守护进程 (PID: $pid)..."
    
    kill "$pid" 2>/dev/null || true
    rm -f "$PID_FILE"
    
    log "✅ 守护进程已停止"
}

# 主运行循环
run_loop() {
    log "🔄 进入主循环..."
    
    while true; do
        # 检查是否应该执行
        local hour=$(date +%H)
        
        # 工作时间每小时执行一次 (8:00 - 22:00)
        if [[ $hour -ge 8 ]] && [[ $hour -le 22 ]]; then
            log "⏰ 工作时间，执行飞轮..."
            
            # 生成智能任务
            bash "$APP_DIR/scripts/recipe-smart-task-gen.sh" 2>/dev/null
            
            # 执行飞轮 (限制循环次数)
            bash "$APP_DIR/scripts/recipe-flywheel.sh" --once 2>&1 | tee -a "$LOG_FILE"
            
            # 自我评判
            bash "$APP_DIR/scripts/recipe-self-critique.sh" 2>&1 | tee -a "$LOG_FILE"
        else
            log "🌙 非工作时间，进入休眠..."
        fi
        
        # 休眠 1小时
        sleep 3600
    done
}

# 主入口
case "${1:-start}" in
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    restart)
        stop_daemon
        sleep 2
        start_daemon
        ;;
    run)
        run_loop
        ;;
    status)
        if is_running; then
            log "✅ 飞轮守护进程运行中 (PID: $(cat $PID_FILE))"
        else
            log "⚠️ 飞轮守护进程未运行"
        fi
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
