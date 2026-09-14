#!/bin/bash
# guard-chain.sh — runs EVERY use_figma PreToolUse gate and reports ALL failures at once.
#
# Why (AUDIT-V2 §1.2): with the gates registered one by one, each refusal carried exactly
# one gate's message. The agent fixed that one, regenerated 13–17 KB of build code, and
# was refused by the next gate. Five times. This wrapper runs the whole chain on the same
# payload and prints every failing gate in a single block, so one refusal is enough to
# learn everything that is still missing.
#
# The individual guards are unchanged; they still decide. This only changes reporting.
# Exit 2 if any gate exits 2; otherwise pass their stdout through and exit 0.
INPUT=$(cat)
HOOK_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$HOOK_DIR/../.." && pwd)}"

# Order matters for the message (cheapest / earliest precondition first). Paths are
# relative to the project root so build/test-gates.sh can check every one is executable.
GUARDS="
.claude/hooks/guard-workflow-contract.sh
.claude/hooks/guard-reference-gate.sh
.claude/hooks/guard-architect-gate.sh
.claude/hooks/guard-wireframe-gate.sh
.claude/hooks/guard-reuse-gate.sh
.claude/hooks/guard-api-gotchas.sh
.claude/hooks/guard-figma-code.sh
.claude/hooks/guard-manifest-drift.sh
"

source "$HOOK_DIR/lib-build-detect.sh"
TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
CODE=$(printf '%s' "$INPUT" | jq -r '.tool_input.code // ""' 2>/dev/null)
IS_BUILD=false; is_build "$CODE" && IS_BUILD=true

# 2026-09-14 (audit finding A): each of the 8 sub-gates below used to re-run its own
# `INPUT=$(cat)` + two `jq` calls on this SAME payload — 8 extra forks + 16 extra jq spawns per
# use_figma call, parsing data this script already parsed above. Export the parsed values so
# each sub-gate can skip its own parse; every sub-gate still falls back to self-parsing via
# `${GUARD_CHAIN_INPUT:-$(cat)}` when run standalone (outside this chain, e.g. manual testing),
# so nothing here changes sub-gate behavior — only removes duplicate parsing on the hot path.
export GUARD_CHAIN_INPUT="$INPUT"
export GUARD_CHAIN_TOOL="$TOOL_NAME"
export GUARD_CHAIN_CODE="$CODE"

TMPERR=$(mktemp)
total=0; fails=0; names=""; OUT=""; ERR=""
for g in $GUARDS; do
  total=$((total + 1))
  path="$PROJ/$g"
  if [ ! -x "$path" ]; then
    # A missing/non-executable gate is a broken install. Fail CLOSED for builds (invariant 5),
    # stay silent for read-only calls so unrelated inspection is not blocked.
    if [ "$IS_BUILD" = true ]; then
      fails=$((fails + 1)); names="$names $(basename "$g" .sh)"
      ERR="$ERR── $(basename "$g") ──"$'\n'"⛔ gate script missing or not executable: $g  (run: chmod +x $g)"$'\n\n'
    fi
    continue
  fi
  o=$(printf '%s' "$INPUT" | CLAUDE_PROJECT_DIR="$PROJ" bash "$path" 2>"$TMPERR"); rc=$?
  e=$(cat "$TMPERR")
  if [ "$rc" -eq 2 ]; then
    fails=$((fails + 1)); names="$names $(basename "$g" .sh)"
    ERR="$ERR── $(basename "$g") ──"$'\n'"$e"$'\n\n'
  else
    [ -n "$o" ] && OUT="$OUT$o"$'\n'
  fi
done
rm -f "$TMPERR"

if [ "$fails" -gt 0 ]; then
  {
    echo "⛔ $fails of $total gates refused this use_figma call:$names"
    echo ""
    printf '%s' "$ERR"
    echo "Fix ALL of the above before the next attempt — do not resend after fixing only one."
    echo "Checklist with exact commands:  bash build/gate-status.sh"
  } >&2
  exit 2
fi
[ -n "$OUT" ] && printf '%s' "$OUT"
exit 0
