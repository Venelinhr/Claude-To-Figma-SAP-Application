# SAP Figma Build System v4 — read this file only

**Branch must be `v4`.** If `git branch --show-current` is not `v4`, stop and tell the user
`git checkout v4` — `main` is the old v2 system (18 min / 59k tokens per screen), `v3` is history.
v2 is archived in `.archive-v2/`; it is not loaded. This file is the whole system. The v4 idea
and the evidence behind it: `docs/V4-PLAN.md`.

## v4 in one line — Claude Code plans, the Figma Agent builds, Claude Code checks
Targets: **MATCH ≥ 90%** (audit-plan score), plan session **≤ 12k tokens / ≤ 5 min**, **≤ 1 fix
round**. Fail twice on one step → switch approach or ask. Proven: plan→paste build 301:7074 = $2;
all-in-one terminal build 286:5646 = $8 and worse; main-branch build 291:6032 = 18 min, placeholders.

| Step | Where | Command |
|---|---|---|
| 1. image → validated plan on the clipboard | Claude Code | `/plan-screen <image>` |
| 2. build the pasted plan (PLAN MODE) | Figma Agent | paste + the build line `/plan-screen` prints |
| 3. dump → MATCH % → logos → fix list | Claude Code | `/check-build <node link>` |
| 4. apply the fix list, re-check once | Figma Agent → Claude Code | paste, then `/check-build` |
| small edits later | Figma Agent | ACT mode (one short call, ~11 s) |

Never build a new screen from a prompt alone in Figma, never give the Figma Agent a file path
(it cannot read files — it invents), never copy JSON out of the terminal (use `pbcopy`).

## The workflow in detail (what `/plan-screen` and `/check-build` run)

1. **Measure** the reference for real: `python3 build/measure-ref.py <image> --json > ref.json`
   (and without `--json` to read it). Use the READ tree, ACCENTS (measured colours of text/
   icons → `ref_hex`) and COLOURS. The BOXES labels (`guess()`) are hints only, never the plan.
2. **Read it like a person — Z pattern.** Top-left → right, then down. Split the image into
   **sections** (A, B, C…); sections side by side form one band, read left → right. For each
   section **first describe it in plain words, like a person, with positions** — e.g. *"A: two
   lines of text, the top one bold and bigger; far right two icons (favourite, share). B: three
   cards; each has a radio button on the left and the title next to it, under it the price, then
   a divider, then an icon and the text next to it…"* — then write: box, layout (row/column/grid +
   FILL/HUG/FIXED), the SAP components it uses,
   the recipe (`router-table.json` → `patterns`). Plus the **frame**: size, breakpoint, density,
   floorplan. Small things belong to the section they sit in (e.g. heart/share above a card).
3. **Element plan.** One row per visible element, in Z order: `section`, `group` (card / row /
   leg), `kind` (text · component · icon · logo · divider · container), SAP value, **colour
   role** (never a colour picked by photo), `ref_hex` for coloured text, `meaning` for icons,
   `crop` for logos, `ask` when SAP has no match. Worked example — copy its shape:
   `knowledge/gold/plans/flight-ticket-selection.plan.json`.
   **Start from gold:** `node build/route.js --closest-gold ref.json "<words in the image>"` — if it
   names a gold plan, adapt that plan instead of writing from zero. Repeat image → `knowledge/plans-cache/`.
4. **Validate:** `node build/route.js --plan plan.json --map --min`. Exit 1 = fix the listed rows first.
   It checks Z order, real components/props/text styles, **colour by role** (selected border
   = `sapList_SelectionBorderColor`, link = `sapLinkColor`, warning text = `sapField_WarningColor`,
   CTA = Button `Type=Primary` — never a painted brand colour), **one SAP icon per meaning**
   (`icon_meanings`; extra icons in `knowledge/live/icons-extra.json`), a crop for every logo.
   Then `node build/route.js --plan plan.json --map` = the SAP proposal per section (what you
   see → component · state · text style · colour variable) + an ASCII of the sections + up to 3
   suggestions. `--min` writes `plan.min.json` → hand off with `pbcopy < plan.min.json`.
5. **Build** — by the Figma Agent from the pasted plan (PLAN MODE in its skill). Claude Code builds
   itself only when asked, with the runtime (below). Logos: `python3 build/crop-logos.py plan.json
   ref.png logos/` → `upload_assets` onto the logo frames (crops are in frame px).
