#!/bin/bash
#============================================
# 食谱APP自我评判模块
# Self-Critique for Quality Control
#============================================

set -e

APP_DIR="/root/code/recipe-app"
WEB_DIR="$APP_DIR/web"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${BLUE}[自评]${NC} $1"; }
logGood() { echo -e "${GREEN}[自评] ✅${NC} $1"; }
logWarn() { echo -e "${YELLOW}[自评] ⚠️${NC} $1"; }
logBad() { echo -e "${RED}[自评] ❌${NC} $1"; }

# 评分标准
BUILD_OK=0
CODE_QUALITY=0
NO_REGRESSION=0
PERFORMANCE=0
TOTAL=0

# ============================================
# 检查1: 构建验证
# ============================================
check_build() {
    log "检查构建..."
    
    cd "$WEB_DIR"
    
    if timeout 120 npm run build &>/dev/null; then
        BUILD_OK=30
        logGood "构建通过 (+30分)"
    else
        BUILD_OK=0
        logBad "构建失败 (+0分)"
        return 1
    fi
}

# ============================================
# 检查2: 代码质量
# ============================================
check_code_quality() {
    log "检查代码质量..."
    
    local score=0
    local max_score=25
    
    # 检查TypeScript类型
    if command -v npx &>/dev/null; then
        if npx tsc --noEmit 2>/dev/null; then
            score=$((score + 10))
            logGood "TypeScript类型检查通过 (+10分)"
        else
            logWarn "TypeScript有警告 (+0分)"
        fi
    fi
    
    # 检查ESLint/Prettier配置
    local has_eslint=false
    local has_prettier=false
    
    if [[ -f "$WEB_DIR/.eslintrc.js" ]] || [[ -f "$WEB_DIR/.eslintrc.json" ]] || [[ -f "$WEB_DIR/.eslintrc.cjs" ]]; then
        has_eslint=true
    fi
    
    if [[ -f "$WEB_DIR/.prettierrc" ]] || [[ -f "$WEB_DIR/.prettierrc.json" ]]; then
        has_prettier=true
    fi
    
    if $has_eslint && $has_prettier; then
        score=$((score + 10))
        logGood "ESLint + Prettier配置完整 (+10分)"
    elif $has_eslint || $has_prettier; then
        score=$((score + 6))
        logWarn "有ESLint或Prettier配置 (+6分)"
    else
        score=$((score + 2))
        logWarn "无代码规范配置 (+2分)"
    fi
    
    # 检查组件大小
    local large_components=$(find "$WEB_DIR/components" -name "*.vue" -exec wc -l {} + 2>/dev/null | sort -rn | awk '$1 > 300 {count++} END {print count}')
    
    if [[ -n "$large_components" ]] && [[ $large_components -lt 3 ]]; then
        score=$((score + 5))
        logGood "组件大小合理 (+5分)"
    else
        logWarn "存在过大组件 (+0分)"
    fi
    
    CODE_QUALITY=$score
    log "代码质量: $score/$max_score"
}

# ============================================
# 检查3: 无回归
# ============================================
check_no_regression() {
    log "检查功能回归..."
    
    local score=0
    local max_score=20
    
    # 检查关键文件是否存在
    local key_files=(
        "app/pages/index.vue"
        "app/pages/recipes/[id].vue" 
        "app/components/RecipeCard.vue"
        "app/composables/useRecipes.ts"
    )
    
    local missing=0
    for file in "${key_files[@]}"; do
        if [[ ! -f "$WEB_DIR/$file" ]]; then
            ((missing++))
        fi
    done
    
    score=$((20 - missing * 5))
    
    if [[ $score -eq 20 ]]; then
        logGood "关键文件完整 (+20分)"
    else
        logWarn "缺少 $missing 个文件 (+$score分)"
    fi
    
    NO_REGRESSION=$score
}

# ============================================
# 检查4: 性能
# ============================================
check_performance() {
    log "检查性能优化..."
    
    local score=0
    local max_score=25
    
    # 检查虚拟滚动
    if grep -rq "useVirtualScrolling\|VirtualScrolling\|virtual.*scroll" "$WEB_DIR" --include="*.vue" 2>/dev/null; then
        score=$((score + 8))
        logGood "已实现虚拟滚动 (+8分)"
    fi
    
    # 检查图片懒加载
    if grep -rq "loading=\"lazy\"\|IntersectionObserver\|useIntersectionObserver" "$WEB_DIR" --include="*.vue" 2>/dev/null; then
        score=$((score + 5))
        logGood "已实现懒加载 (+5分)"
    fi
    
    # 检查代码分割
    if grep -rq "defineAsyncComponent\|() => import" "$WEB_DIR" --include="*.vue" 2>/dev/null; then
        score=$((score + 7))
        logGood "已实现代码分割 (+7分)"
    fi
    
    # 检查SEO (useSeoMeta 或 useHead)
    if grep -rq "useSeoMeta\|useHead\|ogTitle\|ogDescription" "$WEB_DIR/pages" --include="*.vue" 2>/dev/null; then
        score=$((score + 5))
        logGood "已配置SEO (+5分)"
    fi
    
    PERFORMANCE=$score
    log "性能优化: $score/$max_score"
}

# ============================================
# 主评判流程
# ============================================
main() {
    echo ""
    echo "=========================================="
    log "🧠 食谱APP自我评判开始"
    echo "=========================================="
    echo ""
    
    # 执行所有检查
    check_build || true
    check_code_quality
    check_no_regression
    check_performance
    
    # 计算总分
    TOTAL=$((BUILD_OK + CODE_QUALITY + NO_REGRESSION + PERFORMANCE))
    
    echo ""
    echo "=========================================="
    log "📊 评判结果"
    echo "=========================================="
    echo ""
    echo "| 检查项 | 得分 |"
    echo "|--------|------|"
    echo "| 构建验证 | $BUILD_OK/30 |"
    echo "| 代码质量 | $CODE_QUALITY/25 |"
    echo "| 无回归 | $NO_REGRESSION/20 |"
    echo "| 性能优化 | $PERFORMANCE/25 |"
    echo "|--------|------|"
    echo "| **总分** | **$TOTAL/100** |"
    echo ""
    
    # 判断等级
    if [[ $TOTAL -ge 90 ]]; then
        echo -e "${GREEN}🏆 优秀! 代码质量很高${NC}"
        return 0
    elif [[ $TOTAL -ge 70 ]]; then
        echo -e "${YELLOW}👍 良好，还有提升空间${NC}"
        return 0
    elif [[ $TOTAL -ge 50 ]]; then
        echo -e "${YELLOW}⚠️ 及格，需要改进${NC}"
        return 1
    else
        echo -e "${RED}❌ 不及格，需要重大改进${NC}"
        return 1
    fi
}

main "$@"
