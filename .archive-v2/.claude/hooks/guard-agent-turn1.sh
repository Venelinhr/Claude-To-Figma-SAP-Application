#!/bin/bash
# guard-agent-turn1.sh — PreToolUse hook on mcp__figma__use_figma. BLOCKING.
#
# Closes the substring-gate leak found by adversarial verification (2026-07-20): the
# wireframe gate only greps tool_input.code for a fixed set of build tokens
# (createInstance|createFrame|importComponentSetByKeyAsync|.clone(|appendChild|insertChild),
# so a use_figma call that mutates the canvas via createNodeFromSvg / createText / node.remove /
# setProperties on an existing node PASSES the wireframe gate (exit 0) and could BUILD before the
# user approves. This hook removes any code-inspection guesswork for the SAP Agent v2 flow:
#
# During TURN 1 of the two-turn Agent bridge flow (read-only wireframe proposal), the bridge writes
# the sentinel .claude/.agent-turn1 before sending turn 1 and DELETES it before sending turn 2
# (the approved build turn). While that sentinel exists, use_figma is forbidden ENTIRELY — turn 1
# must only call the read tools (get_metadata / get_design_context / get_screenshot /
# get_variable_defs), which are separate MCP tools this hook does not match.
#
# Registered BEFORE guard-wireframe-gate.sh under the mcp__figma__use_figma matcher.
# Exit 2 blocks; stderr becomes the agent's feedback. Read-only turns / normal (non-Agent) builds
# have no sentinel and pass through untouched.
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
echo "$TOOL" | grep -qi "use_figma" || exit 0

PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

if [ -f "$PROJ/.claude/.agent-turn1" ]; then
  echo "⛔ SAP AGENT v2 — TURN 1 is READ-ONLY. use_figma is forbidden until the wireframe is approved." >&2
  echo "" >&2
  echo "This turn you may ONLY call read tools: get_metadata, get_design_context, get_screenshot, get_variable_defs." >&2
  echo "Present the ASCII wireframe + L1–L5 layer plan as TEXT and end with the line AGENT_WIREFRAME_READY." >&2
  echo "The build happens on turn 2, AFTER the user approves in the plugin (the approval writes .wireframe-approved)." >&2
  exit 2
fi

exit 0
