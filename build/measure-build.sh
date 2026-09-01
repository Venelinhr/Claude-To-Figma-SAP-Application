#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# measure-build.sh — one command, one number set, every build.
#
# Reads a Claude Code session log (~/.claude/projects/<project>/<session>.jsonl)
# and prints what a build actually cost: wall-clock, output tokens, context per
# turn, use_figma calls (and how many failed), screenshots, native-frame ratio,
# compactions, and whether the SAP gates were ACTIVE or DORMANT.
#
# Why: the 2026-09-01 v2 test was judged by eye ("7 min, ~34k tokens, not
# improved"). The log showed the session had started in $HOME, so no v2 hook
# ever ran — the test measured the legacy global path, not v2. You cannot
# improve what you do not measure, and you cannot compare two things you did
# not measure the same way. This script is that same way.
#
# Usage:
#   bash build/measure-build.sh <session.jsonl> [--day YYYY-MM-DD]
#   bash build/measure-build.sh --latest [--day YYYY-MM-DD]     # newest log under this project
#
# Targets (CLAUDE.md, "ADAPTIVE EXECUTION"): 3–5 min and ≤10–12k output tokens per build.
# Read-only. Never writes anything.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE=""; DAY=""
while [ $# -gt 0 ]; do
  case "$1" in
    --day) DAY="${2:-}"; shift 2 ;;
    --latest)
      KEY="$(printf '%s' "$PROJECT_ROOT" | sed 's#/#-#g')"
      FILE="$(ls -t "$HOME/.claude/projects/$KEY"/*.jsonl 2>/dev/null | head -1 || true)"
      shift ;;
    *) FILE="$1"; shift ;;
  esac
