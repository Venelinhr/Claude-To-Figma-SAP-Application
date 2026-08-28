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

# PATH-INDEPENDENT (2026-08-28): derive the project root from this script's own
# location instead of a hardcoded absolute path. Previously this was pinned to
# one folder, so ANY copy/worktree/rename ran with every gate silently dormant —
# the exact RC-1 failure this dispatcher exists to prevent, reintroduced by a
# constant. HOOK_DIR is <root>/.claude/hooks, so root is two levels up.
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
SAP_PROJECT="$(cd "$HOOK_DIR/../.." && pwd)"
GUARD="$1"

# Sanity: the derived root must actually look like the SAP project. If the
# marker file is absent we are not where we think we are — fail OPEN (never
# block unrelated work) but say so loudly on stderr.
if [ ! -f "$SAP_PROJECT/SAP_BUILD_MANIFEST.md" ]; then
  echo "sap-scope-guard: '$SAP_PROJECT' has no SAP_BUILD_MANIFEST.md — not a SAP project root, skipping" >&2
  exit 0
fi

INPUT=$(cat)

# Determine the active session directory. PreToolUse payloads carry .cwd; fall back to $PWD.
CWD=$(echo "$INPUT" | jq -r '.cwd // empty' 2>/dev/null)
[ -z "$CWD" ] && CWD="$PWD"

# Only enforce when the session is inside the SAP project.
case "$CWD" in
  "$SAP_PROJECT"|"$SAP_PROJECT"/*) : ;;   # in scope — run the guard
  *) exit 0 ;;                             # other project — no-op
esac

# Guard must exist; if not, fail OPEN (do not block unrelated work on a config error) but note it.
if [ -z "$GUARD" ] || [ ! -f "$HOOK_DIR/$GUARD" ]; then
  echo "sap-scope-guard: guard '$GUARD' not found in $HOOK_DIR — skipping (config error)" >&2
  exit 0
fi

# Forward stdin verbatim to the real guard; propagate its exit code (2 = block).
printf '%s' "$INPUT" | CLAUDE_PROJECT_DIR="$SAP_PROJECT" bash "$HOOK_DIR/$GUARD"
exit $?
