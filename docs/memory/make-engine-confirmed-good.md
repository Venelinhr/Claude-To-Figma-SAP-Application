---
name: make-engine-confirmed-good
description: "2026-10-05 the user confirmed the Make → Figma result of the fixed engine is perfect; keep this behaviour for every next run"
metadata:
  type: project
---

User said (2026-10-05): "Perfect result! Remember all — it works perfect and great. Apply this for next run."
State that was confirmed: Flight Search clone from the Make app, converter commit 875af9f (Application) + 07634b5 (plugin repo), plugin-v2 and the standalone "Make → Figma" plugin both synced with `node plugin-v2/sync-make-engine.js`.
Includes: bordered Secondary buttons, kit Segmented Button, faded blank glyph, status badge without icon, equal table columns, 2-line strip, route row with line, full-screen preview read by the Chrome extension (v2.11.0).

**Why:** the user wants this exact quality on every next Make clone.
**How to apply:** do not revert these rules; after any converter change re-run `node plugin-v2/sync-make-engine.js` for plugin-v2 and the standalone plugin, then `node --test test/make2tree.test.js`. Related: [[make-engine-sync]], [[make-read-fullscreen-preview]].
