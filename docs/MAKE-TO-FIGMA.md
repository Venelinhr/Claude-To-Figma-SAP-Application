# Make → Figma (SAP kit) — no Claude, no terminal

Turns a Figma Make app built from SAPUI5 controls into a Figma frame made of real SAP Web UI Kit components, auto layout,
text styles and Horizon variables. Deterministic: a table (`build/make-map.json`), no model.

## Fastest: paste the Make link (no extension, no bookmark)

1. Copy the link of a **published** Make app (`https://….figma.site`), or the `figma.com/make/…` link if it opens without a login.
2. In Figma open **SAP Bridge**, click the **Make → SAP** card and press **Cmd+V** (or type it in the link box and press **Build**).
3. The bridge (localhost:41778, always on) opens the link in its own headless Chrome, reads the live SAPUI5 controls and hands them to the
   plugin, which builds the frame. About 15–40 s. No model is used. The frame is captured at 1440 × 900.

Needs: Google Chrome (or Chromium / Edge) in `/Applications`, and the bridge running with the Make routes. After updating the bridge run
`node build/mailbox.js restart` once (it refuses while a build is running; `--force` overrides).

**Login limit (said plainly):** headless Chrome has an empty profile, so a link that needs a Figma login cannot be opened. A `figma.com/make/…`
editor link needs a login unless the app address is public. The plugin then says so: press **Publish** in Make and paste the `*.figma.site` link,
or use the extension below. The link is only accepted for `figma.com/make/…` and `*.figma.site` addresses (https, no port, no login in the link).

Test without Figma (in your own terminal — Claude's shell may not start Chrome):

```bash
cd ~/Downloads/Claude-To-Figma-SAP-Application
node build/make-fetch.js "https://<name>.figma.site/" /tmp/d.json      # prints: N controls · KB
node build/make-verify.js /tmp/d.json                                   # STRUCTURE ≥ 97 %, GROSS 0
```

## Other ways to copy the running app

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
Mapped today: Shell Bar (title, avatar), Side Navigation (items, icons, selection), Icon Tab Bar, Input / Search Field, Multi Combo Box, Date (Range) Picker, Table (columns, rows, cells), Grid, Button / Icon Button, Check Box,
Switch, Select, Link, Label, Object Number (state colour), Avatar, Card (shadow), Generic Tile + Numeric Content (card with header and value),
Object Status (text), Dynamic Side Content (fixed side column + flexible main), Custom List Item (full-width row), wrapped rows that break into
several lines (become a column of rows), text (size + weight → SAP text style),
colours (value + role → Horizon variable), images (placed from the copied bytes). Containers become auto layout with gap,
padding and FILL / HUG / FIXED taken from the live boxes.

**Anything else** becomes a named plain frame and is listed as `control <class> is not mapped` — never dropped silently.
Add a control: extend the `switch` in `make-convert.js` and the tables in `make-map.json`, run `node build/plugin-bundle.js`,
reopen the plugin, and run `node --test test/make2tree.test.js`.

## Layout is read from the boxes, not from the control class

The first version knew flexbox (HBox / VBox). Anything that lays out its children another way (`sap.ui.layout.Grid` floats, `sap.m.Table` table-cells,
toolbars with spacers, hidden overflow clones) was stacked vertically and the clones inflated sizes (Purchase Orders app: page header 1644 px tall,
title item 10177 px wide, table 3033 px tall). Now:

- **Any container that is not flex** (Grid, floats, plain divs): direction comes from where the children really are — one line → a row (spanning rows share
  the width like grid columns), several lines → a column of line rows. One huge gap between two groups becomes a flexible spacer.
- **sap.m.Table**: the Column headers give every column's x and width; each ColumnListItem is one row; a cell control belongs to the column its centre is in.
  Header and rows become auto-layout rows with the same cell widths (the column without a width flexes, hAlign End = right aligned, leading / trailing cell for
  the selection box / navigation arrow), so the columns line up and the table resizes.
- **Toolbar spacers** (`ToolbarSpacer`, flex-grow fillers) become real FILL spacer frames between the groups (one = start | end, two = centred middle).
- **Hidden things never enter the tree**: the probe marks a control `hid` when CSS hides it (display / visibility / opacity, own or inherited) or it sits outside an
  overflow-clipping parent; the converter also drops controls far outside the page and `HiddenElement` / `InvisibleText` helpers.
- **Unmapped input-like widgets** (ComboBox, TextArea, StepInput …) keep their box only — their inner parts (arrow icon, tokenizer) are not converted.
- A container whose children overlap along its stacking axis in Make gets a `layout:` warning ("will not match") in the plugin's list.

## Checks

- `node build/make-verify.js <dump.json>` — **run this on every new dump** (the dump is what the bookmark / extension copies; save the clipboard to a file). It converts, lets
  `build/layout-sim.js` place every node like Figma auto layout, and compares it with the box the same control has in Make. STRUCTURE (layout logic only; the gate),
  KIT DRIFT (real kit sizes; info), GROSS (a node off by > 40 px or bigger than the screen = a layout that was not understood). Exit 1 = do not paste, fix the converter first.
  Saved dumps and their floors: `test/fixtures/make-*.dump.json` (the Purchase Orders one is rebuilt from the failing Make app — replace it with a real dump when you have one).

- `node --test test/make2tree.test.js` — the converter gives the saved golden tree; the copy compiled into the plugin gives the same tree; make-verify on every saved dump (no app gets worse).
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
- **Make link in the plugin (headless Chrome)** — built (bridge routes `POST /make/fetch` + `GET /make/job`, `bridge/make-link.js`,
  `build/make-fetch.js`, plugin link box) and unit-tested (allow-list, job state machine, page decision, route auth), but **not yet run against a
  real published app**: Claude's shell may not start Chrome, so the first real run is yours (`node build/make-fetch.js <url> /tmp/d.json`).
  It cannot open a link that needs a Figma login; whether an editor link's iframe address (`app-….makeproxy-c.figma.site`) opens without a
  login is unverified.
- **Figma Agent chat** cannot open a link or run the converter, so a link pasted there cannot build the frame. It stays the place for edits
  after the build (whether it accepts a pasted tree prompt is untested).
- **Copy design → Cmd+V in the plugin** — the plugin reports what the clipboard holds, but it cannot decode a Copy-design paste yet.
  A Copy-design paste has no control types (358 frames, 0 instances), so it would be a recogniser that guesses.
- The Make app itself is not responsive below about 900 px (fixed 300 / 220 / 170 px columns in its source); the Figma frame follows
  the app as captured.
