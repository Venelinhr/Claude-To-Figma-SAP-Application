#!/bin/bash
# load-workflow-contract.sh — SessionStart hook.
#
# Injects the mandatory directive to read and OBEY WORKFLOW-CONTRACT.md before any
# Figma SAP task. This is the single-source-of-truth loader: it ensures every session
# starts knowing the contract governs all builds, improvement suggestions, edits, and
# variants — not just fresh screens.
#
# Stdout → context, exit 0, never blocks.

PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
CONTRACT="$PROJ/WORKFLOW-CONTRACT.md"

[ -f "$CONTRACT" ] || exit 0

# Write the .workflow-loaded marker HERE (SessionStart), proving the contract directive was injected
# into context this session. The AGENT cannot write this marker (the marker-write PreToolUse guard
# blocks it) — so guard-workflow-contract.sh can only be satisfied by this loader actually running.
# If hooks are dormant, the marker is absent and the use_figma gate blocks + tells the agent to
# self-load the contract. This removes the old self-echo bypass.
mkdir -p "$PROJ/.claude" 2>/dev/null
printf 'loaded %s\n' "$(date -u 2>/dev/null || echo session)" > "$PROJ/.claude/.workflow-loaded" 2>/dev/null

cat <<'EOF'
<workflow-contract-directive>
⛔ BEFORE ANY Figma SAP task — new screen, improvement suggestion, next step, edit, or
variant — you MUST read and OBEY WORKFLOW-CONTRACT.md (project root). It is the single
mandatory source of truth: 31 rules + 10-step flow + hard rules + skills + lessons.

On EVERY such request: (1) load the contract, (2) analyze the source screen's SAP
tokens/instances/states first, (3) follow the 10-step flow + 31 rules, (4) use only real
SAP components/tokens/text-styles (never native look-alikes, raw hex, or raw 72 font),
(5) preserve menu/component states, (6) hand off with a validated node URL + Bind reminder.

This applies to follow-up edits and "improve this screen" requests too. To repair an
existing non-compliant screen, run /sap-fix <nodeId>.
</workflow-contract-directive>
EOF

# Visible proof that THIS project's hooks are alive (AUDIT-V2 P0). If this line is absent at
# session start, the session was launched outside the project and every gate is OFF.
N=$(grep -c '"command"' "$PROJ/.claude/settings.json" 2>/dev/null || echo '?')
echo "✅ SAP pipeline v2 — project hooks ACTIVE in $PROJ ($N hook commands). Before any build code: bash build/gate-status.sh"

exit 0
