#!/bin/bash
# restore-turn2-markers.sh — called by bridge before spawning Turn 2 resume child.
# Restores gate markers that SessionStart would otherwise wipe.
PROJ="${1:-$(cd "$(dirname "$0")/../.." && pwd)}"
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "{\"approvedBy\":\"bridge-resume\",\"at\":\"$TS\"}" > "$PROJ/.claude/.wireframe-approved"
# Restore reuse decision if passed as second arg
if [ -n "$2" ]; then
  echo "$2" > "$PROJ/.claude/.reuse-declared"
fi
exit 0
