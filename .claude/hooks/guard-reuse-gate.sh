#!/bin/bash
# guard-reuse-gate.sh — PreToolUse hook · Canonical Pattern Library gate (RULE 31). BLOCKING.
#
# Fires before a use_figma build. RULE 31 requires that BEFORE building, Claude has:
#   1. Scored the request against the canonical library (build/score-canonical.js)
#   2. Recorded a VALID reuse decision (level 1-5 + base canonical) to .claude/.reuse-declared
#   3. For Level 1-4: a delta-spec that passes build/validate-delta-spec.js
#
# The marker .claude/.reuse-declared is a JSON artifact:
#   {"level":1,"score":94,"baseCanonical":"750:174925","deltaSpec":".claude/.delta-spec.json"}
# The hook re-validates it (level range, score consistency, base exists, delta-spec valid for L1-4).
# If a BUILD is detected (createInstance / createFrame / .clone()) and the marker is missing or
# invalid → BLOCK (exit 2, stderr message to Claude). Read-only use_figma calls pass silently.
#
# Tool input arrives as JSON on stdin (.tool_name, .tool_input). exit 2 = block; exit 0 = allow.
# 2026-09-14: when run inside guard-chain.sh, INPUT/TOOL/CODE are already parsed and exported —
# skip the duplicate cat+jq. Falls back to self-parsing when run standalone (unchanged behavior).
INPUT="${GUARD_CHAIN_INPUT:-$(cat)}"
TOOL="${GUARD_CHAIN_TOOL:-$(echo "$INPUT" | jq -r '.tool_name // empty')}"
echo "$TOOL" | grep -qi "use_figma" || exit 0

PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
MARKER="$PROJ/.claude/.reuse-declared"

CODE="${GUARD_CHAIN_CODE:-$(echo "$INPUT" | jq -r '.tool_input.code // ""')}"

# ── Detect a BUILD (vs a read-only inspect / tweak) ──
# Includes .clone( — RULE 28's preferred clone-canonical path (was previously blind to it).
# Shared build definition — see lib-build-detect.sh. The old 4-token grep let a
# build that only appended/mutated existing nodes bypass the reuse gate entirely.
source "$(dirname "$0")/lib-build-detect.sh"
IS_BUILD=false
is_build "$CODE" && IS_BUILD=true
[ "$IS_BUILD" = true ] || exit 0

blockmsg() {
  # exit 2 with stderr feedback is the documented PreToolUse "block" behavior.
  echo "$1" >&2
  exit 2
}

# ── No marker → block ──
if [ ! -f "$MARKER" ]; then
  blockmsg "⛔ RULE 31 BLOCKED — use_figma BUILD attempted with no reuse decision on record.

Before building you MUST:
1. Score the request:   node build/score-canonical.js --floorplan \"<fp>\" --regions <r1,r2> --components <c1,c2>
2. Pick the top match + reuse level (1-5).
3. For Level 1-4, write a delta-spec and validate it:  node build/validate-delta-spec.js <spec.json>
4. Record the decision with the sanctioned script (raw writes to the marker are blocked):
   node build/record-reuse-decision.js --level <N> --score <S> --base \"<node-id>\" [--delta <path>]
   (if Gate 0's record-reference.js already ran for the SAME node this session, --score/--base
   are OPTIONAL — they default from .reference-selected, so you only need --level)

If this is a genuine Level 5 (no canonical scored >=60):
   node build/record-reuse-decision.js --level 5 --score <S> --base none
All preconditions at once:  bash build/gate-status.sh

Reuse > rebuild. Do not rebuild a screen a canonical could satisfy."
fi

# ── Marker exists — validate it as JSON ──
LEVEL=$(jq -r '.level // empty' "$MARKER" 2>/dev/null)
SCORE=$(jq -r '.score // empty' "$MARKER" 2>/dev/null)
BASE=$(jq -r '.baseCanonical // empty' "$MARKER" 2>/dev/null)
DELTA=$(jq -r '.deltaSpec // empty' "$MARKER" 2>/dev/null)

if [ -z "$LEVEL" ]; then
  blockmsg "⛔ RULE 31 BLOCKED — .claude/.reuse-declared is not valid JSON (no .level).
Rewrite it:  node build/record-reuse-decision.js --level <N> --score <S> --base \"<id|none>\""
fi

# level 1-5
case "$LEVEL" in
  1|2|3|4|5) ;;
  *) blockmsg "⛔ RULE 31 BLOCKED — reuse level '$LEVEL' invalid (must be 1-5)." ;;
esac

