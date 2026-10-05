---
name: make-engine-sync
description: "Make → Figma lives in 3 copies (Application build/make-convert.js + make-map.json, SAP Bridge v2 MAKESA block, standalone make-figma/plugin); keep them identical and prove with make-verify"
metadata:
  node_type: memory
  type: project
  originSessionId: b699ccd4-801f-46ac-a003-f63926db4525
  modified: 2026-10-05T06:18:09.513Z
---

2026-10-05: Bridge v2 cloned Make worse than the standalone "Make → Figma" plugin because the copies had drifted:
the Application repo had an old converter (453 lines, make-map.json with NO control mappings) and a builder runtime without the Make features
(`@first`/`@last` text, wrapRow, ico/hide/add/sub/ml, safe imports). Fixed: Application = source (newer Make modules copied from
"~/Downloads/Figma Make /build", runtime merged in build/templates/{sap-kit.prelude,render-tree}.js), converter + map + slim MAKE_KIT (with props!)
written into plugin-v2/code.js MAKESA block and "Figma Make /make-figma/plugin/code.js". Make links from any Bridge tab use the plugin engine.
Converter now keeps Make's measured sizes (pinPass), measured end gaps, one segment per SegmentedButtonItem, Shadow0 for faint shadows.

**Why:** the user saw "Make → Figma copies well, Bridge v2 not"; the cause was code drift, not the reading.
**How to apply:** after any Make converter/map change, re-copy into BOTH plugins (MAKE_CONVERT block, MAKE_MAP, MAKE_KIT props) and run
`node build/make-verify.js <dump>` on test/fixtures/make-*.dump.json + the user's dump (target 100 %, gross 0) and `node --test test/make2tree.test.js`.
Editing files inside "~/Downloads/Figma Make /build" was blocked by the permission check once — work in the Application repo. Related: [[plugin-first-builder]].

2026-10-05 (later): one command now syncs a plugin: `node plugin-v2/sync-make-engine.js [code.js]` (reads the Application repo: make-convert.js, make-map.json, icons-extra.json, kit.json, templates/render-tree.js). Run it for plugin-v2 AND for the standalone "Figma Make /make-figma/plugin/code.js" (blocked for me: the user runs it). Converter fixes of this day: Default Button/ToggleButton = Secondary (flat only in a toolbar, sapMBarChild), kit Segmented Button (o.seg), blank glyph = faded icon (o.fade), Object Status without icon hides the icon (o.hide + o.fit), all-auto table keeps Make's column widths (one flexible), Message Strip keeps its height, raw HTML row from the probe's computed style + "…line" element. Test: make-flight2 fixture.

2026-10-05 (popover): a Select / ComboBox popup (sap.m.Popover holding a sap.m.SelectList) was drawn as plain 16 px texts. Now `selectDrop()` in make-convert.js returns the published kit part "Drop-Down" (key d74d4ae8…, 5 item slots; "Drop-Down Item" itself is NOT published — never import it) with `dd:[{t,on}]`; runtime `_dd()` sets text/Selected, hides unused items. The sync script now replaces the Make-only runtime parts (_seg, _dd, fade, fit) fully on every run.
