#!/bin/bash
# guard-private-screens.sh — PreToolUse(Bash) hook (L2 durable private-screen guardrail).
#
# Canonical screenshot PNGs are PRIVATE BY DEFAULT via .gitignore (private-refs +
# an explicit public allowlist). This hook is the second layer: if a git command
# would `add`/`stage`/`commit` a canonical PNG that .gitignore has NOT allowlisted,
# warn before it runs. The leak happened twice from a forced/blanket add slipping a
# private screen past the ignore rules (git add -f, git add docs/..., git add -A of an
# un-ignored path). Advisory only — stdout → context, exit 0 never blocks.
#
# Bash tool input arrives as JSON on stdin (.tool_input.command).
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only care about git commands that could stage files.
echo "$CMD" | grep -qE '\bgit\b.*(add|commit|stash)' || exit 0

PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$PROJ" 2>/dev/null || exit 0

# A force-add (-f/--force) bypasses .gitignore entirely — highest risk.
FORCED=false
echo "$CMD" | grep -qE '\bgit +add\b.*(-f|--force)' && FORCED=true

# Find canonical PNGs that are NOT allowlisted (i.e. currently ignored = private).
PRIVATE=""
for f in docs/canonical-screens/*.png docs/canonical-screens/_private-refs/*.png; do
  [ -e "$f" ] || continue
  if git check-ignore -q "$f" 2>/dev/null; then
    PRIVATE="$PRIVATE  - $f\n"
  fi
done
[ -n "$PRIVATE" ] || exit 0

if [ "$FORCED" = true ]; then
  echo "<private-screen-guard severity=\"high\">This is a \`git add --force\`, which BYPASSES .gitignore. The following canonical screenshots are PRIVATE (not on the public allowlist) and must NOT be committed to GitHub:
$(printf "$PRIVATE")
Do NOT force-add these. If the user has explicitly approved publishing one, add an \`!docs/canonical-screens/<file>.png\` allowlist line to .gitignore instead of force-adding. Structural ground truth ships as .md + the .fig — raw private PNGs stay local.</private-screen-guard>"
else
  echo "<private-screen-guard>Reminder: these canonical screenshots are PRIVATE (gitignored, not allowlisted) and must stay out of GitHub:
$(printf "$PRIVATE")
A normal \`git add\`/\`commit\` will skip them (they are ignored) — good. Only publish one by adding an explicit \`!docs/canonical-screens/<file>.png\` line to .gitignore AND after user confirmation. Never \`git add -f\` a private screen.</private-screen-guard>"
fi

exit 0
