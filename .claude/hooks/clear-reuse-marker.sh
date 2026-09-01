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

# Per-turn (Stop): clear only the per-build PLAN artifacts. These are regenerated per build
# and must not carry over. Approvals are NOT cleared here (see F-2 above).
rm -f "$PROJ/.claude/.reuse-declared" "$PROJ/.claude/.delta-spec.json" 2>/dev/null

# Build-complete invalidation: if the reality gate produced a verify artifact, the build is
# finished and handed off. Clear the approvals so the NEXT screen must be freshly approved.
# (A mid-build turn has NOT produced a verify.json yet, so approvals survive.)
if [ "$EVENT" = "Stop" ] && ls "$PROJ"/output/*-verify.json >/dev/null 2>&1; then
  # Only invalidate if a verify.json is newer than the last-build marker (i.e. this build verified).
  NEWEST_VERIFY=$(ls -t "$PROJ"/output/*-verify.json 2>/dev/null | head -1)
  if [ -n "$NEWEST_VERIFY" ] && [ "$NEWEST_VERIFY" -nt "$PROJ/.claude/.wireframe-approved" ] 2>/dev/null; then
    rm -f "$PROJ/.claude/.wireframe-approved" "$PROJ/.claude/.scratch-approved" \
          "$PROJ/.claude/.architect-approved" "$PROJ/.claude/.reference-selected" \
          "$PROJ/.claude/.last-build-node" 2>/dev/null
  fi
fi

# Per-session (SessionStart): full reset — every gate marker cleared for a clean slate.
# NOTE: .workflow-loaded is intentionally NOT cleared here — it is owned by load-workflow-contract.sh
# (written at SessionStart). Clearing it after the loader writes it would deadlock the workflow gate.
if [ "$EVENT" = "SessionStart" ]; then
  rm -f "$PROJ/.claude/.reuse-declared" "$PROJ/.claude/.delta-spec.json" \
        "$PROJ/.claude/.wireframe-approved" "$PROJ/.claude/.scratch-approved" \
        "$PROJ/.claude/.architect-approved" "$PROJ/.claude/.reference-selected" \
        "$PROJ/.claude/.inspect-done" "$PROJ/.claude/.canonical-selected" \
        "$PROJ/.claude/.agent-turn1" "$PROJ/.claude/.last-build-node" \
        "$PROJ/.claude/.wireframe-pending" 2>/dev/null
fi
exit 0
