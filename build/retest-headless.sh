#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# retest-headless.sh — the AUDIT-V2 §7 re-test, unattended.
#
# A FRESH Claude Code session launched INSIDE this project (so every gate is active),
# the golden Purchase Order Overview prompt (the same words as the 2026-09-01 run),
# then the approval turn(s) a user would give, then build/measure-build.sh on the log.
#
# Usage:  bash build/retest-headless.sh [figma-file-url]
#   default file = the one the 2026-09-01 run saved to.
# Bounded: at most 1 build prompt + 3 approval/continue turns. Writes only to output/.
# ─────────────────────────────────────────────────────────────────────────────
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
FILE_URL="${1:-https://www.figma.com/design/mkBWOYmvUpdMlC5P6Tw2mK/Untitled}"
STAMP=$(date +%Y%m%d-%H%M%S)
LOG="output/retest-$STAMP.log"; mkdir -p output
TOOLS='Bash,Read,Write,Edit,Glob,Grep,Skill,mcp__figma__use_figma,mcp__figma__get_metadata,mcp__figma__get_screenshot,mcp__figma__get_design_context,mcp__figma__get_variable_defs,mcp__figma__search_design_system'

PROMPT1="Build me a SAP screen. I'm a purchasing manager and need a screen where I can manage and review purchase orders.

Build me a SAP Fiori Purchase Order Overview screen. I need to be able to filter purchase orders by supplier, company code, purchasing organization, purchasing group, creation date and status.

Show the results in a table with the purchase order number, supplier, company code, creation date, total amount, currency and current status. The status should be easy to understand visually, especially for orders that are waiting for approval or have been rejected.

I should be able to search, filter, sort the results and open a purchase order to see more details. Save it here $FILE_URL"

PROMPT2="Architecture approved. Wireframe approved. If no canonical scores 60 or more, build from scratch is OK. Build it now — satisfy every line of gate-status first, one use_figma build call, then hand off with the validated URL."
PROMPT3="Continue. Satisfy every remaining line of bash build/gate-status.sh, then build. Approved."

# RUN THIS FROM A TERMINAL IN CORPORATE MODE (2026-09-02 findings):
#   ~/.claude/settings.json routes every CLI session through the local gateway on
#   localhost:6655 (the `corporate` alias in ~/.zshrc). If that gateway is not running the
#   first turn ends with "API Error: Connection refused". A session started from inside the
#   Claude desktop app cannot run this either: it inherits a per-session bearer token the API
#   refuses for a child process (401). So:   corporate   →   bash build/retest-headless.sh
# The CLI runs in a clean environment (the desktop app's variables would break auth) but the
# proxy variables the corporate alias sets are passed through. Cold start (hooks + ~15 MCP
# servers) takes a minute or more before the first token — do not mistake that for a hang.
if ! curl -sS -m 3 -o /dev/null "http://localhost:6655/anthropic/" 2>/dev/null; then
  echo "⛔ local gateway localhost:6655 is not reachable — run the \`corporate\` alias / start the gateway first (see header)." >&2
  exit 1
fi
cl() { env -i HOME="$HOME" PATH="$PATH" USER="$USER" SHELL="${SHELL:-/bin/zsh}" TERM="${TERM:-xterm}" LANG="${LANG:-en_US.UTF-8}" \
       ${HTTPS_PROXY:+HTTPS_PROXY="$HTTPS_PROXY"} ${HTTP_PROXY:+HTTP_PROXY="$HTTP_PROXY"} ${NO_PROXY:+NO_PROXY="$NO_PROXY"} \
       ${ANTHROPIC_BASE_URL:+ANTHROPIC_BASE_URL="$ANTHROPIC_BASE_URL"} ${ANTHROPIC_AUTH_TOKEN:+ANTHROPIC_AUTH_TOKEN="$ANTHROPIC_AUTH_TOKEN"} \
       claude "$@"; }
run_turn() {  # $1 = prompt, $2 = session id or empty → prints JSON result
  # The prompt goes in on STDIN: --allowedTools is variadic and would swallow a trailing
  # positional prompt as another tool name ("Input must be provided…" — seen 2026-09-01).
  if [ -n "${2:-}" ]; then
    printf '%s' "$1" | cl -p --resume "$2" --output-format json --permission-mode acceptEdits --allowedTools "$TOOLS" 2>>"$LOG"
  else
    printf '%s' "$1" | cl -p --output-format json --permission-mode acceptEdits --allowedTools "$TOOLS" 2>>"$LOG"
  fi
}
show() { jq -r '"  session=\(.session_id // "?")  turns=\(.num_turns // "?")  cost_usd=\(.total_cost_usd // "?")  duration_s=\((.duration_ms // 0) / 1000 | floor)\n  ── result head ──\n\(.result // "" | .[0:700])"' <<<"$1" 2>/dev/null || printf '%s\n' "${1:0:700}"; }

T0=$(date +%s)
echo "═══ TURN 1 — build request ($(date '+%H:%M:%S')) ═══" | tee -a "$LOG"
R1=$(run_turn "$PROMPT1" ""); show "$R1" | tee -a "$LOG"
SID=$(jq -r '.session_id // empty' <<<"$R1" 2>/dev/null)
[ -n "$SID" ] || { echo "no session id — headless run failed; see $LOG"; exit 1; }

echo "═══ TURN 2 — approvals ($(date '+%H:%M:%S')) ═══" | tee -a "$LOG"
R2=$(run_turn "$PROMPT2" "$SID"); show "$R2" | tee -a "$LOG"

built() { [ -f .claude/.builds-count ] && [ "$(tr -cd '0-9' < .claude/.builds-count)" -ge 1 ] 2>/dev/null; }
n=0
while ! built && [ "$n" -lt 2 ]; do
  n=$((n + 1))
  echo "═══ TURN $((2 + n)) — continue ($(date '+%H:%M:%S')) ═══" | tee -a "$LOG"
  R=$(run_turn "$PROMPT3" "$SID"); show "$R" | tee -a "$LOG"
done
T1=$(date +%s)

echo "" | tee -a "$LOG"
echo "wall-clock (all turns): $(( (T1 - T0) / 60 )) min $(( (T1 - T0) % 60 )) s   builds completed: $(tr -cd '0-9' < .claude/.builds-count 2>/dev/null || echo 0)" | tee -a "$LOG"
echo "" | tee -a "$LOG"
echo "═══ measure-build.sh --latest ═══" | tee -a "$LOG"
SESSION_FILE="$HOME/.claude/projects/$(printf '%s' "$ROOT" | sed 's#/#-#g')/$SID.jsonl"
if [ -f "$SESSION_FILE" ]; then bash build/measure-build.sh "$SESSION_FILE" | tee -a "$LOG"; else bash build/measure-build.sh --latest | tee -a "$LOG"; fi
echo "full log: $LOG"
