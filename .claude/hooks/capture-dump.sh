#!/bin/bash
# capture-dump.sh — PostToolUse(use_figma). Turns a tree dump returned by use_figma into the
# reality gate WITHOUT the model echoing it back.
#
# Why (AUDIT-V2 §9.2, measured 2026-09-02): in a fresh-context benchmark the reality gate cost
# ~12k output tokens — the agent had to Write the 200-node dump it had just received back to disk
# for verify-invariants.js — plus ~12k of context for three dump slices, and that pushed the
# session into a compaction. A PostToolUse hook sees the SAME tool result (.tool_response), so it
# can save it, expand it, run the verifier and hand the agent only the verdict. Output-token cost
# of verification drops to the dump call itself (~0.5k).
#
# Recognises the compact dump shape produced by build/templates/dump-tree.use_figma.js and
# dump-delta.use_figma.js: {rows:[[19 fields]…]} or a slice {total, from, rows}. Slices are
# accumulated in output/<node>-compact.json until `total` rows are present.
# Provenance (--based-on / --canonical) comes from .claude/.reuse-declared (level 1–4).
# Stdout → context. Never blocks (exit 0).
INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
echo "$TOOL" | grep -qi "use_figma" || exit 0
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
OUT="$PROJ/output"; mkdir -p "$OUT"

