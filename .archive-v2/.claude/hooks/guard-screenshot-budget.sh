#!/bin/bash
# guard-screenshot-budget.sh — PreToolUse(get_screenshot | take_screenshot). Enforces the
# "one screenshot at hand-off" rule that was prose only.
#
# Why (AUDIT-V2 §2.1, P5): the 2026-09-01 build took 6 screenshots (3 inside the build);
# CLAUDE.md says "ONE screenshot only at final hand-off … screenshots are the biggest
# per-call token cost". Verify by TEXT (the use_figma return), screenshot once.
#
# Budget = 1 (reference analysis) + 1 per completed build this session (hand-off).
# The user can always grant one more by asking for it ("take a screenshot", "show me") —
# capture-approvals.sh writes .screenshot-requested from the user's own words.
# Counters are hook-owned (guard-marker-write.sh TIER 3) and reset at SessionStart.
INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
echo "$TOOL" | grep -qiE "get_screenshot|take_screenshot" || exit 0
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
M="$PROJ/.claude"

if [ -f "$M/.screenshot-requested" ]; then
  rm -f "$M/.screenshot-requested" 2>/dev/null
  exit 0   # the user asked for this one
fi

TAKEN=$(cat "$M/.screenshots-taken" 2>/dev/null | tr -cd '0-9'); TAKEN=${TAKEN:-0}
BUILDS=$(cat "$M/.builds-count" 2>/dev/null | tr -cd '0-9'); BUILDS=${BUILDS:-0}
ALLOW=$((1 + BUILDS))

if [ "$TAKEN" -ge "$ALLOW" ]; then
  {
    echo "⛔ SCREENSHOT BUDGET — $TAKEN taken this session, allowance $ALLOW (1 for analysis + 1 per completed build)."
    echo "Verify by TEXT instead: make the use_figma call return {created, instances, nativeFrames, unboundHex, widths}."
    echo "Take the one hand-off screenshot after the build passes the reality gate."
    echo "If the user explicitly asks for a screenshot, their words grant one (.screenshot-requested)."
  } >&2
  exit 2
fi
echo $((TAKEN + 1)) > "$M/.screenshots-taken" 2>/dev/null
exit 0
