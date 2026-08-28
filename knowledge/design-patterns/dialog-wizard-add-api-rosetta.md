# ROSETTA: Add API Wizard Dialog — The Canonical Designer Pattern

> Canonical pattern for Add API wizard dialogs — step structure, slot injection, confirmed components.


**Reference**: Figma node `138:17478` ("Dialog") in SAP-application-builder file
**Discovered**: 2026-06-27 — the most architecturally complete SAP Dialog
reference we've found. This is the definitive pattern for any
multi-step wizard inside a Dialog.

---

## Outer Dialog dimensions

| Field | Value |
|---|---|
| Frame name | `Dialog` (plain FRAME wrapper, per Rule A) |
| Width | **834px** (NOT 811 — 834 is the canonical Fiori "M" Dialog width) |
| Height | **632px** (hugs content) |
| Background | `sapShellColor` white |
| Border | `sapShell_BorderColor` 1px |
| Corner radius | 8px |
| Drop shadow | Y=4, blur=16, color rgba(0,0,0,0.15) |

## TOP — composite Wizard Page Header (116px tall)

The designer does NOT use a separate SAP `Header` strip. Instead:

```
Dialog                          (FRAME)
├── Header (INSTANCE, 40 tall, OVERLAID at y=0 by Wizard Page Header)
├── Wizard Page Header (INSTANCE, 72 tall — REGISTERED SAP COMPONENT, NOT NATIVE!)
├── Wizard-Input Fields (FRAME, content area)
├── Footer (INSTANCE)
└── Wizard Page Header (FRAME, 116 tall, OVERLAYS Header)
    ├── .base/Object Header Title (FRAME, 28 tall, at y=24)
    │   ├── "Add API" (TEXT, 28 tall, fontSize ~24/Bold)
    │   └── Icon Button (INSTANCE, 32×26, at x=706 — the close X)
    └── Steps (FRAME, 64 tall, at y=52)
        ├── .base/Wizard Step (INSTANCE, 365×64)  ← step 1 visible
        ├── .base/Wizard Step (INSTANCE, 365×64)  ← step 2 visible
        └── .base/Wizard Step (INSTANCE, 108×64, HIDDEN by default — un-hide if needed)
```

**Critical**: The Wizard Page Header FRAME at the END of children list
overlays the original SAP `Header` instance. The `Header` instance still
provides the chrome (rounded top corners, border) but its content is
visually covered by the Wizard Page Header.

The TWO Wizard Page Header entries:
- One is a SAP **INSTANCE** (72 tall) — provides the canonical SAP wizard step nav
- One is a custom **FRAME** (116 tall) — overlays with custom title bar + step composition

The designer apparently uses BOTH simultaneously for layering reasons.

## SAP Components We Need (NEW)

| Component | Used For | Key Discovery Method |
|---|---|---|
| `.base/Object Header Title` | The title row inside Wizard Page Header | findOne within Wizard Page Header instance |
| `.base/Wizard Step` | Each step in the wizard | findAll within Steps frame of Wizard Page Header |
| `Icon Button` | The close X | already in registry |
| `Select Method` | The section header above the List | published SAP instance |
| `List Item` | Each row in the list | already in registry — but full structure has more slots than we use |

## MIDDLE — Wizard-Input Fields (Content area)

| Field | Value |
|---|---|
| Container | `Wizard-Input Fields` (FRAME, 770×429) |
| Position | y=132 (below the 116px Wizard Page Header + 16px gap) |
| Background | (inherits from parent — usually transparent) |
| Inner | Another FRAME `Wizard-Input Fields` (770×429) — double-wrap for padding |

### Inside the inner Wizard-Input Fields

```
Wizard-Input Fields (770×429)
├── Select Method (INSTANCE, 16,16 → 690×32)  ← SAP section header instance
└── List (FRAME 16,58 → 705×355) — NATIVE vertical container
    ├── List Item (INSTANCE) — first 2 are HIDDEN sample variants
    ├── List Item (INSTANCE, 705×40, hidden)
    ├── List Item (INSTANCE, 705×44, hidden)
    ├── List Item (FRAME 705×92)  ← FIRST visible option
    ├── List Item (FRAME 705×90)  ← SECOND visible option
    ├── List Item (FRAME 705×90)  ← THIRD visible option
    ├── ... more hidden List Item INSTANCES (8 hidden at various heights)
    └── Frame 2018776121 (705×83)  ← SELECTED option (special composition!)
```

**Key observation**: visible List Items are FRAMES (detached from their
master variant), the hidden ones are INSTANCES (sample placeholders).
This means the designer **detaches each List Item when they want to
customize it**, leaves the rest as instances.

### SAP List Item composition (per node 138:17487)

