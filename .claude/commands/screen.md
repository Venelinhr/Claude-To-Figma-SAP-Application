---
description: v5 — image or text (+ Figma file link) → Claude builds the SAP screen in Figma from a layout tree → checks it (≥ 95 % or it is a failure).
argument-hint: <image path | "text request"> <figma file or node link>
---

# /screen — v5: ask in chat, Claude builds and checks (branch `v5` only)

The bar: **≥ 95 % or it is a failure** — reference match AND SAP execution (real kit components + states, text
styles, colour variables, layer names). Reply in short plain sentences. Input: $ARGUMENTS
Work folder: `bridge-out/<job>/` (git-ignored). Time the run from the first step (report `Done in Xm Ys`).

0. **Branch** — `git branch --show-current` = `v5`, else stop: `git checkout v5`.
   **Route** — `node build/route.js "<text>"`. ACT (a small edit on a selected node) → one `use_figma` with the
   router's `act`, read back, done. Otherwise continue.
1. **Start from a gold TREE, never from zero.** `ls knowledge/gold/trees/` — pick the closest one
   (flight-results-1000 = results list with filters and cards · po-list-report-1440 = shell + filter bar + table).
   A gold tree is a dumped approved build: every frame (direction, gap, padding, size), every kit instance with
   its non-default props and inner texts, text styles and colour variables by name. Schema: header of
   `build/templates/dump-layout.use_figma.js`. New gold = an approved build → run that script (ROOT = node,
   long dumps come back in parts) → save to `knowledge/gold/trees/<name>.tree.json`.
2. **Adapt the tree** to the request (copy to `bridge-out/<job>/tree.json`):
   - **image**: `python3 build/see.py spec ref.png --out see-ref` (+ `measure-ref.py --json`) — take the numbers
     (frame size = the reference, boxes, gaps, paddings, sizes, text styles, states) into the tree. Colours by
     SAP role, never by photo. Cached reference? `shasum -a 1 ref.png | cut -c1-12` → `knowledge/plans-cache/`.
   - **text**: real business content in EVERY field — no "Placeholder", "Typed Text", "Description",
     "Product Identifier", default status words. Inputs → `pr["✏️ Placeholder"]`; Select value, Shell title,
     Object Status label, table headers → `tx` (text typed inside the instance); ID cell → `"✏️ By Text Description"`.
     Equal row heights (cells `s:"FF"`), cell wrappers get `bg: sapList_Background`. Trees you write use `sz:"x"`
     (sizing letters explicit: F fill · H hug · X fixed).
3. **First screen — show it before building:** `node build/tree.js show bridge-out/<job>/tree.json 4` → the ASCII
   picture, the layer tree, the lists (components + states, text styles, variables, icons, density) and the lint.
   Lint must say ✓ (unknown kit name, raw colour, unstyled text, generic layer name = fix first).
4. **Build — one call, no hand-written code.** Once per Figma file: `node build/render.js --install --out i.js`
   → run it (stores the runtime in the file). Then `node build/render.js tree.json --lean --out b.js` → one
   `use_figma` with its content. Returns `{nodeId, made, WARN}` — WARN must be `[]`. `'INSTALL FIRST'` → install.
   Logos: frames named like the tree node; `crop-logos.py` + `upload_assets` onto them (image fill hash only
   works inside the same file).
5. **Check — only numbers a script prints count.**
   - image: `download_assets` (png, scale 2) → `curl -s -A Mozilla/5.0 -o build@2x.png` (retry on a 74-byte
     reply); `dump-geometry.use_figma.js` → `geometry.json`; `dump-tree.use_figma.js` → `tree.json` (audit) →
     `node build/gates.js <plan> bridge-out/<job> --ref ref.png` → MATCH · HYGIENE · EYE. Look at
     `see-out/diff-sheet.png` once.
   - text: `dump-compact.use_figma.js` → `built.json` → `node build/verify-tree.js tree.json built.json`
     (every layer: component, props, inner texts, style, variables + hygiene) and one `get_screenshot` by eye.
   Save big replies with a heredoc (`cat > file <<'EOF'`), not Write — it avoids a double send.
6. **Fix** ≤ 2 rounds: small `use_figma` patches on the node AND the same change in the tree file. Re-check.
7. **Done** = PASS. Reply: node link · `MATCH n% · EYE n% · hygiene 0 · Done in Xm Ys`. Record:
   `node build/gates.js <plan> <jobDir> --ref ref.png --record "<request>" --node <id> --ms <ms>` (image), and
   an approved new screen → its tree into `knowledge/gold/trees/`.
Proven: 440:9214 (image, EYE 95 %, MATCH 100 %) · 445:9214 (text, MATCH 100 %) — 2026-09-28.
