#!/bin/bash
# surface-learnings.sh — SessionStart hook.
#
# Surfaces any pending (uncaptured) learning signals from prior sessions so the
# feedback loop closes even across session boundaries. Reads
# .claude/pending-learnings.jsonl, counts entries whose status is still
# "pending", and if any exist, injects a reminder listing them.
#
# SessionStart stdout is added to context (exit 0). Never blocks.
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
LEDGER="$PROJ/.claude/pending-learnings.jsonl"

[ -f "$LEDGER" ] || exit 0

# Count + list pending entries
PENDING=$(jq -c 'select(.status=="pending")' "$LEDGER" 2>/dev/null)
COUNT=$(printf '%s\n' "$PENDING" | grep -c . )

if [ "$COUNT" -gt 0 ]; then
  LIST=$(printf '%s\n' "$PENDING" | jq -r '"  · [\(.type)] \(.ts): \(.prompt[0:80])"' 2>/dev/null | tail -3)
  # Ground-truth tasks get a distinct, actionable callout (Loop D)
  GT_COUNT=$(printf '%s\n' "$PENDING" | jq -c 'select(.type=="ground-truth")' 2>/dev/null | grep -c .)
  GT_NOTE=""
  if [ "$GT_COUNT" -gt 0 ]; then
    GT_NOTE=" ${GT_COUNT} of these are GROUND-TRUTH tasks (RULE 27): for each, run the ground-truth-updater — read the confirmed node's exact measurements via get_design_context and write them into knowledge/guidelines/token-assignment-rules.md, then mark captured."
  fi
  echo "<pending-learnings count=\"$COUNT\">There are $COUNT uncaptured feedback signal(s) from prior sessions in .claude/pending-learnings.jsonl. Review whether each reflects a reusable lesson; if so, capture it as a 'feedback' memory and set that entry's status to \"captured\" (edit the JSONL line). If it was one-off with no reusable lesson, set status to \"dismissed\". Do not let them accumulate.${GT_NOTE}
$LIST</pending-learnings>"
fi

exit 0
