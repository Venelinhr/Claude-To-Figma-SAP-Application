#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# test-gates.sh — exercises the v2 gate machinery with synthetic hook payloads.
#
# Covers the 2026-09-01 Part C fixes (docs/AUDIT-V2.md §5):
#   P0'  gate-status.sh lists every missing precondition; guard-chain.sh reports ALL
#        failing gates in one message (Run B got one at a time, five times).
#   P1   guard-api-gotchas.sh blocks code that will throw inside Figma.
#   P3   guard-figma-code.sh blocks native-heavy code and code-visible fake components.
#   P5   guard-screenshot-budget.sh + count-build.sh enforce "one screenshot at hand-off".
#   P6   guard-scoped-metadata.sh blocks root dumps and flags big ones.
#   Every registered hook, chain member and tool must be executable (a non-executable
#   hook fails OPEN — see test-build.sh "Hook executability").
#
# Session gate markers are snapshotted before and restored after, so running this in a
# live session changes nothing. Usage:  bash build/test-gates.sh      exit 0 = all pass
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
export CLAUDE_PROJECT_DIR="$ROOT"
H="$ROOT/.claude/hooks"; M="$ROOT/.claude"
pass=0; fail=0
ok()  { echo "  ✓ $1"; pass=$((pass + 1)); }
bad() { echo "  ✗ $1"; fail=$((fail + 1)); }

MARKERS=".workflow-loaded .reference-selected .reuse-declared .architect-approved .wireframe-approved .wireframe-pending .scratch-approved .screenshots-taken .builds-count .screenshot-requested .last-build-node"
SNAP=$(mktemp -d); ERR=$(mktemp); OUT=$(mktemp)
for f in $MARKERS; do [ -f "$M/$f" ] && cp "$M/$f" "$SNAP/$f"; done
restore() { for f in $MARKERS; do rm -f "$M/$f"; [ -f "$SNAP/$f" ] && cp "$SNAP/$f" "$M/$f"; done; rm -rf "$SNAP" "$ERR" "$OUT"; }
trap restore EXIT
clear_markers() { for f in $MARKERS; do rm -f "$M/$f"; done; }

# payload helpers
pl()  { jq -n --arg t "$1" --arg c "$2" --arg ev "${3:-PreToolUse}" --arg cwd "$ROOT" '{tool_name:$t, tool_input:{code:$c}, cwd:$cwd, hook_event_name:$ev}'; }
plr() { jq -n --arg c "$1" --arg r "$2" --arg cwd "$ROOT" '{tool_name:"mcp__figma__use_figma", tool_input:{code:$c}, tool_response:$r, cwd:$cwd, hook_event_name:"PostToolUse"}'; }
plm() { jq -n --arg n "$1" --arg ev "$2" --arg r "${3:-}" --arg cwd "$ROOT" '{tool_name:"mcp__figma__get_metadata", tool_input:{nodeId:$n}, tool_response:$r, cwd:$cwd, hook_event_name:$ev}'; }
run() { bash "$1" >"$OUT" 2>"$ERR"; echo $?; }
all_markers() {
  echo "loaded test" > "$M/.workflow-loaded"
  echo '{"node":"9:1550","score":88}' > "$M/.reference-selected"
  echo '{"level":3,"score":88,"baseCanonical":"9:1550","deltaSpec":null}' > "$M/.reuse-declared"
  echo '{"approvedBy":"test"}' > "$M/.wireframe-approved"
}

BUILD_CODE='const set = await figma.importComponentSetByKeyAsync("k"); const root = figma.createFrame(); root.layoutMode = "VERTICAL"; const b = set.defaultVariant.createInstance(); root.appendChild(b); b.layoutSizingHorizontal = "FILL";'
READ_CODE='const n = figma.currentPage.findOne(n => n.name === "x"); return n ? n.id : null;'
CLONE_CODE='const src = figma.currentPage.findOne(n => n.id === "9:1550"); const c = src.clone(); figma.currentPage.appendChild(c); return c.id;'

echo ""
echo "SAP gate machinery — synthetic payload tests   $(date '+%Y-%m-%d %H:%M:%S')"
echo "$(printf '─%.0s' {1..60})"

