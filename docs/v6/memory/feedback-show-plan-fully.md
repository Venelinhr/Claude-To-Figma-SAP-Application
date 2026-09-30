---
name: feedback-show-plan-fully
description: "EVERY plan/report shows ALL 5 sections in full and in the user's exact style — 1 Analyze, 2 Zones, 3 Wireframe (boxed, zone letters), 4 Layers (├─ tree), 5 Confidence — then \"Approve / Reject / Modify?\""
metadata:
  node_type: memory
  type: feedback
  originSessionId: a1d0debc-88f1-4329-8ff6-34de9ce7bc61
  modified: 2026-09-30T06:52:03.834Z
---

**The rule (user, 2026-09-30, said with "!!!!!"): "I want to see all of these: 1. Analyze, 2. Zones, 3. Wireframe, 4. Layers, 5. Confidence" — "make sure to show all of my request, exact same style in future".**
Show all five, in full, every time, in the chat (the terminal folds tool output, the user sees only what Claude writes). Never a summary, never "see the tool output".
1. **Analyze** — what the reference is, size / scale, floorplan, density, theme, what was assumed.
2. **Zones** — table `Zone | Content | SAP component (kit) | Key properties` (A, B, C … in Z order).
3. **Wireframe** — boxed, one row per line, glyphs aligned, zone letter + component name on the right: `┌───┐ │ ‹  Dream Hotel  ♡ ⇪ │ A  Header + Icon Button ×2 ├───┤ │ [3,1] Poor › │ B … └───┘`.
   Generated from the REAL tree: `node build/tree.js plan <tree.json>` (phone-width ≤ 600 px → `build/sketch.js`; desktop keeps the to-scale grid; `--grid` forces it). Paste it verbatim in ``` fences.
4. **Layers** — box-drawing tree: `Hotel — Object Page 390×798 (V, FIXED)  ├─ Header row (H)  │  ├─ Header "Dream Hotel" … └─ Footer bar (V)`, repeated siblings folded (`Rating ×3 (…)`). Same command.
5. **Confidence** — table `Area | Conf. | Notes` with ● sure / ○ guess; name every guess (icon nearest, map = image crop, theme light vs dark, Header/Footer beside the kit component).
Then the SAP components table (real kit keys, from the same command) and ONE closing line: **"Approve / Reject / Modify?"**. In the final report after a build, add the node link, the measured gates, provenance, the ASSUMED ledger.
**Why:** it is the approval artefact, same as `main`; the user asked "where is ASCII / tree?" twice (2026-09-29) and "why does the wireframe look weird" (2026-09-30) when the old to-scale grid was pasted. A hand-drawn sketch that is NOT generated from the built tree can differ from Figma — always generate it.
**How to apply:** rule lives in step 4 of `docs/v6/screen.md` (copy to `.claude/commands/screen.md`) and in CLAUDE.md. Also: never switch git branches / stash in this repo while sessions run; another session shares the folder and moved HEAD to v5 once — check `git branch --show-current` before every write; commit early on v6.
