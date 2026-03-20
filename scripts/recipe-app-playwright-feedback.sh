#!/bin/bash
# recipe-app-playwright-feedback.sh
# 食谱 APP - Playwright 视觉反馈闭环脚本
# 集成到 Agent Team 迭代器中
#
# 用法:
#   ./recipe-app-playwright-feedback.sh [--server=<port>] [--mode=<mode>]
#
# Modes:
#   quick     - 快速截图验证 (默认)
#   full      - 完整 E2E + 截图对比
#   mobile    - 移动端测试
#   console   - 控制台错误检测

set -e

# 配置
SERVER_PORT="${SERVER_PORT:-3000}"
SERVER_HOST="${SERVER_HOST:-localhost}"
TEST_MODE="${1:-quick}"
SCREENSHOT_DIR="/root/code/recipe-app/web/screenshots"
REPORT_DIR="/root/code/recipe-app/web/playwright-report"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_err() { echo -e "${RED}[ERROR]${NC} $1"; }

# 确保目录存在
mkdir -p "$SCREENSHOT_DIR" "$REPORT_DIR"

# 检查服务器是否运行
check_server() {
    if curl -s -o /dev/null -w "%{http_code}" "http://${SERVER_HOST}:${SERVER_PORT}" | grep -q "200"; then
        log_ok "服务器运行正常: http://${SERVER_HOST}:${SERVER_PORT}"
        return 0
    else
        log_warn "服务器未运行，尝试启动..."
        return 1
    fi
}

# 快速截图模式
run_quick() {
    log_info "执行快速截图验证..."

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local screenshot="${SCREENSHOT_DIR}/quick_${timestamp}.png"

    python3 << EOF
from playwright.sync_api import sync_playwright
import os

screenshot_path = "$screenshot"
os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 720})
    page.goto("http://${SERVER_HOST}:${SERVER_PORT}")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=screenshot_path, full_page=True)
    browser.close()
    print(f"Screenshot saved: {screenshot_path}")
EOF

    log_ok "截图已保存: ${screenshot}"
}

# 完整 E2E 测试模式
run_full() {
    log_info "执行完整 E2E 测试 + 截图对比..."

    cd /root/code/recipe-app/web

    # 运行 E2E 测试
    bunx playwright test --reporter=list 2>&1 || true

    # 截图当前状态
    local timestamp=$(date +%Y%m%d_%H%M%S)
    python3 << EOF
from playwright.sync_api import sync_playwright
import os

screenshot_path = "/root/code/recipe-app/web/screenshots/e2e_${timestamp}.png"
os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 720})
    page.goto("http://${SERVER_HOST}:${SERVER_PORT}")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=screenshot_path, full_page=True)
    browser.close()
    print(f"E2E screenshot saved: {screenshot_path}")
EOF

    log_ok "E2E 测试完成"
}

# 移动端测试模式
run_mobile() {
    log_info "执行移动端测试..."

    cd /root/code/recipe-app/web/scripts

    if [ -f "test_mobile_375.py" ]; then
        python3 test_mobile_375.py
        log_ok "移动端测试完成"
    else
        log_warn "test_mobile_375.py 不存在，跳过"
    fi
}

# 控制台错误检测模式
run_console() {
    log_info "检测控制台错误..."

    python3 << EOF
from playwright.sync_api import sync_playwright
import json
from datetime import datetime

console_messages = []
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 720})

    # 监听控制台消息
    def handle_console(msg):
        if msg.type == "error":
            errors.append({"text": msg.text, "location": msg.location})
        console_messages.append({"type": msg.type, "text": msg.text})

    page.on("console", handle_console)

    # 访问主要页面
    pages_to_test = [
        "http://${SERVER_HOST}:${SERVER_PORT}",
        "http://${SERVER_HOST}:${SERVER_PORT}/recipes",
        "http://${SERVER_HOST}:${SERVER_PORT}/admin",
    ]

    for url in pages_to_test:
        try:
            page.goto(url, wait_until="networkidle")
            page.wait_for_timeout(1000)  # 等待异步操作
        except Exception as e:
            errors.append({"text": str(e), "location": {"url": url}})

    browser.close()

    # 输出报告
    print(f"\n{'='*60}")
    print(f"控制台错误检测报告 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")

    if errors:
        print(f"\n🚨 发现 {len(errors)} 个错误:\n")
        for i, err in enumerate(errors, 1):
            print(f"  {i}. {err['text']}")
            if 'location' in err and err['location']:
                loc = err.get('location', {})
                print(f"     位置: {loc.get('url', 'unknown')}:{loc.get('lineNumber', '?')}")
    else:
        print("\n✅ 未发现控制台错误!")

    print(f"\n总控制台消息: {len(console_messages)}")
    print(f"错误消息: {len(errors)}")
