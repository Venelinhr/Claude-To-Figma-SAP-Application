#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# test-build.sh — Automated pipeline regression test
# Usage:  bash build/test-build.sh
#         bash build/test-build.sh --verbose
#
# Validates a set of canonical "known-good" specs against:
#   1. JSON parse
#   2. Registry gate (all components registered)
#   3. Composition rules (0 violations)
#   4. Slot-name validation (0 violations)
#   5. Token whitelist (all tokens whitelisted)
#   6. Component count within expected range (+/-10% of baseline)
#   7. validationStatus = "pass"
#
# Exit code 0 = all pass  |  1 = any failure
#
# Canonical baseline specs (updated 2026-07-09):
#   create-mcp-server-step2-spec.json     → 20 components  (Dialog + wizard)
#   create-mcp-server-step3-spec.json     → 40 components  (Dialog + table)
#   warehouse-shipments-worklist-spec.json → 65 components  (Worklist, FCL-ready)
#   sap-landscape-mgmt-activities-spec.json → 91 components (FCL + SideNav + 3 cols)
#   field-service-dispatch-console-spec.json → 64 components (complex form)
#
# Add new specs to SPECS[] to grow the regression suite.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VALIDATOR="$PROJECT_ROOT/build/validate-spec.js"
VERBOSE="${1:-}"

# ── Baseline definitions ──────────────────────────────────────────────────────
# Format: "spec_filename:expected_min_components:expected_max_components"
# Range = baseline ±10% (rounded). Set min=0 max=9999 for "any count OK".
declare -a SPECS=(
  "create-mcp-server-step2-spec.json:18:22"
  "create-mcp-server-step3-spec.json:36:44"
  "warehouse-shipments-worklist-spec.json:58:72"
  "sap-landscape-mgmt-activities-spec.json:82:100"
  "field-service-dispatch-console-spec.json:57:71"
)

# ── Counters ─────────────────────────────────────────────────────────────────
pass=0; warn=0; fail=0; total=0

# ── Color helpers (no-op if not a TTY) ───────────────────────────────────────
if [ -t 1 ]; then
  GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
else
  GREEN=''; YELLOW=''; RED=''; NC=''
fi

echo ""
echo "SAP Figma Design Agent — Pipeline Regression Test"
echo "$(date '+%Y-%m-%d %H:%M:%S')  |  $(node --version)"
echo "$(printf '─%.0s' {1..60})"

