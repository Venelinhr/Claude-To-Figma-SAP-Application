#!/bin/bash
# guard-architect-gate.sh — PreToolUse hook · Gate 0.5 (Architect-First Reasoning). BLOCKING.
#
# WHY: the pipeline was implementation-first — a plain TEXT business request could jump
# straight to component selection with no business→IA→floorplan reasoning. RULE 20's
# "Reasoning Brain" existed but was GUIDANCE with no gate reading its artifacts (same dead-
# enforcement class the drift audit found). This makes architect-first reasoning a HARD gate
# for from-scratch text builds.
#
# Fires before a use_figma BUILD. BLOCKS (exit 2) unless .architect-approved exists —
# UNLESS the build is exempt (see SKIP below). The marker is written ONLY by
# capture-approvals.sh from the user's own architect-approval words; Claude cannot self-echo it.
#
# ORDER: this runs BEFORE guard-wireframe-gate.sh. Flow for a new text screen:
#   business statement → information architecture → floorplan+rationale → (architect approved)
#   → ASCII wireframe → (wireframe approved) → build.
#
# SKIP (exempt from architect reasoning — these are NOT new-from-text builds):
#   • a canonical CLONE is declared (.reuse-declared level 1–4) — architecture is inherited
#   • a from-scratch build was explicitly consented (.scratch-approved) AND wireframe approved
#   • the wireframe was already approved via an IMAGE flow (reference image drives architecture)
#   • repairs / small edits: the code clones/setProperties an existing node without creating a new screen root
# 2026-09-14: when run inside guard-chain.sh, INPUT/TOOL/CODE are already parsed and exported —
# skip the duplicate cat+jq. Falls back to self-parsing when run standalone (unchanged behavior).
INPUT="${GUARD_CHAIN_INPUT:-$(cat)}"
TOOL="${GUARD_CHAIN_TOOL:-$(echo "$INPUT" | jq -r '.tool_name // empty')}"
echo "$TOOL" | grep -qi "use_figma" || exit 0

CODE="${GUARD_CHAIN_CODE:-$(echo "$INPUT" | jq -r '.tool_input.code // ""')}"
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

# Only gate a BUILD (node-creating). Read-only inspects pass.
# Shared build definition — see lib-build-detect.sh (was missing setProperties).
source "$(dirname "$0")/lib-build-detect.sh"
is_build "$CODE" || exit 0

# ── SKIP conditions (real markers only — no phantom markers) ──
# 1. Canonical clone declared → architecture is inherited from the canonical, not designed fresh.
if [ -f "$PROJ/.claude/.reuse-declared" ]; then
  LEVEL=$(NO_COLOR=1 node -e "try{process.stdout.write(String(JSON.parse(require('fs').readFileSync('$PROJ/.claude/.reuse-declared','utf8')).level||''))}catch(e){}" 2>/dev/null | tr -cd '0-9')
  case "$LEVEL" in 1|2|3|4) exit 0 ;; esac
fi
# 2. A build that CLONES a node (repair / clone-first) rather than creating a new screen root.
#    If the code clones and does NOT create a fresh root frame, it's not a new-from-text screen.
if echo "$CODE" | grep -qE "\.clone\(" && ! echo "$CODE" | grep -qE "createFrame\(|figma\.createFrame"; then
  exit 0
fi
# 3. Already have architect approval → pass.
[ -f "$PROJ/.claude/.architect-approved" ] && exit 0

# ── BLOCK: a new-from-scratch screen build with no architect brief approved ──
echo "⛔ GATE 0.5 BLOCKED (Architect-First Reasoning) — no architecture brief approved for this new screen." >&2
echo "" >&2
echo "Before the wireframe/build, act as a Senior SAP Product Designer and present, in order:" >&2
echo "  1. BUSINESS STATEMENT — the problem, the primary user + task, the key decision, the outcome." >&2
echo "  2. INFORMATION ARCHITECTURE — the region tree (header/nav/filter/primary/supporting/actions)," >&2
echo "     reading order, and progressive disclosure — BEFORE any SAP component is named." >&2
echo "  3. FLOORPLAN + RATIONALE — the ONE SAP Fiori floorplan that fits, and why (not a default)." >&2
echo "" >&2
echo "Then WAIT for the user to approve the architecture (e.g. 'architecture approved', 'IA looks right'," >&2
echo "'floorplan approved'). Only after that: ASCII wireframe → wireframe approval → build." >&2
echo "" >&2
echo "SKIP this gate legitimately by: declaring a canonical clone (.reuse-declared L1–4), or cloning" >&2
echo "an existing node. The marker is written by the user's approval prompt — it cannot be self-set." >&2
echo "See skill/agents/reasoning-brain.md for the artifact templates (reuse them; don't reinvent)." >&2
exit 2