```
List Item (FRAME, 705×92)
├── Separator (ROUNDED-RECTANGLE, 705×1, at y=91)  ← bottom divider
├── Selector Container (FRAME, 44×92, at x=0)
│   └── Selector (INSTANCE, 16×16, at x=14, y=16)  ← Radio or Checkbox
├── Thumbnail Container (FRAME, 76×76, HIDDEN)
│   └── Thumbnail (INSTANCE, 48×48)
├── Text Container (FRAME, 677×92, at x=28)
│   ├── Text + Byline (FRAME, 645×60, at x=16, y=16)
│   │   ├── Title (TEXT, 645×16)
│   │   └── Bylines (FRAME, 645×32)
│   │       ├── Byline (TEXT, 645×32)
│   │       └── Attachment List (INSTANCE, hidden)
│   ├── Item Counter (TEXT, hidden)
│   └── Button Container (FRAME, hidden)
│       ├── 2nd Button (INSTANCE, hidden)
│       └── 1st Button (INSTANCE)
├── Trailing Icon Container (FRAME, hidden)
│   └── Trailing Icon (INSTANCE, 16×16)
└── Navigation Indicator (FRAME, 3×92, hidden)  ← the blue selection bar
```

### SAP List Item — SELECTED variant special composition

Instead of just adding `sapList_SelectionBackgroundColor`, the designer
composes the selected row as a DIFFERENT structure:

```
Frame 2018776121 (705×83)  ← name is generic-numbered, semantic role unclear
├── Radio Button (INSTANCE 90×16, at 24,16)  ← STANDALONE Radio Button outside Selector Container
└── Frame 2018776116 (616×27, at 24,40)
    └── "Create an API artifact..." (TEXT 582×19, at 24,4)  ← byline text only
```

This is curious — for selected rows the designer treats it as a special
composition rather than using a setProperties variant. This might be
because the "selected" state visual treatment in the live SAP List Item
master doesn't match what the designer wanted (perhaps the navigation
indicator strip, perhaps the byline wrapping).

**For our plugin**: we can either replicate this exact pattern OR keep
our simpler approach (regular ActionListItem with selected background).
The simpler approach is closer to what end-users see in a real running
SAP application — the special composition is probably a designer's
visual preference for the Figma file, not a UX guideline.

## BOTTOM — Footer (40px tall canonical, HUGS in plugin)

```
Footer (INSTANCE 834×40, at y=592)
└── ⿻ Actions Compact (SLOT)
    ├── 1st Action (INSTANCE) — "Previous" Tertiary  (back-action)
    ├── 2nd Action (INSTANCE) — "Next"     Primary   (primary-action)
    └── 3rd Action (INSTANCE) — "Cancel"   Tertiary  (safe-escape)
```

**Plugin rule: Footer always HUGs vertical**. The 40px is canonical for
Compact density / 26px buttons, but height MUST adapt if button size
changes (Cozy density, icon-only, etc.). Set `layoutSizingVertical='HUG'`
on the Footer FRAME so it grows with its children.

### Intent → Button Type variant map (CANONICAL — derived from designer reference)

The intent field on a footer button maps to a SAP Button `Type` variant.
The spec can override with `props.type` for custom cases.

**Live SAP Web UI Kit Button Type values:**
`Primary` / `Secondary` / `Accept` / `Reject` / `Attention` / `Tertiary`
There is NO `Emphasized`, `Transparent`, `Negative`, `Ghost`, or `Default` in the kit — those are
UI5 API vocabulary and will throw if passed to `setProperties`.

| Intent              | SAP Button Type | Visual                                | Used for               |
|---------------------|-----------------|---------------------------------------|------------------------|
| `primary-action`    | `Primary`       | Solid blue fill, white text           | Next, Save, Submit, OK |
| `destructive`       | `Reject`        | Solid red fill, white text            | Delete, Remove         |
| `back-action`       | `Tertiary`      | No fill, no border, blue text         | Previous, Back         |
| `safe-escape`       | `Tertiary`      | No fill, no border, blue text         | Cancel, Close          |
| `secondary-action`  | `Tertiary`      | No fill, no border, blue text         | Generic secondary      |
| `(no intent)`       | `Tertiary`      | (safest default)                      | Fallback               |

**Override**: `{ "intent": "back-action", "props": { "type": "Secondary" } }` →
explicit `props.type` wins over the intent's default. The override must also be a valid kit value.

**Designer reference**: this map matches the visual treatment in the
reference Dialog at node 138:17478 — Previous (Tertiary) +
Next (Primary, blue) + Cancel (Tertiary, no border).

This DOES use the SAP Footer instance. The fact that we couldn't easily
mutate the action labels via Plugin API means the designer probably
sets them via Figma UI's "Instance Properties" panel — which is
trivially achievable interactively but hard programmatically.

**Recommendation**: keep our native Footer + fresh SAP Buttons approach
for the plugin path. It produces the same visual output as the
designer's SAP Footer instance + interactively-set action labels.

## How to apply this pattern

For the plugin's Dialog renderer, when the spec calls for a wizard
Dialog with steps + list:

1. Detach SAP Dialog → outer FRAME with Header (instance), Content
   Container (frame), Footer (instance)
