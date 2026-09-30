# Make → Figma in two gestures: Copy design → Cmd+V in SAP Bridge → SAP frame, ready

## Context

You want the transfer to convert while it moves: in Make press **Copy design**, paste once, and get the SAP frame (real kit
components, auto layout, variables) with no Claude and no terminal, for any Make source. You also keep the Figma Agent chat
for edits after the build.

**Where the paste can go:** the Figma Agent chat is a chat box; it cannot run our converter, and I have not verified that it accepts
a Copy-design paste at all. The **SAP Bridge plugin window** can: a plugin UI receives the paste event with the clipboard content.
So the gesture is the same, "Cmd+V" — into the plugin window instead of the canvas.

**What "Copy design" carries (measured on the Flugsuche paste):** layer geometry, text, fonts, and variable bindings (165 bound fills).
It does **not** carry control types: 358 frames, 0 instances; the four "Placeholder for UI5Control" layers are 16 px icon slots.
Only tag-style names survive ("Button", "Text Input", "Heading 5", "Link", "List Item", "Navigation"). So this path is a recogniser
that guesses checkboxes, switch, select, cards and the Object Number colour. The **Share/Preview link** path reads the running app
and is exact. Both use one converter.

**Already in the repo (reuse):** `plugin/sap-bridge/` (compiled-in runtime `RUN_TREE(KIT, TREE)`, `placeTreeLogos()`, UI with paste-capable
textarea), `bridge/server.js` (always-on local node service, LaunchAgent), `build/make2tree.js` + `make-map.json`,
`build/templates/make-probe.browser.js`, `build/plugin-bundle.js` (`--check`), `.claude/skills/sap-figma-agent/SKILL.md` (edits in the Agent chat).

## What the user does

**Main flow (Path B, fastest):** Make → **Copy design** → Figma → open **SAP Bridge** → **Cmd+V** in the plugin window.
The plugin decodes the clipboard, recognises the controls, and builds the SAP frame next to your content; it lists what it could not map.

**Exact flow (Path A, when a state matters):** Make → Share/Preview link → paste it into the plugin's **Make link** field → **Build**.
The local service opens the link in headless Chrome, reads the live SAPUI5 controls, and the plugin builds the frame.

**Edits (both paths):** talk in the Figma Agent chat with the SAP skill ("make Suchen secondary"). A plugin button
**Copy tree for Agent** exists for files where the plugin cannot run.

## Step 0 — spike before building (decides Path B, ~1 hour, read-only on real data)

1. Does the plugin window receive the Figma clipboard on Cmd+V, and can it be decoded (Figma's `figma` clipboard buffer, kiwi format)?
   Test with a real Copy design of the Flugsuche app.
2. Recogniser accuracy: run the recogniser on the saved Flugsuche paste (`bridge-out/.../` metadata dump) and compare control types
   with the exact tree from Path A. Report the match as a number.
   **Gate:** if the buffer cannot be decoded, fall back to "paste on canvas, select the frame, press Convert". If accuracy is below the bar,
   Path B stays a labelled "draft" mode and Path A is the default.

## Changes

1. `build/make2tree.js` → portable `convert(dump, {kit, map, extra})` returning `{tree, images, warn}`; CLI stays a wrapper. No behaviour change.
2. `build/plugin-bundle.js` + `build/kit.js pack --all` → compile `convert()`, the map, and a full packed `KIT` (~30 KB) into
   `plugin/sap-bridge/code.js`; `--check` covers it.
3. **Path B:** plugin `ui.html` paste handler + `code.js` `pasteToDump()` (clipboard decode + recogniser) → the same control-list format as the probe → `convert()`.
4. **Path A:** `POST /make {url}` in `bridge/server.js` (no model): headless Chrome over the DevTools protocol using node's built-in
   WebSocket (no install), wait for controls, run `make-probe.browser.js`, return the dump with images as base64. Plugin "Make link" field + Build.
5. `build/make-map.json`: add Table/ColumnListItem, Dialog, ObjectStatus, ObjectHeader, RadioButton, TextArea, DatePicker, SegmentedButton;
   web-component sources (`ui5-*`) get a probe v2 with the same output format. Unmapped controls stay plain named frames plus a WARN line.
6. Docs: `docs/MAKE-TO-FIGMA.md` (the two gestures, what maps, what does not) and one line in `CLAUDE.md`.

## Verification

- Golden test `test/make2tree.test.js`: `convert()` on the saved Flugsuche dump equals today's tree (166 layers, door ✓ ALL IN).
- `node build/plugin-bundle.js --check` and `node --test test/*.test.js` pass.
- Path B end to end on a real Copy design: frame with MATCH 100 % · HYGIENE 0 · STRUCTURE 0; report control-type match vs Path A.
- Path A end to end with a real Share link: same as frame `545:37766`; logos present.
- A second Make source through both paths; every unmapped control named in WARN.
- `layout-sim.js` at 0.85× and 1.15× (overflow 0).

## Risks (said plainly)

- **Not tested:** decoding the Copy-design clipboard inside a plugin, and a real Share/Preview link. If the link needs a Figma login,
  headless Chrome cannot open it; then Path B (or the existing bookmark) is the way.
- Path B is worse than Path A by design (states are guessed). The spike puts a number on it before we ship.
- Interaction states (hover, focus) are never captured.
- The plugin holds compiled code: after a table edit run `node build/plugin-bundle.js` and reopen the plugin.
