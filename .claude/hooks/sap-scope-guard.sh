#!/bin/bash
# sap-scope-guard.sh — cwd-scoped dispatcher for the SAP use_figma guard chain.
#
# WHY THIS EXISTS (root cause RC-1, audit 2026-07-21):
# The SAP guards were registered ONLY in <project>/.claude/settings.json. Sessions launched
# from ~ (home is also a registered project) bind to ~/.claude/settings.json, which had ZERO
# use_figma guards — so every guard was silently dormant and a broken build shipped unblocked.
#
# FIX: the guard chain is now ALSO registered in ~/.claude/settings.json (user scope) so it is
# active regardless of launch dir. But the raw SAP guards block ANY use_figma build (they do not
# self-scope). To avoid breaking Figma work in OTHER projects, every globally-registered SAP guard
# is invoked THROUGH this dispatcher, which runs the real guard ONLY when the active session cwd
# is inside the SAP project. Outside the SAP project → exit 0 (no-op, other projects unaffected).
#
# Usage in settings.json:
#   "command": "/ABS/PATH/.claude/hooks/sap-scope-guard.sh guard-wireframe-gate.sh"
# The single arg is the real guard script name (in the same hooks dir).
#
# stdin (the PreToolUse payload) is captured and forwarded verbatim to the real guard.

# PROJECT-RELATIVE (2026-08-28). This used to pin SAP_PROJECT to one hardcoded
# absolute path, so ANY copy, worktree or rename of the project ran with every
# gate silently dormant — precisely the RC-1 failure this dispatcher exists to
# prevent, reintroduced as a constant.
#
# It now resolves the project from the SESSION's cwd, not from where this script
# happens to live, and then runs THAT project's own guard scripts. One global
# registration therefore serves the original folder, this worktree, and any
# future copy, with each getting its own hooks. Non-SAP projects still no-op.
GUARD="$1"

INPUT=$(cat)

# Active session directory. PreToolUse payloads carry .cwd; fall back to $PWD.
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null)
[ -z "$CWD" ] && CWD="$PWD"
[ -d "$CWD" ] || exit 0

# Walk up from the session cwd looking for a SAP project root: a directory that
# has BOTH the build manifest and a hooks dir. First match wins.
SAP_PROJECT=""
probe="$(cd "$CWD" 2>/dev/null && pwd)"
while [ -n "$probe" ] && [ "$probe" != "/" ]; do
  if [ -f "$probe/SAP_BUILD_MANIFEST.md" ] && [ -d "$probe/.claude/hooks" ]; then
    SAP_PROJECT="$probe"
    break
  fi
  probe="$(dirname "$probe")"
done

# Not inside any SAP project → no-op, so Figma work in other projects is untouched.
[ -n "$SAP_PROJECT" ] || exit 0

HOOK_DIR="$SAP_PROJECT/.claude/hooks"

# Guard must exist; if not, fail OPEN (do not block unrelated work on a config error) but note it.
if [ -z "$GUARD" ] || [ ! -f "$HOOK_DIR/$GUARD" ]; then
  echo "sap-scope-guard: guard '$GUARD' not found in $HOOK_DIR — skipping (config error)" >&2
  exit 0
fi

# Forward stdin verbatim to the real guard; propagate its exit code (2 = block).
printf '%s' "$INPUT" | CLAUDE_PROJECT_DIR="$SAP_PROJECT" bash "$HOOK_DIR/$GUARD"
exit $?
