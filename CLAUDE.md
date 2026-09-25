# SAP Figma Build System v3 — read this file only

v2 (39 hooks, 8 gates, ~3,900 lines across 6 docs) is archived in `.archive-v2/` for
reference. It is not loaded. This file is the whole system.

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

## Floorplan pick — one line, from the shape of the ask

| Task shape | Floorplan |
|---|---|
| Manage one record's fields | Object Page |
| Browse/filter many records | List Report |
| Short linear create flow | Wizard-in-Dialog |
| Commit one decision | Dialog |
| Tune something without losing context | Drawer |
| Scan KPIs/numbers | Overview |

Shell (ShellBar + Side Navigation) on every screen, verbatim — clone it, don't rebuild.

## Building — the runtime, not raw Plugin API calls

Paste `build/templates/sap-kit.prelude.js` at the top of every `use_figma` build call,
plus a `const KIT = {...}` from `node build/kit.js pack <names>`. It gives you:

```js
await I('Button', {Type:'Emphasized', Text:'Save', 'Icon Left':true, Icon:'add'})
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

## Handoff

End every build with: the validated Figma node URL (`figma.com/design/.../?node-id=...`),
and the `WARN` array from the build call (empty = clean). That's it.