2. Replace the standard ⿻ Content with `Wizard-Input Fields` semantic
   naming and 770×429 sizing
3. Build native Wizard Page Header (116 tall) at y=0 OVER the Header
   - Inside: TitleObject row (title + close icon) at y=24, 28 tall
   - Inside: Steps row at y=52, 64 tall, with `.base/Wizard Step` instances
4. Inside Wizard-Input Fields:
   - Top: real SAP `Select Method` instance for the section header (if
     spec has Panel.headerText)
   - Below: native VERTICAL List frame with `List Item` SAP instances
5. Replace SAP Footer with native + fresh SAP Buttons (existing approach)

## Width calibration

The designer uses **834** for the Add API Dialog width. Our current spec
uses 811. The 834 width gives:
- 24+24 padding for the wizard step row labels = 786 inner
- 4 step labels at full breath: 24 + 365 + 8 + 365 + 8 + 108 = NO that
  doesn't fit. Designer only shows 2 visible steps in the metadata
  (Step 1 + Step 2, Step 3 is hidden).

Actually that 365px-wide Wizard Step is overly generous — the designer
designed it for a 3-step wizard where each step gets a fair chunk of
the 738px usable width.

For OUR 4-step wizard at 834 width: each step ≈ 200px (738 / 4 = 184),
leaving 8px gaps. The native step rendering we have (variable widths
matching label text) is actually more flexible.

## Patterns Applied

| Pattern | SAP Guideline |
|---|---|
| Dialog with Wizard | https://experience.sap.com/fiori-design-web/wizard/ |
| Object Header Title in dialog | https://experience.sap.com/fiori-design-web/object-page/ |
| List Item with Selector + Text + Byline | https://experience.sap.com/fiori-design-web/list/ |
| Selected list item (radio selection pattern) | https://experience.sap.com/fiori-design-web/radio-button/ |

## What this changes about our existing knowledge

- **RULE A confirmed**: `Dialog` is a FRAME wrapper. ✓
- **RULE I update**: Wizard step IS available as a SAP instance — `.base/Wizard Step`. Add to the "should be SAP instance" list in PATTERN-LIBRARY priorities.
- **NEW RULE L** (proposed): When a Dialog has a wizard, the WIZARD PAGE HEADER is the title bar — there's no separate Header strip. Title and steps go together in one ~116px tall composite element.
- **NEW RULE M** (proposed): The "selected" state of a list item can be either (a) the SAP List Item's built-in Selected variant, OR (b) a separate native composition the designer crafts. Both are valid — option (b) gives more visual control but breaks the SAP Selected pattern.

## Continuous-learning note

This is the most complete SAP Dialog reference in the file. Any new
"Wizard inside Dialog" pattern reference should be cross-checked against
this rosetta. New insights become amendments below this section.

---

## Amendments (2026-06-28)

### Native Table — spec columns + items bypass SAP demo content

The SAP Table component instance ships with hardcoded "Sales Orders (15)"
demo content that cannot be overridden via Plugin API. When the spec
provides `slots.columns` and/or `slots.items`, the plugin builds a
**native Table FRAME** with our exact columns + rows instead of importing
the SAP instance.

```
Table (FRAME)
├── SapColHeader (FRAME, 32px tall, sapShellColor + 1px sapList_BorderColor bottom)
│   └── ColHeader-N (FRAME) → Bold 14 "Name" / "URL" / etc.
├── ColumnListItem (FRAME, HUG vertical, padding 16/12)
│   ├── Cell-0 (FRAME) → child component (Text/Link/Button/…)
│   ├── Cell-1 (FRAME) → child component
│   └── Cell-2 (FRAME) → child component
└── ColumnListItem (selected) — sapList_SelectionBackgroundColor blue tint
```

`ColumnListItem.children[i]` maps positionally to `Column[i]`. Column
widths from `props.width` (`"30%"`, `"200px"`) or distributed equally.

Falls back to SAP Table instance only when spec has NO columns/items
(useful for placeholder demos).

### OverflowToolbar — borderless by default

OverflowToolbar inside a Panel, Dialog, or Table.headerToolbar slot is
**borderless** per SAP Fiori convention. The parent container provides
visual separation. Opt-in to a border via `props.bordered: true` only
when the toolbar stands alone without a wrapping container.

### Table.headerToolbar slot — slot-specific validation

The registry's `Table.validSlotChildren.headerToolbar = ['OverflowToolbar', 'Toolbar']`
allows OverflowToolbar in the headerToolbar slot while keeping the main
table children constrained to row/column types. This matches SAP UI5's
`sap.m.Table` aggregation model.

### Spec field convention — `props.text` is canonical

All text-bearing components (Text, Link, Title, Label) accept the text
content via `props.text`. The legacy `nodeSpec.label` shorthand is also
honored for backward compatibility. Specs should prefer `props.text`
consistently.

<!-- part of the SAP Fiori knowledge base -->
