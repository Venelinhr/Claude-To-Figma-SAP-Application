---
description: v4 — the final gate after the Figma Agent built a plan — MATCH % (layers) + EYE MATCH % (pixels, like a person) + real logos + one fix list with node ids.
argument-hint: <Figma node link> [plan.json] [gold node link]
---

# /check-build — v4 split flow, step 2 of 2 (the last control)

Budget: ≤ 10k tokens. Read-only in Figma except the logo upload. Input: $ARGUMENTS
Plan = the given file, else the scratchpad `plan.json` from `/plan-screen`.
Target = the gold node when the user named one (memory `gold-nodes`), else the reference image.

1. **Layers.** One read-only `use_figma` with `build/templates/dump-tree.use_figma.js` (`ROOT` = node id,
   `301-7074` → `'301:7074'`) → `tree.json` → `node build/audit-plan.js plan.json tree.json` → `MATCH NN%` + HYGIENE.
2. **Pixels — the eye.** `download_assets` (png, `defaultScale` 2) of the build → `build@2x.png`; same for the gold
   (or use `ref.png`). One read-only `use_figma` with `build/templates/dump-geometry.use_figma.js` → `geometry.json`.
   `python3 build/see.py diff <gold or ref> build@2x.png --tree geometry.json --out see-out` →
   `EYE MATCH NN%`, one line per mismatch (box, border, radius, padding, shadow, text, size, weight, colour,
   icon, image, group gap, position) and `see-out/fix.md` with the Figma node id per line.
   **Look at `see-out/diff-sheet.png` and `see-out/zooms.png`** and drop lines that are reading errors.
3. **Logos.** For each PNG in `logos/`: `upload_assets` onto the logo frames (scaleMode FILL), never `use_figma`.
4. **Pass** = audit-plan exit 0 (MATCH ≥ 90%, 0 hygiene) **and** see.py exit 0 (EYE MATCH ≥ 95%). Then:
   - save the plan to `knowledge/plans-cache/<sha>.plan.json` (sha of `ref.png`, 12 chars);
   - if the user calls the build gold, also copy it to `knowledge/gold/plans/<name>.plan.json`;
   - append one line to the memory note `v4-run-log`: date, screen, MATCH %, EYE %, fix rounds, time, tokens.
5. **Not passed** → give the user `see-out/fix.md` (plus audit-plan lines, hygiene first) as ONE block to paste
   into the Figma Agent, then run this again. After 2 rounds without a pass: stop, list what blocks, ask.
