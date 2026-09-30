---
name: project-plugin-runner
description: v5 build path where the SAP Bridge plugin builds the tree itself (send.js, ~11-25 s, ~0 tokens); state, numbers, how to run, open issues (2026-09-29)
metadata:
  type: project
---
`node build/send.js bridge-out/<job> --file <fileKey> --ref <job>/ref.png` = build + logos + dump + PNG + gates through the SAP Bridge plugin (Plugins → Development → SAP Bridge, keep open, "Connected to Claude · v5"). Model types nothing (was 6 min / 40-60k tokens via use_figma typing). Plugin runtime is COMPILED into plugin/sap-bridge/code.js by `node build/plugin-bundle.js` (Figma plugins forbid new Function; no createAutoLayout; use getMainComponentAsync) → after ANY change to build/templates/*: run plugin-bundle, then close + reopen the plugin. `/screen` step 4 uses send.js; screen-builder agent = fallback.
Offline gates before Figma: door.js (incl. responsive rule) + `layout-sim.js tree.json --expect tree.expect.json [--scale 0.85|1.15] [--geometry check/geometry.json]` (validated 98 % vs real Figma sizes on gold trees).
From-zero flight (bridge-out/flight-v5b, see-ref/spec.json): rounds STRUCTURE/EYE 52/31 → 12/66 → 5/74 → 5/68 → 5/75 (node 534-18899). Gold-tree path ≈ 95 %. Bar 95 % NOT met from zero; open: route line in each leg too short (≈90 vs 275 px), filter column 4 px tall. Real text boxes = floor(size×1.17) tall; SAP 72 font ≈ 0.89× measured glyph width; Button real height 36.
Snapshot tag: snapshot-2026-09-29-plugin-runner.
**Why:** user wants quick + cheap builds and ≥ 95 %. **How to apply:** use send.js for builds; iterate from-zero with layout-sim --geometry against the real dump; see [[workflow-v5-trees]] [[feedback-show-plan-fully]].

Full summary + lessons learned: knowledge/plugin-runner-summary-2026-09-29.md (tag snapshot-2026-09-30-summary).