done
[ -n "$FILE" ] && [ -f "$FILE" ] || { echo "usage: bash build/measure-build.sh <session.jsonl> [--day YYYY-MM-DD]   |   --latest" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq is required" >&2; exit 1; }

# ── Gate evidence (grep, cheap) ──────────────────────────────────────────────
if [ -n "$DAY" ]; then LINES=$(grep "\"timestamp\":\"$DAY" "$FILE" || true); else LINES=$(cat "$FILE"); fi
g() { printf '%s' "$LINES" | grep -c "$1" || true; }
WF=$(g 'wireframe-first-gate'); AP=$(g 'approval-captured'); WC=$(g 'workflow-contract-directive'); BL=$(g 'GATE [0-9.]* BLOCKED')
if [ "$((WF+AP+WC+BL))" -gt 0 ]; then GATES="ACTIVE"; else GATES="DORMANT"; fi

# ── Everything else (jq, one pass) ───────────────────────────────────────────
JQ='
def ts: (. // "") | sub("\\.[0-9]+Z$"; "Z") | try fromdateiso8601 catch 0;
def k: (. / 1000 | floor);
( if $day == "" then . else map(select((.timestamp // "") | startswith($day))) end ) as $d
| ($d | map(select(.type == "assistant")))                                            as $a
| ($a | group_by(.message.id) | map(.[-1]))                                           as $msgs
| ($a | map(.timestamp as $t | .message.content[]? | select(.type == "tool_use") | . + {ts: $t}) | unique_by(.id)) as $tu
| ($tu | map({key: .id, value: .name}) | from_entries)                                 as $names
| ($d | map(select(.type == "user")) | map(.message.content[]? | select(type == "object" and .type == "tool_result")
     | {name: ($names[.tool_use_id] // "?"), txt: (.content | tostring)}))            as $res
| ($d | map(select(.type == "user" and ((.message.content | type) == "string"))))    as $prompts
| ($prompts | map(select(.message.content | startswith("This session is being continued"))) | length) as $compactions
| ($msgs | map((.message.usage.input_tokens // 0) + (.message.usage.cache_read_input_tokens // 0) + (.message.usage.cache_creation_input_tokens // 0))) as $ctx
| ($msgs | map(.message.usage.output_tokens // 0) | add // 0)                          as $out
| ($tu  | map(select(.name | test("use_figma"))))                                     as $uf
| ($res | map(select(.name | test("use_figma"))))                                     as $ufr
| ($uf  | map(.input.code // ""))                                                     as $codes
| ($codes | map([scan("createFrame\\(")] | length) | add // 0)                        as $cf
| ($codes | map([scan("createInstance\\(")] | length) | add // 0)                     as $ci
| ($codes | map([scan("importComponent(Set)?ByKeyAsync")] | length) | add // 0)       as $imp
| ($codes | map([scan("\\.clone\\(")] | length) | add // 0)                           as $cl
| ($tu | map(select(.name | test("screenshot"))) | length)                            as $shots
| ($res | map(select(.name | test("get_metadata")) | .txt | length) | add // 0)       as $metaB
| ($res | map(select(.name | test("screenshot")) | .txt | length) | add // 0)         as $shotB
| ($res | map(select(.name == "Read") | .txt | length) | add // 0)                    as $readB
| ($tu | map(select(.name == "Skill")) | map(.input.skill) )                           as $skills
# build episodes: a user prompt that asks for a build, until the next REAL prompt.
# A gated build spans several prompts (wireframe → "approve" → build), so a short
# approval reply continues the episode instead of ending it.
| ($prompts | to_entries | map(.value.message.content as $c
     | . + {cont: (($c | length) < 40 and ($c | test("^\\s*(approve|approved|yes|ok|okay|go|go ahead|build it|proceed|continue|lgtm|ship it|do it|looks good)[.! ]*$"; "i")))})) as $pe
| ($pe | map(select(.value.message.content | test("build|create.*screen|make.*screen|sap screen|save it here"; "i")) | select(.cont | not))) as $starts
| ($starts | map(
     .key as $i
     | .value.timestamp as $pt
     | ($pt | ts) as $t0
     | ($pe | map(select(.key > $i and (.cont | not))) | first) as $nx
     | (if $nx == null then 9999999999 else ($nx.value.timestamp | ts) end) as $t1
     | ($msgs | map(select((.timestamp | ts) >= $t0 and (.timestamp | ts) < $t1))) as $w
     | ($tu   | map(select((.ts | ts) >= $t0 and (.ts | ts) < $t1)) ) as $wt
     | { prompt: (.value.message.content[0:60] | gsub("\n"; " ")),
         start: $pt[11:19],
         end:   (($w | map(.timestamp) | max // $pt)[11:19]),
         minutes: ((($w | map(.timestamp | ts) | max // $t0) - $t0) / 60 * 10 | round / 10),
         out_tokens: ($w | map(.message.usage.output_tokens // 0) | add // 0),
         use_figma: ($wt | map(select(.name | test("use_figma"))) | length),
         screenshots: ($wt | map(select(.name | test("screenshot"))) | length) }
  )) as $episodes
| "SESSION       \($d[0].sessionId // "?")",
  "CWD(s)        \($d | map(.cwd // empty) | unique | join("  →  "))",
  "SPAN          \(($d | map(.timestamp // empty) | min // "?")[0:19])  →  \(($d | map(.timestamp // empty) | max // "?")[0:19])",
  "TURNS         \($msgs | length) assistant turns · \($prompts | length) user prompts · \($compactions) compaction(s)",
  "OUTPUT TOKENS \($out)",
  "CONTEXT       first turn \(($ctx | first // 0) | k)k (cost before the first word) · avg \((($ctx | add // 0) / (($ctx | length) | if . == 0 then 1 else . end)) | k)k/turn · max \(($ctx | max // 0) | k)k",
  "USE_FIGMA     \($uf | length) calls · \($ufr | map(select(.txt | test("hook error"))) | length) blocked by gates · \($ufr | map(select((.txt | test("hook error") | not) and (.txt | test("^\\[?\\{?\"?(type\":\"text\",\"text\":\")?Error|^Error")))) | length) API errors · \(($codes | map(length) | add // 0) / 1024 | floor) KB code generated",
  "NATIVE RATIO  createFrame \($cf) : createInstance \($ci) (+\($imp) imports, \($cl) clones)  \(if $ci == 0 and $cf > 0 then "⛔ NO SAP INSTANCES" elif $cf > 2 * ($ci + $cl) then "⚠ native-heavy" else "✓" end)",
  "SCREENSHOTS   \($shots)  (rule: 1 at hand-off)  · \($shotB / 1024 | floor) KB",
  "READS         get_metadata \($metaB / 1024 | floor) KB · Read \($readB / 1024 | floor) KB",
  "SKILLS        \($skills | join(", "))",
  "",
  "BUILD EPISODES (prompt → next prompt)",
  ( $episodes[] | "  \(.start)→\(.end)  \(.minutes) min  \(.out_tokens) out-tok  \(.use_figma) use_figma  \(.screenshots) shots   \"\(.prompt)…\"   \(if .minutes <= 5 and .out_tokens <= 12000 then "✓ within target" else "✗ over target (3–5 min, ≤12k)" end)" ),
  ( if ($episodes | length) == 0 then "  (no build prompt found)" else empty end )
'
jq -r -s --arg day "$DAY" "$JQ" "$FILE"
echo "GATES         $GATES   (wireframe-first=$WF approval-captured=$AP contract=$WC blocked=$BL)"
if [ "$GATES" = "DORMANT" ]; then
  echo "              ⛔ No SAP gate fired in this session. Was Claude launched from the project folder?"
  echo "                 cd \"$PROJECT_ROOT\" && claude     (in the terminal, not inside Claude)"
fi