echo "1. gate-status.sh (readiness before code)"
clear_markers
bash build/gate-status.sh >"$OUT" 2>&1; rc=$?
n=$(grep -c '✗' "$OUT")
if [ "$rc" -eq 1 ] && grep -q "NOT READY" "$OUT" && [ "$n" -ge 4 ]; then ok "no markers → NOT READY, $n preconditions listed with commands"; else bad "gate-status with no markers: rc=$rc missing=$n"; fi
all_markers
bash build/gate-status.sh >"$OUT" 2>&1; rc=$?
if [ "$rc" -eq 0 ] && grep -q "^READY" "$OUT"; then ok "all markers (level-3 clone) → READY"; else bad "gate-status ready path: rc=$rc"; sed 's/^/      /' "$OUT"; fi

echo "2. guard-chain.sh (all failing gates in ONE message)"
clear_markers
rc=$(pl mcp__figma__use_figma "$BUILD_CODE" | run "$H/guard-chain.sh")
n=$(grep -c '^── guard-' "$ERR")
if [ "$rc" -eq 2 ] && [ "$n" -ge 4 ] && grep -q "gates refused" "$ERR"; then ok "build with no markers → exit 2, $n gates reported at once"; else bad "guard-chain aggregation: rc=$rc sections=$n"; sed 's/^/      /' "$ERR" | head -8; fi
rc=$(pl mcp__figma__use_figma "$READ_CODE" | run "$H/guard-chain.sh")
if [ "$rc" -eq 0 ]; then ok "read-only use_figma passes the chain"; else bad "read-only call blocked: rc=$rc"; sed 's/^/      /' "$ERR" | head -5; fi
all_markers
rc=$(pl mcp__figma__use_figma "$CLONE_CODE" | run "$H/guard-chain.sh")
if [ "$rc" -eq 0 ]; then ok "level-3 clone with every marker passes all 8 gates"; else bad "ready clone blocked: rc=$rc"; sed 's/^/      /' "$ERR" | head -12; fi

echo "3. guard-api-gotchas.sh (documented Figma API traps)"
G="$H/guard-api-gotchas.sh"
rc=$(pl mcp__figma__use_figma 'const f = figma.createFrame(); f.layoutMode = "VERTICAL"; f.primaryAxisSizingMode = "HUG"; const i = set.defaultVariant.createInstance(); f.appendChild(i);' | run "$G")
[ "$rc" -eq 2 ] && grep -q "HUG" "$ERR" && ok "primaryAxisSizingMode='HUG' → blocked (Run A error #1)" || bad "HUG enum not caught (rc=$rc)"
rc=$(pl mcp__figma__use_figma 'const p = figma.createFrame(); p.layoutMode = "HORIZONTAL"; const i = set.defaultVariant.createInstance(); i.layoutSizingHorizontal = "FILL"; p.appendChild(i);' | run "$G")
[ "$rc" -eq 2 ] && grep -q "BEFORE" "$ERR" && ok "FILL before appendChild → blocked (Run A error #2)" || bad "FILL-before-append not caught (rc=$rc)"
rc=$(pl mcp__figma__use_figma 'const p = figma.createFrame(); const i = set.defaultVariant.createInstance(); p.appendChild(i); i.layoutSizingHorizontal = "FILL";' | run "$G")
[ "$rc" -eq 2 ] && grep -q "no layoutMode" "$ERR" && ok "FILL into a createFrame parent with no layoutMode → blocked" || bad "non-autolayout parent not caught (rc=$rc)"
rc=$(pl mcp__figma__use_figma 'const root = figma.createFrame(); figma.currentPage.appendChild(root); root.layoutSizingHorizontal = "FILL"; const i = set.defaultVariant.createInstance(); root.appendChild(i);' | run "$G")
[ "$rc" -eq 2 ] && grep -q "page-level" "$ERR" && ok "FILL on a page-level frame → blocked" || bad "page-level FILL not caught (rc=$rc)"
rc=$(pl mcp__figma__use_figma 'const p = figma.createFrame(); p.layoutMode = "VERTICAL"; p.counterAxisAlignItems = "STRETCH"; const i = set.defaultVariant.createInstance(); p.appendChild(i);' | run "$G")
[ "$rc" -eq 2 ] && grep -q "STRETCH" "$ERR" && ok "counterAxisAlignItems='STRETCH' → blocked" || bad "STRETCH not caught (rc=$rc)"
rc=$(pl mcp__figma__use_figma "$BUILD_CODE" | run "$G")
[ "$rc" -eq 0 ] && ok "correct order (layoutMode → append → FILL) passes" || { bad "clean code blocked (rc=$rc)"; sed 's/^/      /' "$ERR"; }
rc=$(pl mcp__figma__use_figma "$READ_CODE" | run "$G")
[ "$rc" -eq 0 ] && ok "read-only code ignored" || bad "read-only code blocked by gotcha lint"

