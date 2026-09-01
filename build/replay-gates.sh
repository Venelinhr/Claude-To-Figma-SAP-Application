#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# replay-gates.sh — run the REAL use_figma code from a past session through the
# CURRENT code-level gates, and count what would have been stopped before Figma.
#
# Why: a gate is only worth what it catches in practice. This turns every past
# session log into a regression corpus — no Figma, no tokens, deterministic.
# It replays the two gates that judge CODE alone (no session markers needed):
#   guard-api-gotchas.sh  — code that throws inside Figma (AUDIT-V2 P1)
#   guard-figma-code.sh   — native-heavy code / code-visible fake components (P3)
# and prints, per call: what Figma actually did THEN vs. what the gates say NOW,
# plus the output tokens of the assistant turn that produced each call.
#
# Usage:  bash build/replay-gates.sh <session.jsonl> [--day YYYY-MM-DD]
# Read-only. Exit 0 always (it reports; it does not judge).
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
export CLAUDE_PROJECT_DIR="$ROOT"
FILE=""; DAY=""
while [ $# -gt 0 ]; do case "$1" in --day) DAY="${2:-}"; shift 2 ;; *) FILE="$1"; shift ;; esac; done
[ -n "$FILE" ] && [ -f "$FILE" ] || { echo "usage: bash build/replay-gates.sh <session.jsonl> [--day YYYY-MM-DD]" >&2; exit 1; }

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
# one JSON object per historical use_figma call: id, ts, out_tokens of its turn, description, result head, code (base64 to survive newlines)
jq -c -s --arg day "$DAY" '
  ( if $day == "" then . else map(select((.timestamp // "") | startswith($day))) end ) as $d
  | ($d | map(select(.type == "user")) | map(.message.content[]? | select(type == "object" and .type == "tool_result")
       | {key: .tool_use_id, value: ((.content | tostring)[0:160] | gsub("\n"; " "))}) | from_entries) as $res
  | ($d | map(select(.type == "assistant")) | group_by(.message.id) | map(.[-1])
       | map(.message.usage.output_tokens as $o | .timestamp as $t | .message.content[]? | select(.type == "tool_use" and (.name | test("use_figma")))
             | {id, ts: $t[11:19], out: $o, desc: (.input.description // "" | .[0:70]), code: (.input.code // "" | @base64), result: ($res[.id] // "?")}))
  | unique_by(.id) | sort_by(.ts) | .[]' "$FILE" > "$TMP/calls.jsonl"

N=$(wc -l < "$TMP/calls.jsonl" | tr -d ' ')
echo ""
echo "Gate replay — $(basename "$FILE")${DAY:+ ($DAY)} — $N use_figma call(s)"
echo "$(printf '─%.0s' {1..78})"
printf '%-8s %-6s %-30s %-34s %s\n' "time" "out" "THEN (what Figma did)" "NOW (code gates)" "reason"
echo "$(printf '─%.0s' {1..78})"

blocked_now=0; failed_then=0; tok_failed_then=0; tok_blocked_now=0; native_now=0
while IFS= read -r call; do
  id=$(jq -r .id <<<"$call"); ts=$(jq -r .ts <<<"$call"); out=$(jq -r .out <<<"$call"); desc=$(jq -r .desc <<<"$call"); res=$(jq -r .result <<<"$call")
  jq -r .code <<<"$call" | base64 -d > "$TMP/code.js" 2>/dev/null || : > "$TMP/code.js"
  [ -s "$TMP/code.js" ] || continue
  # THEN
  if printf '%s' "$res" | grep -q "hook error"; then then_v="gate-blocked"; then_r=$(printf '%s' "$res" | grep -oE 'guard-[a-z-]+' | head -1)
  elif printf '%s' "$res" | grep -qE '^(\[?\{?"?(type"?:"?text"?,"?text"?:"?)?)?Error|Figma Debug UUID'; then then_v="API ERROR"; then_r=$(printf '%s' "$res" | grep -oE 'Error: [^"]{0,60}' | head -1); failed_then=$((failed_then + 1)); tok_failed_then=$((tok_failed_then + out))
  else then_v="ran"; then_r=""; fi
  # NOW — code-level gates only
  payload=$(jq -n --rawfile c "$TMP/code.js" --arg cwd "$ROOT" '{tool_name:"mcp__figma__use_figma", tool_input:{code:$c}, cwd:$cwd, hook_event_name:"PreToolUse"}')
  now_v=""; now_r=""
  if ! printf '%s' "$payload" | bash .claude/hooks/guard-api-gotchas.sh >/dev/null 2>"$TMP/err"; then
    now_v="BLOCKED pre-flight (api-gotchas)"; now_r=$(grep -oE 'line [0-9]+: [^→]{0,70}' "$TMP/err" | head -1)
  fi
  if ! printf '%s' "$payload" | bash .claude/hooks/guard-figma-code.sh >/dev/null 2>"$TMP/err2"; then
    r2=$(grep -oE 'native-heavy build: [^.]{0,60}|line [0-9]+: [^—]{0,60}' "$TMP/err2" | head -1)
    if [ -n "$now_v" ]; then now_v="$now_v + figma-code"; now_r="$now_r; $r2"; else now_v="BLOCKED pre-flight (figma-code)"; now_r="$r2"; fi
    native_now=$((native_now + 1))
  fi
  if [ -n "$now_v" ]; then blocked_now=$((blocked_now + 1)); tok_blocked_now=$((tok_blocked_now + out)); else now_v="passes code gates"; fi
  printf '%-8s %-6s %-30s %-34s %s\n' "$ts" "$out" "$then_v${then_r:+ · $then_r}" "$now_v" "$now_r"
done < "$TMP/calls.jsonl"

echo "$(printf '─%.0s' {1..78})"
echo "THEN: $failed_then call(s) threw inside Figma after a full round-trip ($tok_failed_then output tokens spent generating them)."
echo "NOW : $blocked_now call(s) would be stopped BEFORE Figma, with the offending line named ($tok_blocked_now output tokens' worth of code); $native_now of them refused as native-heavy / fake components."
echo "      A pre-flight block costs one in-place fix and a resend of the SAME code — not a Figma round-trip plus a regeneration that introduces the next trap."
exit 0
