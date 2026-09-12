#!/bin/bash
# surface-canonical-record.sh — Stop hook. Closes the reuse learning loop (RULE 31 · flywheel).
#
# The flywheel already failed once: "Schedule Activated" is in reuse-outcomes-ledger.md but was
# never added to canonical-index.json Tier 2 — because record-canonical.js was invoked by nobody.
#
# A pure hook cannot know the confirmed node ID / screen name (only Claude does), so this hook
# does the next best thing MECHANICALLY: at turn end, if a build happened this session (marker
# .claude/.last-build-node present) AND a confirmation signal was logged this session
# (pending-learnings.jsonl has a "positive" or "ground-truth" row), it reminds Claude to run
# record-canonical.js with the exact command — so the library actually grows.
#
# It also runs the integrity check and warns if any ledger row lacks a Tier-2 entry (drift).
# Always exit 0 (Stop hooks never block).
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
LEDGER_PENDING="$PROJ/.claude/pending-learnings.jsonl"
BUILD_MARKER="$PROJ/.claude/.last-build-node"

# Only fire when BOTH: a build occurred this session AND a positive/ground-truth signal was logged.
[ -f "$BUILD_MARKER" ] || exit 0
[ -f "$LEDGER_PENDING" ] || exit 0
grep -qE '"type":"(positive|ground-truth)"' "$LEDGER_PENDING" 2>/dev/null || exit 0

NODE=$(cat "$BUILD_MARKER" 2>/dev/null | head -1)

# 2026-09-12 fix: the marker used to ALWAYS contain the literal string "build <timestamp>" (a
# mark-build.sh bug, now fixed) — so every reminder this hook ever printed quoted an invalid
# --node value that record-canonical.js's own format check (`^\d+[:-]\d+$`) would reject. The
# flywheel comment above says it "already failed once"; this is very likely why it kept failing
# silently rather than erroring loudly. Guard against a still-unrecognised response shape so the
# reminder never again asks for a command that cannot succeed.
if ! echo "$NODE" | grep -qE '^[0-9]+[:-][0-9]+$'; then
  echo "<canonical-record-reminder>A build was confirmed this session, but the captured build marker (\"$NODE\") is not a usable node id — record-canonical.js would reject it. Read the built frame's real id and width live (use_figma: \`(await figma.getNodeByIdAsync(\"<id>\")).width\`), then run:

  node build/record-canonical.js --node \"<real id, e.g. 804:44859>\" --name \"<screen name>\" --width <real width> --file \"<file key>\" --base \"<canonical id or none>\" --level <N> --score <S> --outcome \"<perfect|bravo|...>\" --date \"<YYYY-MM-DD>\"

Then clear the build marker: rm .claude/.last-build-node</canonical-record-reminder>"
  exit 0
fi

echo "<canonical-record-reminder>A build ($NODE) was confirmed this session but the canonical library grows ONLY when you run the write-back. Close the loop now (RULE 31 flywheel):

  node build/record-canonical.js --node \"$NODE\" --name \"<screen name>\" --width <real width — read it live, do not guess> --file \"<file key>\" --base \"<canonical id or none>\" --level <N> --score <S> --outcome \"<perfect|bravo|...>\" --date \"<YYYY-MM-DD>\"

This appends the reuse-outcomes ledger AND adds the Tier 2 canonical entry in one step. Skipping it means the next similar request won't find this screen — the flywheel stalls (it already failed once on 'Schedule Activated'). --width is REQUIRED (AUDIT-V2 P10): canonicals resolve live by name+width, never by a stored id.

Then clear the build marker: rm .claude/.last-build-node</canonical-record-reminder>"

# Integrity drift check — warn if a ledger row has no matching Tier-2 entry
if [ -f "$PROJ/build/check-reuse-integrity.js" ]; then
  DRIFT=$(node "$PROJ/build/check-reuse-integrity.js" 2>&1)
  if [ $? -ne 0 ]; then
    echo "<reuse-integrity-warning>$DRIFT</reuse-integrity-warning>"
  fi
fi

exit 0
