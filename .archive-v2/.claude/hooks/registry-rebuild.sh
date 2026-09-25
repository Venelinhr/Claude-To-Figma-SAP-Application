#!/bin/bash
# registry-rebuild.sh — PostToolUse(Edit|Write) hook.
#
# When a component registry JSON is edited, rebuild the plugin bundle so
# code.bundled.js stays current. Previously this used the non-existent
# CLAUDE_TOOL_INPUT_FILE_PATH env var and silently never fired (confirmed
# 2026-07-14). Now uses the documented stdin JSON (.tool_input.file_path)
# + $CLAUDE_PROJECT_DIR. Never blocks (exit 0).
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if echo "$FILE_PATH" | grep -qE '/knowledge/components/registry/.*\.json$'; then
  cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || cd "$(dirname "$0")/../.." || exit 0
  echo "[hook] Registry file changed — rebuilding bundle..."
  node build/build-registry-bundle.js 2>&1 | tail -8
fi

exit 0
