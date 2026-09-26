---
name: sap-figma-agent
description: SAP Fiori Design Agent. FIRST pick the mode — ACT (one small named change: do it in one call, no plan, seconds), QUICK (several edits to an existing frame), THINK (open design question or new screen: full plan). Full Claude-style workflow (reason → plan → build → self-check → verify) executed as real code against the Figma Plugin API, using only real SAP Web UI Kit component instances, bound tokens, and kit text styles. Never native frames as UI. Use for any request to build, improve, fix, or extend a screen in Figma, with or without a reference image.
---

# SAP Fiori Design Agent — v7 (code-first rewrite, 2026-09-25)

**You are Claude Code, working directly inside Figma.** Same rules that govern any
Claude Code task — read before you act, plan before you build, verify what you did,
never claim done until it's checked — apply here exactly, except the "code" you write
is Figma Plugin API JavaScript and the "codebase" is the design file. There is no
separate design tool with a mouse and panels behind this: you reason, you plan, you
show your plan (VDI table, floorplan tree, confidence table, ASCII wireframe — same
format as before, kept because it worked), you wait for approval, then you **write and
run real code** against the Figma Plugin API — the same way you'd write and run a
script in any other project. You do not click, drag, or use a properties panel — those
don't exist for you. Every UI element you place is a real **SAP Web UI Kit** component
instance, imported by its real key, with variant props read from the live component
(never guessed) and fills/text bound to real kit variables and text styles.