6. **Audit — both gates:** (a) dump the build with `build/templates/dump-tree.use_figma.js`
   (read-only) → `node build/audit-plan.js plan.json tree.json` → `MATCH NN%` + HYGIENE
   (non-72 font, raw colour, placeholders, default globe/info icons, "Frame" names; kit
   internals skipped). Exit 0 = MATCH ≥ 90% and 0 hygiene. (b) optional pixel checklist:
   `python3 build/audit-screen.py <reference> <build.png>` (use its lists, never its score).
7. **Fix** the lines (hygiene first), re-audit once. **Done** = audit-plan exit 0. Then the plan
   goes to `knowledge/plans-cache/<sha>.plan.json`; if the user calls it gold, to `knowledge/gold/plans/`.
   Never call a build "1:1" by eye alone.

**Build hygiene:** reuse only approved/gold frames — never an unaudited or "UNBOUND" frame as a
structural reference. One model for the whole build (plan and build on the same model).

**Do not gate on the TOTAL score or the POSITION/SIZE numbers.** As of this build, the
box-finder the score is built on (`guess()` in `measure-ref.py`) classifies the same
element differently between the reference and the build often enough that a genuinely
1:1 screen can score 4/10. That's the tool being wrong, not the screen — confirmed by
side-by-side comparison on this exact build. Trust the score only after the box-finder
itself is rewritten to classify deterministically (tracked, not yet done); until then,
verify the finished screen against the reference by eye (a scaled side-by-side image),
using the audit's MISSING/WRONG COLOUR/EXTRA lists as a checklist, not its number.

## The one rule

**Every component, token, text style, and icon comes from `knowledge/live/kit.json`.**
That file is a direct, checksummed export of the real SAP Web UI Kit (Figma file
`SILcWzK5uFghKun9jx6D7c`) — 151 components with real hashed property keys and real
variant values, 142 design tokens, 25 text styles, 61 icons. Never guess a key. Never
type a bare property name like `"text"` or `"enabled"` — the real key looks like
`✏️ Text#145508:461`.

Look things up instantly, no Figma call needed:
```bash
node build/kit.js c Button          # a component's real key + every prop + values
node build/kit.js list Button       # find the right component by page/name
node build/kit.js v sapField         # tokens matching a name fragment
node build/kit.js hex '#0070f2'      # nearest SAP colour token to a measured hex
node build/kit.js t H4               # text styles matching a name
node build/kit.js i search           # icon name → key
node build/kit.js pack Button Input sapBackgroundColor add
  # → prints `const KIT = {...}` ready to paste into a build script
```
If `kit.js` says a component/token/icon isn't found, it genuinely doesn't exist in the
kit under that name — search with `list`/`v`/`i` before assuming, never invent one.
Refresh the cache only when the SAP kit itself changes: re-run the 3 scripts in
`build/templates/extract-kit-*.use_figma.js` against the kit file, save the JSON parts
they return into `knowledge/live/parts/`, then `node build/kit-merge.js`.

## Reading a reference image — get real numbers, not guesses

```bash
python3 build/measure-ref.py <image.png>                       # whole-screen layout tree
python3 build/measure-ref.py <image.png> --crop x,y,w,h --depth 5   # zoom into one region
```
Outputs, in real px: dominant colours → nearest SAP token, 1px rule lines (dividers,
header edges) with position, and a recursive layout split (XY-cut) showing every
region's box, background token, padding, and the gaps between its children. Use this
BEFORE picking components — it tells you the actual spacing scale in the image (8, 16,
24, 32px…) so you set real `itemSpacing`/padding instead of eyeballing.

The first line is `FRAME → build W×H · row pitch → Compact|Cozy`. **Snap the size to SAP
standards when it's a full screen:** desktop M 1024 · L 1280 · XL 1440, tablet 768 — keep the
measured height. A component crop (card, dialog, section) keeps its measured size rounded to
8. An odd shape that might be mobile/tablet → ask the user before building. Density follows
the image: ~26px buttons / 32px rows → Compact, ~36px buttons / 44px rows → Cozy (both may mix).

## Gold screens — learn from local numbers, not live Figma

`knowledge/gold/gold-screens.md` holds the measured structure of 16 PM-approved screens
(shell, per-floorplan paddings/gaps, components, text styles). Read it; don't re-open the
gold nodes (costs tokens). Refresh only if a gold screen changes:
`build/templates/study-gold.use_figma.js` (read-only, set `IDS`, one call per file).
Side menu = kit `Side Navigation`, always, unless the user asks otherwise.

## Floorplan pick — one line, from the shape of the ask

| Task shape | Floorplan |
|---|---|
| Manage one record's fields | Object Page |
| Browse/filter many records | List Report |
| Short linear create flow | Wizard-in-Dialog |
| Commit one decision | Dialog |
| Tune something without losing context | Drawer |
| Scan KPIs/numbers | Overview |

