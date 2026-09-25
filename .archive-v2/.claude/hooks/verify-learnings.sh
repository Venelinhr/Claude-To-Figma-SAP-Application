#!/bin/bash
# verify-learnings.sh — Stop hook (capture verification).
#
# At the end of a turn, if any feedback signal is still status:"pending" in
# .claude/pending-learnings.jsonl, re-inject a HARD reminder so the lesson cannot
# silently evaporate. This closes the capture gap: the durable ledger entry exists,
# but the actual memory-write is guided — this makes "still uncaptured" impossible
# to ignore at turn end (not just at next session start).
#
# Stop stdout is added to context; exit 0 never blocks.
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
LEDGER="$PROJ/.claude/pending-learnings.jsonl"

[ -f "$LEDGER" ] || exit 0

PENDING=$(jq -c 'select(.status=="pending")' "$LEDGER" 2>/dev/null)
COUNT=$(printf '%s\n' "$PENDING" | grep -c .)

[ "$COUNT" -gt 0 ] || exit 0

# F-10 (Performance Recovery, RC-10): do NOT nag on every Stop for a couple of stragglers — that
# is per-turn context bloat. Only re-inject at turn end when the backlog is genuinely piling up
# (> 5 pending), and show at most the 3 most recent, each truncated. SessionStart still lists more.
[ "$COUNT" -gt 5 ] || exit 0

LIST=$(printf '%s\n' "$PENDING" | jq -r '"  · [\(.type)] \(.ts): \(.prompt[0:80])"' 2>/dev/null | tail -3)
echo "<uncaptured-learnings count=\"$COUNT\">⚠ $COUNT feedback signals are PENDING in .claude/pending-learnings.jsonl (backlog > 5). Capture the reusable ones as feedback memories and set their status to \"captured\", or \"dismissed\" if one-off. Showing the 3 most recent:
$LIST</uncaptured-learnings>"

exit 0