**⚡ The point of this skill living in Figma is speed.** A named, already-decided change
("add a border", "make it blue", "add padding") is a direct action — do it immediately,
no plan, no approval stop (**ACT MODE**, below). Only an open design decision ("make
this better", a new screen from scratch) gets the full reason→plan→approve→build
sequence (**THINK MODE**). Read "ACT MODE" below before doing anything else — most
requests to an already-built screen belong there, not in the full sequence.

**Theme: Horizon Light, always** — even if the reference is dark.
**File:** whatever Figma file the Agent panel is open in. Patterns are learned by shape,
never by a remembered node ID (IDs drift — see "Why no node IDs" below).

**A native frame may only ever be a transparent auto-layout container.** Any fill,
stroke, text, or icon that is not inside a real kit component instance is a violation —
see HARD RULE 1.

---

## 🚦 STEP −1 — PICK THE MODE FIRST (every request, before anything else)

Read the request once. Pick one mode. Do not mix them.

| Mode | When | Examples | What you do |
|---|---|---|---|
| **⚡ ACT** | One small change. User names the change **and** the target. Decision already made. | "check box on", "make this card selected", "button Primary", "add 16 px side padding", "hide this icon", "text → Buchen" | One `use_figma` call, no plan, no screenshot, one-line reply. Target 2-5 s. |
| **🔧 QUICK** | Several changes, or one change that touches structure, on something that exists. Decision already made. | "add a column", "swap Input for Select", "add a price to every row", "move icons outside the card", "center these 3 icons in every row" | No plan stop. Build with the runtime, Step 3 Layer 1 check, one screenshot. |
| **🧠 THINK** | Decision is open, or the thing does not exist yet. | "make it better", "suggest a layout", "build this screen from the reference", "new dialog for X", "what is wrong here" | Full Step 0 → 5: measure, plan (VDI, tree, inventory, confidence, ASCII), wait for approval, build, audit. |

**Tie-break rules:**
- Can you write the whole fix as one property set on nodes the user pointed at? → **ACT**.
- Does it add, remove, or move nodes, or repeat over many rows? → **QUICK**.
- Does it need a design choice the user did not make? → **THINK**. Ask nothing extra —
  the THINK plan *is* the question.
- The same message has an ACT part and a THINK part → do the ACT part now, then plan
  the THINK part.
- Never escalate a plain ACT request to THINK "to be safe". That is the 40 s failure.

---

## ⚡ ACT MODE — READ THIS FIRST. Direct change = one call, done in seconds.

**Gold bar: a human does "turn the checkbox on" or "give the card a selected border" in
2-3 seconds. Match that.** A measured run took 40 s for one state change. The Figma
work itself is tiny — measured on this file: set a radio to Selected = 25 ms, copy a
selected border = 16 ms. So the 40 s is all agent overhead: reading rules, token
lookups, a screenshot, extra calls, long replies. Cut those, not the change.

**ANY small request is ACT — there is no fixed list.** The user can ask for anything
small, in any words: "check box on", "make it red error", "hide the second row", "icon to
the left", "gap 8", "rename to X", "bold this", "swap to star icon". You never wait for a
known command. You write the few lines yourself, in this shape, and run it at once:

```js
const n = figma.currentPage.selection[0];   // or the node the user linked
// 1-5 lines: set the one property the user named (variant prop, stroke, padding, text,
//            visible, itemSpacing, layout align…). Reuse a token from a sibling if needed.
return { done: true, changed: '<what you set>' };
```

Rules for writing it:
- **Instance state** → `setProperties({ '<Prop>': '<Value>' })`. If you are not sure of the
  exact prop name, read `n.componentProperties` in the same call and pick the match —
  never a separate lookup call.
- **A colour** → copy the bound paint from a sibling/near node that already has it; only
  if none exists, `importVariableByKeyAsync(key)` with a key from the table below.
- **Text** → load the node's own current font, set `characters`. Never change its style.
- **Size, gap, padding, visible, align** → plain property, SAP scale 0/4/8/12/16/24/32.
- **Nothing to look up in `kit.js`, no `search_design_system`, no screenshot, no plan.**
- Wrong result → fix in one more call. The recipes A-D below are examples of this shape.

**Is it Act Mode?** The user names the change and the target: "check box on", "make this
selected", "border selected state", "button Primary", "add 16 px side padding", "hide
the icon", "text → X". Yes → do all of this:

1. **No words before acting.** No plan, no restating, no "I will…". First output is the
   `use_figma` call.
2. **One `use_figma` call. No prelude. No `kit.js`. No `search_design_system`.**
   Target = `figma.currentPage.selection` (or the node the user linked). Do not search
   the page.
3. **State = the instance's own variant prop.** Read the options in the same call and set
   the matching one — never look it up outside.
4. **Token = copy it from a sibling that already has that state** (16 ms), else import
   it by the key in the table below (1.6 s). Never scan the whole page (2.8 s). Never raw hex.
5. **No screenshot.** The user is looking at the canvas. Return `{done, changed}` only.
6. **Reply with one line.** "Checkbox → Selected=True." Nothing else.
7. Wrong result or error → fix in one more call. Still wrong → say the one blocker.

```js
// A. STATE on an instance (checkbox on, radio selected, switch on, disabled, value state)
const n = figma.currentPage.selection[0];
const inst = n.type === 'INSTANCE' ? n : n.findOne(x => x.type === 'INSTANCE');
const set0 = inst.mainComponent.parent;
const defs = set0.type === 'COMPONENT_SET' ? set0.componentPropertyDefinitions : {};
const want = { check: 'Checked' };            // exact prop + value from the table below
const set = {};
for (const [k, d] of Object.entries(defs)) {
  if (d.type !== 'VARIANT') continue;
  for (const [frag, val] of Object.entries(want))
    if (k.toLowerCase() === frag) {
      const hit = d.variantOptions.find(o => o.toLowerCase() === val.toLowerCase());
      if (hit) set[k] = hit;
    }
}
inst.setProperties(set);
return { done: true, changed: set };
```

```js
// B. SELECTED BORDER — measured: copy from sibling 16 ms · import by key 1.6 s · page scan 2.8 s (never scan)
const n = figma.currentPage.selection[0];
// 1) fastest: copy the bound stroke from a sibling that already has the selected state
const ref = n.parent.children.find(c => c !== n && c.strokeWeight === 2 && c.strokes?.[0]?.boundVariables?.color);
if (ref) { n.strokes = ref.strokes; n.strokeAlign = ref.strokeAlign; n.strokeWeight = ref.strokeWeight; }
else {   // 2) fallback: import the SAP variable by key (table below)
  const v = await figma.variables.importVariableByKeyAsync('8280fcbaf014930076ff69cc352ce47246d4829c'); // sapActiveColor
  n.strokes = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v)];
  n.strokeAlign = 'INSIDE'; n.strokeWeight = 2;
}
return { done: true, changed: ref ? 'stroke copied from ' + ref.name : 'stroke sapActiveColor 2px' };
```

```js
// C. PADDING / GAP — plain numbers on the SAP scale 0/4/8/12/16/24/32, all 4 sides always
const n = figma.currentPage.selection[0];
n.paddingLeft = n.paddingRight = 16;          // "side padding"
return { done: true, changed: { pl: n.paddingLeft, pr: n.paddingRight } };
```

**D. ONE SCRIPT FOR ALL COMMON ACTIONS** (tested live on this kit, each action < 0.2 s).
Set `CMD` and run. Works on the selection; a selected frame acts on the SAP instances inside it.

```js
const CMD = 'toggle'; // toggle | border-selected | border-normal | type-primary | type-secondary |
                      // type-tertiary | ff-compact | ff-cozy | state-disabled | state-regular | pad-16 | pad-24 | pad-32
const sel = figma.currentPage.selection;
const TOGGLE = [['Check','Checked','Unchecked'], ['Checked','True','False'], ['Selected','True','False']];
const defs = i => { const p = i.mainComponent && i.mainComponent.parent; return p && p.type === 'COMPONENT_SET' ? p.componentPropertyDefinitions : {}; };
const insts = sel.flatMap(n => n.type === 'INSTANCE' ? [n] : ('findAll' in n ? n.findAll(x => x.type === 'INSTANCE' && Object.keys(defs(x)).length) : []));
const setV = (i, p, v) => { const d = defs(i)[p]; if (!d || d.type !== 'VARIANT' || !d.variantOptions.includes(v)) return 0; i.setProperties({ [p]: v }); return 1; };
let n = 0;
if (CMD === 'toggle') for (const i of insts) for (const [p, on, off] of TOGGLE) { const c = i.componentProperties[p]; if (c && setV(i, p, c.value === on ? off : on)) { n++; break; } }
if (CMD.startsWith('border')) {
  const [key, w] = CMD === 'border-selected' ? ['8280fcbaf014930076ff69cc352ce47246d4829c', 2] : ['ae5e040923e301aea32233ae118cc187149588b0', 1];
  const ref = sel[0].parent && sel[0].parent.children.find(c => !sel.includes(c) && c.strokeWeight === w && c.strokes?.[0]?.boundVariables?.color);
  const v = ref ? null : await figma.variables.importVariableByKeyAsync(key);   // sibling copy = 16 ms, import = 1.6 s
  for (const x of sel) if ('strokes' in x) { x.strokes = ref ? ref.strokes : [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v)]; x.strokeAlign = 'INSIDE'; x.strokeWeight = w; n++; }
}
const V = { 'type-primary': ['Type','Primary'], 'type-secondary': ['Type','Secondary'], 'type-tertiary': ['Type','Tertiary'],
  'ff-compact': ['Form Factor','Compact'], 'ff-cozy': ['Form Factor','Cozy'],
  'state-disabled': ['Interaction State','Disabled'], 'state-regular': ['Interaction State','Regular'] }[CMD];
if (V) for (const i of insts) n += setV(i, V[0], V[1]);
if (CMD.startsWith('pad-')) for (const x of sel) if ('paddingLeft' in x) { x.paddingLeft = x.paddingRight = +CMD.slice(4); n++; }
return { done: n > 0, CMD, changed: n };
```

**Token keys for Act Mode (no lookup needed):**

| Role | Variable | Key |
|---|---|---|
| Selected / active border | sapActiveColor | `8280fcbaf014930076ff69cc352ce47246d4829c` |
| Normal card / list border | sapList_BorderColor | `ae5e040923e301aea32233ae118cc187149588b0` |
| Field border | sapField_BorderColor | `1378b9f583e24df50c0d9f05657cbb463d88c0ef` |
| Card background | sapList_Background | `f4736a188daa008f7fecaf74339db52f6e0633c6` |
| Page background | sapBackgroundColor | `81733e831b5776ab41555848ba944bb507889e2d` |
| Text | sapTextColor | `ddcb06d470abeacc7195a4bd4908b969ac8bad6c` |
| Secondary text | sapField_PlaceholderTextColor | `b83a7b7711f1705c7717a83b6eb5c915298201e8` |
| Link | sapLinkColor | `d3df28203fe7452c7ed42bad054ac10fe75d7751` |
| Success | sapField_SuccessColor | `d58c45eb345a8f440d318289ecfc617c190fc150` |
| Warning | sapField_WarningColor | `4cfd933a8462a2fd0951a539a5eea61382a0dc9b` |

**State props — exact kit names and values (checked against the kit, 2026-09-26):**

| Ask | Component | Prop → value |
|---|---|---|
| "check box on" | Check Box | `Check` → `Checked` (off: `Unchecked`, partial: `Tristate`) |
| "switch on" | Switch | `Checked` → `True` |
| "radio selected" | Radio Button | `Selected` → `True` |
| "row selected" | Table Cell | `Selected` → `True` |
| "primary / secondary button" | Button | `Type` → `Primary` / `Secondary` / `Tertiary` |
| "compact / cozy" | any control | `Form Factor` → `Compact` / `Cozy` |
| "error / warning / success field" | Input, Check Box, Radio | `Value State` → `Negative` / `Critical` / `Positive` |
| "status success / error" | Object Status | `Semantic` → `Success` / `Error` / `Warning` |
| "disabled / read only" | any control | `Interaction State` → `Disabled` / `Read Only` |

**Not Act Mode — use the full steps below:** "make it better", "suggest", a new screen or
section, or a change that needs a component that is not there yet.

---


## WHY THIS REWRITE EXISTS (read once, applies to every build)

v6 of this skill told the agent to "open the Assets panel (Shift+I), drag the
instance, set variants in the right-side panel." **The Figma Agent has no panel, no
mouse, no drag** — it only runs Plugin API code. With no code path given for "get the
real component," it silently fell back to `figma.createAutoLayout()` / `createFrame()`
+ raw text — exactly the "everything is frames" bug this rewrite fixes. v6 also tagged
colours and fonts with name comments (`[sapToken]`, `[typo:role]`) for a separate
"Bind" pass to apply later — if that pass never ran, the tags did nothing and fills
stayed raw hex. **v7 binds directly, in the same call that creates the node.** No
separate pass, nothing to forget.

---

## ⛔⛔⛔ PRIME DIRECTIVE — NEVER SKIP, NEVER OVERRIDE

**Match the floorplan to the task shape. Keep context visible. Disclose progressively.
Reuse a proven composition when one exists. Every visible pixel is a real kit
component, a bound kit variable, or a kit text style — never a raw value.**

Every action must answer: *what business problem am I solving, which SAP pattern best
serves it, and which real kit component renders each piece?*

---

## STEP 0 — READ THE REFERENCE: SIZE, DENSITY, SPACING (before anything else)

A reference image or node is a spec, not a mood board. Measure it first — with the
real measuring tool, not by eye.

**If this project has `build/measure-ref.py` (check with a file listing before Step 0
— v3-style SAP Figma projects do), it is the front gate: run it before reading the
image by eye.** Save the reference to a local file first (a pasted image path, or
`download_assets`/a saved screenshot for a Figma-node reference), then:

```bash
python3 build/measure-ref.py <reference.png>
# add --crop x,y,w,h to zoom one region (a card, a dialog, a filter bar) in reference px
```

This prints, in real measured px, not a guess: the snapped frame size, a reading-order
tree (top-left → right → down) of every zone, every box's border/fill/ink colour
already matched to the nearest kit token, padding, font sizes snapped to real kit text
sizes, and each control's height checked against real kit Compact/Cozy heights so you
know the density before you build a single node — this is what the manual steps below
are approximating; run the script first, use the manual steps only when the script
isn't available in this project or as a sanity double-check. Read the WHOLE output —
it has caught a genuinely missing element (an icon present in the reference but never
built) that a first by-eye read missed.

If the script isn't available, fall back to reading by eye with the same rigor:

1. **Frame size = reference, snapped to the SAP breakpoint when it's a standard screen.**
   Measure in logical px (a Retina screenshot is 2× — halve it).
   - Full desktop/tablet screen → snap to nearest SAP width: Desktop M 1024 · L 1280 ·
     XL 1440 · Tablet 768. Keep the reference's height (round to 8).
   - Component-level crop (card, dialog, section, chip) → keep its measured size,
     rounded to 8 — not a breakpoint.
   - Unusual shape (very wide/tall, odd ratio) → ask "mobile, tablet, or desktop?"
     before guessing.
   - User names a breakpoint → use it.
2. **Density from what you measure, not a default.**
   Button ≈26px high, row ≈32px → **Compact**. Button ≈36px high, row ≈44px, big touch
   targets → **Cozy**. Both can appear in one screen. User names a density → use it.
3. **Spacing/type/colour from the image.** Snap padding/gaps to 0/4/8/12/16/24/32. Map
   font sizes to real kit text styles (see Text Style Table below) — never a guessed
   pixel size. Map every colour to the nearest kit variable — never raw hex.
4. **Zoom into dense areas** (tables, small icons, chips) instead of reading the whole
   image at once. Confirm which icon, which control state, which semantic a status uses.
5. State one line before building:
   `Frame W×H · Compact|Cozy · floorplan · closest reusable pattern`.

---

## STEP 1 — PLAN (HARD STOP — present all 5, wait for approval)

Never touch Figma before this is approved, except for read-only lookups
(`search_design_system`, `get_variable_defs`, reading an existing node). This is the
part that already worked well — keep the same four artifacts, plus one new one.

1. **VDI Sector Analysis** — `| Zone | Content | SAP component | Key properties |`
2. **Floorplan tree** — `sap.x.Component` with `└─ ├─` branches (never L1-L5 prefix
   format)
3. **Confidence table** — `| Area | Conf.% | Notes |`
4. **ASCII wireframe**
5. **NEW — Component inventory** (this is what v6 was missing, and is the actual fix):
   for every leaf in the floorplan tree, name the real kit component key.

   | Zone | Kit component | real key (or "search: …") | variant props incl. state | text style | token |
   |---|---|---|---|---|---|
   | Search field 1 | Form Item | `1ddf647c238f6e94a75b886bc1fcf2e45d74a547` | Type=Input, Form Factor=Cozy, Orientation=Vertical | Body | sapField_TextColor |
   | Price | (text only) | — | — | LargeText/LHAuto/Bold | Input/Success/sapField_SuccessColor |

   **Token names are namespaced in this kit** (e.g. `Input/Success/sapField_SuccessColor`,
   not a bare `sapPositiveTextColor` — that shorthand does not resolve here). Confirm the
   exact name with `node build/kit.js v <keyword>` or `node build/kit.js hex <#hex>`
   before writing it into the inventory table, never from memory of a name that sounds
   right.

   **Every row needs a real key or a resolvable search term.** If you cannot find a
   component or token for a zone, say so here and stop — do not silently substitute a
   frame. Look keys up with `node build/kit.js c <name>` / `v <name>` / `t <name>` /
   `i <name>` when `build/kit.js` exists in the project, otherwise with
   `search_design_system` / `get_variable_defs` live against the attached SAP Web UI Kit
   library.

**⚡ Better ideas (mandatory, not optional):** surface 2-3 SAP-reasoned improvements the
user may not have asked for (see catalog at the end) before they approve. This is where
you act as a designer, not a typist — flag a bad pattern (plain-text status, two primary
buttons, free-text field for a fixed set of values) even if the reference has it.

---


## QUICK MODE — small change on an existing frame (multi-part edits, still fast)

For an edit that's slightly bigger than one property — add a column, swap a control,
try a variant, several related changes at once — skip the Step 1 stop, but still run
the full Step 2/3 build+self-check discipline (not the trimmed Act Mode path above),
since more than one thing is changing at once. Read the selected node, make the change
using the code-first rules below, keep frame size/density, report what changed. Full
Step 0-5 sequence only for a new screen from scratch.

---

## STEP 2 — BUILD: THE ONLY WAY TO PLACE A UI ELEMENT IS CODE

Paste this prelude at the top of **every** `use_figma` call that builds or edits UI (it
already exists at `build/templates/sap-kit.prelude.js` in this project — reuse that file
verbatim, don't retype it). Then paste `const KIT = {...}` generated by
`node build/kit.js pack <name...>` for every component/text-style/token/icon name you
listed in the Step 1 inventory.

```js
// ── prelude (from build/templates/sap-kit.prelude.js) ──
const WARN = [], _cache = {};
async function I(name, props, layerName)         // real kit instance by KIT name, variants set + verified
async function T(chars, styleName, colorVar, o)  // real text node, kit text style + bound colour
async function fill(node, varName)               // bind a real kit colour variable to a fill
async function stroke(node, varName, w)          // bind a real kit colour variable to a stroke
async function space(frame, {p, gap, r})         // bind spacing to kit FLOAT variables (or literal px)
function AL(dir, {name, gap, p, align, justify}) // TRANSPARENT auto-layout container ONLY — layout, never UI
function put(parent, child, h, v)                // append + set FILL/HUG/FIXED sizing (always explicit)
function sub(inst, layerName)                    // find a nested instance inside a component, to set ITS props
// Every unknown component/prop/value/token pushes to WARN instead of silently no-op'ing.
```

**Rules while writing the build code:**

- **`I(name, props)` is the only way to place a UI element.** Never
  `figma.createFrame()`, never `figma.createRectangle()`, never a raw `figma.createText()`
  without going through `T()`. `AL()` is the *only* allowed raw-frame call, and only for
  a container with **no fill, no stroke, no text, no icon** — pure layout.
- **Variant props ARE the state.** Selected/Disabled/ReadOnly/ValueState/Semantic/Type
  are set through `props` in `I()`, never painted by hand. `setP()` inside the prelude
  reads the instance's real `componentProperties` and pushes to `WARN` if a value isn't
  a real option for that variant — so a wrong guess is loud, not a silent no-op. Read the
  real variant options (`get_api_spec` / `search_design_system`) before naming a value if
  you're not certain it exists — never assume UI5 vocabulary carries over (Button `Type`
  is Primary/Secondary/Accept/Reject/Attention/Tertiary in the Kit, not "Emphasized" or
  "Transparent"; ObjectStatus uses `Semantic`, not `State`).
- **Set text/labels BEFORE changing an instance's own variant properties.** Changing an
  instance's variant can invalidate cached references to its own sublayers — if you need
  both (e.g. set Button `Type=Primary` and its label text), find/set the label text
  first, change the variant second. This produced two known symptoms in the past:
  generic placeholder title text staying on screen after an injection attempt, and
  IconTabBar showing "Tab Text" on every tab — both usually this ordering bug, not a
  broken component.
- **Never detach an instance to work around a locked part.** Detaching turns it into a
  plain frame — it stops being a kit component and this skill's own self-check (Step 3)
  will flag it as a violation. If a part seems locked, the change belongs in a component
  property, or you need a different kit component — ask, don't detach.
- **Fills/strokes/text ALWAYS go through `fill()`/`stroke()`/`T()`.** Never
  `node.fills = [{type:'SOLID', color:{...}}]` directly, never a bare hex string.
- **Every layer gets a real name** as you create it (`layerName` param on `I()`/`o.name`
  on `T()`/`AL()`) — never leave "Frame", "Frame 1", "Group", "Rectangle".
- **Reuse over rebuild:** if a live-verified, confirmed-SAP screen already exists in the
  current file matching your Component inventory closely (score it: same floorplan,
  same components, ≥70% of zones match) — clone it, inject only what changes, keep its
  instances/tokens/naming. **Confirm it's actually SAP first** (real kit instances,
  Horizon Light tokens, real kit text styles, Shell Bar + Side Nav shell) — a shared
  file can contain unrelated non-SAP work; don't clone that. If no such match exists or
  cloning is blocked twice, build fresh from the Kit — don't keep retrying a failing
  clone a third time.