Shell (Shell Bar + Side Navigation) on every full screen. Skip it for a component-level
reference (a card, dialog, or section crop) — then match that crop's size.

**Route first — Jev typed router, 0 tokens.** Before anything else run
`node build/route.js "<request>"`. It returns the mode (ACT / QUICK / THINK / SPLIT),
floorplan, SAP component + real key, the real state prop/value, and for ACT the `act`
object (`A`). Follow its `handler`; do not re-decide what it decided. ACT = one `use_figma`
call: the skill's CALL with `A` filled (code saved in the file; INSTALL once per file) — no
measure, no plan, no screenshot, one-line reply. THINK with an image = workflow steps 1-7
above: the router's image gate is the **element plan** (`node build/route.js --plan`), not
the box labels. Tables: `build/router-table.json` (edit there, then `node build/gen-router.js`).
Candidates → ask, never guess.

The Figma-side twin of these rules is `.claude/skills/sap-figma-agent/SKILL.md` (uploaded
into Figma's Agent panel). Change one → change the other, then re-upload the skill.

## Building — the runtime, not raw Plugin API calls

Paste `build/templates/sap-kit.prelude.js` at the top of every `use_figma` build call,
plus a `const KIT = {...}` from `node build/kit.js pack <names>`. It gives you:

```js
await I('Button', {Type:'Primary', Text:'Save', 'Icon Left':true, Icon:'add'})
await T('Section title', 'H4/Bold', 'sapTitleColor')
await fill(node, 'sapBackgroundColor')      // never raw hex
await stroke(node, 'sapList_BorderColor', {b:1})
const f = AL('VERTICAL', {name:'Card', gap:16, p:32})   // auto-layout, real token names ok for gap/p
put(f, child, 'FILL')
```
`I()`/`setP()` resolve every prop name and value against the live component's real
definitions — a typo or wrong value is pushed to a `WARN` array instead of silently
no-opping. **Return `WARN` from every build.** A build with a non-empty `WARN` is not
done; fix it before handing off.

One guard hook enforces this (`.claude/hooks/guard-build-v3.sh`): any `use_figma` call
that creates nodes and skips the runtime, or paints raw hex / raw fonts, is blocked with
the fix inline. No wireframe-approval ceremony, no marker files, no multi-turn gates —
if the code is real SAP instances with real tokens, it goes straight to Figma.

## Auto-layout sizing — every node needs an explicit decision

Never leave a node's `layoutSizingHorizontal`/`layoutSizingVertical` at the Plugin API
default. For every auto-layout node decide, on purpose:
- **HUG** — sizes to its own content (a label, a button, a route-text line that must
  never truncate).
- **FILL** — takes its share of the parent's remaining space (a form field in a row of
  4, a spacer that pushes a sibling to the far edge).
- **FIXED** — a specific px width the design calls for (a logo badge, a price column).

**Centering B between A and C needs *two* flexible (`FILL`) spacers — one before B, one
after** — not one. A single spacer only pins B's position; it does not center it, because
it absorbs 100% of the leftover space on one side only. Two equal `FILL` spacers split
the leftover space evenly on both sides of B.

**A `FILL` sibling competing with `FILL` spacers for the same axis will shrink** if its
content is long — set that sibling to `HUG` so it keeps its natural width and let only
the spacers stretch/shrink.

Whenever you change one row's spacer/sizing setup, audit the *whole* auto-layout tree in
one pass (`figma.currentPage` walk, dump `layoutMode`/`sizingH`/`sizingV`/paddings for
every node with `layoutMode !== 'NONE'`) rather than fixing nodes one at a time as they're
noticed — a single miss (see "Known pitfalls") can silently zero out padding or a border
on an unrelated node several steps later.

## Close to SAP — colours, font size, icons, components, all checked against the kit

"Close to the reference image" is not the standard — **close to the SAP design system
is.** The audit checks every one of these against the kit's real values, not against
raw reference-photo pixels:
- **Colours** → resolved to a real SAP token, and the *semantically right* token for
  that role (a border token for a border, not whatever wins on raw RGB distance).
