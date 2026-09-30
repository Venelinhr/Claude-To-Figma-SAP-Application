# Make → Figma: paste that does not break, on the SAP Web UI Kit

## Context

You use "Copy design" in Figma Make and paste into Figma. The paste is broken.

I measured it (frame `536:21897`, file `L9bomZ4CKDmBGQfGM9C61z`):
- 358 frames, 114 text nodes, **0 instances**. 204 frames are named "Container".
- Positions are DOM numbers (x=80.5078125). No components, no auto layout, no SAP styles.
- 4 layers are named `Placeholder for UI5Control` — the capture itself gave up on them.

Why: the Make app (`0E2ryf7Th1ca7tBUUWLB8D`) is built with **real SAPUI5 controls**
(`sap.tnt.ToolPage`, `sap.f.DynamicPage`, `sap.m.Input`, …, Horizon, Compact).
"Copy design" only takes a picture of the DOM. It cannot know that a `<div>` is a Shell Bar.
That is Figma's closed capture. **We cannot change it.**

So the fix is not a better paste. The fix is: **rebuild** the screen from what we know is true.
- Meaning (which control, which state, which text) = Make source `App.tsx` + `index.css`.
- Position and size = the pasted frame (same file, already there).
- Parts = SAP Web UI Kit (already linked to the file; keys found — see table).

You already own the second half of this: `/Users/C5408360/Downloads/Claude-To-Figma-SAP-Application`
(branch `v5`): `door.js` (face control), `render.js --lean` (real instances + auto layout in one `use_figma`),
`gates.js` / `structure.js` (MATCH · EYE · STRUCTURE), `knowledge/live/kit.json` (151 components, real keys).
What is missing is one input: **Make**. Today it takes only an image or text.
I add that input. I do not build a new engine.

## What we build (in the v5 project)

| New file | Job |
|---|---|
| `build/make-map.json` | UI5 control → kit component + props + text style + colour role. One table for every Make app that uses `@sap/sap-web-ui-make-kit`. |
| `build/make-geo.js` | Pasted frame dump (`dump-geometry`) → `spec.json` in the same shape `see.py spec` writes. Lets `spec2tree.js`, `door.js`, `gates.js`, `structure.js` take the paste as the reference, unchanged. Also lists the image fills (logo hashes). |
| `.claude/commands/make-screen.md` | `/make-screen <pasted node link> [make link]` — the one command you run after paste. |
| `knowledge/gold/trees/fly-booking-1387.tree.json` | The approved result, saved as gold for next time. |
| 1 line in `CLAUDE.md` | Points to `/make-screen`. |

No change to `door.js`, `render.js`, `gates.js`. Reuse only.

## UI5 → SAP Web UI Kit (keys from `search_design_system`, library "SAP Web UI Kit")

| Make (UI5) | Kit component | Key |
|---|---|---|
| ToolHeader (menu, logo, title, bell, avatar) | Shell Bar + Icon Button + Avatar | `169cfd74…` · `c1ee1ca7…` · `71a3389e…` |
| SideNavigation + 4 items | Side Navigation | `d680af6d…` |
| IconTabBar (3 tabs) | Icon Tab Bar | `4aafcbf5…` |
| Input ×4 (+ Label + icon) | Input (+ kit icon) | `0f4366cb…` |
| Button Emphasized "Suchen" | Button, Type Primary | `91805fa1…` |
| CheckBox ×9 | Check Box | `23b4a2ca…` |
| Switch | Switch | `c63509f6…` |
| Select "Sortieren nach" | Select | `5ce369ff…` |
| Card ×4 (watch card + 3 flights) | Card | `76fbadb9…` |
| ObjectNumber (Success / None) | Object Number | `7b67d22e…` |
| Link | Link | `2e67b539…` |
| Title H2–H6 / Text | kit text styles (font "72" only through styles) + `sapTextColor`, `sapContent_LabelColor`, `sapPositiveTextColor` | `kit.js t/v` |
| DynamicPage / Title / Header | **no kit match found** (search returned 503 — re-check first). Fallback = plain auto-layout frames + Horizon variables. | — |
| `.flyDateTile` (price chip) | no kit control. Auto-layout frame; the CSS already names the tokens: `sapList_BorderColor`, `sapList_Background`, `sapList_SelectionBackgroundColor`, `sapContent_Selected_ForegroundColor`. | — |
| `sap.m.Image` (3 airline logos, SAP logo) | image frame. Copy `imageHash` from the paste (same file → works, no upload). | — |

