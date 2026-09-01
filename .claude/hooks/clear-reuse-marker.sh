#!/bin/bash
# clear-reuse-marker.sh — SessionStart + Stop hook.
#
# F-2 (2026-07-22, Performance Recovery): approvals are now BUILD-scoped, not TURN-scoped.
# Previously this wiped .wireframe-approved / .architect-approved / .scratch-approved on EVERY
# Stop, so a multi-turn build on the SAME screen had to re-present the wireframe + re-earn
# approval every turn (the re-approval treadmill, RC-3 — the exact cause of the wizard-fix stall).
# Now: on Stop we clear only the per-build PLAN artifacts (.reuse-declared, .delta-spec.json);
# the user's wireframe/architect/scratch APPROVAL survives across turns of the same build and is
# cleared only at SessionStart, or when hand-off completes (a *-verify.json was produced → the
# build is done, the next screen must be re-approved). This preserves the anti-self-echo property
# (only capture-approvals.sh, fired by a real user prompt, ever WRITES an approval) while removing
# the redundant re-approval work.
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

INPUT=$(cat 2>/dev/null)
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // empty' 2>/dev/null)

# SAP_BRIDGE_TURN2=1 means this is the resumed Turn 2 child — gates were already
# validated in Turn 1 and the user approved. Skip all marker clearing.
if [ "${SAP_BRIDGE_TURN2}" = "1" ]; then
  exit 0
fi

# 2026-09-01: the per-turn `rm -f .reuse-declared .delta-spec.json` that used to sit here ran
# on EVERY event (it was not even guarded by EVENT=Stop). A build spans turns — wireframe turn,
# approval turn, build turn — so the reuse decision recorded in turn 1 was gone by turn 3 and
# the reuse gate refused the build again (Run B, AUDIT-V2 §1.2: guard-reuse-gate ×3). Plan
# artifacts are now build-scoped exactly like approvals: cleared when a build completes
# (verify.json below) or on a fresh session start — never per turn.

# Build-complete invalidation: if the reality gate produced a verify artifact, the build is
# finished and handed off. Clear the approvals AND the plan artifacts so the NEXT screen must
# be freshly decided and approved. (A mid-build turn has NOT produced a verify.json yet.)
if [ "$EVENT" = "Stop" ] && ls "$PROJ"/output/*-verify.json >/dev/null 2>&1; then
  # Only invalidate if a verify.json is newer than the last-build marker (i.e. this build verified).
  NEWEST_VERIFY=$(ls -t "$PROJ"/output/*-verify.json 2>/dev/null | head -1)
  if [ -n "$NEWEST_VERIFY" ] && [ "$NEWEST_VERIFY" -nt "$PROJ/.claude/.wireframe-approved" ] 2>/dev/null; then
    rm -f "$PROJ/.claude/.wireframe-approved" "$PROJ/.claude/.scratch-approved" \
          "$PROJ/.claude/.architect-approved" "$PROJ/.claude/.reference-selected" \
          "$PROJ/.claude/.reuse-declared" "$PROJ/.claude/.delta-spec.json" \
          "$PROJ/.claude/.last-build-node" 2>/dev/null
  fi
fi

# Per-session (SessionStart): full reset — every gate marker cleared for a clean slate.
# NOTE: .workflow-loaded is intentionally NOT cleared here — it is owned by load-workflow-contract.sh
# (written at SessionStart). Clearing it after the loader writes it would deadlock the workflow gate.
#
# 2026-09-01: only a FRESH session is a clean slate. SessionStart also fires on `--resume`
# and after context compaction (source = "resume" / "compact") — the SAME session, whose
# approvals and recorded decisions are still valid. Wiping them there re-blocked builds
# mid-flow (AUDIT-V2 §1.2: markers gone after the compaction) and makes any resumed or
# headless multi-turn build impossible. Reset on startup/clear only.
SRC=$(echo "$INPUT" | jq -r '.source // empty' 2>/dev/null)
if [ "$EVENT" = "SessionStart" ] && { [ "$SRC" = "resume" ] || [ "$SRC" = "compact" ]; }; then
  exit 0
fi
if [ "$EVENT" = "SessionStart" ]; then
  rm -f "$PROJ/.claude/.reuse-declared" "$PROJ/.claude/.delta-spec.json" \
        "$PROJ/.claude/.wireframe-approved" "$PROJ/.claude/.scratch-approved" \
        "$PROJ/.claude/.architect-approved" "$PROJ/.claude/.reference-selected" \
        "$PROJ/.claude/.inspect-done" "$PROJ/.claude/.canonical-selected" \
        "$PROJ/.claude/.agent-turn1" "$PROJ/.claude/.last-build-node" \
        "$PROJ/.claude/.wireframe-pending" \
        "$PROJ/.claude/.screenshots-taken" "$PROJ/.claude/.builds-count" "$PROJ/.claude/.screenshot-requested" 2>/dev/null
fi
exit 0
