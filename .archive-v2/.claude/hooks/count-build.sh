#!/bin/bash
# count-build.sh — PostToolUse(use_figma). Counts COMPLETED builds this session.
#
# Feeds guard-screenshot-budget.sh (1 hand-off screenshot per completed build).
# A call that threw inside Figma is not a completed build and is not counted; a call
# refused by a PreToolUse gate never reaches PostToolUse at all.
# Counter is hook-owned (guard-marker-write.sh TIER 3), reset at SessionStart.
INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
echo "$TOOL" | grep -qi "use_figma" || exit 0
CODE=$(printf '%s' "$INPUT" | jq -r '.tool_input.code // ""' 2>/dev/null)
source "$(dirname "$0")/lib-build-detect.sh"
is_build "$CODE" || exit 0
RESP=$(printf '%s' "$INPUT" | jq -r '.tool_response | tostring' 2>/dev/null)
printf '%s' "$RESP" | grep -qE '^(\[?\{?"?(type"?:"?text"?,"?text"?:"?)?)?Error|"Error:|Figma Debug UUID' && exit 0
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
N=$(cat "$PROJ/.claude/.builds-count" 2>/dev/null | tr -cd '0-9'); N=${N:-0}
echo $((N + 1)) > "$PROJ/.claude/.builds-count" 2>/dev/null
exit 0