echo "4. guard-figma-code.sh (native-heavy + code-visible fakes)"
F="$H/guard-figma-code.sh"
HEAVY=$(for i in $(seq 17); do printf 'const f%d = figma.createFrame(); ' "$i"; done; for i in 1 2 3; do printf 'const i%d = set.defaultVariant.createInstance(); ' "$i"; done)
rc=$(pl mcp__figma__use_figma "$HEAVY" | run "$F")
[ "$rc" -eq 2 ] && grep -q "native-heavy" "$ERR" && ok "createFrame ×17 vs createInstance ×3 → blocked (Run A's final build)" || bad "native-heavy not caught (rc=$rc)"
rc=$(pl mcp__figma__use_figma "$HEAVY // layout-only: 17" | run "$F")
[ "$rc" -eq 2 ] && grep -q "no self-declaration escape hatch" "$ERR" && ok "a fake '// layout-only: N' declaration is IGNORED — no longer an escape hatch (2026-09-02 fix)" || bad "self-declaration exploit still works (rc=$rc)"
NAMED=$(for i in $(seq 17); do printf 'const f%d = figma.createFrame(); f%d.name = "Table Row %d";' "$i" "$i" "$i"; done; for i in 1 2 3; do printf 'const i%d = set.defaultVariant.createInstance(); ' "$i"; done)
rc=$(pl mcp__figma__use_figma "$NAMED" | run "$F")
[ "$rc" -eq 0 ] && ok "createFrame ×17 all properly named 'Table Row N' (allowlist match) passes with NO declaration needed" || { bad "properly-named layout frames still blocked (rc=$rc)"; sed 's/^/      /' "$ERR"; }
BAL=$(for i in 1 2 3; do printf 'const f%d = figma.createFrame(); ' "$i"; done; for i in $(seq 9); do printf 'const i%d = set.defaultVariant.createInstance(); ' "$i"; done)
rc=$(pl mcp__figma__use_figma "$BAL" | run "$F")
[ "$rc" -eq 0 ] && ok "createFrame ×3 vs createInstance ×9 passes (Run B's code shape)" || { bad "balanced code blocked (rc=$rc)"; sed 's/^/      /' "$ERR"; }
rc=$(pl mcp__figma__use_figma 'const cb = figma.createFrame(); cb.name = "CheckBox"; const i = set.defaultVariant.createInstance();' | run "$F")
[ "$rc" -eq 2 ] && grep -q "CheckBox" "$ERR" && ok "createFrame variable named 'CheckBox' → blocked as a fake" || bad "fake CheckBox frame not caught (rc=$rc)"
rc=$(pl mcp__figma__use_figma 'const t = figma.createText(); t.characters = "☐ Select all"; const i = set.defaultVariant.createInstance();' | run "$F")
[ "$rc" -eq 2 ] && grep -q "glyph" "$ERR" && ok "text node with a ☐ checkbox glyph → blocked (the 8 native checkboxes)" || bad "checkbox glyph not caught (rc=$rc)"
rc=$(pl mcp__figma__use_figma 'const cb = set.defaultVariant.createInstance(); cb.name = "CheckBox [sapContent_LabelColor]"; const w = figma.createFrame(); w.name = "Filter Row";' | run "$F")
[ "$rc" -eq 0 ] && ok "a real instance named 'CheckBox' + a layout frame named 'Filter Row' pass" || { bad "legit instance/layout frame blocked (rc=$rc)"; sed 's/^/      /' "$ERR"; }

