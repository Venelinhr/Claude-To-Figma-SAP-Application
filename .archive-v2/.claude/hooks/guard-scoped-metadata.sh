#!/bin/bash
# guard-scoped-metadata.sh — PreToolUse + PostToolUse (get_metadata). Keeps metadata reads scoped.
#
# Why (AUDIT-V2 §2.1, P6): one get_metadata call on 2026-09-01 returned 41 KB (~10k tokens)
# of whole-page XML during a build. During a build, read metadata for the target frame only.
#
# PreToolUse : block the document root ("0:1") — that is never what a build needs.
# PostToolUse: if a result is larger than 20 KB, say so, with the scoped alternative.
INPUT=$(cat)
TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
echo "$TOOL" | grep -qi "get_metadata" || exit 0
EVENT=$(printf '%s' "$INPUT" | jq -r '.hook_event_name // empty' 2>/dev/null)

if [ "$EVENT" = "PreToolUse" ]; then
  NODE=$(printf '%s' "$INPUT" | jq -r '.tool_input.nodeId // empty' 2>/dev/null)
  if [ "$NODE" = "0:1" ] || [ "$NODE" = "0-1" ]; then
    {
      echo "⛔ SCOPED METADATA — get_metadata on the document root (0:1) dumps every page (tens of KB, ~10k tokens)."
      echo "Omit nodeId to list pages cheaply, then call get_metadata with the ONE frame you are working on."
      echo "Canonical nodes are indexed in docs/canonical-screens/CANONICAL-SCREENS.md — no dump needed to find them."
    } >&2
    exit 2
  fi
  exit 0
fi

if [ "$EVENT" = "PostToolUse" ]; then
  SZ=$(printf '%s' "$INPUT" | jq -r '.tool_response | tostring | length' 2>/dev/null); SZ=${SZ:-0}
  if [ "$SZ" -gt 20000 ]; then
    echo "<metadata-cost-warning>get_metadata returned $((SZ / 1024)) KB (≈$((SZ / 4000))k tokens) — a page/section dump. During a build, pass the target frame's nodeId only; use docs/canonical-screens/CANONICAL-SCREENS.md to find canonical nodes.</metadata-cost-warning>"
  fi
  exit 0
fi
exit 0
