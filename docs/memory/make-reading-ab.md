---
name: make-reading-ab
description: Figma Make lesson (top-down regions + same-built cards) is in see.py/spec2tree as a SECOND reading; prove any pipeline change with the offline A/B (SAP score + text position) before claiming it helps
metadata:
  node_type: memory
  type: project
  originSessionId: b421efbc-fb98-4219-88d9-45d25321762e
  modified: 2026-10-04T21:24:43.374Z
---

2026-10-05: traced Figma Make (it reads a screen top-down: shell → side panel → list of identical cards; spacing comes from SAP, not pixels). Added to the screenshot pipeline:
see.py `regions()` (side panel / main / right rail along the longest clear gutter + a box for a repeated card that has none), front.js writes the old reading too (`see-ref-noreg`), run.js `s2tBest` keeps the tree with the better `build/sap-score.js` score (tie → old).
Also fixed in spec2tree: crossAlign centres in the FRAME, ≤2 px, and a COLUMN with one narrow row keeps offsets (+18 % text position on flight screens); photos stay in their own card; a lifted picture leaves a Spacer; groups shrink only after losing parts to a PHOTO.

**Why:** many "fixes" looked good on one screen and broke another (flight v5b 67→51, card 3 82 px off, a lost Range Slider). Only the 6-screen A/B caught them.
**How to apply:** before claiming a pipeline change helps, run the same images through a baseline copy and the new code (run.js --dry, SAP_BRIDGE_PORT=1 to mute notes) and compare SAP score, unique-text position within 6 px (layout-sim --geometry-out vs marks.json), SMASH, STRUCT-SIM and kit-part count. Never copy names.json between runs: shape numbers follow tree order. EYE needs a real build (user approval). Related: [[plugin-first-builder]], [[shape-naming-quality]].
