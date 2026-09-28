---
description: v5 — image or text (+ Figma file link) → Claude builds the SAP screen in Figma from a layout tree → checks it (≥ 95 % or it is a failure).
argument-hint: <image path | "text request"> <figma file or node link>
---

# /screen — v5: ask in chat, Claude builds and checks (branch `v5` only)

The bar: **≥ 95 % or it is a failure** — reference match AND SAP execution (real kit components + states, text
styles, colour variables, layer names). Reply in short plain sentences. Input: $ARGUMENTS
Work folder: `bridge-out/<job>/` (git-ignored). Time the run from the first step (report `Done in Xm Ys`).

**Budget — cheap and fast, same quality** (every turn re-sends the whole chat, so turns × chat size = the bill;
run 451:9507 took 219 turns / 34 min / $9.5 for one screen):
- Target ≤ 40 turns, ≤ 10 min. Start `/screen` in a fresh session (`/clear` first).
- Never hand-write or edit build code. Send the generated `i.js` / `b.js` as they are: `cat` once, paste the
  content into `use_figma`. A guard-hook block on it = a bug to report, not a thing to patch around.
- Never open a PNG in the chat (`build@2x.png`, `diff-sheet.png`, `zooms.png`, screenshots) — each one is
  re-sent on every later turn. The scripts print the result as text. To see one doubt, crop ≤ 400 px:
  `python3 -c "import cv2;i=cv2.imread('build@2x.png');cv2.imwrite('c.png',i[y0:y1,x0:x1])"` and look at `c.png`.
- No probe calls (one `use_figma` per property to "check"). Read the dump files instead.
- Do not chase lines marked `SAP LOOK`, `(brand→SAP)` or `EXTRA` — they are expected.

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
     (frame size = the reference, boxes, gaps, paddings, sizes, text styles, states) into the tree.
     **Build at the reference size — never snap an image job to 1024/1280/1440** (the EYE check compares
     layout 1:1; 451:9507 built at 1280 for a 1159 reference and scored 49 %). Text steps down per the spec (16→14). Colours by
     SAP role, never by photo. Cached reference? `shasum -a 1 ref.png | cut -c1-12` → `knowledge/plans-cache/`.
   - **text**: real business content in EVERY field — no "Placeholder", "Typed Text", "Description",
     "Product Identifier", default status words. Inputs → `pr["✏️ Placeholder"]`; Select value, Shell title,
     Object Status label, table headers → `tx` (text typed inside the instance); ID cell → `"✏️ By Text Description"`.
     Equal row heights (cells `s:"FF"`), cell wrappers get `bg: sapList_Background`. Trees you write use `sz:"x"`
     (sizing letters explicit: F fill · H hug · X fixed).
3. **FRONT DOOR — face control, before the user sees anything.** `node build/door.js bridge-out/<job>/tree.json
   [--ref bridge-out/<job>/see-ref/spec.json]` (local, < 1 s, no Figma). Only the right parts get in: real kit
   component, real prop names, allowed state values, no kit placeholder text or default icon on show, colour
   variables by role (text ink · fill · border), no fake components, explicit sizing, and with a reference: the
   reference size, every reference text placed, the icons placed. Every `OUT` = fix the tree and run the door
   again — never show a plan with an OUT, never ask the user about an OUT. `ASK` lines (brand colour role,
   density, icon shapes with no SAP match) go to the user in the approval message. Be quick: fix all OUT in one pass.
   **Analysis for approval — same as `main`, engine v5.** `node build/tree.js plan bridge-out/<job>/tree.json
   [--ref …/spec.json]` (its DOOR line must say ✓ ALL IN). The user does not see tool output, so write it into the reply, in this order:
   (1) **Reading** — 2-4 lines: image size (retina → real size), what the screen is, floorplan, frame size, density,
   which gold tree it starts from.
   (2) **Gate 0 — zones table** `Zone | Content | SAP component (kit name) | Key properties` — A, B, C… in Z order,
   one row per section, written from the tree's top-level frames + `see.py spec`. Logos = image crops (no SAP match).
   (3) **Wireframe + L1-L5 layer tree** — paste the `WIREFRAME` and `L1-L5` blocks of `tree.js plan` as printed
   (names = the Figma layer names; repeated rows are folded).
   (4) **SAP components table** — paste `SAP COMPONENTS` (real kit keys, states); add text styles + variables from
   `LISTS` in one line each.
   (5) **Confidence table** `Area | Conf. | Notes` with ● (sure) / ○ (guess): layout, each key component, colours,
   icons, logos, frame size. Say plainly what is not 1:1: brand colour → SAP token, text 16→14 px, no kit match.
   Anything < 85 % is named as a question, together with the door's ASK lines (max 4, most important first).
   End with ONE line: **"Approve and build? (yes / change: …)"**. STOP — do not build before the user says yes.
   "change" → edit `tree.json`, re-run `tree.js plan`, show only what differs, ask again. "yes" → step 4 at once.
4. **Build — one call, no hand-written code.** Once per Figma file: `node build/render.js --install --out i.js`
   → send its content (stores the runtime in the file). Then `node build/render.js tree.json --lean --out b.js` →
   one `use_figma` with its content, unchanged. Never the full (non-lean) build. Returns `{nodeId, made, WARN}` — WARN must be `[]`. `'INSTALL FIRST'` → install.
   Logos: frames named like the tree node; `crop-logos.py` + `upload_assets` onto them (image fill hash only
   works inside the same file).
5. **Check — only numbers a script prints count.**
   - image: `download_assets` (png, scale 2) → `curl -s -A Mozilla/5.0 -o build@2x.png` (retry on a 74-byte
     reply); `dump-geometry.use_figma.js` → `geometry.json`; `dump-tree.use_figma.js` → `tree.json` (audit) →
     `node build/gates.js <plan> bridge-out/<job> --ref ref.png` → MATCH · HYGIENE · EYE. Read the printed
     lines (and `see-out/fix.md`), not the pictures.
   - text: `dump-compact.use_figma.js` → `built.json` → `node build/verify-tree.js tree.json built.json`
     (every layer: component, props, inner texts, style, variables + hygiene) and one `get_screenshot`
     (`maxDimension: 800`) by eye.
   Save big replies with a heredoc (`cat > file <<'EOF'`), not Write — it avoids a double send.
6. **Fix** ≤ 2 rounds: ONE `use_figma` per round with all fixes on the node, AND the same change in the tree
   file. Re-check. After round 2 stop and report what is left — no round 3.
7. **Done** = PASS. Reply: node link · `MATCH n% · EYE n% · hygiene 0 · Done in Xm Ys`. Record:
   `node build/gates.js <plan> <jobDir> --ref ref.png --record "<request>" --node <id> --ms <ms>` (image), and
   an approved new screen → its tree into `knowledge/gold/trees/`.
Proven: 440:9214 (image, EYE 95 %, MATCH 100 %) · 445:9214 (text, MATCH 100 %) — 2026-09-28.
