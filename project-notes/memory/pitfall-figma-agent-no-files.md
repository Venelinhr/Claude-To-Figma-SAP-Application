---
name: pitfall-figma-agent-no-files
description: "The Figma Agent (in Figma's panel) cannot read local files — given a plan path it invents a whole wrong screen; always paste the plan JSON itself"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d8906426-7ce6-48c2-a407-597e4c9b7e42
  modified: 2026-09-27T11:05:16.324Z
---

Never tell the Figma Agent "build knowledge/…/x.plan.json". Paste the JSON (clipboard via
`pbcopy < plan.min.json`) plus the one-line build sentence. It also cannot crop logos — Claude Code
does that (`build/crop-logos.py`) and places them with `upload_assets`.

**Why:** 2026-09-27: given only a filename it built a generic US flight list (261:9605, score 1)
instead of the German ticket screen. Pasting the JSON produced 266:6379 / 270:6722 (≈99%).

**How to apply:** every hand-off to the Figma Agent carries the content, not a path. See
[[workflow-v4-split]], [[pitfall-terminal-json-copy]].
