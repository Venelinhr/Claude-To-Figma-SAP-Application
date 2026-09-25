#!/bin/bash
# manifest-sync-check.sh — PostToolUse(Edit|Write) hook.
#
# When SAP_BUILD_MANIFEST.md is edited, immediately re-run the drift checker so
# a stale component key (which would break importComponentSetByKeyAsync at build
# time) is caught the instant the manifest changes — not only in the full suite.
#
# Tool input arrives as JSON on stdin (.tool_input.file_path). This hook never
# blocks (exit 0 always) — it only surfaces drift as a notice.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if echo "$FILE_PATH" | grep -qE 'SAP_BUILD_MANIFEST\.md$'; then
  cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || cd "$(dirname "$0")/../.." || exit 0
  echo "[hook] SAP_BUILD_MANIFEST.md changed — checking drift vs source JSONs..."
  node build/check-manifest-sync.js 2>&1 | tail -3
fi

exit 0
