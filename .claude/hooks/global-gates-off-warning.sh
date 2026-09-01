#!/bin/bash
# global-gates-off-warning.sh — for GLOBAL registration (~/.claude/settings.json, UserPromptSubmit).
#
# Why (AUDIT-V2 §1.1, P0): a SAP build requested from a session that is NOT inside a SAP
# pipeline project runs with zero gates — no approval, no reuse check, no native-frame
# check, no reality gate — and nothing says so. This hook says so, loudly, before any work.
#
# It lives in the project so it is versioned, but it only helps when registered globally
# (a project hook cannot fire outside its project). Register once:
#
#   jq '.hooks.UserPromptSubmit += [{"hooks":[{"type":"command","command":"\"/Users/C5408360/Downloads/sap-pipeline-v2/.claude/hooks/global-gates-off-warning.sh\""}]}]' \
#      ~/.claude/settings.json > /tmp/s.json && mv /tmp/s.json ~/.claude/settings.json
#
# Stdout → context. Never blocks (exit 0).
INPUT=$(cat)
PROMPT=$(printf '%s' "$INPUT" | jq -r '.prompt // empty' 2>/dev/null | tr '[:upper:]' '[:lower:]')
[ -n "$PROMPT" ] || exit 0
echo "$PROMPT" | grep -qiE "sap (screen|fiori|figma|dialog|list report|object page)|fiori|/sap-screen|figma.*(build|screen|design|mockup)|build.*(screen|figma|mockup)" || exit 0

CWD=$(printf '%s' "$INPUT" | jq -r '.cwd // empty' 2>/dev/null); [ -n "$CWD" ] || CWD="$PWD"
p="$(cd "$CWD" 2>/dev/null && pwd)"
while [ -n "$p" ] && [ "$p" != "/" ]; do
  [ -f "$p/SAP_BUILD_MANIFEST.md" ] && [ -f "$p/.claude/settings.json" ] && exit 0   # inside a project → its own hooks run
  p="$(dirname "$p")"
done

cat <<EOF
<sap-gates-off>
⛔ This session is NOT inside a SAP pipeline project (cwd: $CWD). NO SAP gate is active:
no wireframe approval, no reuse/canonical check, no native-frame check, no reality gate, no CLAUDE.md rules.
Do NOT build anything. Tell the user to relaunch from the project folder — in the terminal, not here:
  "/Users/C5408360/Downloads/sap-pipeline-v2/bin/sap-v2"
</sap-gates-off>
EOF
exit 0