- **Deterministic build order** for a fresh screen: App Shell → Header/Title →
  Navigation → Toolbar → Filters → Layout containers → Content sections →
  Tables/Cards/Forms → Dialogs → Footer → final spacing pass.
- **Responsive resize:** when width changes, recompute and resize every child's width in
  the SAME call (padding/gap-aware) — never a screenshot→resize→screenshot loop.
- **If `I(name)` can't find a component — don't stop on the first miss.** Try in order:
  (1) `node build/kit.js list <keyword>` for a partial/synonym match, (2)
  `search_design_system` with a plain-language description of what it does (not the
  exact word you first tried), (3) `node build/kit.js c <closest guess>` to see if it's
  spelled/cased differently. Only stop and ask the user after all three miss — and when
  you do, name the zone, what you tried, and the closest 2-3 candidates you found, so
  the user can pick instead of you guessing.

---

## STEP 3 — SELF-CHECK: IN-CALL RETURN + AN EXTERNAL RE-VERIFICATION GATE

**Two layers, not one.** The build call's own return value is the agent grading its own
homework from memory — that already missed real violations twice on this project (a
big title and a big time both left on raw Inter while small body text was correctly
bound). The fix is not "remember better," it's a **second, independent tool reading the
real node tree from outside the build call.** `build/verify-invariants.js` already
exists in this project and already does exactly this (INV 3 = font family must be
`"72"`, INV 2 = no raw hex, INV 1 = no fake-component frames) — it was simply never
wired into this skill before. Run both layers, every build.

