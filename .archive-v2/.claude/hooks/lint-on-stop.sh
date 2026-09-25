#!/bin/bash
# lint-on-stop.sh — Stop hook (Loop B enforcement, both build paths).
#
# Loop B catches a bad build at turn-end without relying on Claude to remember.
# Two build paths, two checks:
#   1. LEGACY JSON path → lint the most-recent output/*-spec.json (build/lint-mcp-frame.js).
#   2. MCP-FIRST path (RULE 25, the DEFAULT) → produces NO spec file (it builds in Figma via
#      use_figma). A Stop hook can't query Figma, so we detect an UNBOUND build via a marker:
#      when a build reminder is issued, .claude/.last-build-node is written; if it exists and
#      hasn't been cleared by a bind confirmation, remind to Bind SAP Tokens + read the a11y report.
# BLOCKING (Fix #3e, audit 2026-07-21): a failing OR missing reality-gate now exits 2 to BLOCK
# hand-off (previously this only echoed advice and always exit 0, so "verified working" could be
# declared on a broken screen). Block reasons go to stderr (Stop reads stderr on exit 2).
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
LINTER="$PROJ/build/lint-mcp-frame.js"
OUTDIR="$PROJ/output"
MARKER="$PROJ/.claude/.last-build-node"
BLOCK=0        # set to 1 by any hard-fail branch → exit 2 at the end
BLOCKMSG=""

# ── Path 1: legacy JSON spec lint ──
if [ -f "$LINTER" ] && [ -d "$OUTDIR" ]; then
  RECENT=$(find "$OUTDIR" -name '*-spec.json' -mmin -10 2>/dev/null | head -1)
  if [ -n "$RECENT" ]; then
    RESULT=$(node "$LINTER" "$RECENT" 2>&1)
    if [ $? -ne 0 ]; then
      BLOCK=1
      BLOCKMSG="${BLOCKMSG}The RULE 25 tag-contract linter FAILED on spec $(basename "$RECENT"):
$RESULT
"
    fi
  fi
fi

# ── Path 2: MCP-first unbound-build reminder (advisory context, not a hard block) ──
if [ -f "$MARKER" ]; then
  NODE=$(cat "$MARKER" 2>/dev/null | head -1)
  echo "<mcp-build-unbound node=\"$NODE\">A screen was built this session via use_figma (RULE 25) but is not yet confirmed token-bound (Loop B). Before finishing: (1) select the frame in Figma and run the plugin \"Bind SAP Tokens\", (2) read the a11y report, (3) confirm 0 raw-fill leaks. Once the user confirms the bind, clear the marker: rm .claude/.last-build-node.</mcp-build-unbound>"
fi

# ── Path 3: invariant reality gate (Gate 9) — BLOCKING ──
if [ -d "$OUTDIR" ]; then
  RECENT_VERIFY=$(find "$OUTDIR" -name '*-verify.json' -mmin -10 2>/dev/null | head -1)
  if [ -n "$RECENT_VERIFY" ]; then
    # jq-absent = block (fail-closed): we cannot confirm the gate passed, so do not allow hand-off.
    if ! command -v jq >/dev/null 2>&1; then
      BLOCK=1
      BLOCKMSG="${BLOCKMSG}Cannot verify $(basename "$RECENT_VERIFY") — jq is not installed, so the reality gate result is unknown. Install jq (fail-closed).
"
    elif [ "$(jq -r '.overallPass' "$RECENT_VERIFY" 2>/dev/null)" != "true" ]; then
      FAILS=$(jq -r '.fails[]? | "  [INV \(.invariant)] \(.verdict) — \(.why)"' "$RECENT_VERIFY" 2>/dev/null | head -20)
      BLOCK=1
      BLOCKMSG="${BLOCKMSG}The post-build reality gate (verify-invariants.js) FAILED on $(basename "$RECENT_VERIFY"). Native frames, raw hex, or non-SAP fonts present. Fix the frame, re-dump the tree, re-run verify until overallPass:true. Violations:
$FAILS
"
    fi
  elif [ -f "$MARKER" ]; then
    # A build occurred (marker present) but NO verify artifact → the reality gate was skipped. Block.
    BLOCK=1
    BLOCKMSG="${BLOCKMSG}A build was marked this session (.last-build-node exists) but produced NO output/<node>-verify.json. The invariant reality gate was SKIPPED. Before hand-off: dump the built frame tree via use_figma (root.findAll(()=>true) → output/<node>-tree.json) and run: node build/verify-invariants.js output/<node>-tree.json --pre-bind --out output/<node>-verify.json — hand off only when overallPass:true.
"
  fi
fi

if [ "$BLOCK" = "1" ]; then
  echo "⛔ STOP BLOCKED (Gate 9 — reality gate). Do NOT declare this build done:" >&2
  printf '%s' "$BLOCKMSG" >&2
  exit 2
fi

exit 0
