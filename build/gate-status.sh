#!/usr/bin/env bash
# gate-status.sh — every build precondition on one screen, BEFORE any code is written.
#
# Why (AUDIT-V2 §1.2, P0'): on 2026-08-28 the agent generated the full screen five
# times (13–17 KB each) and each use_figma call was refused by a DIFFERENT gate in
# turn — 43,895 tokens, zero screens. The gates only spoke after the expensive step.
# This script speaks first: it evaluates the same conditions the PreToolUse gates
# evaluate, lists everything still missing, and gives the exact command for each.
# Satisfy every line, then generate the build code ONCE.
#
# Usage:  bash build/gate-status.sh            (exit 0 = ready, 1 = not ready)
# Read-only, except the manifest-sync cache it shares with guard-manifest-drift.sh.
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
M="$PROJ/.claude"
miss=0
line() { printf '  %s  %-20s %s\n' "$1" "$2" "$3"; }
need() { line "✗" "$1" "$2"; miss=$((miss + 1)); }

echo "SAP build gate status — $(date '+%H:%M:%S')"

# 1 ── workflow contract (SessionStart proof that hooks are alive)
if [ -f "$M/.workflow-loaded" ]; then
  line "✓" "workflow contract" "loaded at SessionStart (hooks are active)"
else
  need "workflow contract" "SessionStart hook never ran → gates are OFF. Relaunch from the project: bin/sap-v2"
fi

# 2 ── canonical reference (Gate 0.7)
SCRATCH_OK=false; [ -f "$M/.scratch-approved" ] && SCRATCH_OK=true
REF_SCORE=""
if [ -f "$M/.reference-selected" ]; then
  REF_NODE=$(jq -r '.node // .nodeId // .id // "?"' "$M/.reference-selected" 2>/dev/null)
  REF_SCORE=$(jq -r '.score // 0' "$M/.reference-selected" 2>/dev/null)
  REF_INT=$(printf '%s' "$REF_SCORE" | awk '{ v=$0+0; printf "%d", (v<0 ? -int(-v) : int(v)) }' 2>/dev/null); [ -n "$REF_INT" ] || REF_INT=0
  if [ "$REF_INT" -ge 60 ]; then
    line "✓" "reference" "node $REF_NODE · score $REF_SCORE → CLONE it"
  elif [ "$SCRATCH_OK" = true ]; then
    line "✓" "reference" "score $REF_SCORE < 60 and the user OK'd building from scratch"
  else
    need "reference" "score $REF_SCORE < 60 → ASK the user for OK to build from scratch (their own words write .scratch-approved)"
  fi
else
  need "reference" "node build/score-canonical.js --floorplan \"<fp>\" --regions <r> --components <c>  →  node build/record-reference.js --node \"<id>\" --score <n> --rationale \"…\" --effort \"…\""
fi

# 3 ── reuse decision (RULE 31)
LEVEL=""
if [ -f "$M/.reuse-declared" ]; then
  LEVEL=$(jq -r '.level // empty' "$M/.reuse-declared" 2>/dev/null)
  RSCORE=$(jq -r '.score // 0' "$M/.reuse-declared" 2>/dev/null)
  BASE=$(jq -r '.baseCanonical // "none"' "$M/.reuse-declared" 2>/dev/null)
  case "$LEVEL" in
    1|2|3|4)
      if [ "$BASE" = "none" ] || [ -z "$BASE" ]; then
        need "reuse decision" "level $LEVEL needs a baseCanonical → node build/record-reuse-decision.js --level $LEVEL --score $RSCORE --base \"<node-id>\""
      elif [ "$LEVEL" = "1" ] && awk "BEGIN{exit !($RSCORE < 85)}"; then
        need "reuse decision" "level 1 needs score ≥ 85 (got $RSCORE) → record level 2 or 3 instead"
      else
        line "✓" "reuse decision" "level $LEVEL · base $BASE · score $RSCORE  (build code MUST contain .clone())"
      fi ;;
    5)
      if awk "BEGIN{exit !($RSCORE >= 60)}"; then
        need "reuse decision" "level 5 but score $RSCORE ≥ 60 → a canonical matches; record level 2–4 with --base and clone it"
      elif [ "$SCRATCH_OK" != true ]; then
        need "reuse decision" "level 5 (from scratch) needs the user's OK → ask; their words write .scratch-approved"
      else
        line "✓" "reuse decision" "level 5 · from scratch · user OK"
      fi ;;
    *) need "reuse decision" ".reuse-declared is invalid → node build/record-reuse-decision.js --level <1-5> --score <s> --base <id|none>" ;;
  esac
