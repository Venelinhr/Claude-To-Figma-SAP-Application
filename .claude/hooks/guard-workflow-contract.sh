#!/bin/bash
# guard-workflow-contract.sh — PreToolUse hook on mcp__figma__use_figma. BLOCKING (advisory-once).
#
# Ensures the WORKFLOW-CONTRACT is acknowledged before ANY use_figma call — build, edit,
# improvement, or variant. This closes the drift gap where follow-up "improve this screen"
# edits skipped the rules (raw 72 fonts, native dividers, placeholder tabs, native components).
#
# Enforcement is "once per session": the FIRST use_figma call of a session is blocked unless the
# .workflow-loaded marker exists. The marker is written ONLY by load-workflow-contract.sh at
# SessionStart (proving the contract directive was injected into context) or by capture-approvals.sh
# from the user's own acknowledgment. The AGENT CANNOT write it — the marker-write PreToolUse guard
# blocks any attempt, so this gate cannot be self-satisfied. If the marker is missing, the session
# did not bootstrap the contract → block and tell the agent to self-load it (read the file), since
# it cannot forge the marker.
#
# Registered under mcp__figma__use_figma AFTER guard-agent-turn1 and BEFORE guard-wireframe-gate.
# Exit 2 blocks; stderr is the agent's feedback. Exit 0 passes.
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
echo "$TOOL" | grep -qi "use_figma" || exit 0

PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
MARKER="$PROJ/.claude/.workflow-loaded"

# Scoped to BUILD calls (2026-09-01). Read-only use_figma inspection gains nothing from a
# refusal to "read the contract first" — every other gate lets reads through; this one now too.
CODE=$(echo "$INPUT" | jq -r '.tool_input.code // ""')
source "$(dirname "$0")/lib-build-detect.sh"
is_build "$CODE" || exit 0

if [ ! -f "$MARKER" ]; then
  echo "⛔ WORKFLOW CONTRACT NOT BOOTSTRAPPED for this session." >&2
  echo "" >&2
  echo "The SessionStart loader did not run (hooks may be dormant — the exact failure this system guards against)." >&2
  echo "You cannot forge the marker (writes to it are blocked). Instead, SELF-ENFORCE now:" >&2
  echo "  1. Read WORKFLOW-CONTRACT.md (project root) — 31 rules + 10-step flow + hard rules + skills." >&2
  echo "  2. Analyze the source screen's SAP tokens / instances / states first." >&2
  echo "  3. Confirm: real SAP instances · [typo:role] text (no raw 72) · [sapToken] fills (no raw hex) ·" >&2
  echo "     no Divider frames on list rows (Success Border) · Compact · correct nav labels · L1–L5 naming." >&2
  echo "" >&2
  echo "Then present the ASCII wireframe and wait for user approval before building. The wireframe gate" >&2
  echo "and the plugin bind reality-gate remain in force regardless. (Repair existing screens: /sap-fix <nodeId>.)" >&2
  exit 2
fi

exit 0