echo "5. guard-screenshot-budget.sh + count-build.sh"
rm -f "$M/.screenshots-taken" "$M/.builds-count" "$M/.screenshot-requested"
S="$H/guard-screenshot-budget.sh"
r1=$(pl mcp__figma__get_screenshot "" | run "$S"); r2=$(pl mcp__figma__get_screenshot "" | run "$S")
[ "$r1" -eq 0 ] && [ "$r2" -eq 2 ] && ok "1st screenshot allowed (analysis), 2nd blocked before any build" || bad "budget: r1=$r1 r2=$r2"
plr "$BUILD_CODE" '{"id":"4:1"}' | bash "$H/count-build.sh" >/dev/null 2>&1
[ "$(cat "$M/.builds-count" 2>/dev/null)" = "1" ] && ok "a completed build increments .builds-count" || bad "count-build did not count a completed build"
plr "$BUILD_CODE" 'Error: in set_primaryAxisSizingMode: Invalid enum value' | bash "$H/count-build.sh" >/dev/null 2>&1
[ "$(cat "$M/.builds-count" 2>/dev/null)" = "1" ] && ok "a build that threw in Figma is NOT counted" || bad "count-build counted a failed build"
r3=$(pl mcp__figma__take_screenshot "" | run "$S"); r4=$(pl mcp__figma__get_screenshot "" | run "$S")
[ "$r3" -eq 0 ] && [ "$r4" -eq 2 ] && ok "after 1 build: one hand-off screenshot allowed, the next blocked" || bad "post-build budget: r3=$r3 r4=$r4"
echo "requested" > "$M/.screenshot-requested"
r5=$(pl mcp__figma__get_screenshot "" | run "$S")
[ "$r5" -eq 0 ] && [ ! -f "$M/.screenshot-requested" ] && ok "user's explicit request grants exactly one more" || bad "screenshot grant: r5=$r5"

echo "6. guard-scoped-metadata.sh"
D="$H/guard-scoped-metadata.sh"
rc=$(plm "0:1" PreToolUse | run "$D"); [ "$rc" -eq 2 ] && ok "get_metadata on the document root 0:1 → blocked" || bad "root dump not blocked (rc=$rc)"
rc=$(plm "12:345" PreToolUse | run "$D"); [ "$rc" -eq 0 ] && ok "get_metadata on a frame node passes" || bad "scoped read blocked (rc=$rc)"
BIG=$(head -c 25000 /dev/zero | tr '\0' 'x')
plm "12:345" PostToolUse "$BIG" | bash "$D" >"$OUT" 2>&1; grep -q "metadata-cost-warning" "$OUT" && ok "a 25 KB result gets the cost warning" || bad "big metadata result not flagged"
plm "12:345" PostToolUse "small" | bash "$D" >"$OUT" 2>&1; grep -q "metadata-cost-warning" "$OUT" && bad "small result wrongly flagged" || ok "a small result is silent"

echo "8. clear-reuse-marker.sh (markers survive resume/compact, reset on a fresh start)"
all_markers
jq -n '{hook_event_name:"SessionStart", source:"resume"}' | CLAUDE_PROJECT_DIR="$ROOT" bash "$H/clear-reuse-marker.sh" >/dev/null 2>&1
[ -f "$M/.wireframe-approved" ] && [ -f "$M/.reuse-declared" ] && ok "SessionStart(source=resume) keeps the session's approvals and decisions" || bad "resume wiped the markers"
jq -n '{hook_event_name:"SessionStart", source:"compact"}' | CLAUDE_PROJECT_DIR="$ROOT" bash "$H/clear-reuse-marker.sh" >/dev/null 2>&1
[ -f "$M/.wireframe-approved" ] && ok "SessionStart(source=compact) keeps them too" || bad "compaction wiped the markers"
jq -n '{hook_event_name:"SessionStart", source:"startup"}' | CLAUDE_PROJECT_DIR="$ROOT" bash "$H/clear-reuse-marker.sh" >/dev/null 2>&1
[ ! -f "$M/.wireframe-approved" ] && [ ! -f "$M/.reuse-declared" ] && ok "SessionStart(source=startup) resets to a clean slate" || bad "fresh start did not clear the markers"