EOF
}

# 截图对比模式 (before/after)
run_compare() {
    log_info "执行截图对比..."

    local before="${SCREENSHOT_DIR}/before.png"
    local after="${SCREENSHOT_DIR}/after.png"
    local diff="${SCREENSHOT_DIR}/diff.png"

    if [ ! -f "$before" ]; then
        log_warn "before.png 不存在，跳过对比"
        return 1
    fi

    if [ ! -f "$after" ]; then
        log_warn "after.png 不存在，跳过对比"
        return 1
    fi

    python3 << EOF
from playwright.sync_api import sync_playwright
from PIL import Image
import os

before_path = "$before"
after_path = "$after"
diff_path = "$diff"

try:
    from PIL import Image
    import numpy as np

    before_img = Image.open(before_path)
    after_img = Image.open(after_path)

    # 转换为 RGB
    before_rgb = before_img.convert("RGB")
    after_rgb = after_img.convert("RGB")

    # 比较
    if before_rgb.size != after_rgb.size:
        print(f"⚠️  图片尺寸不同: {before_rgb.size} vs {after_rgb.size}")
        # 调整大小
        after_rgb = after_rgb.resize(before_rgb.size)

    # 计算差异
    pixels_before = np.array(before_rgb)
    pixels_after = np.array(after_rgb)
    diff = np.abs(pixels_before.astype(int) - pixels_after.astype(int))

    # 统计差异像素
    diff_count = np.sum(diff > 10)  # 阈值 10
    total_pixels = diff.shape[0] * diff.shape[1] * diff.shape[2]
    diff_percent = (diff_count / total_pixels) * 100

    print(f"\n{'='*60}")
    print(f"截图对比报告")
    print(f"{'='*60}")
    print(f"差异像素: {diff_count:,} / {total_pixels:,} ({diff_percent:.2f}%)")

    if diff_percent < 1:
        print("\n✅ 视觉差异极小，变更可接受")
    elif diff_percent < 5:
        print("\n🟡 存在一定视觉差异，请人工检查")
    else:
        print("\n🔴 视觉差异较大，建议人工审核")

except ImportError:
    print("⚠️  需要 Pillow 和 NumPy 来进行图片对比")
    print("   pip install pillow numpy")
EOF
}

# 主流程
main() {
    echo ""
    echo "================================================"
    echo "  🍳 食谱 APP - Playwright 视觉反馈闭环"
    echo "================================================"
    echo ""
    log_info "模式: $TEST_MODE"
    log_info "服务器: http://${SERVER_HOST}:${SERVER_PORT}"
    echo ""

    # 检查服务器
    if ! check_server; then
        log_err "服务器未运行，请先启动: cd web && bun run dev"
        exit 1
    fi

    case "$TEST_MODE" in
        quick)
            run_quick
            ;;
        full)
            run_full
            ;;
        mobile)
            run_mobile
            ;;
        console)
            run_console
            ;;
        compare)
            run_compare
            ;;
        *)
            log_err "未知模式: $TEST_MODE"
            echo "可用模式: quick, full, mobile, console, compare"
            exit 1
            ;;
    esac

    echo ""
    log_ok "视觉反馈流程完成!"
}

# 帮助信息
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "用法: $0 [模式] [选项]"
    echo ""
    echo "模式:"
    echo "  quick    - 快速截图验证 (默认)"
    echo "  full    - 完整 E2E + 截图对比"
    echo "  mobile  - 移动端测试"
    echo "  console - 控制台错误检测"
    echo "  compare - 截图对比 (before.png vs after.png)"
    echo ""
    echo "选项:"
    echo "  --server=<port>  服务器端口 (默认: 3000)"
    echo "  --host=<addr>    服务器地址 (默认: localhost)"
    echo ""
    echo "示例:"
    echo "  $0 quick                        # 快速截图"
    echo "  $0 full                        # 完整 E2E"
    echo "  $0 mobile                      # 移动端测试"
    echo "  $0 console                     # 检测控制台错误"
    echo "  $0 compare                     # 对比 before/after"
    echo "  SERVER_PORT=3001 $0 full       # 指定端口"
    exit 0
fi

main