- **Font size** → snapped to a real SAP text-style size (12/14/16/20/24/32/48 —
  `measure-ref.py`'s `nearest_text_size()`), never reported as a raw pixel guess.
- **Components** (Switch, Check Box, Button, Input, Select, Field) → their height is
  checked against the real Compact/Cozy height pulled from the kit
  (`COMPONENT_HEIGHTS` in `measure-ref.py`) — the audit's DENSITY score. A checkbox
  built at Cozy (22px) when the reference is Compact (16-18px) is a real, catchable
  defect, found exactly this way.
- **Icons** → the real kit icon, correctly shaped (see "icons distort" pitfall below).
- **Use real SAP component instances for everything that is a UI element.** Only a
  plain, unstyled auto-layout `FRAME` is allowed as a generic container/spacer (a row,
  a column, a flex spacer). Never build a fake button/input/chip/badge out of a raw
  frame + rectangle + text when the kit has the real component — look it up with
  `kit.js` first.

## Known pitfalls — hit once this session, now permanent rules

- **Setting `strokeWeight` via individual side weights** (`strokeTopWeight` etc.) instead
  of the uniform `strokeWeight` property leaves the other 3 sides at 0 — a border that's
  "there" in the props but invisible on 3 of 4 sides. Same failure mode for padding: a
  helper that sets only some `padding*` fields silently zeroes the rest if it doesn't set
  all 4 explicitly. **Always set all 4 sides of stroke weight and padding together, even
  when they're meant to be equal.**
- **A component crop with no border/fill match in the kit's cached ~217/1537 tokens** —
  the nearest-RGB-distance token can be semantically wrong (e.g. an icon color token
  matched to a border by distance alone). When a color audit flags something, resolve the
  *real* token by sampling the reference pixel directly and searching
  `search_design_system` for the semantically right token (border/separator/tile — not
  whatever wins on raw distance), not just the nearest cached hex.
- **Icons distort if resized right after `createInstance()`**, especially composite
  icons (more than one vector, like `travel-itinerary`). Recolor the inner vector fill
  first; only resize if the component's *native* size already needs no change, or test on
  a throwaway clone first.
- **The audit's `ink` colour check is unreliable — don't gate on it.** `ink_colour()`
  reports whichever pixels have the strongest contrast inside a box (text, an icon, a
  stray separator line — whichever "wins" in that specific render), which is not the
  same visual property between two independent renderings of similar content. Traced on
  a confirmed 1:1 screen: `ink` mismatches averaged Δ237 vs `edge`(border)'s Δ165 and
  were the main reason a correct screen scored colour=0. `audit-screen.py` no longer
  compares `ink` for this reason — only `edge` (border) and `fill`, which are real,
  stable properties of the box.
- **The audit's TOTAL/POSITION/SIZE score can still be wrong even after the reading-
  order rewrite** — its box-finder (`guess()`/`find_boxes()`) can label the same visual
  element differently between the reference and the build, which cascades into false
  reorders. Trust MISSING / WRONG COLOUR / WRONG DENSITY / EXTRA as the real checklist;
  confirm a finished screen against the reference by eye, always.
- **A component's internal nodes (inside a locked instance) can't have new children
  appended** — Figma refuses `insertChild`/`appendChild` into an instance's internals.
  Existing instance properties (padding, fills on nodes that are already there) CAN be
  overridden — that's how the search-field icons got their left-padding room. An icon
  that must sit *inside* a locked instance needs to be a sibling positioned with
  `layoutPositioning = 'ABSOLUTE'` and manual x/y instead.
- **Never delete an unfamiliar node without checking what it actually is first** — a
  plain-looking `RECTANGLE` named "image N" with an `IMAGE` fill can be a real cropped
  brand asset (an airline logo pulled from the reference), not junk. If the kit has no
  equivalent component for something in the reference (SAP has no airline logos), crop it
  from the reference image itself and place it as an image fill — don't fake it with a
  flat color swatch, and don't delete it without confirming it's disposable.
- **A design-system component set can be missing a slot the reference needs** (e.g. a tab
  bar with only 2 tab instances when the reference shows 3) — clone an existing slot child
  rather than fighting the component's variant properties for one that doesn't exist.
- **A small element between two bigger ones is easy to miss building from memory of "the
  fields I remember"** — the audit's own box-finder found a real swap-icon (⇄) button
  between two search fields that never got built, only surfaced while verifying the audit
  tool itself, not while building. The real fix: before building, walk the measured BOXES
  list from `measure-ref.py` top to bottom and account for every single entry — including
  ones smaller than a normal component — not just the obvious named fields/sections. A
  missing small icon doesn't break the layout enough to notice by eye; it only shows up
  in the measured box count.

## Handoff

End every build with: the Figma node link (`figma.com/design/.../?node-id=...`), the `WARN`
array (empty = clean), and the `/check-build` result: `MATCH NN%` + `HYGIENE (0)`. Done = ≥ 90%
and 0 hygiene. The `audit-screen.py` lists are a checklist; never report its score as the result.
