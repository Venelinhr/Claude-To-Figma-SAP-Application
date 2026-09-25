#!/bin/bash
# block-generated-files.sh — PreToolUse(Edit|Write) hook.
#
# Blocks edits to auto-generated files (code.bundled.js, registry-bundle.js) —
# edits get wiped on the next build. Previously used the non-existent
# CLAUDE_TOOL_INPUT_FILE_PATH env var and silently never fired, giving a false
# sense of protection (confirmed 2026-07-14). Now uses documented stdin JSON.
# Exit 2 blocks; stderr becomes the agent's feedback.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if echo "$FILE_PATH" | grep -qE '(code\.bundled\.js|registry-bundle\.js)$'; then
  echo "BLOCK: This file is auto-generated. Edit code.js or the registry JSON files instead, then run node build/build-registry-bundle.js to regenerate." >&2
  exit 2
fi

exit 0