# Level ↔ score consistency (matches score-canonical.js thresholds)
if [ "$LEVEL" = "1" ] && [ -n "$SCORE" ]; then
  awk "BEGIN{exit !($SCORE < 85)}" && blockmsg "⛔ RULE 31 BLOCKED — Level 1 needs score >=85, got $SCORE. Re-score or drop to Level 2/3."
fi
if [ "$LEVEL" = "5" ] && [ -n "$SCORE" ]; then
  awk "BEGIN{exit !($SCORE >= 60)}" && blockmsg "⛔ RULE 31 BLOCKED — Level 5 (new build) but score $SCORE >=60. A canonical likely exists — reuse it."
fi
# L5 anti-gaming (drift-audit 2026-07-22, GAP #4): the score above is SELF-REPORTED in the marker.
# A genuine high-scoring request could be written as {"level":5,"score":0} to dodge reuse. Two
# independent backstops make that fail: (a) L5 REQUIRES .scratch-approved (checked below) — the
# USER must consent to build-from-scratch, and capture-approvals.sh writes that only from the
# user's own words; (b) the score MUST come from an actual `node build/score-canonical.js` run
# (deterministic) — a fabricated 0 with no scorer invocation is a RULE 31 violation. Enforce (a):
if [ "$LEVEL" = "5" ]; then
  if [ ! -f "$PROJ/.claude/.scratch-approved" ]; then
    blockmsg "⛔ RULE 31 BLOCKED — Level 5 (build from scratch) requires user consent (.scratch-approved) AND a real score-canonical.js run proving top score <60. Run the scorer; if a canonical scores >=60, reuse it. Do NOT self-report score:0 to skip reuse."
  fi
fi

# Level 1-4 must name a base canonical and (if a delta-spec path is given) validate it
if [ "$LEVEL" != "5" ]; then
  if [ -z "$BASE" ] || [ "$BASE" = "none" ]; then
    blockmsg "⛔ RULE 31 BLOCKED — Level $LEVEL requires a baseCanonical (got '$BASE'). Set it or use Level 5."
  fi
  if [ -n "$DELTA" ] && [ "$DELTA" != "null" ] && [ -f "$PROJ/$DELTA" ]; then
    if ! node "$PROJ/build/validate-delta-spec.js" "$PROJ/$DELTA" >/dev/null 2>&1; then
      blockmsg "⛔ RULE 31 BLOCKED — delta-spec $DELTA failed validation. Run: node build/validate-delta-spec.js $DELTA"
    fi
  fi
  # ── CLONE-FIRST (RULE 28) — a canonical match MUST be built by cloning it ──
  # Previously the gate treated .clone()/createInstance/createFrame identically, so a
  # Level 1-4 decision could still be built from native frames. Now: if a canonical matched,
  # the code must contain .clone( — otherwise it is not clone-first, it is a rebuild.
  if ! echo "$CODE" | grep -qE "\.clone\("; then
    blockmsg "⛔ RULE 28 BLOCKED — Level $LEVEL means canonical $BASE matched, but the build code contains no .clone().
A matched canonical MUST be cloned, then injected/swapped — not rebuilt from scratch.
  const src = figma.currentPage.findOne(n => n.id === '$BASE'); const clone = src.clone(); /* inject content */
If you truly cannot clone (base unavailable), re-score honestly — do not rebuild what a canonical satisfies."
  fi
fi

# ── ASK-BEFORE-SCRATCH — a from-scratch build needs INDEPENDENT user consent ──
# Level 5 = no canonical matched = building from zero (pure SAP instances, no clone base).
# Claude must have ASKED the user, and the user must have consented. The consent marker is
# written ONLY by capture-approvals.sh on a user prompt — Claude cannot self-echo it.
if [ "$LEVEL" = "5" ]; then
  if [ ! -f "$PROJ/.claude/.scratch-approved" ]; then
    blockmsg "⛔ ASK-BEFORE-SCRATCH BLOCKED — Level 5 means no approved screen matched, so this would build from zero.
You must ASK the user before building a screen from scratch. Present the analysis + component suggestion +
ASCII wireframe + L1–L5 layer structure, then ask the user to confirm building new (no clone base exists).
Only the user's own confirmation writes .claude/.scratch-approved — it cannot be self-set.
(If an approved screen actually exists, re-score and clone it instead — that is always preferred.)"
  fi
fi

# All checks pass — allow, with a confirming note
echo "<reuse-gate status=\"passed\">RULE 31 satisfied: Level $LEVEL · base $BASE · score ${SCORE:-—}. Building.</reuse-gate>"
exit 0
