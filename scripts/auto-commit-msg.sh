#!/usr/bin/env bash
# auto-commit-msg.sh - Generate Conventional Commits messages from git staged changes
# Usage: ./auto-commit-msg.sh [--ai] [--dry-run]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Generate Conventional Commits messages from git staged changes.

OPTIONS:
  --ai       Use AI to generate more descriptive messages
  --dry-run  Show generated message without applying
  -h, --help Show this help message

EXAMPLES:
  $(basename "$0")                  # Generate from staged changes
  $(basename "$0") --ai             # Use AI for smarter messages
  $(basename "$0") --dry-run        # Preview without applying
EOF
  exit 0
}

# Parse arguments
USE_AI=false
DRY_RUN=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --ai) USE_AI=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Detect change type from file path
detect_type() {
  local file="$1"
  local filename="$(basename "$file")"
  
  case "$file" in
    # Documentation
    *.md|*.txt|*.rst|docs/*|DOCS/*)
      echo "docs"
      ;;
    # Tests
    *test*|*spec*|*.test.*|*.spec.*|__tests__/*|tests/*)
      echo "test"
      ;;
    # Styles (CSS, SCSS, etc)
    *.css|*.scss|*.less|*.sass)
      echo "style"
      ;;
    # Config files
    package.json|package-lock.json|yarn.lock|pnpm-lock.yaml|.env*|config/*|configs/*)
      echo "chore"
      ;;
    # Scripts
    scripts/*.sh|scripts/*.py|scripts/*.js|scripts/*.ts)
      echo "chore"
      ;;
    # Components
    components/*/*.vue|components/*/*.jsx|components/*/*.tsx|components/*/*.ts)
      echo "feat"
      ;;
    # Pages
    pages/*/*.vue|pages/*/*.jsx|pages/*/*.tsx|pages/*/*.ts)
      echo "feat"
      ;;
    # API/Server
    server/*|api/*|serverless/*|functions/*)
      echo "feat"
      ;;
    # Assets (images, fonts, etc)
    assets/*|public/*|static/*)
      echo "chore"
      ;;
    # Default
    *)
      echo "fix"
      ;;
  esac
}

# Get human-readable description for file
get_file_desc() {
  local file="$1"
  local filename="$(basename "$file")"
  local dirname="$(dirname "$file")"
  local basename="${filename%.*}"
  
  # Clean up common patterns
  basename="${basename//-/ }"
  basename="${basename//_/ }"
  
  echo "$basename"
}

# Generate simple message from files
generate_simple_msg() {
  local files=("$@")
  local types=()
  local descriptions=()
  
  # Group files by type
  declare -A type_files
  for file in "${files[@]}"; do
    local ft=$(detect_type "$file")
    types+=("$ft")
    if [[ -z "${type_files[$ft]:-}" ]]; then
      type_files[$ft]="$file"
    else
      type_files[$ft]="${type_files[$ft]};$file"
    fi
  done
  
  # Determine primary type (priority: feat > fix > docs > test > style > refactor > chore)
  local primary_type=""
  local priority="docs test style refactor chore feat fix"
  for pt in $priority; do
    if [[ " ${types[*]} " =~ " $pt " ]]; then
      primary_type="$pt"
      break
    fi
  done
  [[ -z "$primary_type" ]] && primary_type="chore"
  
  # Generate description based on type and files
  local desc=""
  case "$primary_type" in
    feat)
      if [[ ${#files[@]} -eq 1 ]]; then
        desc="add $(get_file_desc "${files[0]}")"
      else
        desc="add ${#files[@]} new files"
      fi
      ;;
    fix)
      if [[ ${#files[@]} -eq 1 ]]; then
        desc="resolve $(get_file_desc "${files[0]}")"
      else
        desc="resolve ${#files[@]} issues"
      fi
      ;;
    docs)
      desc="update documentation"
      ;;
    style)
      desc="adjust styling"
      ;;
    refactor)
      desc="refactor code structure"
      ;;
    test)
      desc="update tests"
      ;;
    chore)
      desc="update configuration"
      ;;
  esac
  
  echo "${primary_type}: ${desc}"
}

# Generate AI-enhanced message
generate_ai_msg() {
  local files=("$@")
  local file_list=$(printf '  - %s\n' "${files[@]}")
  
  local prompt="Given these git staged files:
${file_list}
Generate ONE concise Conventional Commits message.
Format: <type>: <description>
Types: feat, fix, docs, style, refactor, test, chore
Rules:
- Keep description under 50 characters
- Use imperative mood (add, fix, update, resolve)
- Be specific but brief
- Example: feat: add recipe rating component
Reply with ONLY the commit message, nothing else."

  # Try opencode first, fallback to curl
  if command -v opencode &>/dev/null; then
    local result
    result=$(opencode run --no-input "$prompt" 2>/dev/null) || true
    if [[ -n "$result" ]]; then
      echo "$result"
      return
    fi
  fi
  
  # Fallback: generate simple message with enhanced description
  generate_simple_msg "${files[@]}"
}

# Main logic
main() {
  cd "$PROJECT_DIR"
  
  # Check if git repo
  if ! git rev-parse --git-dir &>/dev/null; then
    echo -e "${RED}Error: Not a git repository${NC}" >&2
    exit 1
  fi
  
  # Get staged files
  local staged_files
  staged_files=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null) || true
  
  # Fallback to unstaged if no staged
  if [[ -z "$staged_files" ]]; then
    echo -e "${YELLOW}No staged changes found. Checking unstaged changes...${NC}"
    staged_files=$(git diff --name-only --diff-filter=ACM 2>/dev/null) || true
  fi
  
  # Still empty?
  if [[ -z "$staged_files" ]]; then
    echo -e "${RED}No changes detected. Stage files with: git add <files>${NC}" >&2
    exit 1
  fi
  
  # Convert to array
  mapfile -t files_array <<< "$staged_files"
  
  echo -e "${BLUE}Detected ${#files_array[@]} changed file(s):${NC}"
  for f in "${files_array[@]}"; do
    echo -e "  ${GREEN}${f}${NC}"
  done
  echo
  
  # Generate message
  local msg=""
  if $USE_AI; then
    echo -e "${YELLOW}Generating AI-enhanced message...${NC}"
    msg=$(generate_ai_msg "${files_array[@]}")
  else
    msg=$(generate_simple_msg "${files_array[@]}")
  fi
  
  echo -e "${GREEN}Generated commit message:${NC}"
  echo -e "  ${YELLOW}${msg}${NC}"
  echo
  
  if $DRY_RUN; then
    echo -e "${BLUE}[Dry run] Message not applied.${NC}"
  else
    # Apply to commit message file if in commit hook
    if [[ -n "${GIT_PARAMS:-}" ]]; then
      echo "$msg" > "$GIT_PARAMS"
      echo -e "${GREEN}Message written to $GIT_PARAMS${NC}"
    else
      # Standalone usage - print for manual use
      echo -e "${BLUE}To use this message, run:${NC}"
      echo -e "  git commit -m \"${msg}\""
    fi
  fi
}

main