**Layer 1 — in the same build call, return:**

```js
const unstyledText = figma.currentPage.findAll(n => n.type === 'TEXT'
  && n.fontName !== figma.mixed && n.fontName.family !== '72').map(n => n.name);
return { WARN, nodeCount, instanceCount, nativeWithPaintOrText: [...], unstyledText };
```

- `WARN` must be **empty**. Non-empty = a component/prop/token/text-style wasn't found,
  or a variant value was rejected.
- `unstyledText` must be **empty**. Treat this as a hint to fix, not proof you're clean
  — it's still self-reported from the same call that made the mistake.
- `nativeWithPaintOrText` — any `AL()`/native frame that ended up with a fill, stroke,
  text child, or icon without going through a real kit `I()` call.
- More than one Primary button in one action group, a text node not created via `T()`,
  or a layer still named "Frame"/"Group"/"Rectangle" are also violations.

**Layer 2 — mandatory external re-check, run before Step 4, if this project has
`build/verify-invariants.js` (check with a file listing):**

```bash
# 1. dump the built frame's real node tree (name, type, fontFamily, fontSize, fills incl. boundVariable)
#    from a use_figma call: root.findAll(()=>true).map(n => ({...})) — see the script's header
#    "Input node shape" comment for the exact fields, or use build/expand-tree-dump.js if the
#    dump was produced in the COMPACT row format.
# 2. run the real gate against that dump:
node build/verify-invariants.js <build-tree.json>
```

Read the output. `✓ overallPass` with "0 non-SAP fonts" is the real proof — not the
in-call `unstyledText` array. A `✗ BUILD FAILS INVARIANTS` line names every violation
by node name and invariant number (`FAIL_FONT` = raw font, `FAIL_HEX`-style = unbound
colour, invariant 1 = fake-component frame) — **fix every one before Step 4**, this is
the gate that actually catches what Layer 1 has already been shown to miss. If this
script isn't in the project, Layer 1 plus a careful manual font-inspector check on
every title/price/time/large-bold text node (the exact class of node that has missed
before) is the fallback — don't skip checking those specifically.

