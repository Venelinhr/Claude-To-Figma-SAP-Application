---
description: v4 — after the Figma Agent built a plan — read-only dump, MATCH % audit, real logos in, one short fix list.
argument-hint: <Figma node link> [plan.json]
---

# /check-build — v4 split flow, step 2 of 2

Budget: ≤ 8k tokens. Read-only in Figma except the logo upload. Input: $ARGUMENTS
Plan = the given file, else the scratchpad `plan.json` from `/plan-screen`.

1. **Dump** (one read-only `use_figma` call): `build/templates/dump-tree.use_figma.js` with
   `ROOT` = the node id from the link (`301-7074` → `'301:7074'`). Save the result as `tree.json`.
2. **Audit.** `node build/audit-plan.js plan.json tree.json` → `MATCH NN%` + lines + HYGIENE.
3. **Logos.** For each PNG in `logos/`: find the logo frame in `tree.json` (name contains the plan
   element or "logo"), then `upload_assets` with those `nodeIds` (scaleMode FIT) and POST each PNG.
   Never `use_figma` for this. Logo lines disappear from the next audit.
4. **Fix list.** Turn every remaining line into one short ACT-style instruction with the node id
   (e.g. `Set Icon on 301:7079 to "navigation-up-arrow"`). Group them in one block for the user to
   paste into the Figma Agent. Hygiene lines first — they block the pass.
5. **Pass** = `MATCH ≥ 90%` and `HYGIENE (0)` (audit exits 0). Then:
   - save the plan to `knowledge/plans-cache/<sha>.plan.json` (sha of `ref.png`, 12 chars);
   - if the user calls the build gold, also copy it to `knowledge/gold/plans/<name>.plan.json`;
   - append one line to the memory note `v4-run-log`: date, screen, MATCH %, fix rounds, time, tokens.
6. Not passed after 2 fix rounds → stop, list what blocks the 90% and ask the user.
