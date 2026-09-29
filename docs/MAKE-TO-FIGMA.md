# Make → Figma (SAP kit) — no Claude, no terminal

Turns a Figma Make app built from SAPUI5 controls into a Figma frame made of real SAP Web UI Kit components, auto layout,
text styles and Horizon variables. Deterministic: a table (`build/make-map.json`), no model.

## The steps (about 15 seconds)

1. Open the running Make app **in its own browser tab** at a desktop width (1280 px or more — the frame is built at the width the page has).
2. Click the **Make → SAP** bookmark. It says how many controls it copied.
3. In Figma open **SAP Bridge** and press **Cmd+V** (or drop the `.json`). The frame appears next to your content, the plugin lists
   anything it could not map, and **Show in canvas** jumps to it.

Then edit by talking in the **Figma Agent chat** with the SAP skill (`.claude/skills/sap-figma-agent/SKILL.md`): "make Suchen secondary".

## If the bookmark does nothing: use the Chrome extension

Figma Make preview pages set a Content-Security-Policy that blocks `javascript:` bookmarks (the DevTools console is not blocked). The extension
injects the same probe through `chrome.scripting` into every frame of the tab, so it also finds the app inside the `figma.com/make` preview.

```bash
node build/make-extension.js        # writes bridge-out/make-extension/
```

Chrome → `chrome://extensions` → Developer mode → Load unpacked → `bridge-out/make-extension`. Then open the app with **Play** and click the
extension button; it copies the design and says how many controls. In Figma: click inside SAP Bridge, **Cmd+V**. Do not copy the alert text
yourself — that replaces the clipboard. After rebuilding the extension press the reload arrow on `chrome://extensions`.

## One-time setup

```bash
node build/make-bookmarklet.js      # writes bridge-out/make-bookmarklet.html — drag its link to the bookmarks bar
node build/plugin-bundle.js         # only after changing make-map.json / make-convert.js / the runtime; then reopen SAP Bridge
```

Import the plugin once: Figma → Plugins → Development → Import plugin from manifest → `plugin/sap-bridge/manifest.json`.

## What it does with each control

`build/make-map.json` holds the tables; `build/make-convert.js` holds the logic (pure, also compiled into the plugin).
Mapped today: Shell Bar (title, avatar), Side Navigation (items, icons, selection), Icon Tab Bar, Input, Button / Icon Button, Check Box,
Switch, Select, Link, Label, Object Number (state colour), Avatar, Card (shadow), Generic Tile + Numeric Content (card with header and value),
Object Status (text), Dynamic Side Content (fixed side column + flexible main), Custom List Item (full-width row), wrapped rows that break into
several lines (become a column of rows), text (size + weight → SAP text style),
colours (value + role → Horizon variable), images (placed from the copied bytes). Containers become auto layout with gap,
padding and FILL / HUG / FIXED taken from the live boxes.

**Anything else** becomes a named plain frame and is listed as `control <class> is not mapped` — never dropped silently.
Add a control: extend the `switch` in `make-convert.js` and the tables in `make-map.json`, run `node build/plugin-bundle.js`,
reopen the plugin, and run `node --test test/make2tree.test.js`.

## Checks

- `node --test test/make2tree.test.js` — the converter gives the saved golden tree; the copy compiled into the plugin gives the same tree.
- `node build/plugin-bundle.js --check` — the plugin is not stale.
- `node build/door.js <tree.json>` — every part is a real kit component with allowed states and variables; the layout must resize.

## Raw HTML and content inside tab bars

`sap.ui.core.HTML` controls give only a markup string: the converter reads its text, flex direction, gap, padding, weight, size and a left
accent border (banners, titles, "Werbung" labels). Text-less HTML (dividers, colour bars) becomes a fixed-size frame. A tab bar that holds
its content (cards, lists) keeps the content under the tab headers. A Panel is drawn white with its corner radius (UI5 paints the white on an
inner element the probe does not read). A DynamicPageTitle with an action toolbar becomes one row: heading | buttons.

## What is not covered (said plainly)

- Only what is on screen: hover, focus and other interaction states are not captured.
- Sources built from UI5 **Web Components** (`ui5-*` tags) need a second probe — not built yet.
- **Make link in the plugin (headless Chrome)** — `build/make-fetch.js` is written but **untested**: launching Chrome with a
  debugging port was blocked in the session that built it, so no bridge route or plugin field uses it yet.
- **Copy design → Cmd+V in the plugin** — the plugin reports what the clipboard holds, but it cannot decode a Copy-design paste yet.
  A Copy-design paste has no control types (358 frames, 0 instances), so it would be a recogniser that guesses.
- The Make app itself is not responsive below about 900 px (fixed 300 / 220 / 170 px columns in its source); the Figma frame follows
  the app as captured.
