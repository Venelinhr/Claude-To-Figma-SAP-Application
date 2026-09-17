# SAP_BUILD_MANIFEST — the build DATA source (component keys · token hexes · canonical clone nodes)
<!-- AUTHORITY: authoritative for build DATA only — the component keys (§3), canonical clone nodes (§3b), token hexes (§4), typography roles (§5), name-tag contract (§6). It is "the only file a BUILD reads" for that data. For workflow/order → WORKFLOW-CONTRACT.md; for gate PASS/FAIL → SYSTEM_PROMPT.md gate sequence. Hierarchy declared in CLAUDE.md. -->

<!-- manifestVersion: 1.0.3 · verified production-ready 2026-07-17 -->
<!-- generatedFrom: knowledge/components/registry/*.json, knowledge/guidelines/horizon-variable-keys.json -->
<!-- lastSynced: 2026-07-16 -->

## ⭐ CANONICAL REFERENCE FILE — USE THIS BEFORE EVERY BUILD

**`docs/canonical-screens/Claude to Figma SAP Application.fig`**

This `.fig` file ships with the repo and is the ONLY approved ground truth.
Open it in Figma + connect SAP Web UI Kit library → clone from it for every build.

| Need to build... | Clone from |
|---|---|
| List Report (any width) | Activities View — node `615:36810` |
| Object Page narrow | yanatest Steps — node `560:36552` |
| SideNavigation | node `699:37890` (proto source) |
| Dialog / Form | Schedule Operation — node `727:42563` |
| Log / Message panel | Validate System — node `750:174814` |
| Desktop List Report | Outage List — node `750:174925` |
| FCL + SideNav + Table | Governance Console — node `750:177443` |

> This file overrides any other pattern reference. If anything conflicts — the `.fig` file wins.

---

**This is the ONLY knowledge file the build agent reads per build** — this manifest + the reference image (or its cached semantic model).

### ⛔ Enforcement contract

If you are about to open any of these files, STOP — everything you need is in this manifest:

| File | Why you must NOT read it | What to use instead |
|---|---|---|
| `plugin/figma-builder/code.js` | Plugin runtime, ~45k tokens, runs inside Figma — irrelevant to `use_figma` builds | §3 for component keys, §4 for token hexes |
| `knowledge/guidelines/component-property-reference.json` | 136 KB bulk reference | §3 has the 25 common keys; fallback = one `registry/<Component>.json` |
| `knowledge/guidelines/horizon-variable-keys.json` | 26 KB token file | §4 has the 25 common tokens |
| Multiple `registry/*.json` files | Bulk load | One file at most, only if component absent from §3 |

- kitFile (components/icons) = `SILcWzK5uFghKun9jx6D7c` · libraryFileId = `p7zm5EMBk5DRRZdxNeJ4f5`

### ⚠ If you are lost, guessing, or output is wrong — STOP and read the .fig file
```
get_design_context on the closest canonical node from §3b
+ read the PNG from docs/canonical-screens/
= ground truth. Build from that, not from memory.
```
RULE 29: Visual Recovery Protocol. The .fig file IS the answer.

---

## §1 — The 3 HARD RULES (never violate)

1. **Real SAP instances only** — every UI element via `importComponentSetByKeyAsync(key)` → `.defaultVariant.createInstance()`. NEVER `figma.createFrame()` for a real component (header, toolbar, button, input, select, label, icon, status, list item, tab bar).
   **⛔ FAIL-CLOSED (the #1 root cause):** if a component key 404s or `importComponentSetByKeyAsync` fails — **STOP and re-harvest the key**. NEVER silently substitute `figma.createFrame()`. A silent native-frame fallback is what produces "not SAP" disasters. Report the failed key; do not build past it.
2. **L1–L5 semantic naming always** — no `Frame 1`, `Group`, `Rectangle`, `Spacer`, `Container`, `Auto Layout`. No decorative chars or token tags in *final* layer names (tags are stripped at Bind).
3. **No Spacer frames** — space with `itemSpacing`, `paddingX`, `primaryAxisAlignItems:'SPACE_BETWEEN'`, or `layoutGrow:1` on a real child. Never an empty frame to push things apart. **⚠ Even a frame named `Toolbar Fill` or `Tab Fill` with `layoutGrow:1` is a spacer — banned.**

### §1b — Workflow gates (before you build)
- **When a reference image is present:** run VDI **Sector-Based Analysis** (divide into labeled sectors A/B/C… → analyze each independently → local recommendation → merge; skill/sap-visual-reading/sector-analysis.md, RULE 17/26). Then present ASCII wireframe + sector map + component list, get user approval (RULE 19 HARD GATE) BEFORE building. Use semantic components (ObjectIdentifier/ObjectNumber/ObjectAttribute/ObjectStatus), not raw text.
- **Field/input sizing:** set field/input/select/date-picker instances to `layoutSizingHorizontal='FILL'` AFTER stripping `minWidth`/`maxWidth` — otherwise they crop at their hardcoded ~272px. Parent column must be FIXED-width first (see figma-build-patterns.md §Form Field FILL).
- **Width (RULE 30):** default 1440 ONLY when nothing given. Reference shared → MEASURE it. If close to a breakpoint, SUGGEST snapping (mobile 375 / tablet 768 / desktop 1440); if deliberately non-standard (320 master col, 560 dialog), use the exact measured width. User can set/change width AT ANY MOMENT → always wins, execute immediately. State width + any snap suggestion in the wireframe.

---

## §2 — L1–L5 naming hierarchy

| Level | What | Examples |
|-------|------|---------|
| L1 | Screen / floorplan | `Purchase Order`, `Yanatest Steps` |
| L2 | Functional regions | `Dynamic Page Header`, `Filter Bar`, `Main Content` |
| L3 | SAP component instances | `Overflow Toolbar`, `Responsive Table`, `Object Status` |
| L4 | Logical groups | `Primary Actions`, `Entry Header`, `Meta Block` |
| L5 | Content elements | `Customer Name`, `Status`, `Time`, `Save Button` |

**Naming rules (all mandatory):**
- Never generic names: `Frame 1`, `Group`, `Rectangle`, `Spacer`, `Container`, `Auto Layout`
- Never decorative chars or token tags in final layer names (tags stripped at Bind)
- Never redundant single-child nesting: `Header → Header` (use the name once)
- Never suffix instance names with ` (SAP)` — preserve official SAP component names as-is
- Preserve official SAP kit instance names where possible (`Button`, `Object Status`, `Icon Tab Bar`)

```
Yanatest Steps                 ← L1
├── Dynamic Page Header         ← L2
│   ├── Title Row               ← L4
│   └── Subtitle                ← L5
├── Icon Tab Bar                ← L3
└── Message List                ← L3
    └── Log Entry ×N            ← L4
        ├── Entry Header         ← L5
        └── Meta Block           ← L5
```

---

## §3 — Common component keys (`importComponentSetByKeyAsync`)

> ⭐ **Full registry with verified hashed property keys for all 139 SAP components:**
> **`knowledge/SAP-COMPONENT-REGISTRY.md`** — includes every TEXT key, BOOLEAN key, VARIANT options, SLOT key, and icon key. Read it before building any component not in the quick table below. Never look up property keys live for components listed there.

Real instances only. Layout containers (DynamicPage, Column, ObjectPageLayout, FilterBar, OverflowToolbar) are auto-layout frames, not kit sets — build them natively but name them semantically (L2/L3). Aliases resolve to the listed base component.

| Component | figmaComponentId | Note |
|---|---|---|
| ShellBar | `169cfd74c0be329c56b4c79b9404c978ff10cb60` | |
| DynamicPageHeader | `dc90c8dbf7714f165ed79357e9ba6ade5b3701ae` | DPTitle/DPHeader share this |
| Button | `91805fa199b1fd247d76a9c08bbe0982b49065c4` | Type: Primary/Secondary/Accept/Reject/Attention/Tertiary — ⚠ re-harvest key if 404 |
| MenuButton | `1d667088d93c355c2bd9bafac57147286206e799` | |
| IconButton | `c1ee1ca76974c720ecd4b1888e1e23ac8a36ec63` | Icon via `◆ICON/` placeholder, NOT via key |
| Input | `0f4366cb3065919e8f3deb0462f1a5a3633d6b50` | SearchField = alias |
| Select | `5ce369ff7fb0cce28984eec8dd9973ccde82facb` | ComboBox = alias |
| CheckBox | `23b4a2ca030e4bd2ff3bdd5b97b70f646ec09071` | |
| RadioButton | `9308f27ef27fbb28bc7d167c52494aa41a21610f` | |
| DatePicker | `ad1f84e6293671f80ff8dd174b1da0cbacf0fa48` | |
| SideNavigation | `d680af6d72f9421fe3f8712bf0ce171308963d3a` | variants: `Form Factor=Compact, Type=Expanded/Collapsed/Floating` |
| NavigationItem | `9d0734a384e9b67475e7b5a357e8c32070a7c2ca` | variants: `Form Factor=Compact, Type=Navigation Item/Child Item, Selected=True/False` |
| Label | `b38ac753648ad298c1e2dd02d71417566dd6095c` | Title = alias |
| Link | `2e67b5399e9f05950c6f6ea6f244a1a9736c8a56` | |
| Table | `03ea321822c4e99c27de4d9c2524bdec9c6e0972` | ResponsiveTable = alias |
| List | `4fb0a3e2fc56fb58d9904d68eb4ac58b9fb1bd25` | |
| StandardListItem | `f7bc6526a9f16608747a4141800146ebd3f4e835` | |
| ObjectStatus | `748d609ead5d4a246d7cd7c144b94b518c467e58` | prop `Semantic`: None/Success/Warning/Error/Information |
| ObjectNumber | `7b67d22ed19f246b708dc4664808a45f314a7414` | |
| ObjectAttribute | `080ead216322befe153704bf8f11373158fea34a` | |
| MessageStrip | `f0e77f8888796e35c0e791ddc0b38535eda6ec31` | |
| Toolbar | `58a258bf5813e59cec4dfc684c8cdb2a6ca6721f` | OverflowToolbar = alias |
| Dialog | `5b965b1eda133ac521b42fa20b201e9491f4bf83` | ⛔ NATIVE FRAME ONLY — slot injection fails in MCP. Use native VBOX + border + cornerRadius:8 + shadow. Clone from `727:42563` (p7zm5EMBk5DRRZdxNeJ4f5). NEVER call importComponentSetByKeyAsync for screen-level dialogs. |
| Panel | `4d19c2a24896033fe5b04bcc5dfdf43e9626283d` | |
| IconTabBar | `4aafcbf55528c439876b314d155438884b614722` | |
| Avatar | `71a3389ecbd47822b3184700766e30963fc2f220` | |
| SegmentedButton | `308476a5285b5a132241dc1c118d09ecf8d82273` | Enable 3rd/4th Button booleans before injecting extra labels |

**Icon keys (harvested — use plugin Harvest Icon Keys for others):**
| Icon | Key |
|---|---|
| home | `ddf4537c2f792179f11f64cae869cd1241e5ec7e` |
| favorite-list | `54a20db7cb800219f99739af69d8195b2c7beedd` |
| gear | `265629e8409332355482d6b3cf1d03f664f3880d` |
| crm-sales | `3d74518d3f5035e8343bde96de99bd24a44fe079` |
| customer-and-contacts | `5b7cfcdaad20640db22b7b6396b8a744d3b1d9fd` |
| wrench | `75f0fa42efe3014f303b55ca1b4f37552f592af1` |
| slim-arrow-right | `3b6dbb6e00c7999da17b69d269c3ace5f9ccee6d` |
| slim-arrow-down | `d206a924630cb08c1b62f4c2ddef383b8142e519` |
| overflow / more (DPH overflow btn) | `6a0c2f0be4be541cc17870a7a633b19e3cb2d1df` |
| show (eye/view) | `f4d889dde94203c7d563db1cde8ec8ae695395bd` |
| edit (pencil) | `b346b05bc52f9d648ead280cfbd17baacea391f2` |
| delete (trash) | `6da9bfb78bb57cc96d015531ac16e201423d8558` |
| date-time | `f8211de35a7e07c14fa178fa3769db7b16306f11` |
| add-calendar | `035388107a60472d49a67c55e79c775c24239330` |

Text = native `figma.createText()` with family `72`, tagged `[typo:role]` (see §5).

---

## §3b — Canonical Screen Nodes

> ⭐⭐⭐ **PRIMARY GOLD-STANDARD SET — file `E083sNBH7JNEOBFrG7Bqge` ("From Claude to SAP Figma screen").**
> User-confirmed 2026-07-21: "these are gold-standard references, expected result every time." **Clone from these first.**
> URL: `https://www.figma.com/design/E083sNBH7JNEOBFrG7Bqge/From-Claude-to-SAP-Figma-screen?node-id=<HYPHEN-ID>`
>
> | Screen | Node | Width | Clone for |
> |---|---|---|---|
> | Menu / Side Navigation | `68:3262` | 260 | left nav rail — real `Side Navigation` instance + N `Navigation Item` in `⿻ Navigation Items` slot |
> | Yanatest Steps | `68:2578` | 320 | Object Page narrow — DPH + IconTabBar + Filter Bar + ObjectStatus/ObjectAttribute list item |
> | Activities View | `68:2928` | 320 | List Report narrow — DPH + Filter Bar + Progress-Row Meta Block list items |
> | Validate System | `42:2348` | 678 | Log/message panel — Message Toolbar, Filter Bar in `⿻ Header Area`, SegmentedButton toggle, Log Entry (Severity/Code/Time/Body) |
> | Outage List Overview | `30:2741` | 1440 | Desktop List Report — AppLayout(SideNav 224 + Content) + DPH + Filter Bar + native Table (8 cols, Link + ObjectStatus cells) |
> | Flight Result Card | `2:5355` | 751 | Card — Zone A Legs + vert-sep + Zone B Price |
> | Schedule Op — State A Collapsed | `9:1470` | 560 | schedule dialog, both toggles off |
> | Schedule Op — State B2 Daily | `9:1696` | 560 | recurrence on + Daily, Monthly panel hidden |
> | Schedule Op — State C End Date (FULL) | `9:1550` | 560 | full expanded: Monthly + end date |
> | Schedule Op — State D EndOnly | `9:1609` | 560 | recurrence off + end date on |
>
> Cross-cutting rules: Dividers = native frames named `Divider` (sapList_BorderColor) on the Schedule dialog; list-report rows use a 3px vertical `Success Border` accent instead. Progress Row = native 40×12 green bar + ObjectStatus Success; SegmentedButton always HUG; Selects in schedule dialog = 80px; conditional sub-sections toggled via `visible` (`hidden=true` until active); recurrence wrapper = `RecurrenceExpanded` when on / `RecWrap` h48 when off.
>
> **Also mirrored in file `3UN4OKl1PVlloiKccyYPOe`** ("Claude to Figma SAP Application") — same set, valid clone source. **Design System Governance Console** (most complex): file `p7zm5EMBk5DRRZdxNeJ4f5` nodes `197:107995` / `197:123144` — ShellBar + AppLayout(SideNav 224 w/ Quick Create footer) + DynamicPageHeader(breadcrumb) + Bar(SegmentedButton + SplitButton) + IconTabBar + DynamicSideContent(Main 848 Panel w/ nested Table + Side 320 Panel w/ Calendar + MessageStrip + List).

> **Legacy reference file:** `docs/canonical-screens/Claude to Figma SAP Application.fig` (file `p7zm5EMBk5DRRZdxNeJ4f5`)
> Open this file in Figma, connect SAP Web UI Kit as library, then use node IDs below as clone sources.
> The `.fig` file ships with the repo — no private Figma access needed.

Clone these — don't build from scratch. These nodes carry correct SAP tokens and slot structures.

| Screen | Node | Description |
|---|---|---|
| Activities View | `615:36810` | 320px List Report, DPH + Progress Row pattern — confirmed Jul 14 |
| yanatest Steps | `560:36552` | Object Page narrow, canonical DPH strip, IconTabBar — confirmed Jul 14 |
| Schedule Form Step 2 | `709:40690` | All SAP tokens, full Horizon theme — confirmed Jul 14 |
| Live Preview Panel | `709:41339` | Execution list + schedule summary — confirmed Jul 14 |
| SideNavigation (full) | `701:119633` | Complete slot-injection build — confirmed Jul 15 |
| SideNavigation (proto source) | `699:37890` | Use as prototype source for slot injection |
| Dialog Header (canonical) | `560:36171` | Clone for any Dialog Header — confirmed Jul 13 |
| Schedule Activated Confirmation | `850:45411` | Confirmation/success state, ObjectStatus, Horizon Light — confirmed Jul 18 "Bravo" |
| Schedule Operation Dialog (PERFECT) | `727:42563` | ⭐ Define/Schedule/recurrence dialog — confirmed Jul 21 "perfect result, expected every time". CLONE for any schedule/recurrence dialog. Select fields 80px, SegmentedButton HUG, disabled row via opacity 0.45, "Recurrence type" label, Monthly Pattern panel sapBackgroundColor |
| Schedule Activated (clone source) | `853:135938` | Clone source for Schedule Activated variants |
| Purchase Orders List Report | `804:44859` | 1440px List Report, approval actions, ObjectStatus — confirmed Jul 16 "Bravo" |
| Orders List Report | `889:45857` | 1440px List Report, full desktop pattern — confirmed Jul 19 |
| Products Inventory | `907:46070` | 1440px Inventory List Report, EMA product data — confirmed Jul 19 |

**750:174xxx benchmark screens (in the .fig file — the mandated quality bar):**

| Screen | Node | Clone for |
|---|---|---|
| Design System Governance Console | `750:177443` | FCL + SideNav + nested Table + DynamicSideContent |
| Side Navigation (full 20-item tree) | `750:174158` | Any SideNavigation |
| Schedule Operation — dialog (PERFECT) | `727:42563` | Dialog / Form, full recurrence + SegmentedButton — CLONE for any dialog |
| Yanatest Steps | `750:174556` | Object Page narrow 320px: DPH + IconTabBar + Filter Bar + List |
| Schedule Operation — Monthly pattern | `750:174290` | Dialog with Panel + RadioButton pattern |
| Activities View (List Report) | `750:174442` | List Report + Progress Rows |
| Schedule Operation — Monthly + End date | `750:174786` | Fully-expanded dialog state |
| Validate System Log Panel | `750:174814` | Log/message panel, severity pills, SegmentedButton filter |
| Schedule Operation Form (base) | `750:174866` | Collapsed dialog base state |
| Outage List Overview | `750:174925` | Desktop List Report, status pills, inline filter bar |
| Design System Governance (worklist) | `750:174960` | Worklist variant |
| Flight Result Card (cross-ref) | `472:34431` | Card build — spec in knowledge/, node here |

---

## §4 — Common token tags (`[sapToken]` name tag; plugin resolves key at Bind)

Tag any fill/stroke layer `<desc> [sapTokenName]`; set the hex below so the plugin's RGB→token match confirms it. Use the token NAME — never a raw untagged hex.

> ⛔ **EXACT-MATCH RULE (the #1 cause of "BIND FAILED — raw-fill leak").** The Bind step matches a native frame's fill/stroke RGB to a token by an **exact key** (`Math.round(channel*1000)`). "Close enough" fails: a hex one digit off (e.g. `#A8B3BE` vs `#A8B3BD`, or `#F9FBFC` vs `#F5F6F7`) produces a different key and leaks. When you set `.fills`/`.strokes` on a **native frame** you MUST use one of the exact hex values in this table — nothing else binds.
> - Compute floats as `n/255` (e.g. `#F5F6F7` → `{r:245/255, g:246/255, b:247/255}`), never eyeballed decimals like `0.98`.
> - **Safe light fills for containers:** `#FFFFFF` (sapShellColor) · `#F5F6F7` (sapBackgroundColor) · `#E5E5E5` / `#D9D9D9` (borders) · `#A8B3BD` (sapGroup_TitleBorderColor). Use ONLY these for panels/headers/dividers.
> - This applies to native frames only — real SAP kit instances carry their own bound variables and must never have `.fills` set (see §1 rule 1).

<!-- GENERATED:hex4:start — hex column synced from knowledge/guidelines/horizon-variable-keys.json by build/generate-derived.js. Token selection + Use column are hand-curated; only the hex is authoritative-from-source. Do not hand-edit hexes; run: node build/generate-derived.js -->
| Token | Hex | Use |
|---|---|---|
| sapBackgroundColor | `#F5F6F7` | App/page content bg |
| sapShellColor | `#FFFFFF` | Shell / white surface |
| sapObjectHeader_Background | `#FFFFFF` | Header / Dialog title bg |
| sapShell_BorderColor | `#D9D9D9` | Shell/section bottom border |
| sapGroup_TitleBorderColor | `#A8B3BD` | Section / table divider |
| sapField_Background | `#FFFFFF` | Input / Select bg |
| sapField_BorderColor | `#556B81` | Input / checkbox border |
| sapField_PlaceholderTextColor | `#556B82` | Input placeholder |
| sapButton_Background | `#FFFFFF` | Default button bg |
| sapButton_BorderColor | `#BCC3CA` | Default button border |
| sapButton_TextColor | `#0064D9` | Default button text |
| sapButton_Emphasized_Background | `#0070F2` | Primary CTA bg |
| sapButton_Emphasized_TextColor | `#FFFFFF` | Primary CTA text |
| sapList_Background | `#FFFFFF` | Row bg |
| sapList_BorderColor | `#E5E5E5` | Row/cell border |
| sapList_TextColor | `#131E29` | List / table / body text |
| sapList_HeaderTextColor | `#1D2D3E` | Column header text |
| sapList_SelectionBackgroundColor | `#EBF8FF` | Selected row bg (blue tint) |
| sapList_SelectionBorderColor | `#0064D9` | Selected/active outline |
| sapTitleColor | `#1D2D3E` | Page title / H1 |
| sapTextColor | `#1D2D3E` | Body text (general) |
| sapContent_LabelColor | `#556B82` | Metadata labels |
| sapLinkColor | `#0064D9` | Links / breadcrumb |
| sapPositiveTextColor | `#1E8F56` | Success text (∞ Indefinitely) |
| sapPositiveElementColor | `#1E8F56` | Success icon / green border |
| sapCriticalTextColor | `#DF7B01` | Warning text |
| sapCriticalElementColor | `#DF7B01` | Warning icon |
| sapNegativeTextColor | `#BB0000` | Error text |
| sapNegativeElementColor | `#BD2920` | Error icon |
| sapInformativeElementColor | `#0070F2` | Information text / icon (kit has no sapInformativeTextColor — use Element) |
| sapNeutralColor | `#788FA6` | Inactive / neutral |
<!-- GENERATED:hex4:end -->

Explicit stroke tag: `[stroke:sapTokenName]` when a border needs a different token than the fill.

---

## §5 — Typography role tags (`[typo:role]` on native text, family `72`)

<!-- GENERATED:typo5:start — Size column synced from build/verify-invariants.js TYPO_ROLES (the enforced authority) by build/generate-derived.js. Role names + Weight + annotations are hand-curated. Do not hand-edit sizes; run: node build/generate-derived.js -->
| Role | Size | Weight |
|---|---|---|
| heading | 20 | Bold |
| title | 16 | Bold |
| subtitle | 14 | Regular |
| label | 14 | Regular |
| labelBold | 14 | Bold | ← use this tag string; `label-emphasized` is an internal alias (verify-invariants.js) but Bind resolves `[typo:labelBold]` only |
| body / bodyText | 14 | Regular |
| caption | 12 | Regular |
| tableHeader | 13 | Bold |
| toolbarTitle | 16 | Regular |
<!-- GENERATED:typo5:end -->

---

## §6 — Placeholders, root frame, name-tag contract

- **Icons:** drop a 16×16 placeholder frame named `◆ICON/<icon-name>` (e.g. `◆ICON/filter`, `◆ICON/sort`, `◆ICON/sys-enter-2`). The agent NEVER swaps icons and NEVER reads icon keys — the plugin's **Bind** button imports + swaps them.
- **Root frame:** `◆SAP-UNBOUND/<ScreenName>` (L1). Position x ≥ 15000 (isolated) OR below existing content — never overlapping.
- **DEMO pill:** small purple pill top-left of the section.

## §7 — ⛔ BANNED JS PATTERNS (each causes a full retry ~5k tokens)

| Banned | Replacement |
|---|---|
| `node.strokeDashes = [...]` | Remove — property does not exist on FRAME nodes |
| `node.primaryAxisSizingMode = 'FILL'` | Invalid enum — only `'AUTO'` and `'FIXED'` are valid |
| `node.layoutSizingHorizontal = 'FILL'` BEFORE appendChild | Always appendChild FIRST, then set FILL |
| `figma.importNodeByKeyAsync(...)` | Does not exist — use `importComponentSetByKeyAsync` |
| `node.strokeRightWeight` without `node.strokeWeight = 0` first | Set `strokeWeight = 0` before individual side weights |

## §8 — Pre-build key probe (MANDATORY for any screen with ≥4 components)

Run this as the FIRST `use_figma` call. Costs ~300 tokens. Saves a full retry (~5k) on any stale key.

```js
const keys = { ShellBar: '169c...', SideNav: 'd680...', Button: '9180...'/*, ...all needed */ };
const results = await Promise.allSettled(Object.entries(keys).map(([n,k]) =>
  figma.importComponentSetByKeyAsync(k).then(cs => ({name:n, csName:cs.name}))
));
const failed = results.filter(r=>r.status==='rejected').map((_,i)=>Object.keys(keys)[i]);
return { ok: failed.length===0, failed };
```
If `failed.length > 0` → STOP. grep `SAP-COMPONENT-REGISTRY.md` for the component name → get fresh key → THEN build.

| Layer | Name tag | Example |
|---|---|---|
| Fill/bg | `[sapToken]` | `Header [sapShellColor]` |
| Stroke (distinct) | `[stroke:sapToken]` | `Success Border [stroke:sapPositiveElementColor]` |
| Text | `[typo:role]` | `Title [typo:heading]` |
| Icon placeholder | `◆ICON/name` | `◆ICON/add` |
| Root | `◆SAP-UNBOUND/Name` | `◆SAP-UNBOUND/Yanatest Steps` |
| SAP instance | official kit name | `Button`, `Object Status`, `Icon Tab Bar` |
