#!/bin/bash
# mark-build.sh — PostToolUse(use_figma) hook. Stamps .claude/.last-build-node when a BUILD ran.
#
# WHY (drift-audit 2026-07-22, GAP #2/#5 — the fail-OPEN hole): the whole "100% SAP screen"
# guarantee rests on verify-invariants.js (Gate 6/7) running post-build. But lint-on-stop.sh
# (Gate 9) only BLOCKS hand-off when it sees a build happened without a verify.json — and it
# detects "a build happened" via .last-build-node, which NOTHING wrote. So an agent that simply
# never ran the verifier handed off clean (fail-open). This hook writes that marker automatically
# whenever use_figma mutates the canvas, making lint-on-stop's "build but no verify → BLOCK"
# branch reachable. The verifier is no longer optional.
#
# This is a SYSTEM-written marker (PostToolUse, not agent Bash), so it is NOT the agent
# self-forging an approval — it attests "a build tool ran", which is objectively true.
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
echo "$TOOL" | grep -qi "use_figma" || exit 0

CODE=$(echo "$INPUT" | jq -r '.tool_input.code // ""')
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

# Only stamp on a BUILD (node-creating / cloning). Read-only inspects don't count.
# Shared build definition — see lib-build-detect.sh.
source "$(dirname "$0")/lib-build-detect.sh"
is_build "$CODE" || exit 0

mkdir -p "$PROJ/.claude" 2>/dev/null
printf 'build %s\n' "$(date -u 2>/dev/null || echo session)" > "$PROJ/.claude/.last-build-node" 2>/dev/null

# Nudge the agent to run the reality gate now, while the tree is fresh.
echo "<build-marked>A use_figma BUILD ran. Gate 9 (lint-on-stop) will now BLOCK hand-off unless output/<node>-verify.json shows overallPass:true. Before you finish: dump the built frame tree and run \`node build/verify-invariants.js output/<node>-tree.json --pre-bind [--canonical <id>] --out output/<node>-verify.json\`. This is the reality gate that proves 0 native frames / 0 raw hex / SAP typography.</build-marked>"
exit 0