# The MCP result is usually [{"type":"text","text":"<json>"}]; sometimes a bare object/string.
PAYLOAD=$(printf '%s' "$INPUT" | jq -r '
  .tool_response
  | if type=="string" then . elif type=="array" then (.[0].text // "") elif type=="object" then (if has("rows") then tostring else (.text // .content // "" | tostring) end) else "" end' 2>/dev/null)
[ -n "$PAYLOAD" ] || exit 0
printf '%s' "$PAYLOAD" | jq -e 'type=="object" and (.rows|type)=="array" and (.rows|length)>0 and (.rows[0]|type)=="array" and (.rows[0]|length)==19' >/dev/null 2>&1 || exit 0

FROM=$(printf '%s' "$PAYLOAD" | jq -r '.from // empty'); TOTAL=$(printf '%s' "$PAYLOAD" | jq -r '.total // empty')
PTR="$PROJ/.claude/.dump-in-progress"
if [ -n "$FROM" ] && [ "$FROM" != "0" ] && [ -f "$PTR" ]; then ROOT=$(cat "$PTR"); else ROOT=$(printf '%s' "$PAYLOAD" | jq -r '.rows[0][0]'); fi
ID=${ROOT//:/-}; C="$OUT/$ID-compact.json"

if [ -n "$FROM" ]; then
  # a slice of a full dump — accumulate until every row is here
  if [ "$FROM" = "0" ]; then printf '%s' "$PAYLOAD" | jq -c '[{from, rows}]' > "$C"; printf '%s' "$ROOT" > "$PTR"
  elif [ -f "$C" ]; then S=$(printf '%s' "$PAYLOAD" | jq -c '{from, rows}'); jq -c --argjson s "$S" '. + [$s]' "$C" > "$C.tmp" && mv "$C.tmp" "$C"
  else printf '%s' "$PAYLOAD" | jq -c '[{from, rows}]' > "$C"; fi
  HAVE=$(jq '[.[].rows | length] | add' "$C" 2>/dev/null); HAVE=${HAVE:-0}
  if [ -z "$TOTAL" ] || [ "$HAVE" -lt "$TOTAL" ]; then
    echo "<reality-gate status=\"partial\" node=\"$ROOT\">dump slice captured: $HAVE of ${TOTAL:-?} nodes — send the remaining slices (same call, next FROM/TO). Do NOT write the dump yourself.</reality-gate>"
    exit 0
  fi
  rm -f "$PTR"
else
  printf '%s' "$PAYLOAD" | jq -c '.rows' > "$C"
fi

BASE=$(jq -r 'select((.level // 5) >= 1 and (.level // 5) <= 4) | .baseCanonical // empty' "$PROJ/.claude/.reuse-declared" 2>/dev/null)
[ "$BASE" = "none" ] && BASE=""
EXP=""; VER="--pre-bind --out output/$ID-verify.json"
if [ -n "$BASE" ]; then
  EXP="--based-on $BASE"; VER="--canonical $BASE $VER"
  # PROVENANCE-AWARE VERIFICATION (AUDIT-V2 §8.4 P11). A clone-first build reuses the confirmed
  # canonical's own node names; without the canonical's dump to compare against, INV 1 / INV 3
  # reject them and bury the genuine findings (measured: 130 false flags on a 204-node build).
  # If this canonical has already been dumped (output/<id>-tree.json, e.g. from a previous
  # dump-tree run or expand-tree-dump), hand it to the verifier so inherited nodes pass by
  # provenance and only the delta is strict. INV 2 and INV 5 run on everything either way, so a
  # missing canonical dump can only make the gate STRICTER, never weaker.
  CID=${BASE//:/-}
  for CAND in "$OUT/$CID-tree.json" "$OUT/$CID-compact.json"; do
    [ -f "$CAND" ] || continue
    if [ "$CAND" = "$OUT/$CID-compact.json" ]; then
      node "$PROJ/build/expand-tree-dump.js" "$CAND" "$OUT/$CID-tree.json" >/dev/null 2>&1 || continue
      CAND="$OUT/$CID-tree.json"
    fi
    VER="$VER --canonical-dump ${CAND#"$PROJ/"}"
    break
  done
fi
if ! node "$PROJ/build/expand-tree-dump.js" "$C" "$OUT/$ID-tree.json" $EXP >/dev/null 2>&1; then
  echo "<reality-gate status=\"error\" node=\"$ROOT\">the dump was captured to output/$ID-compact.json but could not be expanded — run: node build/expand-tree-dump.js output/$ID-compact.json output/$ID-tree.json $EXP</reality-gate>"
  exit 0
fi
( cd "$PROJ" && node build/verify-invariants.js "output/$ID-tree.json" $VER >/dev/null 2>&1 )
SUMMARY=$(jq -r '"overallPass=\(.overallPass) · nodes=\(.summary.instances + .summary.containers + .summary.primitives + .summary.text + .summary.other) · hidden=\(.summary.hidden)" + (if (.provenance.active // false) then " · provenance: clone of \(.provenance.declared), \(.summary.inherited // 0) inherited (INV 1/3 waived; INV 2/5 still applied)" else "" end) + " · " + ((.fails | group_by(.verdict) | map("\(.[0].verdict)×\(length)") | join(" · ")) | if . == "" then "0 violations" else . end)' "$OUT/$ID-verify.json" 2>/dev/null)
[ -n "$SUMMARY" ] || SUMMARY="verifier produced no output/$ID-verify.json — run it by hand: node build/verify-invariants.js output/$ID-tree.json $VER"
HARD=$(jq -r '[.fails[] | select(.verdict=="FAIL_RAW_HEX" or .verdict=="FAIL_CHILD_OVERFLOW" or .verdict=="FAIL_HEADER_WIDTH_MISMATCH")] | map("  • \(.verdict) \(.name): \(.why | .[0:140])") | join("\n")' "$OUT/$ID-verify.json" 2>/dev/null)
echo "<reality-gate node=\"$ROOT\" verify=\"output/$ID-verify.json\">$SUMMARY
Hard criteria (must be 0): FAIL_RAW_HEX, FAIL_CHILD_OVERFLOW, FAIL_HEADER_WIDTH_MISMATCH.${HARD:+
$HARD}
Verification is provenance-aware (AUDIT-V2 P11): on a clone-first build, nodes inherited unchanged from the confirmed canonical pass INV 1/INV 3 by provenance, while nodes this build ADDED or RENAMED are verified at full strictness. INV 2 and INV 5 apply to every node — a FAIL_RAW_HEX, FAIL_CHILD_OVERFLOW or FAIL_HEADER_WIDTH_MISMATCH is always a real defect, inherited or not. If the line above shows no 'Provenance:' note on a clone-first build, the canonical's own dump was not on disk and everything was checked at full strictness — any remaining FAIL_FAKE_COMPONENT / FAIL_TYPO_TAG on a verbatim canonical name is then calibration, not a defect. The dump was saved by this hook; do not write it yourself.</reality-gate>"
exit 0