# ── Per-spec test ─────────────────────────────────────────────────────────────
for entry in "${SPECS[@]}"; do
  IFS=':' read -r spec_file min_count max_count <<< "$entry"
  spec_path="$PROJECT_ROOT/output/$spec_file"
  total=$((total + 1))

  if [ ! -f "$spec_path" ]; then
    echo -e "  ${RED}✗ MISSING${NC}  $spec_file"
    fail=$((fail + 1))
    continue
  fi

  # Run CLI validator (checks JSON, registry, composition, slots, tokens, hex, density)
  validator_output=$(node "$VALIDATOR" "$spec_path" 2>&1)
  validator_code=$?

  # Count actual components
  actual_count=$(python3 -c "
import json, sys
def count(nodes):
    n=0
    for node in (nodes if isinstance(nodes,list) else []):
        if isinstance(node,dict) and node.get('component'):
            n+=1
            for sv in (node.get('slots') or {}).values(): n+=count(sv if isinstance(sv,list) else [sv])
            n+=count(node.get('children'))
    return n
d = json.load(open('$spec_path'))
print(count(d.get('hierarchy',[])))
" 2>/dev/null || echo "0")

  # Evaluate
  count_ok=true
  if [ "$actual_count" -lt "$min_count" ] || [ "$actual_count" -gt "$max_count" ]; then
    count_ok=false
  fi

  if [ "$validator_code" -eq 0 ] && [ "$count_ok" = true ]; then
    if echo "$validator_output" | grep -q "WARNINGS"; then
      echo -e "  ${YELLOW}⚠ WARN${NC}    $spec_file  (${actual_count} components, expected ${min_count}–${max_count})"
      warn=$((warn + 1))
    else
      echo -e "  ${GREEN}✓ PASS${NC}    $spec_file  (${actual_count} components)"
      pass=$((pass + 1))
    fi
    if [ "$VERBOSE" = "--verbose" ]; then
      echo "$validator_output" | grep -E '✓|⚠' | sed 's/^/          /'
    fi
  else
    echo -e "  ${RED}✗ FAIL${NC}    $spec_file  (${actual_count} components, expected ${min_count}–${max_count})"
    fail=$((fail + 1))
    # Always show failure details
    echo "$validator_output" | grep -E '✗|FAIL' | head -5 | sed 's/^/          /'
    if [ "$count_ok" = false ]; then
      echo "          Component count ${actual_count} outside expected range ${min_count}–${max_count}"
    fi
  fi
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo "$(printf '─%.0s' {1..60})"
echo "Results:  ✓ $pass pass  ·  ⚠ $warn warnings  ·  ✗ $fail fail  (${total} specs)"

if [ "$fail" -gt 0 ]; then
  echo -e "${RED}REGRESSION DETECTED — $fail spec(s) failed${NC}"
  echo ""
  echo "To investigate: node build/validate-spec.js output/<spec-file>.json"
  echo "To update baselines: edit the SPECS[] array in build/test-build.sh"
  exit 1
fi

if [ "$warn" -gt 0 ]; then
  echo "Warnings are expected for Dialog-based specs (no ShellBar)."
fi

# ── MCP-first path lint (RULE 25) — 2026-07-11 ───────────────────────────────
# Headless check that the tag-contract linter (build/lint-mcp-frame.js) accepts
# a clean MCP-built frame and rejects a broken one. This gives the MCP-first
# path CI coverage parity with the legacy JSON path (audit P1).
echo ""
echo "$(printf '─%.0s' {1..60})"
echo "MCP-first contract lint (RULE 25)"
echo "$(printf '─%.0s' {1..60})"
mcp_fail=0
if node build/lint-mcp-frame.js test-fixtures/mcp-frame-clean.json >/dev/null 2>&1; then
  echo "  ✓ clean fixture PASSES lint"
else
  echo -e "  ${RED}✗ clean fixture unexpectedly FAILED lint${NC}"; mcp_fail=1
fi
if node build/lint-mcp-frame.js test-fixtures/mcp-frame-broken.json >/dev/null 2>&1; then
  echo -e "  ${RED}✗ broken fixture unexpectedly PASSED lint (linter not catching errors)${NC}"; mcp_fail=1
else
  echo "  ✓ broken fixture correctly FAILS lint (near-miss hex, bad token/role/icon caught)"
fi
if [ "$mcp_fail" -gt 0 ]; then
  echo -e "${RED}MCP-path lint regression — build/lint-mcp-frame.js not behaving${NC}"
  exit 1
fi

# ── Manifest sync check — 2026-07-14 ─────────────────────────────────────────
# SAP_BUILD_MANIFEST.md is a derived cache of the registry + token JSONs.
# This guards against drift: a stale component key would break the build agent's
# importComponentSetByKeyAsync at build time.
echo ""
echo "$(printf '─%.0s' {1..60})"
echo "Build manifest sync (SAP_BUILD_MANIFEST.md vs source JSONs)"
echo "$(printf '─%.0s' {1..60})"
if node build/check-manifest-sync.js; then
  echo "  ✓ manifest in sync"
else
  echo -e "${RED}Manifest drift — regenerate SAP_BUILD_MANIFEST.md §3 from registry${NC}"
  exit 1
fi

echo ""
echo "$(printf '─%.0s' {1..60})"
echo "Reuse integrity (canonical-index ↔ reuse-outcomes-ledger — RULE 31)"
echo "$(printf '─%.0s' {1..60})"
if node build/check-reuse-integrity.js; then
  echo "  ✓ reuse library consistent"
else
  echo -e "${RED}Reuse integrity drift — a confirmed build may be missing from canonical-index.json${NC}"
  exit 1
fi

echo ""
echo "$(printf '─%.0s' {1..60})"
echo "Invariant gate (verify-invariants.js — Gates 6/7/8, the reality gate)"
echo "$(printf '─%.0s' {1..60})"
# A known-good SAP frame dump MUST pass; a known-bad native-frame dump MUST fail (exit 2).
# This proves the post-build reality gate is wired and discriminating.
if node build/verify-invariants.js test-fixtures/invariants/good-sap-frame.json --pre-bind >/dev/null 2>&1; then
  echo "  ✓ good SAP frame passes invariants"
else
  echo -e "${RED}verify-invariants.js rejected a known-good SAP frame — the gate is mis-calibrated${NC}"
  exit 1
fi
if node build/verify-invariants.js test-fixtures/invariants/bad-native-frame.json --pre-bind >/dev/null 2>&1; then
  echo -e "${RED}verify-invariants.js PASSED a known-bad native-frame wireframe — the gate is not enforcing${NC}"
  exit 1
else
  echo "  ✓ bad native-frame wireframe correctly FAILS the invariant gate"
fi
if node build/verify-invariants.js test-fixtures/invariants/instance-rawhex-override.json --pre-bind >/dev/null 2>&1; then
  echo -e "${RED}verify-invariants.js PASSED an instance with an unbound raw-hex override — INV 2 instance hole is open${NC}"
  exit 1
else
  echo "  ✓ raw-hex override on a SAP instance correctly FAILS (INV 2 instance-override hole closed)"
fi
# INV 5 (sizing/overflow) — a correctly full-width DPH passes; a narrower-than-parent DPH
# and a child overflowing a clipping parent both correctly FAIL. Proves the
# layoutSizingHorizontal='FILL'-no-op bug class (DPH hidden-content report) is caught.
if node build/verify-invariants.js test-fixtures/invariants/dph-width-ok.json --pre-bind >/dev/null 2>&1; then
  echo "  ✓ full-width DynamicPageHeader passes INV 5"
else
  echo -e "${RED}verify-invariants.js rejected a correctly full-width DynamicPageHeader — INV 5 is mis-calibrated${NC}"
  exit 1
fi
if node build/verify-invariants.js test-fixtures/invariants/dph-width-mismatch.json --pre-bind >/dev/null 2>&1; then
  echo -e "${RED}verify-invariants.js PASSED a DynamicPageHeader narrower than its parent — INV 5 header-width hole is open${NC}"
  exit 1
else
  echo "  ✓ DynamicPageHeader narrower than its parent correctly FAILS (INV 5 header-width check)"
fi
if node build/verify-invariants.js test-fixtures/invariants/child-overflow-clipped.json --pre-bind >/dev/null 2>&1; then
  echo -e "${RED}verify-invariants.js PASSED a child overflowing a clipping parent — INV 5 overflow hole is open${NC}"
  exit 1
else
  echo "  ✓ child overflowing a clipsContent parent correctly FAILS (INV 5 overflow check)"
fi
# INV 5c (forced-equal-width siblings, full audit 2026-09-12) — the documented 6-column
# filter-row defect (1 toggle + 5 dropdowns, all forced equal width) had zero mechanical
# check before this. Scoped to 3+ siblings of 2+ DIFFERENT component types at the same
# width, so repeated identical cells/cards never false-positive.
if node build/verify-invariants.js test-fixtures/invariants/forced-equal-width-filter-row.json --pre-bind >/dev/null 2>&1; then
  echo -e "${RED}verify-invariants.js PASSED a 6-column filter row (toggle+5 dropdowns) forced to equal width — INV 5c hole is open${NC}"
  exit 1
else
  echo "  ✓ forced-equal-width filter row (mixed component types) correctly FAILS (INV 5c)"
fi
if node build/verify-invariants.js test-fixtures/invariants/equal-width-same-component-pass.json --pre-bind >/dev/null 2>&1; then
  echo "  ✓ repeated same-component cells at equal width correctly PASS (INV 5c does not false-positive on legitimate repeats)"
else
  echo -e "${RED}verify-invariants.js REJECTED repeated identical table cells at equal width — INV 5c is over-triggering${NC}"
  exit 1
fi
if node build/verify-invariants.js test-fixtures/invariants/two-different-components-pass.json --pre-bind >/dev/null 2>&1; then
  echo "  ✓ 2 different components sharing a width (below the 3-sibling threshold) correctly PASS"
else
  echo -e "${RED}verify-invariants.js REJECTED 2 siblings at the same width — INV 5c threshold is mis-set${NC}"
  exit 1
fi

# INV 9 (variant property values, audit finding C, 2026-09-14) — verify-invariants.js only ever
# checked that an INSTANCE has a non-null mainComponentKey, never whether its variant values (e.g.
# Button.Type, ObjectStatus.Semantic) are real kit values. No-op unless the dump carries the new
# optional componentName + componentProperties fields (backward compatible with every existing dump).
if node build/verify-invariants.js test-fixtures/invariants/wrong-variant-value.json --pre-bind >/dev/null 2>&1; then
  echo -e "${RED}verify-invariants.js PASSED a Button with Type=Emphasized (not a real kit value) — INV 9 hole is open${NC}"
  exit 1
else
  echo "  ✓ Button instance with an invalid variant value (Type=Emphasized) correctly FAILS (INV 9)"
fi
if node build/verify-invariants.js test-fixtures/invariants/correct-variant-value.json --pre-bind >/dev/null 2>&1; then
  echo "  ✓ Button instance with a valid variant value (Type=Primary) correctly PASSES (INV 9)"
else
  echo -e "${RED}verify-invariants.js REJECTED a Button with a REAL kit value (Type=Primary) — INV 9 is over-triggering${NC}"
  exit 1
fi
if node build/verify-invariants.js test-fixtures/invariants/no-componentname-fixture-still-passes.json --pre-bind >/dev/null 2>&1; then
  echo "  ✓ an INSTANCE with no componentName/componentProperties (older-style dump) correctly PASSES — INV 9 is a true no-op without the new fields"
else
  echo -e "${RED}verify-invariants.js REJECTED a dump with no componentName field — INV 9 broke backward compatibility${NC}"
  exit 1
fi

# Audit finding D (2026-09-14) — the pre-build guard-figma-code.sh Block 3 heuristic (createFrame
# count vs instance/clone count) is confirmed exploitable by cloning the same small component N
# times to offset N unnamed hand-drawn frames (see guard-figma-code.sh's own documented-limitation
# comment on Block 3 — deliberately NOT fixed there, since the only static fix tried also breaks
# the documented/encouraged "clone one real table row N times" pattern). This asserts the actual
# safety net: the POST-build reality gate still catches the exact same bypass, because it inspects
# real built node names, not code-level call counts. If this ever starts passing, the defense-in-
# depth claim in guard-figma-code.sh's comment is false and needs re-investigating.
if node build/verify-invariants.js test-fixtures/invariants/clone-count-bypass-caught-postbuild.json --pre-bind >/dev/null 2>&1; then
  echo -e "${RED}verify-invariants.js PASSED the clone-count-bypass fixture — the documented post-build safety net for guard-figma-code.sh's Block 3 gap is broken${NC}"
  exit 1
else
  echo "  ✓ a build that bypasses guard-figma-code.sh's clone-count heuristic (D) still FAILS post-build (INV 1) — the safety net holds"
fi

# ── Provenance-aware verification (AUDIT-V2 §8.4 P11) ──────────────────────────────────
# The default build path is CLONE-FIRST (RULE 28), but INV 1's allowlist and INV 3's
# [typo:role] convention were written for from-scratch builds. Measured on the live
# 204-node build: 3 genuine defects and 130 FALSE flags (78 FAIL_FAKE_COMPONENT +
# 52 FAIL_TYPO_TAG), and the PM-confirmed canonical FAILED ITS OWN GATE. These checks
# prove the reconciliation: inherited nodes pass INV 1/INV 3 by provenance, the delta
# stays strict, and INV 2 / INV 5 are NEVER weakened (they found all 3 real defects).
CANON=test-fixtures/invariants/clone-canonical-source.json
if node build/verify-invariants.js test-fixtures/invariants/clone-inherited-pass.json --pre-bind --canonical 6:1 --canonical-dump "$CANON" >/dev/null 2>&1; then
  echo "  ✓ clone-first build: nodes inherited unchanged from a confirmed canonical PASS INV 1/INV 3 by provenance"
else
  echo -e "${RED}verify-invariants.js rejected a clone-first build whose nodes are verbatim the confirmed canonical's — P11 false-flag regression${NC}"
  exit 1
fi
if node build/verify-invariants.js test-fixtures/invariants/clone-delta-bad-name.json --pre-bind --canonical 6:1 --canonical-dump "$CANON" >/dev/null 2>&1; then
  echo -e "${RED}verify-invariants.js PASSED a clone-first build whose NEWLY ADDED nodes are a fake component and a non-SAP font — the delta is not strict${NC}"
  exit 1
else
  echo "  ✓ clone-first build: NEWLY ADDED/renamed nodes are still verified at FULL strictness (delta is strict)"
fi
# The load-bearing one: provenance must never leak into INV 2 / INV 5. All three genuine
# defects in the live build were on nodes inherited from the canonical.
if node build/verify-invariants.js test-fixtures/invariants/clone-inherited-inv2-inv5-still-fire.json --canonical 6:1 --canonical-dump "$CANON" >/dev/null 2>&1; then
  echo -e "${RED}provenance SUPPRESSED INV 2/INV 5 on inherited nodes — the gate is now blind to the stray-stroke and overflow defects it actually found${NC}"
  exit 1
else
  echo "  ✓ INV 2 (raw hex) + INV 5 (overflow) still FIRE on inherited nodes — provenance never weakens them"
fi
if node build/verify-invariants.js test-fixtures/invariants/clone-inherited-header-width.json --pre-bind --canonical 6:1 --canonical-dump "$CANON" >/dev/null 2>&1; then
  echo -e "${RED}provenance SUPPRESSED INV 5b header-width on an inherited node — the FILL-no-op bug class is no longer caught${NC}"
  exit 1
else
  echo "  ✓ INV 5b (page-header width) still FIRES on an inherited node"
fi
# INV 3 relaxation: font '72' at a role size is real SAP-styled text, tag or no tag.
if node build/verify-invariants.js test-fixtures/invariants/typo-font72-role-size.json --pre-bind >/dev/null 2>&1; then
  echo "  ✓ untagged TEXT in SAP font '72' at a role size passes INV 3 (no [typo:role] tag needed)"
else
  echo -e "${RED}verify-invariants.js rejected untagged text already styled in SAP font '72' at a role size — INV 3 relaxation missing${NC}"
  exit 1
fi
if node build/verify-invariants.js test-fixtures/invariants/typo-font72-bad-size.json --pre-bind >/dev/null 2>&1; then
  echo -e "${RED}verify-invariants.js PASSED untagged text at a non-role size / non-SAP font — the INV 3 relaxation is too wide${NC}"
  exit 1
else
  echo "  ✓ untagged TEXT at a NON-role size or in a non-SAP font still correctly FAILS INV 3 (relaxation is narrow)"
fi
# The pipeline's own gold standard must pass its own reality gate — the P11 headline defect.
if node build/verify-invariants.js "$CANON" --pre-bind >/dev/null 2>&1; then
  echo "  ✓ the confirmed canonical passes its OWN reality gate (P11 headline defect closed)"
else
  echo -e "${RED}the reality gate REJECTS the pipeline's own confirmed canonical — AUDIT-V2 P11 has regressed${NC}"
  exit 1
fi

echo ""
echo "$(printf '─%.0s' {1..60})"
echo "Instance-ratio detector (silent native-frame fallback)"
echo "$(printf '─%.0s' {1..60})"
# WIRED 2026-08-28. lint-instance-ratio.js was an ORPHAN — no hook, no test — despite
# targeting the single most damaging failure in this project's history: an SAP import
# fails, the build silently falls back to createFrame(), and the result "looks nothing
# like SAP". docs/SAP-INVARIANT-ARCHITECTURE.md flagged it as unwired. Now it is tested.
if node build/lint-instance-ratio.js test-fixtures/instance-ratio-healthy.json >/dev/null 2>&1; then
  echo "  ✓ healthy SAP screen correctly PASSES the instance-ratio check"
else
  echo -e "${RED}lint-instance-ratio.js rejected a known-good SAP frame — detector mis-calibrated${NC}"
  exit 1
fi
if node build/lint-instance-ratio.js test-fixtures/instance-ratio-fallback.json >/dev/null 2>&1; then
  echo -e "${RED}lint-instance-ratio.js PASSED a native-frame fallback screen — detector not enforcing${NC}"
  exit 1
else
  echo "  ✓ native-frame fallback correctly FAILS (root cause #3 now detected)"
fi

echo ""
echo "$(printf '─%.0s' {1..60})"
echo "Hook executability (every registered hook must actually run)"
echo "$(printf '─%.0s' {1..60})"
# ADDED 2026-08-28. A hook registered in settings.json but lacking +x does not fail
# loudly — the runtime reports "Permission denied" as a NON-BLOCKING status and
# carries on, so a gate silently fails OPEN. mark-build.sh had been in this state
# since July; nothing noticed because a duplicate global writer covered for it.
# guard-marker-write.sh landed the same way and left the marker guard inert.
hook_fail=0
for cfg in .claude/settings.json; do
  [ -f "$cfg" ] || continue
  for h in $(grep -oE '\.claude/hooks/[A-Za-z0-9_-]+\.sh' "$cfg" | sort -u); do
    if [ ! -f "$h" ]; then
      echo -e "${RED}registered hook missing on disk: $h${NC}"; hook_fail=1
    elif [ ! -x "$h" ]; then
      echo -e "${RED}registered hook not executable (will fail OPEN): $h — run: chmod +x $h${NC}"; hook_fail=1
    fi
  done
done
if [ "$hook_fail" -ne 0 ]; then exit 1; fi
echo "  ✓ every hook registered in settings.json exists and is executable"

echo ""
echo "$(printf '─%.0s' {1..60})"
echo "Wireframe-pending gate (F-11 — approval requires a demand, not just a word)"
echo "$(printf '─%.0s' {1..60})"
# ADDED 2026-09-01. Live failure: an ordinary reply ("yeah go ahead") satisfied
# capture-approvals.sh's WEAK+CONTEXT regex and wrote .wireframe-approved even
# though no wireframe had been shown this turn — the build then skipped straight
# past Gate 3 with no error. Fix: enforce-wireframe-first.sh stamps
# .wireframe-pending the instant it demands a wireframe; capture-approvals.sh may
# only convert an approval phrase into .wireframe-approved while that stamp exists.
wf_fail=0
rm -f "$PROJECT_ROOT/.claude/.wireframe-pending" "$PROJECT_ROOT/.claude/.wireframe-approved" 2>/dev/null

# Case 1: approval-shaped words with NO prior demand this turn — must NOT approve.
echo '{"prompt":"yeah go ahead and build it"}' | bash "$PROJECT_ROOT/.claude/hooks/capture-approvals.sh" >/dev/null 2>&1
if [ -f "$PROJECT_ROOT/.claude/.wireframe-approved" ]; then
  echo -e "  ${RED}✗ approval was granted with no .wireframe-pending stamp — F-11 regression${NC}"; wf_fail=1
else
  echo "  ✓ approval-shaped words alone (no demand this turn) correctly do NOT approve"
fi
rm -f "$PROJECT_ROOT/.claude/.wireframe-approved" 2>/dev/null

# Case 2: demand fires first (stamps pending), then approval — must succeed and clear pending.
echo '{"prompt":"build me a SAP screen for purchase orders"}' | bash "$PROJECT_ROOT/.claude/hooks/enforce-wireframe-first.sh" >/dev/null 2>&1
if [ ! -f "$PROJECT_ROOT/.claude/.wireframe-pending" ]; then
  echo -e "  ${RED}✗ enforce-wireframe-first.sh did not stamp .wireframe-pending on a build request${NC}"; wf_fail=1
else
  echo "  ✓ a build request correctly stamps .wireframe-pending"
fi
echo '{"prompt":"yeah go ahead and build it"}' | bash "$PROJECT_ROOT/.claude/hooks/capture-approvals.sh" >/dev/null 2>&1
if [ ! -f "$PROJECT_ROOT/.claude/.wireframe-approved" ]; then
  echo -e "  ${RED}✗ approval was refused even though .wireframe-pending was present${NC}"; wf_fail=1
elif [ -f "$PROJECT_ROOT/.claude/.wireframe-pending" ]; then
  echo -e "  ${RED}✗ .wireframe-pending was not cleared after conversion to .wireframe-approved${NC}"; wf_fail=1
else
  echo "  ✓ approval with a prior demand correctly succeeds and clears the pending stamp"
fi
rm -f "$PROJECT_ROOT/.claude/.wireframe-pending" "$PROJECT_ROOT/.claude/.wireframe-approved" 2>/dev/null

if [ "$wf_fail" -ne 0 ]; then exit 1; fi

echo ""
echo "$(printf '─%.0s' {1..60})"
echo "Gate machinery (build/test-gates.sh — 28 synthetic hook payloads)"
echo "$(printf '─%.0s' {1..60})"
# ADDED 2026-09-01 (AUDIT-V2 Part C). Runs guard-chain / gate-status / api-gotchas /
# figma-code / screenshot budget / scoped metadata against synthetic payloads. Wired here
# so it can never become an orphan like lint-instance-ratio.js once was.
GATES_LOG=$(mktemp)
if bash build/test-gates.sh >"$GATES_LOG" 2>&1; then
  grep -E '^Results' "$GATES_LOG" | sed 's/^/  ✓ /'
else
  cat "$GATES_LOG"; rm -f "$GATES_LOG"
  echo -e "${RED}Gate machinery regression — see build/test-gates.sh output above${NC}"
  exit 1
fi
rm -f "$GATES_LOG"
# Regression: a node with an EMPTY fills array and an unbound raw-hex STROKE (the exact
# shape of every table-row divider / card border in this system) must still fail INV 2.
# A fills-only checker would miss this. See test-fixtures/invariants/stroke-only-rawhex.json.
# NOTE: no --pre-bind here — this fixture is a non-instance FRAME, and --pre-bind
# intentionally exempts non-instance nodes (they're expected unbound mid-build; Bind
# resolves them). The fixture proves Gate 6's real post-build check, not the pre-bind path.
if node build/verify-invariants.js test-fixtures/invariants/stroke-only-rawhex.json >/dev/null 2>&1; then
  echo -e "${RED}verify-invariants.js PASSED a strokes-only unbound raw-hex node — the fills-only blind spot is open${NC}"
  exit 1
else
  echo "  ✓ strokes-only raw-hex divider/border correctly FAILS (INV 2 fills-only blind spot closed)"
fi
if node build/verify-invariants.js test-fixtures/invariants/stroke-only-bound-clean.json >/dev/null 2>&1; then
  echo "  ✓ strokes-only BOUND divider/border correctly PASSES (no false positive on legit stroke-only nodes)"
else
  echo -e "${RED}verify-invariants.js rejected a strokes-only node with a properly bound stroke — false positive${NC}"
  exit 1
fi

echo ""
echo "All specs within baseline. Pipeline is clean."
exit 0
