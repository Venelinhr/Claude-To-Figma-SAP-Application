---
name: sap-screen
description: Build a new SAP Fiori screen in Figma from a reference image, description, or ticket. Deterministic 10-step flow — VDI analysis, canonical clone search, wireframe approval hard gate, Horizon Light always, real SAP instances only, verified property keys, L1-L5 naming, inline QA, validated URL. Invoke as /sap-screen <reference> <Figma URL>.
---

# SAP Screen Builder

You are the SAP Fiori Screen Builder for this project.
Project root: `/Users/C5408360/Downloads/Task to Figma SAP layouts components/`

> ## ⭐ ONE EXECUTION SPINE — read this first
> This skill has ONE path: **STEP 1 → STEP 10**. Follow the STEPs in order.
> - Each STEP names the **Gate** it satisfies (that's what the hooks enforce).
> - Each STEP names the **RULEs** it implements (that's the rationale).
> - **On ANY conflict, the STEP body wins.** The rule table at the bottom and CLAUDE.md are indexes, not authorities.
> - Every fact lives in exactly ONE place: component keys → STEP 6 · build API → STEP 7 · reasoning artifacts → STEP 5 · tokens → the token table. Never re-derive what a table already states.

**Data sources:** `SAP_BUILD_MANIFEST.md` §3b canonical nodes · `knowledge/SAP-COMPONENT-REGISTRY.md` all 139 component keys. NEVER read `code.js`.

---

## ⛔⛔⛔ 3 ABSOLUTE HARD RULES (top-of-mind — full detail lives in the named STEP)

- **A — Horizon Light ALWAYS.** Dark reference → build white anyway. Exception only if user writes "dark theme"/"dark mode". Token hex → STEP 7 token table.
- **B — Real SAP instances ALWAYS.** Every UI element via `importComponentSetByKeyAsync`. `figma.createFrame()` allowed ONLY for: root wrapper (`◆SAP-UNBOUND/`), layout VBox/HBox containers, stroke-dividers, and the ONE dialog-surface exception (STEP 6). If a key fails → STOP, re-check the registry. No native fallback for real components.
- **C — Wireframe approval gate ALWAYS (STEP 5).** Show ASCII wireframe + L1-L5 tree → FULL STOP. Do NOT call `use_figma` until the user approves in their own words. Not skippable — not for clones, not for "obvious" layouts, not for anything.

---

# THE 10-STEP FLOW

## STEP 1 — Parse input
Extract: reference (image / description / ticket), target Figma fileKey (from URL), any width or content hints.
- **If a reference IMAGE is provided** → STEP 2 runs visual VDI (the image carries the architecture).
- **If only a description/ticket (no image)** → run **STEP 1.5 (Gate 0.5 — architect-first) FIRST**, then STEP 2.

## STEP 1.5 — Gate 0.5: Architect-first reasoning (TEXT requests only · architect-first, 2026-07-22)
For a text/ticket request (no image, no canonical clone), act as a Senior SAP Product Designer and
present an **architecture brief** BEFORE any component is chosen — then WAIT for the user to approve it
(`guard-architect-gate.sh` blocks the build until `.architect-approved`; approve with words like
"architecture approved" / "floorplan approved"). Produce, in order (templates in
`skill/agents/reasoning-brain.md` — do not reinvent):
1. **Business Statement** — Intent Card + Business Entity Model: the problem, primary user + task, key decision, required data/objects, outcome. Flag any missing critical info; don't assume.
2. **Information Architecture** — Layout Blueprint region tree (header / nav / filter / primary / supporting / actions / footer / dialogs), reading order, progressive disclosure — BEFORE naming SAP components.
3. **Floorplan + rationale** — Screen Classification: the ONE SAP Fiori floorplan the IA implies, and WHY (not a default). This is an OUTPUT of the IA, not an up-front pick.
→ On architecture approval, continue to STEP 2. Then STEP 3 (canonical search) may still redirect to a clone — architect reasoning does not override clone-first. Skips automatically for image requests, canonical clones (`.reuse-declared` L1–4), and repairs.

---

## STEP 2 — Gate 0: Analyze the reference (RULE 12 · 17 · 18 · 26)

**Divide into N logical regions (minimum 3)** by the reference's actual layout axis — horizontal bands, vertical columns, or a grid. Simple screens = 3 (top/middle/bottom). Complex screens (FCL, dashboards) = as many regions as the layout truly has. Analyze each region independently, then merge.

**Confidence tier on every mapped element:**
- ● Confirmed — directly visible
- ○ Inferred — strongly implied
- ? Ambiguous — list as an Open Question

**Measure (image only):** overall width, region heights, margins, padding.

**Answer the business-intent questions:** What problem does this screen solve? Who is the user and their primary workflow? Which SAP floorplan fits?

**Output a component map:**
| Region | Element | SAP Component | Variant Props | SAP Token | Confidence |
|---|---|---|---|---|---|

---

## STEP 3 — Gate 1: Search canonical first (RULE 28 · 31)

Building composites from scratch loses internal `⿻` slot frames → `setProperties` fails silently. **Always prefer cloning an existing correctly-built node.**

**Score the request against canonicals** with `node build/score-canonical.js` (it is the single authoritative emitter of both score AND level — do not invent your own numbers). Its scale:
- **Score ≥ 85 → Level 1: CLONE directly**, inject content only. State: "Cloning `nodeId` — `screenName` (L1)".
- **Score 70–84 → Level 2: clone + delta** (similar screen). State: "Cloning `nodeId` as base, adapting N regions (L2)".
- **Score 60–69 → Level 3: clone + delta** (floorplan reuse). State: "Cloning `nodeId` for floorplan, adapting content (L3)".
- **Score < 60 → Level 5: build new.** First STOP and ask the user: *"No canonical match (score N). Approve building from scratch?"* Wait for the user's own approval words — the `.scratch-approved` marker is written only by their message, never self-set. Then proceed.

**Record the decision** so the reuse gate passes: `echo '{"level":N,"score":S,"baseCanonical":"<id-or-none>","deltaSpec":null}' > .claude/.reuse-declared` (levels must match the scale above — the gate re-validates: L1 needs ≥85, L5 needs <60).

**⛔ Gate 0.7 — ALSO record the canonical reference** (hard-blocked by `guard-reference-gate.sh`): after scoring, commit the chosen reference:
```
node build/record-reference.js --node "<id>" --name "<name read LIVE via use_figma>" --score <n> --rationale "<one line>" --effort "<low/med/high + what changes>"
```
The build is blocked until `.reference-selected` exists. If nothing scores ≥60, record the low score AND get the user's OK (`.scratch-approved`) first. **When unsure which reference, use the curated gold set below / default anchor `9-1550` for dialogs.**

**⭐ PRIMARY gold-standard clone sources — file `E083sNBH7JNEOBFrG7Bqge` (user-confirmed 2026-07-22):**
| Screen | Node | Use for | Width |
|---|---|---|---|
| Side Navigation | `68-3262` | left nav rail / shell | 260 |
| Yanatest Steps | `68-2578` | Object Page narrow (DPH + IconTabBar) | 320 |
| Activities View | `68-2928` | narrow List Report (Progress Row) | 320 |
| Validate System | `42-2348` | Log / message / severity panel | 678 |
| Schedule Op — State A/B/C/D/B2 | `9-1470`/`9-1498`/`9-1550`/`9-1609`/`9-1696` | any Define/Schedule/recurrence dialog (**default anchor `9-1550`**) | 560 |
| Outage List Overview | `30-2741` | desktop List Report (8-col table) | 1440 |
| Flight Result Card | `2-5355` | card | 751 |
| Multi-Source Selection (MCP config) | `219-120887` (p7zm5) | config screen w/ MultiComboBox source-type | 1711 |
| Select API Dialog | `1114-136067` (p7zm5) | detail screen: ShellBar+SideNav+IconTabBar+Table | 1711 |

**Legacy clone sources** (file `p7zm5EMBk5DRRZdxNeJ4f5` — historical mirrors, prefer the E083 gold set above):
| Screen | Node | Use for | Native width |
|---|---|---|---|
| Schedule Operation dialog (PERFECT) | `727:42563` | Any Define/Schedule/recurrence **dialog** | 560 |
| Schedule Operation Monthly | `750:174290` | Dialog + RadioButton panel | 560 |
| Outage List Overview | `750:174925` | Desktop List Report | 1440 |
| Governance Console | `750:177443` | FCL + SideNav + nested tables | 1440 |
| Validate System Log | `750:174814` | Log / message panel | 678 |
| Schedule Activated | `850:45411` | Confirmation / success state | 560 |
| Activities View | `615:36810` | Narrow List Report | 320 |
| yanatest Steps | `560:36552` | Object Page narrow | 320 |
| Purchase Orders | `804:44859` | Desktop List Report (approvals) | 1440 |
| SideNavigation | `701:119633` | SideNavigation full tree | 260 |

---

## STEP 4 — Gate 2: Set the width (RULE 30 · 7)

**Width target is authoritative and set here.** Precedence:
1. **User-specified width → always wins.** Execute immediately.
2. Reference image → measure actual width from image dimensions.
3. No reference → default 1440px desktop.

**Clone/width reconciliation:** in STEP 3, prefer a canonical whose native width matches this target band (narrow ~320 / dialog ~560 / panel ~678 / desktop 1440). If the chosen clone's native width differs from the target, resize the clone to the target width after cloning — the STEP 4 target wins.

---

## STEP 5 — Gate 3: Reasoning + ASCII Wireframe → ⛔ HARD STOP (RULE 3 · 8 · 19 · 20)

**Confirm the floorplan first** (RULE 3): state the chosen floorplan and why. Tie-break: action verbs (approve/reject/process) → Worklist · discovery verbs (search/browse/filter) → List Report · both → show both, ask.

**State the 7 reasoning artifacts** (RULE 20 — all 7, in order):
1. **Intent Card** — business problem + primary user action
2. **Entity Model** — the data objects and their fields shown
3. **Screen Classification** — Dashboard / ListReport / ObjectPage / Wizard / Dialog / …
4. **Layout Blueprint** — named regions, proportions, nesting (no SAP components yet)
5. **Component Decisions** — which SAP component per region + why (RULE 8: validate each against parent + children + siblings)
6. **Token Map** — which SAP token per surface/text
7. **Open Questions** — every `?` Ambiguous item from STEP 2

**Present the ASCII wireframe + L1-L5 layer tree:**
```
┌────────────────────────────────────────────────────────────────┐ Npx (locked)
│ L1: ◆SAP-UNBOUND/Screen Name                                     │
│ L2: Region Name                    [sapBackgroundColor]          │
│  L3: SAP Component [Compact/Type]                                │
│  L3: Row — Label [typo:label]           Value [typo:labelBold]   │
│   L4: ObjectStatus [Semantic=Success]                            │
│ L2: Footer Bar                                                   │
│  L3: [Button Secondary] [Button Secondary]  [Button Primary]     │
└────────────────────────────────────────────────────────────────┘

L1-L5 Layer Tree:
L1  ◆SAP-UNBOUND/Screen Name              root frame Npx
L2    Region Name                         native VBOX auto-layout, pad 32, fill [sapToken]
L3      SAP Component Instance            importComponentSetByKeyAsync(key)
L3      Row — Label Name                  native HBOX, strokeBottom [sapList_BorderColor]
L4        Label [typo:label]              createText(), font 72
L4        Value [typo:labelBold]          createText(), font 72
L2    Footer Bar                          native HBOX, SPACE_BETWEEN
L3      Button — Back                     SAP Button, Type=Secondary
L3      Button — Submit                   SAP Button, Type=Primary

SAP Components needed:
| Component | Key (from STEP 6 table) | Variant props |
|---|---|---|
```
The wireframe must state the **locked width** (from STEP 4) and use **real SAP component names** — not emoji placeholders. What you show here is what the build produces.

**⛔ STOP. Do NOT call `use_figma`. Wait for the user's explicit approval.**

---

## STEP 6 — Gate 4: Verified component keys (RULE 1 · 23 · 24)

Every component must have a key below. **Trust these keys — they are harvested from the live kit and verified. Do NOT call `use_figma` to inspect property keys for listed components.** Inspect the live kit ONLY for a component that is NOT in this table and NOT in `knowledge/SAP-COMPONENT-REGISTRY.md`.

> **Dialog build path (single rule, no exceptions):** A screen-level dialog is built by **cloning canonical `727:42563`** (RULE 28). If no clone applies, the dialog **surface** (the outer container with border + cornerRadius:8 + shadow) is the ONE native-frame exception to HARD RULE B — everything *inside* it is still real SAP instances. **NEVER** `importComponentSetByKeyAsync` the Dialog component itself — slot injection into a Dialog instance fails in MCP.

### VERIFIED COMPONENT KEYS + PROPERTY KEYS (harvested 2026-07-21 from `SILcWzK5uFghKun9jx6D7c`)

`setProperties` requires the **full hashed key** (short names like `✏️ Text` fail). Use these exactly:

| Component | Set Key | TEXT key (exact) | Key VARIANT props |
|---|---|---|---|
| **Button** | `91805fa199b1fd247d76a9c08bbe0982b49065c4` | `✏️ Text#145508:461` | `Form Factor`=Compact · `Type`=Primary/Secondary/Accept/Reject/Attention/Tertiary · `Icon Left#112533:293`(bool) · `Icon#112533:487`(swap) |
| **IconButton** | `c1ee1ca76974c720ecd4b1888e1e23ac8a36ec63` | — | `Form Factor`=Compact · `Type`=Tertiary(icon-only) · `Icon#112533:584`(swap) |
| **Input** | `0f4366cb3065919e8f3deb0462f1a5a3633d6b50` | `✏️ Typed Text#145437:221` · `✏️ Placeholder#145437:156` | `Form Factor`=Compact · `Value State`=None/Negative/Critical/Positive/Information · `Content`=Placeholder/Typed Text |
| **Select** | `5ce369ff7fb0cce28984eec8dd9973ccde82facb` | — | `Form Factor`=Compact · `Drop-Down`=False/True |
| **CheckBox** | `23b4a2ca030e4bd2ff3bdd5b97b70f646ec09071` | `✏️ Text#154638:49` | `Form Factor`=Compact · `Check`=Unchecked/Checked/Tristate · `Label#125545:8`(bool) |
| **RadioButton** | `9308f27ef27fbb28bc7d167c52494aa41a21610f` | `✏️ Text#154638:0` | `Form Factor`=Compact · `Selected`=False/True · `Label#125545:8`(bool) |
| **DatePicker** | `ad1f84e6293671f80ff8dd174b1da0cbacf0fa48` | — | `Form Factor`=Compact · `Calendar#165202:0`(bool — set false to hide) |
| **ObjectStatus** | `748d609ead5d4a246d7cd7c144b94b518c467e58` | inject via `inst.findOne(n=>n.type==='TEXT')` | `Semantic`=None/Information/Success/Warning/Error — ⚠ NO `Form Factor` |
| **ObjectNumber** | `7b67d22ed19f246b708dc4664808a45f314a7414` | inject via findOne TEXT | `Type`=Regular/Emphasized/Large/Inverted · `Semantic`=…  — ⚠ NO `Form Factor` |
| **ObjectAttribute** | `080ead216322befe153704bf8f11373158fea34a` | inject via findOne TEXT | `Type`=Regular/Active — ⚠ NO `Form Factor` |
| **MessageStrip** | `f0e77f8888796e35c0e791ddc0b38535eda6ec31` | inject via `findOne(n=>n.name==='Text Message')` | `Value State`=Information/Critical(=Warning)/Negative/Positive · `Icon`=True/False — ⚠ NO `Type` prop |
| **Label** | `b38ac753648ad298c1e2dd02d71417566dd6095c` | `✏️ Label#237212:48` | `Type`=Regular · `Required#104646:0`(bool) |
| **Avatar** | `71a3389ecbd47822b3184700766e30963fc2f220` | `✏️ Initials#143938:0` | `Type`=Image/Icon/Initials · `Size`=XS/S/M/L/XL · `Color`=Image/1-10 — ⚠ NO `Form Factor` |
| **SegmentedButton** | `308476a5285b5a132241dc1c118d09ecf8d82273` | inject labels via slot | `Form Factor`=Compact · `Type`=Text/Icon · `3rd Button#167915:5`(bool) · `4th Button#167915:10`(bool) |
| **Panel** | `4d19c2a24896033fe5b04bcc5dfdf43e9626283d` | `✏️ Title#145524:0` | `Form Factor`=Compact · `Collapsed`=False/True |
| **StandardListItem** | `f7bc6526a9f16608747a4141800146ebd3f4e835` | `✏️ Text#152462:90` · `✏️ Byline#152704:108` | `Form Factor`=Compact · `Type`=Single Line/Byline/… · `Selected`=False/True |
| **ShellBar** | `169cfd74c0be329c56b4c79b9404c978ff10cb60` | — | `Size`=XL · `Search`/`Notification`/`Help`(bools) |
| **IconTabBar** | `4aafcbf55528c439876b314d155438884b614722` | — | `Type`=Inline Mode/Icon Only/… · slots for tabs |
| **DynamicPageHeader** | `dc90c8dbf7714f165ed79357e9ba6ade5b3701ae` | — | `Form Factor`=Compact · `Collapsed`=False/True · `⿻ Content` / `⿻ Header Area` slots |
| **Table** | `03ea321822c4e99c27de4d9c2524bdec9c6e0972` | — | `Form Factor`=Compact · `⿻ Columns/Rows Compact` slots |
| **List** | `4fb0a3e2fc56fb58d9904d68eb4ac58b9fb1bd25` | — | `Form Factor`=Compact · `⿻ List Items Compact` slot |

**`Form Factor: Compact` on every instance that has it** — EXCEPT ObjectStatus / ObjectNumber / ObjectAttribute / Avatar (no such prop; do not set it).

> **Full registry** (ALL 139 SAP Web UI Kit component sets with their `assetKey` + variants, plus full BOOLEAN/SLOT/VARIANT/TEXT keys for the 24 core components, plus icon keys + tokens): `knowledge/SAP-COMPONENT-REGISTRY.md`. The "Complete Component Set Index" section there lists every component the kit ships. Read it before building any component not in the 20-row table above — never guess a key or inspect the live kit for a component the registry already lists.

---

## STEP 7 — Gate 5: Build (RULE 8 · 13 · 14 · 25)

> **⚡ ADAPTIVE EXECUTION (F-6/7/8, 2026-07-22) — time-box: 3–5 min / ≤12k tokens, same quality.**
> - **Decision point:** after STEP 3 you have a level. If clone is viable (L1–3), clone + inject only what changes; **do not rebuild unchanged sections**. If clone is blocked (missing keys · invalid overrides · instance-parent errors · no canonical) → **stop cloning, switch to Pattern B controlled rebuild** in the deterministic order below. Do not keep retrying a blocked clone.
> - **Controlled-rebuild order (Pattern B):** Shell → Header → Nav → Toolbar → Filters → containers → content sections → tables/cards/forms → dialogs → footer → final spacing/tokens. One section fully before the next.
> - **⛔ FAIL-TWICE-THEN-SWITCH:** if the SAME `use_figma` operation fails twice, STOP, record why, switch strategy. Never a 3rd identical retry. (This is what turned one wizard step into 5 screenshots + 2 gate blocks.)
> - **Verify by TEXT, not screenshots:** the STEP 8 QA block returns counts/ratios/unbound-hex as text — read that. Take ONE screenshot only at final hand-off.

**Two build patterns — pick by the STEP 3 level (the reuse gate enforces this):**

### Pattern A — CLONE (Level 1–3, score ≥ 60) — the gate REQUIRES `.clone(` in your code
```js
// Clone the canonical, then swap content. The reuse gate blocks L1-3 builds with no .clone().
const src = await figma.getNodeByIdAsync('727:42563');   // baseCanonical from .reuse-declared
const root = src.clone();
root.name = "◆SAP-UNBOUND/Screen Name";
root.x = 15200; root.y = 200;                            // place beside originals
// L1: adjust width to STEP 4 target if it differs from the clone's native width
// L2: walk root.findOne(...) to each slot/text, inject new content (setProperties / characters)
// L3: hide/show regions via node.visible for delta adaptation
figma.currentPage.appendChild(root);
```

### Pattern B — SCRATCH (Level 5 only, score < 60, `.scratch-approved` present)
Build from real SAP instances. **Container-First (RULE 14):** top-down from the highest container. **Compose, never isolate (RULE 8).**

```js
await figma.loadFontAsync({ family: '72', style: 'Regular' });
await figma.loadFontAsync({ family: '72', style: 'Bold' });

// L1 — root frame (the ONLY native frame for the screen itself)
const root = figma.createFrame();
root.name = "◆SAP-UNBOUND/Screen Name";
root.layoutMode = 'VERTICAL';
root.primaryAxisSizingMode = 'AUTO';       // hug height
root.counterAxisSizingMode = 'FIXED';      // fixed width
root.resize(SCREEN_WIDTH, 100);            // width from STEP 4 (locked)
root.fills = [{ type:'SOLID', color:{ r:0.961, g:0.965, b:0.969 } }]; // sapBackgroundColor
root.clipsContent = false;                 // never crop SAP field borders

// L2 — layout container: createFrame + layoutMode (there is NO figma.createAutoLayout)
const region = figma.createFrame();
region.name = "Region Name";
region.layoutMode = 'VERTICAL';
region.counterAxisSizingMode = 'FIXED';    // parent must be FIXED-width before a child can FILL
region.paddingLeft = region.paddingRight = 32;   // 32 always, never 48
region.fills = [{ type:'SOLID', color:{ r:1, g:1, b:1 } }]; // sapShellColor #FFFFFF
region.clipsContent = false;
root.appendChild(region);
region.layoutSizingHorizontal = 'FILL';    // FILL only AFTER appendChild + parent FIXED

// L3 — real SAP instance (full key, verified TEXT key from STEP 6 — NO Object.keys discovery)
const btnSet = await figma.importComponentSetByKeyAsync('91805fa199b1fd247d76a9c08bbe0982b49065c4');
const btn = btnSet.defaultVariant.createInstance();
btn.name = "Submit Button";
region.appendChild(btn);
btn.setProperties({ 'Form Factor':'Compact', 'Type':'Primary', '✏️ Text#145508:461':'Submit' });
btn.layoutSizingHorizontal = 'FILL';

// ObjectStatus / MessageStrip — no TEXT prop; inject into the sub-layer text node
const osSet = await figma.importComponentSetByKeyAsync('748d609ead5d4a246d7cd7c144b94b518c467e58');
const os = osSet.defaultVariant.createInstance();
os.name = "Object Status — Ready";
os.setProperties({ 'Semantic':'Success' });         // no Form Factor on ObjectStatus
const osTxt = os.findOne(n => n.type === 'TEXT');
if (osTxt) { osTxt.fontName = { family:'72', style:'Regular' }; osTxt.characters = 'Ready'; }
region.appendChild(os);

// L4 — native text: ALWAYS [typo:role] tag + exact SAP hex
const label = figma.createText();
label.name = "Field Label [typo:label]";
label.fontName = { family:'72', style:'Regular' };
label.fontSize = 14;
label.fills = [{ type:'SOLID', color:{ r:0.333, g:0.420, b:0.510 } }]; // sapContent_LabelColor
label.characters = "Label text";

// Row with a divider — strokeBottom on the parent, NEVER a createFrame divider
const row = figma.createFrame();
row.name = "Row — Name";
row.layoutMode = 'HORIZONTAL';
row.primaryAxisAlignItems = 'SPACE_BETWEEN';
row.counterAxisAlignItems = 'CENTER';
row.strokes = [{ type:'SOLID', color:{ r:0.898, g:0.898, b:0.898 } }]; // sapList_BorderColor
row.strokeBottomWeight = 1;
row.strokeAlign = 'INSIDE';
region.appendChild(row);

// Footer — SPACE_BETWEEN, two real clusters, NO spacer frames
const footer = figma.createFrame();
footer.name = "Footer";
footer.layoutMode = 'HORIZONTAL';
footer.primaryAxisAlignItems = 'SPACE_BETWEEN';
root.appendChild(footer);
footer.layoutSizingHorizontal = 'FILL';
// left cluster: [Back][Discard] · right cluster: [Save as draft][Primary]

figma.currentPage.appendChild(root);
// … then the STEP 8 QA block, then return
```

**Footer button intent → Type (RULE 10):** Primary CTA→Primary · cancel/secondary→Secondary · destructive→Reject · icon-only→Tertiary. **Max 1 Primary per action group.**

**Rendering conventions (RULE 11):** Footer HUGs vertical. Toolbar borderless inside Panel/Dialog. Compact = 32px rows — NEVER switch to Cozy to silence a11y warnings.

**Design flexibility (RULE 16):** SAP patterns are the default, not absolute. If the reference shows an intentional deviation, execute it; correct only cosmetic drift (colors, spacing).

---

## STEP 8 — Gate 6/7/8: Inline QA (RULE 21) — FOLDED INTO THE BUILD CALL

Do NOT make a separate `use_figma` call. Append this block to the end of the build script and return its result:

```js
// ── INLINE QA (Gate 6 tokens · Gate 7 zero native frames · Gate 8 naming) ──
const _root = await figma.getNodeByIdAsync(root.id);

// Pre-compute the id of every node that lives inside a SAP instance (one pass, not O(n²))
const _insideInstance = new Set();
_root.findAll(n => n.type === 'INSTANCE').forEach(inst => {
  inst.findAll(() => true).forEach(d => _insideInstance.add(d.id));
});

// Gate 7 — native UI frames that are NOT allowed containers and hold no instances
const _allowed = ['◆SAP-UNBOUND','Divider','Row','Section','Header','Footer','Warning','Heading','Region'];
const _badNatives = _root.findAll(n =>
  n.type === 'FRAME' &&
  !_insideInstance.has(n.id) &&
  !_allowed.some(a => n.name.startsWith(a)) &&
  n.children && !n.children.some(c => c.type === 'INSTANCE') &&
  n.width > 40 && n.height > 40
);

// Gate 8 — untagged native text (skip any text that lives inside a SAP instance, at ANY depth)
const _untagged = _root.findAll(n =>
  n.type === 'TEXT' && !n.name.includes('[typo:') && !_insideInstance.has(n.id)
);

// Gate 6 — raw dark fills (threshold 0.10 excludes valid sapList_TextColor #131E29 avg 0.118)
const _darkFills = _root.findAll(n =>
  n.type !== 'INSTANCE' && !_insideInstance.has(n.id) &&
  n.fills && n.fills.length > 0 &&
  n.fills.some(f => f.type === 'SOLID' && (f.color.r + f.color.g + f.color.b) / 3 < 0.10)
);

const _instances = _root.findAll(n => n.type === 'INSTANCE');

return {
  rootId: root.id,
  hyphenId: root.id.replace(':', '-'),
  w: root.width, h: root.height,
  qa: {
    instances: _instances.length,
    badNatives: _badNatives.map(n => n.name),
    untagged: _untagged.map(n => n.name).slice(0, 5),
    darkFills: _darkFills.map(n => n.name).slice(0, 3),
    pass: _badNatives.length === 0 && _untagged.length === 0 && _darkFills.length === 0
  }
};
```

**Recovery loop (bounded):** if `qa.pass === false`:
1. Read the offending node names from `qa.badNatives` / `qa.untagged` / `qa.darkFills`.
2. Fix them in the SAME next `use_figma` call (replace native with instance / add `[typo:role]` / swap to SAP token hex), re-run the QA block ONCE.
3. If it still fails after that one retry → STOP, report the failing names to the user, do NOT hand off (Gate 9 fail-closed). Never loop more than twice.

`qa.instances` must be > 0 — a screen with zero SAP instances is always wrong.

**⛔ Gate 9 requires a `verify.json` on disk — the inline QA above is necessary but NOT sufficient.** `lint-on-stop.sh` blocks hand-off unless `output/<node>-verify.json` exists with `overallPass:true`. So after the build call, in the SAME turn:
1. Dump the built frame tree in the EXACT shape `verify-invariants.js` parses (not raw Figma paint objects). In a `use_figma` call:
   ```js
   function hex(p){ if(!p||p.type!=='SOLID')return null; const c=p.color, h=n=>('0'+Math.round(n*255).toString(16)).slice(-2); return '#'+h(c.r)+h(c.g)+h(c.b); }
   function paint(p){ return { type:p.type, hex:hex(p), boundVariable: !!(p.boundVariables&&p.boundVariables.color), overridden:false }; }
   const t = root.findAll(()=>true).concat(root).map(nd => ({
     id:nd.id, name:nd.name, type:nd.type, visible:nd.visible!==false,
     layoutMode:nd.layoutMode||null, childCount:(nd.children||[]).length,
     mainComponentKey: nd.type==='INSTANCE' ? (nd.mainComponent&&nd.mainComponent.key)||'' : undefined,
     fontFamily: nd.type==='TEXT'&&nd.fontName&&nd.fontName.family || undefined,
     fontSize: nd.type==='TEXT'&&typeof nd.fontSize==='number' ? nd.fontSize : undefined,
     fills: Array.isArray(nd.fills)? nd.fills.map(paint):[],
     strokes: Array.isArray(nd.strokes)? nd.strokes.map(paint):[]
   }));
   return JSON.stringify(t);
   ```
   Write that to `output/<node>-tree.json`. **Clone-first provenance (INV 4):** if you cloned a canonical (reuse level L1–L4), set `basedOnCanonical` on the dumped root object to the cloned node id — `t.basedOnCanonical = '<canonicalId>'` — OR include a `[clone:<canonicalId>]` tag in the root frame name. A from-scratch build (L5, `.scratch-approved`) omits it.
2. Run the reality gate. If `.reuse-declared` names a `baseCanonical`, pass it so INV 4 verifies clone provenance (otherwise INV 4 is skipped for genuine from-scratch builds):
   ```bash
   CANON=$(NO_COLOR=1 node -e "try{process.stdout.write(String(JSON.parse(require('fs').readFileSync('.claude/.reuse-declared','utf8')).baseCanonical||''))}catch(e){}" | tr -cd '0-9:-')
   node build/verify-invariants.js output/<node>-tree.json --pre-bind ${CANON:+--canonical "$CANON"} --out output/<node>-verify.json
   ```
3. Hand off only when `overallPass:true`. If it fails → fix the frame, re-dump, re-run (max 2 tries, per the recovery loop).

This is what makes the reality gate actually run — without a correctly-shaped `verify.json`, `lint-on-stop.sh` reports "invariant reality gate SKIPPED" and blocks the turn.

---

## STEP 9 — Bind reminder (RULE 25 · 27)

Tell the user: **"Run Bind SAP Tokens in the plugin — it binds every `[sapToken]` / `[typo:role]` name-tag to a live SAP variable."**
- The validated URL (STEP 10) is still shared now, even while Bind is pending.
- If the user pastes a Bind error → run `/sap-fix <nodeId>`. Never hand off on a FAIL.
- **RULE 27:** if the user confirms quality ("perfect" / "bravo" / "exactly right" / "canonical") → dispatch the `ground-truth-updater` agent to record this build as a new canonical.

---

## STEP 10 — Gate 9: Validated Figma URL (⛔ MANDATORY LAST ACTION)

1. Take `rootId` from the build return value.
2. Confirm the node exists: `get_metadata(fileKey, nodeId)`.
3. Format the id with a HYPHEN: `1011:49200` → `1011-49200`.
4. Share: `https://www.figma.com/design/<fileKey>/SAP-application-builder?node-id=<id-HYPHEN>`

This is the last action of EVERY build. Always. No exceptions.

---

# STEP ↔ GATE MAP (for the hooks — informational)

| STEP | Gate | Enforced by |
|---|---|---|
| 2 | Gate 0 (analyze) | — |
| 3 | Gate 1 (canonical search) | `guard-reuse-gate.sh` |
| 4 | Gate 2 (width) | — |
| 5 | Gate 3 (wireframe → STOP) | `guard-wireframe-gate.sh` |
| 6 | Gate 4 (keys verified) | `guard-manifest-drift.sh` |
| 7 | Gate 5 (build) | `guard-figma-code.sh` |
| 8 | Gate 6/7/8 (inline QA) | `verify-invariants.js` |
| 10 | Gate 9 (hand-off + URL) | `lint-on-stop.sh` |

---

# SAP TOKEN HEX (Horizon Light — exact values for `use_figma` fills)

| Token | Hex | r,g,b (0-1) | Use |
|---|---|---|---|
| sapBackgroundColor | #F5F6F7 | 0.961, 0.965, 0.969 | Page bg |
| sapShellColor | #FFFFFF | 1, 1, 1 | Surface / dialog |
| sapList_Background | #FFFFFF | 1, 1, 1 | Table / list rows |
| sapList_BorderColor | #E5E5E5 | 0.898, 0.898, 0.898 | Dividers / row borders |
| sapTitleColor | #1D2D3E | 0.114, 0.176, 0.243 | Page title H1 |
| sapList_TextColor | #131E29 | 0.075, 0.118, 0.161 | Body / table text |
| sapContent_LabelColor | #556B82 | 0.333, 0.420, 0.510 | Labels / captions |
| sapButton_Emphasized_Background | #0070F2 | 0, 0.439, 0.949 | Primary button bg |
| sapPositiveTextColor | #1E8F56 | 0.118, 0.561, 0.337 | Success text |
| sapCriticalTextColor | #DF7B01 | 0.875, 0.482, 0.004 | Warning text |
| sapNegativeTextColor | #BB0000 | 0.733, 0, 0 | Error text / asterisk |
| sapLinkColor | #0064D9 | 0, 0.392, 0.851 | Links / interactive text |

# TYPOGRAPHY ROLES (`[typo:role]` — on EVERY native `createText()` node name)

| Role tag | Size | Weight | Use |
|---|---|---|---|
| `[typo:heading]` | 20px | Bold | Page title H1 |
| `[typo:title]` | 16px | Bold | Section title |
| `[typo:subtitle]` | 14px | Regular | Subtitle |
| `[typo:labelBold]` | 14px | Bold | Values, emphasis |
| `[typo:label]` | 14px | Regular | Form labels |
| `[typo:body]` | 14px | Regular | Body paragraphs |
| `[typo:tableHeader]` | 13px | Bold | Column headers |
| `[typo:caption]` | 12px | Regular | Timestamps, sub-values |

---

# RULE INDEX (rationale only — STEP bodies are authoritative on any conflict)

| Rule | Where it lives | What |
|---|---|---|
| RULE 1 | STEP 6 | Registry gate — every component has a verified key. No invented names. |
| RULE 2 | token table + STEP 7 | SAP tokens only, exact hex + `[sapToken]` tag. No raw hex. |
| RULE 3 | STEP 5 | Confirm floorplan. Action verbs→Worklist, discovery→ListReport. |
| RULE 7 | STEP 4 | Default width 1440. Measure when a reference is given. |
| RULE 8 | STEP 5 · 7 | Compose in context — validate parent + child + sibling. |
| RULE 10 | STEP 7 | Footer button intent → Type map. Max 1 Primary per group. |
| RULE 11 | STEP 7 | Footer HUGs. Toolbar borderless in Panel/Dialog. Compact 32px rows. |
| RULE 12 | STEP 2 | Reference = business intent, not a pixel template. |
| RULE 13 | STEP 7 | Adopt the working pattern (clone-canonical). Stop patching what fails. |
| RULE 14 | STEP 7 | Container-First. Build top-down. |
| RULE 15 | STEP 9 | Positive feedback = canonical confirmation (folds into RULE 27). |
| RULE 16 | STEP 7 | Design flexibility — execute intentional deviations, fix cosmetic drift. |
| RULE 17 | STEP 2 | Divide into N logical regions (min 3) by the real layout axis. |
| RULE 18 | STEP 2 | Measure width, region heights, margins before building. |
| RULE 19 | STEP 5 | ⛔ Wireframe + L1-L5 → HARD STOP until user approves. |
| RULE 20 | STEP 5 | 7 reasoning artifacts before the wireframe. |
| RULE 21 | STEP 8 | Inline QA: zero native UI frames, zero untagged text, zero raw hex. |
| RULE 23 | STEP 6 | SAP Web UI Kit is the only source of components/props/tokens. |
| RULE 24 | STEP 6 | Trust the verified key table. Inspect live only for unlisted components. |
| RULE 25 | STEP 7 · 9 | MCP-first: build real instances via `use_figma`; plugin binds tokens. |
| RULE 26 | STEP 2 | VDI confidence: ● Confirmed / ○ Inferred / ? Ambiguous. |
| RULE 27 | STEP 9 | On "perfect"/"bravo" → dispatch `ground-truth-updater`. |
| RULE 28 | STEP 3 | Clone-Canonical: clone a correct node, never build composites from scratch. |
| RULE 29 | recovery | When lost → STOP → read the `.fig` canonical → build once. |
| RULE 30 | STEP 4 | Measure reference width. Never blind-default to 1440 when a reference exists. |
| RULE 31 | STEP 3 | Reuse before rebuild — `score-canonical.js` emits score+level: ≥85 L1 clone · 70-84 L2 · 60-69 L3 · <60 L5 new. |

**Retired (do NOT apply — legacy JSON path only):** RULE 4 (non-default props in specs), RULE 5 (no px in JSON specs — N/A on MCP path; on MCP use exact measured px), RULE 6 (→ RULE 19), RULE 22 (incremental-edit contract).
