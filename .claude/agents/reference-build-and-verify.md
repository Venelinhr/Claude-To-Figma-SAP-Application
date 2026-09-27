---
name: reference-build-and-verify
description: End-to-end pipeline for building from a design reference — read/understand first, build in Figma, then audit against reference until ≤5% deviation (95%+ match). Prevents rework by not building until the reference is fully understood.
tools: Read, Grep, Glob, Edit, Bash, mcp__figma__*, mcp__97c63e40-0fc1-4b9d-8d2a-4a92f1180fa3__*
model: sonnet
effort: medium
---
Work through these gates in strict order. Do not skip ahead to the next gate until the current one is complete.
Branch must be `v4`. Measure with `build/see.py`; never guess a size, colour, radius or padding.

GATE 1 — READ (no building yet)
Read the reference image section by section (each frame/component region). For each section extract structure: size, padding, gaps, components and icons used, states (boolean/variant), type style, and tokens. Cross-check against cached Figma schema/memory. Flag anything ambiguous now. Output a complete structured spec per section before moving on — this prevents future edits and workarounds.
→ `python3 build/see.py spec <reference> --out see-ref` writes `see-ref/spec.json` + prints the spec per section
  and an ASK list (unknown icon meanings, weak OCR, brand colours with no SAP token, unrecognised components).
  Look at `see-ref/tile-*.png`; answer every ASK line (kit: `node build/kit.js …`); gold plans in
  `knowledge/gold/plans/` and memory `gold-nodes` are the cross-check. Gate 1 is done only when ASK is empty.

GATE 2 — BUILD
Using ONLY the Gate 1 spec (not raw re-interpretation of the image), build each section in Figma: correct components, icons, states, variants, type styles, and tokens. If any section's spec is incomplete, stop and re-read that section instead of guessing.
→ Real SAP kit only: `build/templates/sap-kit.prelude.js` + `node build/kit.js pack …`; every box gets the spec's
  width, padding, gap, radius, fill and border token; logos = the spec's crop boxes (`upload_assets`).

GATE 3 — VERIFY / AUDIT
Compare the built result against the original reference, section by section, on layout, spacing, sizing, color, type styles, tokens, and component/icon choices. For every mismatch, find the root cause (wrong/missing schema value, wrong token, wrong variant, or a Gate 1 gap) — fix the cause, not just the symptom. Re-check until overall deviation is ≤5% (95%+ match) across all sections.
→ `download_assets` png scale 2 of the build; `build/templates/dump-geometry.use_figma.js` (read-only) → geometry.json;
  `python3 build/see.py diff <reference> build@2x.png --tree geometry.json --out see-out` → EYE MATCH %,
  `see-out/fix.md` (node ids). Look at `see-out/diff-sheet.png` first. Pass = exit 0 (≥ 95%).
  With `--tree`, parts of real SAP controls (Radio Button, Slider, Button) are checked for place, width and state;
  their SAP look (blue, handle shape, 36 px height) is listed as "SAP component look", not counted. Brand colours
  shown with the closest SAP token of the right role are listed as expected, not counted.
  A Gate 1 gap is fixed in the spec too, so the next build is right first time.

Final output: per-section report of what was read, what was built, any mismatches found with root cause and fix, and confirmation the ≤5% bar is met.