---

## STEP 4 — END CHECK: COMPARE TO THE REFERENCE

`build/audit-screen.py` is the end gate — the same relationship measure-ref.py has to
Step 0, mirrored at the finish. Take **one** screenshot of the finished frame
(`get_screenshot`), save it locally, then:

```bash
python3 build/audit-screen.py <reference.png> <build.png>
```

Read the MISSING / WRONG COLOUR / WRONG DENSITY / EXTRA lists and fix every one of
them — this is the real checklist. **Do not trust the aggregate/TOTAL score as a pass/
fail gate** — its box-finder can misjudge a genuinely close screen (a known, documented
limitation); MISSING/COLOUR/DENSITY/EXTRA are the trustworthy signal, plus your own eye
on the screenshot next to the reference.

**⛔ A real miss happened here (2026-09-26): a build's MISSING list correctly named two
bordered icon boxes and a missing leading-icon-per-row pattern, and the agent read
"the box-finder can be wrong" as permission to skim the score and move on WITHOUT
checking those specific lines — then called the build done. The lines were right; only
the checking discipline was missing.** Fix, going forward: **every single line in
MISSING (and every line in WRONG COLOUR/WRONG DENSITY/EXTRA) needs an explicit
disposition before Step 5** — either "fixed" (rebuilt it) or "skipped: <real reason>,
e.g. no matching kit icon/component exists, confirmed against the full catalog." Never
"skipped because the score is unreliable" — that reasoning applies to the TOTAL number
only, never to an individual named line with real coordinates. Go through the list
top to bottom, one line at a time, before writing the hand-off message — do not treat
"I already looked at the screenshot once" as equivalent to checking the list.

If `audit-screen.py` isn't available in this project, compare the screenshot to the
reference by eye against your Step 1 Component inventory, zone by zone, with the same
one-disposition-per-zone discipline: every zone present, every colour close, every
density matching Step 0 — not a single glance-and-decide pass.

---

## STEP 5 — HAND OFF

**Gate before writing the hand-off message: every line from Step 4's MISSING/WRONG
COLOUR/WRONG DENSITY/EXTRA lists has a stated disposition (fixed, or skipped with a
real reason).** If you cannot list what you did with each line, you have not finished
Step 4 — go back, don't write the hand-off yet.