echo "9. capture-dump.sh (the reality gate runs on the returned tree — no write-back by the model)"
rm -f "$ROOT/output/9999-1-compact.json" "$ROOT/output/9999-1-tree.json" "$ROOT/output/9999-1-verify.json" "$M/.dump-in-progress"
echo '{"level":2,"score":80,"baseCanonical":"889:45857","deltaSpec":null}' > "$M/.reuse-declared"
ROW0='["9999:1","Test Screen","FRAME",true,"VERTICAL",1,"","","",1440,0,0,1440,800,"FIXED",true,"","#f5f6f7|1",""]'
ROW1='["9999:2","Shell Bar","INSTANCE",true,"HORIZONTAL",2,"29a19a09fca9d6b091876a2945f88f33867f0487","","",1440,0,0,1440,52,"FILL",true,"9999:1","#ffffff|1",""]'
# (a) full dump in one result
PR=$(jq -n --arg t "{\"total\":2,\"rows\":[$ROW0,$ROW1]}" --arg cwd "$ROOT" '{tool_name:"mcp__figma__use_figma", tool_input:{code:"dump"}, tool_response:[{type:"text", text:$t}], cwd:$cwd, hook_event_name:"PostToolUse"}')
printf '%s' "$PR" | CLAUDE_PROJECT_DIR="$ROOT" bash "$H/capture-dump.sh" >"$OUT" 2>"$ERR"
if [ -f "$ROOT/output/9999-1-verify.json" ] && grep -q '<reality-gate node="9999:1"' "$OUT" && grep -q 'overallPass=' "$OUT"; then ok "a returned dump is saved, expanded and verified by the hook; the verdict is injected"; else bad "capture-dump full: $(head -c 200 "$OUT") $(head -c 200 "$ERR")"; fi
# (b) sliced dump: slice 0 → partial notice; slice 1 → verdict
rm -f "$ROOT/output/9999-1-compact.json" "$ROOT/output/9999-1-tree.json" "$ROOT/output/9999-1-verify.json"
PR0=$(jq -n --arg t "{\"total\":2,\"from\":0,\"rows\":[$ROW0]}" --arg cwd "$ROOT" '{tool_name:"mcp__figma__use_figma", tool_input:{code:"dump"}, tool_response:[{type:"text", text:$t}], cwd:$cwd, hook_event_name:"PostToolUse"}')
PR1=$(jq -n --arg t "{\"total\":2,\"from\":1,\"rows\":[$ROW1]}" --arg cwd "$ROOT" '{tool_name:"mcp__figma__use_figma", tool_input:{code:"dump"}, tool_response:[{type:"text", text:$t}], cwd:$cwd, hook_event_name:"PostToolUse"}')
printf '%s' "$PR0" | CLAUDE_PROJECT_DIR="$ROOT" bash "$H/capture-dump.sh" >"$OUT" 2>"$ERR"
grep -q 'status="partial"' "$OUT" && [ ! -f "$ROOT/output/9999-1-verify.json" ] && ok "slice 0 → 'partial', verifier not run yet" || bad "capture-dump slice 0: $(head -c 200 "$OUT")"
printf '%s' "$PR1" | CLAUDE_PROJECT_DIR="$ROOT" bash "$H/capture-dump.sh" >"$OUT" 2>"$ERR"
[ -f "$ROOT/output/9999-1-verify.json" ] && grep -q 'overallPass=' "$OUT" && [ "$(jq 'length' "$ROOT/output/9999-1-tree.json")" = "2" ] && ok "slice 1 completes the dump → 2 nodes verified, verdict injected" || bad "capture-dump slice 1: $(head -c 200 "$OUT")"
# (c) an ordinary use_figma result is ignored
PRX=$(jq -n --arg cwd "$ROOT" '{tool_name:"mcp__figma__use_figma", tool_input:{code:"x"}, tool_response:[{type:"text", text:"{\"rootId\":\"1:2\",\"qa\":{\"instances\":3}}"}], cwd:$cwd, hook_event_name:"PostToolUse"}')
printf '%s' "$PRX" | CLAUDE_PROJECT_DIR="$ROOT" bash "$H/capture-dump.sh" >"$OUT" 2>"$ERR"
[ ! -s "$OUT" ] && ok "a non-dump use_figma result is ignored" || bad "capture-dump reacted to a non-dump result"
rm -f "$ROOT/output/9999-1-compact.json" "$ROOT/output/9999-1-tree.json" "$ROOT/output/9999-1-verify.json" "$M/.dump-in-progress"

echo "7. executability (hooks in settings.json + guard-chain members + tools)"
miss=0
for h in $(grep -ohE '\.claude/hooks/[A-Za-z0-9_-]+\.sh' .claude/settings.json .claude/hooks/guard-chain.sh | sort -u) build/gate-status.sh build/measure-build.sh bin/sap-v2; do
  if [ ! -f "$h" ]; then echo "      missing: $h"; miss=1; elif [ ! -x "$h" ]; then echo "      not executable (fails OPEN): $h"; miss=1; fi
done
[ "$miss" -eq 0 ] && ok "every hook, chain member and tool exists and is executable" || bad "executability"

echo "$(printf '─%.0s' {1..60})"
echo "Results:  ✓ $pass pass  ·  ✗ $fail fail"
[ "$fail" -eq 0 ] && { echo "Gate machinery OK."; exit 0; } || { echo "GATE REGRESSION — $fail check(s) failed"; exit 1; }
