#!/bin/bash
# ============================================================
# 🛠️ Hephaestus Dev Helper for k (爪爪)
# Efficiency tool for recipe-app development
# ============================================================
set -euo pipefail

APP_DIR="/home/k/code/recipe-app"
cd "$APP_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

CHECK="✅"
CROSS="❌"
ROCKET="🚀"
FILE="📄"
STAT="📊"
GEAR="⚙️"

show_help() {
    echo -e "${CYAN}=============================================${NC}"
    echo -e "${CYAN}   🛠️  Hephaestus Dev Helper for k${NC}"
    echo -e "${CYAN}=============================================${NC}"
    echo ""
    echo -e "${GREEN}Usage:${NC} ./dev-helper.sh [command]"
    echo ""
    echo -e "${YELLOW}Commands:${NC} status | changed | staged | untracked | stats | quickadd | commit | aliases | todo | help"
    echo ""
}

git_status_summary() {
    echo -e "${BLUE}${STAT} Git Status Summary${NC}"
    echo -e "${BLUE}-------------------${NC}"
    STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l)
    UNSTAGED=$(git diff --name-only 2>/dev/null | wc -l)
    UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)
    echo -e "  Staged: ${GREEN}$STAGED${NC} | Unstaged: ${YELLOW}$UNSTAGED${NC} | Untracked: ${CYAN}$UNTRACKED${NC}"
    echo ""
}

list_changed_files() {
    echo -e "${BLUE}${FILE} Modified Files${NC}"
    echo -e "${BLUE}-------------------${NC}"
    if git diff --name-only 2>/dev/null | grep -q .; then
        git diff --name-only 2>/dev/null | while read f; do
            echo -e "  ${YELLOW}M${NC} $f"
        done
    else
        echo "  No modified files"
    fi
    echo ""
}

show_stats() {
    echo -e "${BLUE}${STAT} Development Statistics${NC}"
    echo -e "${BLUE}-------------------${NC}"
    TOTAL=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    TODAY=$(git log --since="midnight" --oneline 2>/dev/null | wc -l || echo "0")
    VUE=$(find "$APP_DIR/web/app/components" -name "*.vue" 2>/dev/null | wc -l)
    COMP=$(find "$APP_DIR/web/app/composables" -name "*.ts" 2>/dev/null | wc -l)
    PAGES=$(find "$APP_DIR/web/app/pages" -name "*.vue" 2>/dev/null | wc -l)
    API=$(find "$APP_DIR/web/server/api" -name "*.ts" 2>/dev/null | wc -l)
    echo -e "  Total commits: ${GREEN}$TOTAL${NC}"
    echo -e "  Today commits: ${GREEN}$TODAY${NC}"
    echo -e "  Vue components: ${CYAN}$VUE${NC}"
    echo -e "  Composables: ${CYAN}$COMP${NC}"
    echo -e "  Pages: ${CYAN}$PAGES${NC}"
    echo -e "  API endpoints: ${CYAN}$API${NC}"
    echo ""
}

stage_group() {
    case "$1" in
        components) git add web/app/components/ web/app/components/recipe/ web/app/components/admin/ 2>/dev/null && echo "✅ Components staged" ;;
        composables) git add web/app/composables/ 2>/dev/null && echo "✅ Composables staged" ;;
        pages) git add web/app/pages/ 2>/dev/null && echo "✅ Pages staged" ;;
        api) git add web/server/ 2>/dev/null && echo "✅ API staged" ;;
        i18n) git add web/i18n/ 2>/dev/null && echo "✅ i18n staged" ;;
        all) git add -A 2>/dev/null && echo "✅ All staged" ;;
        *) echo "Groups: components | composables | pages | api | i18n | all" ;;
    esac
    echo ""
}

show_aliases() {
    echo -e "${BLUE}${GEAR} Aliases for ~/.bashrc${NC}"
    cat << 'EOF'

alias kstatus='~/code/recipe-app/scripts/dev-helper.sh status'
alias kchanged='~/code/recipe-app/scripts/dev-helper.sh changed'
alias kstats='~/code/recipe-app/scripts/dev-helper.sh stats'
alias kquick='~/code/recipe-app/scripts/dev-helper.sh quickadd'
alias kpush='git push origin $(git branch --show-current)'
alias kdev='cd ~/code/recipe-app/web && bun run dev'
alias kbuild='cd ~/code/recipe-app/web && bun run build'
EOF
    echo ""
}

show_todo() {
    echo -e "${BLUE}${STAT} Task Summary${NC}"
    STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l)
    UNSTAGED=$(git diff --name-only 2>/dev/null | wc -l)
    echo -e "  Staged: $STAGED | Modified: $UNSTAGED"
    TODO=$(grep -r "TODO\|FIXME" "$APP_DIR/web/app" --include="*.vue" --include="*.ts" 2>/dev/null | wc -l || echo "0")
    echo -e "  TODO/FIXME: $TODO"
    echo ""
}

case "${1:-help}" in
    status) git_status_summary ;;
    changed) list_changed_files ;;
    staged) git diff --cached --name-only 2>/dev/null | sed 's/^/  /' || echo "No staged files" ;;
    untracked) git ls-files --others --exclude-standard 2>/dev/null | sed 's/^/  /' || echo "No untracked files" ;;
    stats) show_stats ;;
    quickadd) stage_group "${2:-}" ;;
    commit) echo "Run: git commit -m 'message'" ;;
    aliases) show_aliases ;;
    todo) show_todo ;;
    help|--help|-h) show_help ;;
    *) echo -e "${RED}${CROSS} Unknown: $1${NC}"; show_help; exit 1 ;;
esac