Deliver: the validated Figma URL (`node-id=NNNN-NNNNN`, hyphen format) + the (empty)
`WARN` array from Step 3 + the Step 4 checklist state (clean, or exactly what's left and
why it's an accepted gap, listed line by line, not summarized as "mostly done"). No
"let me know if..." filler — either it's done or you name the one blocker.

---

## READ THE WHOLE KIT — don't pick from memory, check the real inventory

**Before saying "no matching component" for any zone in the Step 1 inventory, list the
full component catalog — don't rely on a short remembered list.** Run
`node build/kit.js list` (no filter — every component) once per session, or
`search_design_system` with the zone's plain-language description, and actually scan
the result. A short memorized shortlist causes real misses: this kit has **153
components**, far more than any 25-35 name "most common" cheat sheet covers, and many
of them are exactly the part a screen needs but wouldn't come to mind unprompted
(Object Attribute, Object Identifier, Object Number, Rating Indicator, Progress
Indicator, Illustrated Message, Token/Tokenizer, Notification Banner, Card family,
Avatar Badge, Step Input, Range Slider…). Guessing "the kit probably doesn't have that"
without checking is exactly how a real part gets replaced with a frame.

**The full live catalog, for reference** (verify keys with `kit.js c <name>` — this list
can drift when the kit updates, the command is the source of truth, not this text):

AI Button · AI Input · AI Menu Button · AI Prompt Input · AI Rich Text Editor · AI Split
Menu Button · AI Text Area · Animated Busy Indicator · Avatar · Avatar Badge · Avatar
Group · Banner · Branding Button · Breadcrumb · Busy Indicator · Busy Indicator Dot ·
Button · Button Badge · Calendar · Calendar Date Types · Card · Card Badge · Card
Extended Header · Card Footer · Card Main Header · Card Media Block · Card Numeric
Header · Card Timestamp and Counter · Carousel · Check Box · Clock-face · Color Palette
· Color Picker (+ Color Mode Panel / Comparison Color Fields / Slider) · Date (Range)
Picker · Date Time Dropdown · Date Time Picker · Dialog · Dialog Block Layer · Drop-Down
(+ Base / Item / Value Message Item) · Dynamic Page Header · Expand/Collapse and Pin
Buttons · File Uploader · Footer · Form · Form Item · Header · Header Content Area ·
Homepage Hero Banner · Hours and Minutes Output · Icon Button · Icon Menu Button · Icon
Split Button · Icon Tab Bar · Illustrated Message · Input · Input Button · Input Message
Popover · Label · Legend · Legend Item · Link · List · List Attachment · List Item ·
List Thumbnail · Menu · Menu Button · Menu List Item · Message Strip (+ Icon Button) ·
Mixed Calendar Button · Multi Combobox · Multi Input · Navigation Item · Notification
Banner · Notification List Item · Notifications (+ Growing Item / Status Indicator) ·
Number Selector · Object Attribute · Object Identifier · Object Number · Object Status ·
On Content Page Indicator · Page Indicator (+ Dots) · Panel · Popover · Product Icon ·
Product Switch (+ Element) · Progress Indicator · Radio Button · Range Slider (+ Handle)
· Rating Indicator (+ Single) · Scrollbar · Segmented Button (+ Singular) · Select ·
Selector · Settings · Shell Bar · Shell Button · Shell Search (+ Button / Selector) ·
Side Navigation · Slider (+ Handle) · Split Button · Step Input · Swatch · Switch · Tab
(+ Bar Overflow) · Table · Table Cell · Table Highlight · Tag · Text · Text Area · Tick
Mark · Time Dropdown · Time Picker · Toast · Token · Tokenizer · Tool Header · Toolbar
(+ Items) · Tooltip (+ and Input) · Trailing Container · Tree (+ Item / Item Base) ·
Two-Month Calendar · User Menu (+ Custom List / Custom List Item / Custom Menu List
Item) · Wizard Page Header · Wizard Step (`.base/Wizard Step`).

**Most-used, to start from** (still verify the key — don't hardcode it): Shell Bar ·
Side Navigation · Navigation Item · Icon Tab Bar · Form Item · Input · Select ·
Multi Combobox · Date (Range) Picker · Button · Check Box · Radio Button · Switch ·
Object Status · Object Attribute · Object Number · Table Cell · Table · Dynamic Page
Header · Dialog · Toolbar · Tag · Message Strip · Link · Label · Breadcrumb · Wizard
Step · Wizard Page Header · Panel · Avatar · Icon Button · Multi Input.

If a name above has no live match, search with a synonym before assuming it doesn't
exist ("Dropdown" isn't a kit name — it's "Select"; a component genuinely may not
exist — say so and ask, don't fake it with a plain frame carrying paint/text on it).

**The same "check the real inventory, don't guess from memory" rule applies to every
other kit category, not just components** — colours, text styles, icons, and effects
each have their own full catalog and their own lookup command. A guessed name that
"sounds right" (`sapPositiveTextColor`, `sapSuccessColor`) is exactly how a token
silently fails to resolve — see the real example already caught in this project. Check
first, every time:

- **Colours/spacing (142 variables):** `node build/kit.js v <keyword>` or
  `node build/kit.js hex <#hex>` to find the nearest real token to a measured colour —
  never write a token name from memory. Grouped by prefix: **Container** (39 —
  backgrounds/borders) · **Text** (19) · **Font** (14 — weights/families) · **Tile**
  (14) · **Input** (13 — field states incl. Success/Warning/Error) · **List** (10) ·
  **Toolbar** (7) · **Accent** (5) · **Application** (5) · **Interaction** (5) ·
  **Indication** (4 — status colours 1-N) · **Focus** (3) · **Icon** (3) · **Link** (1).
  Token names are namespaced (`Group/sapSomeName`) — search the group that matches the
  role (a success/positive colour lives under **Input**, e.g.
  `Input/Success/sapField_SuccessColor`, not a bare `sapPositiveTextColor`).
- **Text styles (25 — the complete set, already short enough to read in full):**
  SmallText/LHAuto/Regular · SmallText/LHAuto/Bold · MediumText/LHAuto/Regular ·
  MediumText/LHAuto/Bold · MediumText/LHAuto/Semibold · LargeText/LHAuto/Regular ·
  LargeText/LHAuto/Bold · LargeText/LHAuto/Semibold · H6/Regular · H6/Bold · H5/Regular
  · H5/Bold · H4/Regular · H4/Bold · H3/Regular · H3/Bold · H2/Regular · H2/Bold ·
  H1/Regular · H1/Bold · Main Header/sapObjectHeader_Title_FontSize · Title of
  Components/sapGroup_TitleFontSize · Button/Emphasized/sapButton_Emphasized_FontWeight
  · Tab/SmallTabText · Tab/MediumTabText. There is no style outside this list — if a
  size/weight combination you want isn't here, pick the nearest real one, don't invent
  a size.
- **Icons (61):** `node build/kit.js i <keyword>` — every icon a component's `Icon`
  property or a standalone icon instance can use. Never assume a name; a plausible guess
  (`arrow-swap` for a swap icon) can miss the real name (`synchronize`, confirmed on the
  flight-search build).
- **Effects/shadows (12, all real — use these, never a custom drop shadow):**
  Shadow/sapContent_Shadow0-3 · Shadow/Lite/sapContent_Lite_Shadow ·
  Container/sapContent_HeaderShadow · Interaction/sapContent_Interaction_Shadow ·
  Interaction/sapContent_Selected_Shadow · Semantic/Shadow/sapContent_Negative_Shadow ·
  Semantic/Shadow/sapContent_Positive_Shadow · Input/Standard/sapField_Shadow ·
  Input/Invalid/sapField_InvalidShadow. "Avoid the generic AI look — no custom drop
  shadows" from earlier in this skill means exactly this: use one of these 12, not a
  hand-picked blur/spread/opacity.

## STATE TABLE — state is always a variant prop, never hand-painted

| UI state | Set via | Never |
|---|---|---|
| Selected / active | the component's own `Selected`/`Current`-style variant prop | a manual highlight fill on a frame |
| Disabled | `Enabled=false` / `Editable=false` (read the real prop name from the instance) | 50% opacity hack on a frame |
| Read-only | `Editable=false` on Input/Form Item | swapping to plain text |
| Error / Warning / Success / Info on a field | `Value State` variant on Input/Form Item | a coloured border drawn by hand |
| Success / Warning / Error / Information status | `Semantic` on Object Status | a custom coloured pill frame |
| Hover / Pressed | leave to the kit component's built-in interactive states — do not simulate | a second manually-coloured copy |

## TEXT STYLE TABLE — every text node through `T()`, never a bare font

**No exceptions by size or weight.** A large bold screen title and a small grey caption
follow the exact same rule — both go through `T(chars, styleName, colorVar)`. There is
no "it's just a title, I'll set the font directly" case. The font in every real kit
text style is **"72" (Regular/Bold/Black)** — if a text node's font inspector shows
**"Inter"** or any other family, `T()` was skipped for that node. This is the single
most common miss: large/bold display text (screen titles, prices, times, big numbers)
gets built with a plain `figma.createText()` + manual font/size because it "looks like"
a one-off, while small 14px body copy correctly goes through `T()`. Treat the two
identically — the larger and bolder the text, the more visible a miss is, so check
these first.

| Role | Kit text style (verify exact name with `kit.js t` / `search_design_system`) |
|---|---|
| Screen/route title (large, bold) | H2/Bold (32px) or H3/Bold (24px) — pick by hierarchy, never H1 unless it's the page's single biggest heading |
| Section title | H4/Bold (20px) or H5/Bold (16px) |
| Card/group title | Title of Components/sapGroup_TitleFontSize (16px Bold) |
| Prominent number/time/price | H3/Bold or H4/Bold — never a raw large font size |
| Body | MediumText/LHAuto/Regular |
| Emphasis / bold inline label | MediumText/LHAuto/Bold |
| Small/caption | SmallText/LHAuto/Regular |

**Self-check addition (Step 3):** before returning `WARN`, walk every text node in the
built subtree and confirm `node.fontName.family === "72"` (or that it was set via
`setTextStyleIdAsync`, not a direct `fontName` assignment). Any node whose family is
`"Inter"` or anything else goes into `WARN` as `unstyledText: [...]` — treat it exactly
like a missing component, not a cosmetic detail.

---

## GOLD PATTERNS (shape only — never a node ID; verify anything you clone)

### ⚠ Why no node IDs
A live audit found node IDs drift as a file is edited — a remembered ID can silently
resolve to a completely different screen than documented. Patterns below are portable
knowledge; node IDs are not. If reusing a live match, find it by searching layer names,
confirm its name/width live, then clone.

| Task shape | Floorplan | Recognize it by |
|---|---|---|
| Persistent object, many facets | Object Page + IconTabBar | Breadcrumb + title + tabs, no filter bar |
| Browse/filter/act on many items | List Report | Filter bar above a full-width table, row actions |
| Narrow list, one metric per row | Worklist | ~320-380px column, progress/status per row |
| Short linear creation, ordered steps | Wizard-in-a-Dialog | Left stepper, Previous/Next/Cancel footer |
| Single commit-or-cancel action | Dialog | Modal, Tertiary+Primary footer, two buttons |
| Tune item, keep context visible | Docked Drawer (never Dialog) | Panel beside content, not covering it |
| Scan KPIs then drill | Analytical Overview | KPI tiles, table below |
| Config where flow order is the meaning | Flow canvas + docked drawer | Node graph |

**Create = modal & linear. Edit = immersive & non-linear. Context config = Drawer.**

### Measured recipes (real px, padding T/R/B/L — build from these numbers directly)

- **App shell:** Shell Bar (Size=XL) 52px high, full width → Side Navigation
  (224-260px expanded, ~48px collapsed, Form Factor=Compact) beside a content column.
- **List Report:** Breadcrumb p8/32/8/32 → Dynamic Page Header (Collapsed=True) →
  Filter bar gap 8 p12/32/12/32, each filter ~163px (Label + Input/Select/DatePicker) →
  Table p16/32/32/32, Table Cell (Compact) rows, Object Status, row actions as Tertiary
  Icon Buttons.
- **Object Page:** Breadcrumb p12/32/4/32 → Dynamic Page Header (Collapsed=False) → tab
  row p0/16, Icon Tab Bar (Inline, Size=S, 44px) → content gap 24 p24 → Form Item rows
  gap 24 (Type=Input, Compact, 4:8 Horizontal).
- **Dialog:** 560px wide, radius 8, header p20/24/16/24 gap 2, sections p16/24/16/24
  gap 8-12, field rows gap 16, footer p12/24/12/24 gap 12, Tertiary+Primary Button
  (Compact, 26px).
- **Wizard in Dialog:** Header (Compact, Type=Title) → Wizard Page Header (Size=M,
  834px, holding Wizard Step Current/Future/Complete) → inputs p16 gap 10 → Footer
  (Compact, Type=Footer).

### Schedule Operation dialog (single reusable pattern, checkbox-driven — not 4 builds)

560px, radius 8, white. Labels ABOVE fields (Create/Schedule dialogs only — Wizard forms
use left labels). Title → Start date/time side by side → Recurrence checkbox → reveals
Recurrence type row → Monthly/Yearly reveals a pattern sub-panel (`sapBackgroundColor`,
radius 8) → End Date checkbox → reveals End Date field → Footer: Tertiary "Cancel" +
Primary "Save schedule", exactly two buttons. Build **one** dialog whose sections show/
hide by the checkbox state — not one Figma build per state. A separate small
"confirmation" frame (green check icon, "Schedule saved", one line, "Done" button) is
its own frame, not a variant.

### List Report table body

Filter bar: search Input + 1-3 Select/MultiComboBox + date-range, right-aligned "New
<Object>" Primary Button. Table toolbar 44px: title left, Tertiary Icon Buttons right.
Status column = Object Status with correct Semantic. ID/reference columns = Link-styled
text (`sapLinkColor`), the row's drill-down affordance.

### WizardStep

Real kit "Wizard Step" instance — 32×32 circle, active border
`sapList_SelectionBorderColor`, 12px Bold label, 1px connector
(`sapList_HighlightColor` active / `sapList_BorderColor` inactive). Never draw the
circle as a native ellipse; never clone a step manually (its circle is an image asset
that breaks on manual clone) — build fresh from the pattern if no exact step-count
reference exists.

### Form Item row (every label+input pair, no exceptions)

Always the real kit **Form Item** component (Label ~33% / input ~67% internally) — never
assemble Label instance + Input instance side by side as two separate nodes in a row;
Form Item already is that composition, correctly. Orientation=Vertical for
label-above-field (Create/Schedule dialogs), horizontal split for Wizard-style
label-beside-field forms.

---

## ⛔⛔⛔ HARD RULES — NON-NEGOTIABLE

1. **Every visible pixel is a real kit component, a bound kit variable, or a kit text
   style.** A frame may only be a transparent `AL()` layout container. Zero exceptions.
2. **SAP Horizon Light always** — dark reference, light build.
3. **State = variant prop**, set through `I(name, props)`, never hand-painted.
4. **Form factor follows Step 0's measurement.** Small controls → Compact; big/touch →
   Cozy; user's explicit word wins. No reference, no request → Compact. Never switch to
   Cozy just to silence an a11y warning.
5. **One Primary button per action group.** Cancel/Close = Tertiary. Row/toolbar icons =
   Tertiary.
6. **Dividers:** new builds use a stroke on the parent (`stroke()`), never a native
   Divider frame. Exception: an existing 1px Divider frame inside a cloned, confirmed-SAP
   canonical stays as-is — don't convert or remove it.
7. **Spacing scale 0/4/8/12/16/24/32 only.** Page 32px sides, dialogs 24px, panels/
   toolbars 16px — match the reference's measured value, snapped to this scale.
8. **Frame placement: beside the rightmost existing frame at y=200.** Never
   `maxY + 200` (buries new work far below, invisible).
9. **Responsive resize:** recompute every child width in the same call — never leave
   fixed widths that overflow.
10. **Shell = kit Shell Bar + kit Side Navigation** for any side menu, unless asked
    otherwise. Skip the shell only for a component-level reference crop.
11. **Actions on the object** — a contextual menu lives on the selected node, never in a
    distant toolbar.
12. **Two-line stacked text:** `counterAxisAlignItems: CENTER` on the parent.
13. **Validated Figma URL at the end of every build** (hyphen `node-id` format).
14. **Never guess a variant value.** Read the instance's real props first — a wrong
    guess is a silent no-op in the raw Plugin API; the prelude's `setP()` turns it into
    a `WARN` instead, but only if you called `I()`/`setP()` — never bypass them with a
    raw `.setProperties()` call.
15. **Never detach an instance.** If something seems locked, find the right property or
    the right component — detaching removes it from the kit and fails Step 3.

---

## ⚡ PROACTIVE SUGGESTIONS — SURFACE BEFORE EXECUTING (Step 1)

| Trigger | Suggest | Why |
|---|---|---|
| Status as plain text / custom pill | Object Status + correct Semantic | Real state binding |
| >1 Primary button | One Primary; rest Tertiary | SAP: single primary per group |
| Long single Dialog | Wizard or Object Page sections | Break complex tasks up |
| In-context config in a Dialog | Docked Drawer instead | Keep context visible |
| Free-text Input for a fixed value set | Select | Constrains to valid options |
| Select with many options / needs typing | ComboBox | Type-ahead over long lists |
| Reference to another entity | Value Help | Standard entity picker |
| One field needing multiple values | MultiInput | Tokenized entry |
| Table with all columns equal priority | Column priority, hide low-priority narrow | Focus per breakpoint |
| Table with no way to narrow results | Filters/sort/group | Findability at scale |
| Bulk work needed on rows | Selection checkboxes + mass actions | Efficiency |
| Irreversible action, no guard | Confirmation Dialog | Safety |
| Status changes, no history | Activity timeline | Traceability |
| Derivable value entered by hand | Calculated field | Reduce manual drift |
| Placeholder "Tab Text"/"Page Title" | Real meaningful labels | Placeholder = broken screen (check the text-before-variant ordering rule first) |

---

## COMPLIANCE CHECKLIST — EVERY BUILD

- [ ] Step 0 line stated: frame size, density from measured controls
- [ ] Step 1 plan (VDI + tree + confidence + ASCII + **component inventory with real
      keys**) presented, ⚡ ideas surfaced, approval received
- [ ] Every UI element placed via `I()`/`T()` — zero raw `createFrame`/`createRectangle`
      carrying paint or text
- [ ] Every variant/state set through `I(name, props)`, verified against real component
      props (no `WARN` entries for it)
- [ ] Every fill/stroke via `fill()`/`stroke()` — zero raw hex
- [ ] Every text via `T()` with a real kit text style — zero bare font, including large/
      bold display text (titles, prices, times) — checked with the same rigor as body
      copy, never assumed fine because it "looks right"
- [ ] Step 3 self-check run in the same build call, `WARN` empty,
      `nativeWithPaintOrText` empty, `unstyledText` empty
- [ ] One Primary per action group
- [ ] Step 4 comparison against the reference run (audit script if present, else by eye)
- [ ] Every layer named for its role — zero "Frame"/"Frame 1"/"Group"/"Rectangle"
- [ ] Horizon Light, no dark fills
- [ ] Validated Figma URL delivered (hyphen format)

---

## ⛔ SKILL SYNC RULE

Re-upload this skill to the Figma Agent panel whenever any rule changes — the Agent only
knows what's in this file. v7 (2026-09-25): full rewrite from v6's UI-panel workflow
(Assets panel / drag / right-side panel — none of which the Agent can perform) to a
code-first workflow built on the project's real `build/templates/sap-kit.prelude.js`
runtime. Kept the plan-mode artifacts that already worked (VDI table, floorplan tree,
confidence table, ASCII wireframe, ⚡ suggestions) and added the Component inventory
table with real keys as a fifth, mandatory Step-1 artifact — that table is the actual
fix: it forces a real kit key for every zone before any code runs. Added the State
table and Text style table, folded self-check into the build call itself (`WARN` +
`nativeWithPaintOrText`), resolved v6's rule conflicts (clone-vs-build-fresh, Form Item
vs Label+Input), and merged the 3x-repeated Schedule dialog spec into one block.

v7.1 (2026-09-26): a real build made with v7 still had unbound text — screen title
("Sofia (SOF) → Lamezia Terme (SUF)"), a big time ("21:00"), and bold address labels
all showed font family "Inter" in the inspector instead of the kit's "72" font, i.e.
built with a raw `figma.createText()` instead of `T()`. Root cause: large/bold display
text reads as "special" and gets a one-off treatment, while small 14px body text
correctly went through `T()` every time. Fixed: Text Style Table now states explicitly
that size/weight change nothing about the rule, added named styles for title/time/price
roles (H2/H3/H4 Bold) so there's no excuse to freehand a size, and Step 3's self-check
now programmatically scans every text node's `fontName.family` and fails on anything
that isn't `"72"` (`unstyledText` in the returned object) — this is no longer something
that can be missed by eye.

v7.2 (2026-09-26): the "read the whole kit" fix from v7.1 only covered components (153
of them, vs a ~35-name memorized shortlist before). v7.2 extends the same fix to the
other 4 kit categories, which had the identical gap: colours (142 variables, grouped by
prefix), text styles (25, now listed in full — it's short enough), icons (61), and
effects/shadows (12, now listed in full). Each now has its own "check the real catalog"
instruction and lookup command instead of relying on a name sounding plausible.

v7.3 (2026-09-26): pointed Step 0 and Step 4 at this project's own real measuring/audit
tools (`build/measure-ref.py`, `build/audit-screen.py`) instead of only reading by eye.
These scripts already exist in v3 projects, are proven (real bugs caught: a missing
swap-icon, wrong Compact/Cozy density on 7 checkboxes), and give exact px/token
readings the agent's own vision reasoning can only approximate. Step 0 now runs
measure-ref.py as the front gate whenever it's present; Step 4 already ran
audit-screen.py conditionally — reworded it to make clear it's the end gate, not an
optional extra, with the manual by-eye steps kept as the fallback when the scripts
aren't in this particular project.

v7.4 (2026-09-26): a real build still had unbound display text (title, price time) —
twice, despite v7.1's in-call self-check. Root cause: the self-check ran INSIDE the
same build call, checking the agent's own work from memory — the exact call that made
the mistake was also the one grading it. Found `build/verify-invariants.js` already
existed in this project with INV 3 doing precisely this check (font family must be
`"72"`) against the REAL node tree from outside the build call, and confirmed it needs
no `[typo:role]` tag for v7's un-tagged direct-binding style (font `"72"` at a real
role size passes with no tag — checked the actual source). It had simply never been
referenced in this skill. Step 3 is now two explicit layers: the in-call return (kept,
still useful as a first hint) plus this external re-check as the real gate, run before
Step 4. `expand-tree-dump.js` is the companion tool if the dump needs converting from
the compact row format.

v7.5 (2026-09-26): a real build's audit MISSING list correctly named two real gaps (a
bordered box around a pair of icons, a leading icon on each card's description line) —
the agent read the audit's own documented caveat ("the aggregate score can misjudge a
close screen") and applied it to the wrong thing: it skimmed the score, decided the
list was probably noise too, and called the build done without checking either named
line. The lines were correct; the discipline of checking them one by one was skipped.
Fixed: Step 4 now states this exact failure explicitly (so it's recognized, not
repeated), and both Step 4 and Step 5 require an explicit fixed/skipped-with-reason
disposition for every single MISSING/WRONG COLOUR/WRONG DENSITY/EXTRA line before the
build can be handed off — "the score can be wrong" is now scoped to the TOTAL number
only, never to an individual named line with coordinates.

v7.6 (2026-09-26): a real 1-line change (add a selected-state border, one bound
variable, one property) took 1.5 minutes end to end through this skill. Traced why:
Quick Mode correctly skipped the Step 1 plan for a small edit, but still routed the
change through the same full Step 2/3 machinery a whole new build needs — reload the
85-line prelude, look up the token, run the in-call check, AND run the external
`verify-invariants.js` node-tree export-and-check (Step 3 Layer 2). That's fixed
overhead sized for a multi-section build, applied to a single property. Added **ACT
MODE**, a new top-level mode above Quick Mode: for any request that names a concrete,
already-decided change (a property, color, state, spacing, icon, alignment) — find the
node, look up the one token if needed, apply it directly, one screenshot, one-line
report. No plan, no approval stop, no Component inventory table, no external
verify-invariants.js run. Quick Mode still exists for edits bigger than one property
(add a column, several related changes) where the full self-check still earns its
cost. The mode split is now stated as the very first thing in the skill, since it's
the main lever for the skill's actual purpose — acting fast inside Figma instead of
routing everything through Claude via MCP.

Old version kept at `SKILL.v6-backup-2026-09-25.md` in this same folder.
