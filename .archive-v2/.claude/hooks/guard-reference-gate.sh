#!/bin/bash
# guard-reference-gate.sh — PreToolUse(use_figma) hook · GATE 0 (Canonical Reference Selection). BLOCKING.
#
# The single highest-leverage decision in the workflow is WHICH canonical reference to clone. Picking
# wrong cascades into manual patching, silent failures, screenshot loops, and 30k+ wasted tokens (the
# wizard disaster, 2026-07-22). This gate makes that decision mandatory and explicit BEFORE any build:
# a use_figma BUILD is blocked (exit 2) unless a scored reference decision has been recorded via
# build/record-reference.js (writes .claude/.reference-selected).
#
# Fires BEFORE guard-wireframe-gate.sh so the reference is locked before the wireframe reflects it.
#
# Pass conditions:
#   • .reference-selected exists AND its score >= 60                          → PASS (a real match chosen)
#   • .reference-selected exists AND score < 60 AND .scratch-approved exists   → PASS (user OK'd scratch)
#   • otherwise                                                                → BLOCK (exit 2)
#
# The marker is written ONLY by record-reference.js (agent runs score-canonical.js, then records the
# chosen node). Raw-Bash writes of the marker are blocked by the marker-write guard (settings.json),
# so this cannot be self-forged.
# 2026-09-14: when run inside guard-chain.sh, INPUT/TOOL/CODE are already parsed and exported —
# skip the duplicate cat+jq. Falls back to self-parsing when run standalone (unchanged behavior).
INPUT="${GUARD_CHAIN_INPUT:-$(cat)}"
TOOL="${GUARD_CHAIN_TOOL:-$(echo "$INPUT" | jq -r '.tool_name // empty')}"
echo "$TOOL" | grep -qi "use_figma" || exit 0

CODE="${GUARD_CHAIN_CODE:-$(echo "$INPUT" | jq -r '.tool_input.code // ""')}"
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

# Only gate BUILDS (node-creating / cloning). Read-only inspects pass silently.
# Shared build definition — see lib-build-detect.sh.
source "$(dirname "$0")/lib-build-detect.sh"
is_build "$CODE" || exit 0

MARKER="$PROJ/.claude/.reference-selected"

if [ ! -f "$MARKER" ]; then
  echo "⛔ GATE 0 BLOCKED — no canonical reference has been selected for this build." >&2
  echo "" >&2
  echo "Reference selection is the highest-leverage decision — pick it BEFORE building:" >&2
  echo "  1. Understand the task shape (dialog / list / object page / nav / card / log panel)." >&2
  echo "  2. Score candidates:  node build/score-canonical.js --floorplan \"<fp>\" --regions <r> --components <c>" >&2
  echo "     (or from a cached VDI model:  node build/score-canonical.js --from-model semantic-models/<file>.md)" >&2
  echo "  3. Pick the best gold reference. When unsure, the curated gold set + default anchor (9:1550" >&2
  echo "     for dialogs) are in memory: reference_gold_standard_screen_set.md." >&2
  echo "  4. READ the node live (use_figma: name + width) — ids drift; the index's 'Outage List' id is a dialog in the live file." >&2
  echo "  5. Record it:  node build/record-reference.js --node \"<id>\" --name \"<live name>\" --score <n> --rationale \"...\" --effort \"...\"" >&2
  echo "     and assert src.name === \"<live name>\" in the clone code before .clone()." >&2
  echo "" >&2
  echo "If NO reference scores >= 60, this is a from-scratch build — record the low score AND get the" >&2
  echo "user's explicit OK (writes .scratch-approved) before building." >&2
  exit 2
fi

# Read the recorded score.
SCORE=$(jq -r '.score // 0' "$MARKER" 2>/dev/null)
# Integer compare, FLOOR. Default 0 if unparseable.
# Was printf '%.0f', which ROUNDS despite the comment saying floor — so a recorded
# 59.6 became 60 and passed a ">= 60" gate. Scores are genuinely fractional
# (score-canonical.js emits e.g. 63.3), so this admitted below-threshold references.
SCORE_INT=$(printf '%s' "$SCORE" | awk '{ v=$0+0; printf "%d", (v<0 ? -int(-v) : int(v)) }' 2>/dev/null)
[ -n "$SCORE_INT" ] || SCORE_INT=0

if [ "${SCORE_INT:-0}" -lt 60 ]; then
  if [ ! -f "$PROJ/.claude/.scratch-approved" ]; then
    echo "⛔ GATE 0 BLOCKED — recorded reference score is $SCORE (< 60): no suitable match, so this is a" >&2
    echo "from-scratch build. That requires the user's explicit OK first (writes .scratch-approved)." >&2
    echo "Present the situation ('no canonical scores >=60; propose building from scratch, reusing" >&2
    echo "compositions X/Y') and wait for the user to approve before building." >&2
    exit 2
  fi
fi

exit 0
