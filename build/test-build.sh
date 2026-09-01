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

echo ""
echo "All specs within baseline. Pipeline is clean."
exit 0
