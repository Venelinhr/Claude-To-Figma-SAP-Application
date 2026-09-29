---
description: v5 — image or text (+ Figma file link) → Claude builds the SAP screen in Figma from a layout tree → checks it (≥ 95 % or it is a failure).
model: claude-sonnet-5
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
1. **ANALYZE + DECIDE in one command (~1-2 s, no Figma, ~30 lines):** `node build/front.js <ref.png | "text request">
   --job bridge-out/<job>`. It measures the reference (`see.py spec`), picks the closest **gold tree** by the reference
   texts it already places (tie → the one the door lets in), fits it (same screen at another width → widths, gaps and
   side paddings scale, heights follow content, checked against the measured boxes), and runs the **front door**.
   Output: `1 ANALYZE` (measured facts) · `2 UNSURE` (assumptions it decided — low impact — and the questions that could
   change the screen) · `3 DECIDE` (gold, fit + check, door) · `4 PROPOSE` (next command). Read only this output —
   never open `spec.json`, the gold JSON or PNGs. New screen type with no gold (few texts placed): adapt the closest
   gold by hand from the OUT lines, never from zero. Gold trees: `knowledge/gold/trees/` (dump of an approved build,
   schema in `build/templates/dump-layout.use_figma.js`). Text jobs: real business content in every field.
   **From zero (user says "no reference / no gold", or no gold places ≥ 95 % of the texts):**
   `node build/spec2tree.js <job>/see-ref/spec.json <job>/tree.json --icons "WxH=icon,…" [--colors "#hex=token"]` —
   the measured layout becomes the tree (auto-layout where spacing is even, measured alignment, colour by role, kit
   components with their measured state). Name each `ICONS with no SAP name` from what the image shows (one quick
   decision each, real kit icons only). Then the door, as below. Always send `dump-geometry` too before `gates.js`
   (without it every SAP icon counts as a miss: 467:9740 EYE 67 % → 76 % with it).
2. **Fix every door `OUT` in one pass** (edit `bridge-out/<job>/tree.json`), re-run `node build/door.js … [--ref …]`
   until `✓ ALL IN`. Never show a plan with an OUT; never ask the user about an OUT (it is a defect, not a choice).
3. **Face control done → propose.** Only the right parts are in: real kit components with allowed states, variables
   by role, real content, explicit sizing, the reference size, every reference text and icon placed.
   **Analysis for approval — same as `main`, engine v5.** `node build/tree.js plan bridge-out/<job>/tree.json
   [--ref …/spec.json]` (its DOOR line must say ✓ ALL IN). The user does not see tool output, so write it into the reply, in this order:
   (1) **Analyze** — 2-4 lines of measured facts (from `1 ANALYZE`): size, what the screen is, floorplan, density.
   (1b) **Uncertainty & assumptions** — facts vs decided assumptions (from `2 UNSURE`), then only the questions that
   could change the screen (max 3). Confidence high → say so and ask nothing extra.
   (2) **Gate 0 — zones table** `Zone | Content | SAP component (kit name) | Key properties` — A, B, C… in Z order,
   one row per section, written from the tree's top-level frames + `see.py spec`. Logos = image crops (no SAP match).
   (3) **Wireframe + L1-L5 layer tree** — paste the `WIREFRAME` and `L1-L5` blocks of `tree.js plan` as printed
   (names = the Figma layer names; repeated rows are folded).
   (4) **SAP components table** — paste `SAP COMPONENTS` (real kit keys, states); add text styles + variables from
   `LISTS` in one line each.
   (5) **Confidence table** `Area | Conf. | Notes` with ● (sure) / ○ (guess): layout, each key component, colours,
   icons, logos, frame size. Say plainly what is not 1:1: brand colour → SAP token, text 16→14 px, no kit match.
   Anything < 85 % is named as a question, together with the door's ASK lines (max 4, most important first).
   End with ONE line: **"Approve / Reject / Modify?"**. STOP — do not build before the user says yes.
   "change" → edit `tree.json`, re-run `tree.js plan`, show only what differs, ask again. "yes" → step 4 at once.
4. **Build + check = the `screen-builder` subagent** (Agent tool, subagent_type `screen-builder`, prompt: `JOB=bridge-out/<job>
   FILE=<file key>`). It sends the build, places logos, dumps and runs the gates in ITS OWN context and returns 5 lines —
   the 20-40 KB build/dump payloads never enter this chat (451:9507 and 467:9740 cost $9-28 mostly from that).
   The steps it follows (for reference / when it is not available):
   **Build — one call, no hand-written code.** Once per Figma file: `node build/render.js --install --out i.js`
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