else
  need "reuse decision" "node build/record-reuse-decision.js --level <1-5> --score <s> --base <node-id|none>   (levels 1–4 = clone a canonical; 5 = from scratch, needs user OK)"
fi

# 4 ── architecture brief (Gate 0.5) — not needed when cloning a canonical (level 1–4)
case "$LEVEL" in
  1|2|3|4) line "✓" "architecture" "not required — canonical clone (level $LEVEL)" ;;
  *)
    if [ -f "$M/.architect-approved" ]; then
      line "✓" "architecture" "approved by the user"
    else
      need "architecture" "present Business Statement → Information Architecture → Floorplan + rationale; the user must say e.g. 'architecture approved' (their words write the marker)"
    fi ;;
esac

# 5 ── wireframe approval (Gate 3)
if [ -f "$M/.wireframe-approved" ]; then
  line "✓" "wireframe" "approved by the user"
elif [ -f "$M/.wireframe-pending" ]; then
  need "wireframe" "a wireframe was demanded this turn → present the 4 sections + ASCII, then STOP and wait for 'approve'"
else
  need "wireframe" "present the Gate 0→3 wireframe (VDI table · floorplan tree · confidence · ASCII), then STOP; the user's 'approve' writes the marker"
fi

# 6 ── manifest in sync (Gate 4) — same signature as guard-manifest-drift.sh
cd "$PROJ" 2>/dev/null
sig() {
  local s=""
  for p in SAP_BUILD_MANIFEST.md knowledge/guidelines/horizon-variable-keys.json skill/SYSTEM_PROMPT.md plugin/figma-builder/code.js knowledge/components/registry; do
    [ -e "$p" ] && s="$s$(stat -f '%m' "$p" 2>/dev/null || stat -c '%Y' "$p" 2>/dev/null):"
  done
  echo "$s$(ls knowledge/components/registry/*.json 2>/dev/null | wc -l | tr -d ' ')"
}
CUR="$(sig)"
if [ -f "$M/.manifest-sync-ok" ] && [ "$(cat "$M/.manifest-sync-ok" 2>/dev/null)" = "$CUR" ]; then
  line "✓" "manifest" "in sync (cached)"
elif node build/check-manifest-sync.js >/dev/null 2>&1; then
  echo "$CUR" > "$M/.manifest-sync-ok" 2>/dev/null
  line "✓" "manifest" "in sync"
else
  need "manifest" "SAP_BUILD_MANIFEST.md drifted → node build/check-manifest-sync.js  (fix, then re-run)"
fi

echo ""
if [ "$miss" -eq 0 ]; then
  echo "READY — generate the build code ONCE. Rules the code gates will check:"
  echo "  · real SAP instances: createFrame count must not exceed instance/clone count (layout containers only)"
  echo "  · level 1–4: the code must call .clone() on the base canonical"
  echo "  · no 'HUG' on primaryAxisSizingMode/counterAxisSizingMode (use 'AUTO'); appendChild BEFORE layoutSizingHorizontal='FILL'"
  echo "  · 8+ components: build zone by zone (skeleton → header → filters → table), each call returning counts"
  exit 0
else
  echo "NOT READY — $miss precondition(s) missing. Satisfy ALL of them, then write the build code once."
  exit 1
fi
