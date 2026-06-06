#!/bin/bash
# セッション開始時にグローバル設定（CLAUDE.md・スキル）をリポジトリから復元する
set -euo pipefail

REPO="${CLAUDE_PROJECT_DIR:-/home/user/a}"
GLOBAL_SRC="$REPO/claude-global"

[ -d "$GLOBAL_SRC" ] || exit 0

# CLAUDE.md を復元
if [ -f "$GLOBAL_SRC/CLAUDE.md" ]; then
  cp "$GLOBAL_SRC/CLAUDE.md" "$HOME/.claude/CLAUDE.md"
fi

# スキルを復元
if [ -d "$GLOBAL_SRC/skills" ]; then
  mkdir -p "$HOME/.claude/skills"
  cp -r "$GLOBAL_SRC/skills/." "$HOME/.claude/skills/"
fi