Density = Compact (`sapUiSizeCompact` in source). Theme = Horizon Light.
I confirm every key and prop with `node build/kit.js c <Name>` before use — never from memory.

## Steps

0. **Setup.** `change_directory` to the v5 project. Check `git branch --show-current` = `v5`. Check kit cache
   freshness (`build/check-registry-freshness.js`; kit.json vs library 1.149) — re-extract if stale.
1. **Baseline (read-only).** `dump-geometry` + `dump-tree` on `536:21897` → numbers to beat (0 instances).
   Save screenshot @2x as the reference `ref.png`.
2. **Map.** Write `make-map.json` from `App.tsx` + `index.css` + `kit.json`. Verify each key/prop/state.
3. **Geometry.** Write `make-geo.js`; run it on the dump → `spec.json`. Merge the real content from `App.tsx`
   (German texts, prices, states: Success on 33 €, selected tile "Sa., 3. Okt.", Switch off, `AM` avatar).
4. **Tree.** `spec2tree.js` from-zero (closest gold `flight-results-*` is a hint only — other language, other layout),
   plus the mapping above. Auto layout with FILL/HUG, no free placement. Fix every door `OUT`
   until `✓ ALL IN`. Run `layout-sim.js` at `--scale 0.85` and `1.15` (must resize).
5. **Show + approve.** One message with the ASCII wireframe, L1–L5 layer tree, SAP components table,
   confidence table (your own `/screen` rule). Build after your "yes".
6. **Build.** `render.js --install` once, then `render.js tree.json --lean` → one `use_figma`. New frame
   **next to** the paste, named `Flugsuche — SAP kit`. The paste stays (nothing deleted).
   Logos: `imageHash` from the paste.
7. **Verify** (below). At most 2 fix rounds, each one `use_figma` plus the same edit in `tree.json`.
8. **Make it repeatable.** `make-screen.md`, `CLAUDE.md` line, tree → gold. Record with `gates.js --record`.

## Verify (numbers, not eyes)

- `door.js` → `✓ ALL IN`. `layout-sim.js` at 0.85 / 1.15 → OVERFLOW 0.
- `gates.js` with `--ref` = paste screenshot: MATCH ≥ 95 %, EYE ≥ 95 %, HYGIENE 0, STRUCTURE 0.
- Read-back on the new frame: INSTANCE count (expected ≥ 30: shell, nav, 3 tabs, 4 inputs, button, 9 checkboxes,
  switch, select, 4 cards, 3 object numbers, links, avatar); `Placeholder for UI5Control` = 0;
  every container `layoutMode ≠ NONE`; every text has a text style; fills bound to Horizon variables; no raw hex.
- Resize the new frame 1387 → 1024 → 1440 wide: no overlap, no clipped text.
- One side-by-side screenshot: new frame vs paste.

## Risks (said plainly)

- The "Copy design" button stays as is. The paste is still broken; it becomes the position reference only.
- `Dynamic Page` and `Label` were not verified in the kit (search 503). If missing → plain frames, listed as such.
- Kit instances have fixed inner sizes (Input 32 px Compact). EYE may not reach 100 %; a gap I cannot close is named, not hidden.
- `send.js` (plugin path) needs SAP Bridge open in the file. If not open, I use `render.js --lean` through `use_figma`.
- Your `/screen` rule makes me stop for approval at step 5. That is one pause, on purpose.
