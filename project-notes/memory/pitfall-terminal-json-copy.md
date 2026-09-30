---
name: pitfall-terminal-json-copy
description: Copying plan JSON out of terminal output truncates/wraps lines and corrupts it — write it to a file and use pbcopy
metadata:
  node_type: memory
  type: feedback
  originSessionId: d8906426-7ce6-48c2-a407-597e4c9b7e42
  modified: 2026-09-27T11:05:18.724Z
---

Hand off a plan with `node build/route.js --plan plan.json --min` then `pbcopy < plan.min.json`.
Never print the JSON and let the user copy it from the terminal.

**Why:** 2026-09-27: a pasted plan arrived with cut lines (`"element"ton",`) and a wrong schema; the
build (301:7074) still needed an icon-fix round (all icons were default globes).

**How to apply:** `/plan-screen` step 8 already does this — keep it. See [[workflow-v4-split]].
