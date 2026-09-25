#!/bin/bash
# block-codejs-read.sh — PreToolUse(Read) enforcement hook.
#
# Closes the enforcement gap flagged by /verify: "never read code.js" was only
# documented, not enforced. This hook makes it mechanical. The plugin runtime
# plugin/figma-builder/code.js is ~45k tokens and is NEVER needed for a
# use_figma build — every key/token it holds is in SAP_BUILD_MANIFEST.md.
#
# Tool input arrives as JSON on stdin (.tool_input.file_path) — NOT via env var.
# Exit 2 blocks the Read; stderr becomes the agent's feedback (redirect to manifest).
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if echo "$FILE_PATH" | grep -qE 'plugin/figma-builder/code\.js$'; then
  echo "BLOCK: plugin/figma-builder/code.js is the Figma plugin runtime (~45k tokens) and is NOT needed for use_figma builds. Use node build/kit.js for every key, token, style and icon." >&2
  exit 2
fi

exit 0
