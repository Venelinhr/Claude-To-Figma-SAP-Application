#!/bin/bash
# recall-vdi.sh — UserPromptSubmit hook (F-4, Performance Recovery, RC-2).
#
# The semantic-models/ VDI cache existed but NO hook consulted it, so the ~14k-token VDI
# analysis was re-run on every image — "the single largest re-derivation cost" (audit-output.md).
# This hook fires when a build/image prompt is detected and injects the list of already-cached
# semantic models so the agent LOADS a matching one (~0.7k tokens) instead of re-analysing (~14k).
# It also states the write-back protocol so new analyses populate the cache.
#
# Content-addressed by image SHA-1 — but the agent usually can't hash an inline image, so we
# surface cached models by screenName + floorplan for recognition-based matching too.
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' | tr '[:upper:]' '[:lower:]')
PROJ="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

[ -n "$PROMPT" ] || exit 0

# Only fire on image/build prompts (shared definition — lib-prompt-classify.sh — so this
# never drifts from enforce-wireframe-first.sh's own classification again).
source "$(dirname "$0")/lib-prompt-classify.sh"
is_image_or_build_prompt "$PROMPT" || exit 0

MODELS_DIR="$PROJ/semantic-models"
[ -d "$MODELS_DIR" ] || exit 0

# Collect cached models (skip README).
LIST=""
for f in "$MODELS_DIR"/*.md; do
  [ -f "$f" ] || continue
  case "$(basename "$f")" in README.md) continue ;; esac
  name=$(grep -m1 -E '^screenName:' "$f" 2>/dev/null | sed 's/screenName:[[:space:]]*//')
  fp=$(grep -m1 -E '^floorplan:' "$f" 2>/dev/null | sed 's/floorplan:[[:space:]]*//')
  sha=$(grep -m1 -E '^sha1:' "$f" 2>/dev/null | sed 's/sha1:[[:space:]]*//')
  [ -z "$name" ] && name="$(basename "$f" .md)"
  LIST="$LIST  • ${name} — ${fp:-?} [$(basename "$f")]\n"
done

[ -z "$LIST" ] && exit 0

printf '<vdi-cache-recall>\n'
printf '⚡ VDI CACHE — check BEFORE running a full visual analysis (saves ~14k tokens).\n'
printf 'Cached semantic models in semantic-models/ (load the matching one instead of re-analysing):\n'
printf "%b" "$LIST"
printf 'If the reference matches a cached model (same screen/floorplan), READ that file and use its\n'
printf 'Zones/Components/Tokens directly — do NOT re-run the 8-stage VDI pass.\n'
printf 'If NO match, run VDI once, then WRITE a compact model to semantic-models/<slug>-<sha1_8>.md\n'
printf '(frontmatter: sha1, screenName, width, floorplan + terse Zones/Components/Tokens) so the\n'
printf 'next build on this reference is a cache hit.\n'
printf '</vdi-cache-recall>\n'
exit 0
