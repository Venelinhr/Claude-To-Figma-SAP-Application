#!/bin/bash
# guard-wireframe-gate.sh — PreToolUse hook · Gate 3 (RULE 19, ASCII wireframe). BLOCKING.
#
# The audit found the ASCII-wireframe gate was PROSE ONLY — no hook created or checked
# .wireframe-approved, so Claude could build having never shown a wireframe. This makes it hard.
#
# Fires before a use_figma BUILD. If the code mutates the canvas (build) and no .wireframe-approved
# marker exists, BLOCK (exit 2). The marker is written ONLY by capture-approvals.sh when the USER
# approves — Claude cannot self-echo it. Read-only use_figma calls pass silently.
#
# This runs FIRST among the use_figma PreToolUse hooks (wireframe approval precedes reuse/code checks).
# 2026-09-14: when run inside guard-chain.sh, INPUT/TOOL/CODE are already parsed and exported —
# skip the duplicate cat+jq. Falls back to self-parsing when run standalone (unchanged behavior).
INPUT="${GUARD_CHAIN_INPUT:-$(cat)}"
TOOL="${GUARD_CHAIN_TOOL:-$(echo "$INPUT" | jq -r '.tool_name // empty')}"
echo "$TOOL" | grep -qi "use_figma" || exit 0

CODE="${GUARD_CHAIN_CODE:-$(echo "$INPUT" | jq -r '.tool_input.code // ""')}"
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

# Detect a BUILD (node-creating / cloning / mutating). Read-only inspects pass.
# Shared definition — see lib-build-detect.sh. Previously this grep omitted
# setProperties, so a screen rebuilt purely through property mutation skipped Gate 3.
source "$(dirname "$0")/lib-build-detect.sh"
is_build "$CODE" || exit 0

# Wireframe approval is independent (written only by capture-approvals.sh on a user prompt).
if [ ! -f "$PROJ/.claude/.wireframe-approved" ]; then
  echo "⛔ GATE 3 BLOCKED (RULE 19) — no ASCII wireframe has been approved for this screen." >&2
  echo "" >&2
  echo "Before building you MUST, in this exact order:" >&2
  echo "  1. Analyze the reference and SEARCH approved/canonical screens (clone-first)." >&2
  echo "  2. Present the ASCII wireframe + the L1–L5 layer structure for the screen." >&2
  echo "  3. WAIT for the user to approve (e.g. 'approve', 'go ahead', 'build it')." >&2
  echo "" >&2
  echo "The approval marker is written by the user's approval prompt — it cannot be self-set." >&2
  echo "This gate exists because building before showing the wireframe was the #1 repeated failure." >&2
  exit 2
fi

exit 0
