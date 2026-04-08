#!/bin/bash
# ============================================================
# 🐾 recipe-app Morning Startup Dashboard
# Run when k wakes up - everything in one glance
# ============================================================
set -euo pipefail

APP_DIR="/root/code/recipe-app"
WORKSPACE="/root/.openclaw/workspace"

echo "============================================="
echo "   🐾 recipe-app Morning Dashboard"
echo "   $(date '+%Y-%m-%d %H:%M %A')"
echo "============================================="
echo ""

# --- System Health ---
echo "📊 SYSTEM STATUS"
echo "-------------------"
# --- Flywheel State ---
echo "🎰 FLYWHEEL STATE"
echo "-------------------"
if [ -f "$WORKSPACE/.flywheel-state.json" ]; then
  python3 -c "
import json
state = json.load(open('$WORKSPACE/.flywheel-state.json'))
running = '✅' if state.get('running') else '❌'
pid = state.get('daemon_pid', 'N/A')
completed = state.get('total_tasks_completed', 'N/A')
failed = state.get('total_tasks_failed', 'N/A')
cycles = state.get('total_cycles', 'N/A')
print(f'  Running: {running} (PID {pid})')
print(f'  Cycles: {cycles} | Completed: {completed} | Failed: {failed}')
if completed + failed > 0:
  rate = completed / (completed + failed) * 100
  print(f'  Success rate: {rate:.1f}%')
"
else
  echo "  (no state file)"
fi
echo ""

# --- Git Status ---
echo "📦 GIT STATUS (68 files, Hephaestus overnight work)"
echo "-------------------"
cd "$APP_DIR"
STAGED=$(git diff --cached --name-only | wc -l)
UNSTAGED=$(git diff --name-only | wc -l)
UNTRACKED=$(git ls-files --others --exclude-standard | wc -l)
echo "  Staged: $STAGED | Unstaged: $UNSTAGED | Untracked: $UNTRACKED"
echo ""

# --- Commit Strategy Preview ---
echo "📋 COMMIT PLAN (6 logical commits ready)"
echo "-------------------"
python3 -c "
import json
commits = [
  ('🚀 Notifications & WebSocket',    'web/server/api/notifications web/server/utils/notification.ts web/server/api/_ws.ts web/app/components/WebSocketNotificationToast.vue'),
  ('📴 Offline Mode Support',          'web/app/components/OfflineBanner.vue web/app/composables/useOfflineStatus.ts'),
  ('🛡️ Rate Limiting & Anti-Scraping', 'web/server/plugins/rate-limit.ts web/server/utils/antiScrape.ts web/server/api/recipes/index.ts web/server/api/my-recipes/index.ts'),
  ('🗄️ Database Index Optimizations',   'web/supabase/INDEX_AUDIT.md'),
  ('📦 Export/Import & API Versioning', 'web/server/api/v1/index.ts'),
  ('⚡ E2E Tests Infrastructure',      'web/playwright.config.ts'),
  ('🎨 UI Improvements & i18n',         'web/app/components web/app/composables web/app/pages web/i18n web/nuxt.config.ts web/app/app.vue web/types/index.ts'),
]
for i, (emoji_desc, _) in enumerate(commits, 1):
  print(f'  {i}. {emoji_desc}')
"
echo ""

# --- Quick Commit Commands ---
echo "⚡ QUICK COMMIT (copy-paste these)"
echo "-------------------"
echo ""
echo "  # 1️⃣ Notifications & WebSocket"
echo "  git add web/server/api/notifications web/server/utils/notification.ts web/server/api/_ws.ts web/app/components/WebSocketNotificationToast.vue && git commit -m \"feat(recipe-app): add notifications & WebSocket system\""
echo ""
echo "  # 2️⃣ Offline Mode"
echo "  git add web/app/components/OfflineBanner.vue web/app/composables/useOfflineStatus.ts && git commit -m \"feat(recipe-app): add offline mode support (PWA)\""
echo ""
echo "  # 3️⃣ Rate Limiting"
echo "  git add web/server/plugins/rate-limit.ts web/server/utils/antiScrape.ts web/server/api/recipes/index.ts web/server/api/my-recipes/index.ts && git commit -m \"feat(recipe-app): add rate limiting & anti-scraping protection\""
echo ""

# --- In-Progress Tasks ---
echo "🔄 IN-PROGRESS TASKS (Hephaestus continuing)"
echo "-------------------"
python3 -c "
import json
try:
  with open('$WORKSPACE/.task-pool.md') as f:
    content = f.read()
  in_prog = [l for l in content.split('\n') if l.strip().startswith('- [→]')]
  if in_prog:
    for t in in_prog[:5]:
      print(f'  {t}')
  else:
    print('  None')
except:
  print('  (task pool unavailable)')
"
echo ""

# --- Files Needing Review ---
echo "⚠️  FILES NEEDING REVIEW BEFORE COMMIT"
echo "-------------------"
echo "  ?? CONTRIBUTING.md"
echo "  ?? docs/tasty-bytes-snowflake-analysis.md"
echo "  ?? web/app/assets/css/design-tokens.css"
echo "  ?? web/app/composables/useDesignSystem.ts"
echo ""

# --- Tomorrow Morning Reminder ---
echo "🌅 TODO TOMORROW MORNING"
echo "-------------------"
echo "  1. Review above commit plan"
echo "  2. Run quick commits (or ./morning-dashboard.sh --commit-all)"
echo "  3. Push: git push"
echo "  4. Check 3 in-progress tasks completion"
echo ""

echo "============================================="
echo "   爪爪 🐾 Morning Dashboard Ready"
echo "============================================="
