# sap-visual-reading

## What this skill does

Reads any combination of UI image, business requirement text, or specification document — and produces a structured SAP Fiori design plan for SAP product designers.

Output is always grounded in real SAP design system sources only:
- SAP Fiori Design Guidelines — experience.sap.com
- SAPUI5 component API — sap.m.*, sap.ui.layout.*, sap.f.*
- SAP Web Components — ui5-webcomponents.org
- SAP Horizon design tokens — only named tokens, never raw hex values
- SAP Web UI Kit (Figma) — https://www.figma.com/design/SILcWzK5uFghKun9jx6D7c/SAP-Web-UI-Kit
- SAP Fiori for Web UI Kit — https://www.figma.com/community/file/1494295794601744471/sap-fiori-for-web-ui-kit

No invented components. No hallucinated tokens. No "custom" solutions unless explicitly stated and flagged.

---

## Triggers

Run this skill when the user provides any one or combination of:

- A UI screenshot, Figma frame, wireframe, sketch, or photograph of a screen
- A business requirement, user story, or acceptance criteria in text
- A specification document (PDF, markdown, plain text)
- An explicit request to plan, map, spec, describe, or build an SAP Fiori screen

The skill handles all three inputs — image, document, text — together or separately. It adapts the pipeline based on what is available.

---

## What to read before running

Always read these reference files before producing output:

1. `references/confidence-system.md` — mandatory for every output
2. `references/screen-types.md` — classify the screen before anything else
3. `references/component-map.md` — visual pattern → SAP component lookup
4. `references/tokens.md` — Horizon token reference for typography, color, spacing
5. `references/states.md` — field states, validation, empty, loading, error patterns
6. `references/prompt-template.md` — output structure template

For image inputs also read:
7. `references/image-quality.md` — reading strategy per image type

---

## Pipeline — loop-aware, 8 stages

Each stage checks its own output before proceeding.
If a check fails: retry once with a different strategy. If still incomplete: flag it as ? and continue.
Max 2 retries per stage. Never block output waiting for a perfect answer.

---

### Stage 1 — Understand the input

Identify what has been provided:
- **Image only** → go to Stage 2 (visual reading)
- **Text/document only** → go to Stage 3 (requirement parsing)
- **Image + text** → run Stage 2 and Stage 3, then merge at Stage 4

**Coverage check (L1 loop):**
Before proceeding, confirm:
- [ ] Screen type is identifiable
- [ ] All major regions are named
- [ ] Business intent is clear

If any item is unchecked after first pass → re-read the input with fresh eyes.
If still unclear → mark as ? and proceed with what is known.

Never skip to component mapping. Always understand before mapping.

---

### Stage 2 — Visual reading (image inputs)

Read the image like a senior SAP product designer reviewing a reference.

**Designer Reasoning Pass — mandatory before describing any element:**

For every major region, answer all six questions:

1. **What is the purpose of this section?**
2. **Why was it designed this way?** (modal vs page, inline vs sidebar, etc.)
3. **What visual principles are at work?** (hierarchy, grouping, emphasis, alignment)
4. **Which SAP floorplan or pattern best represents it?**
5. **Which SAP components best preserve both the function and visual intent?**
6. **What evidence from the image supports these decisions?**

This pass must come before component selection. It prevents generic output and grounds every decision in observable design evidence.

**Then apply the Sector-Based Analysis method (mandatory — never analyze the screen as one unit):**

Understand each PART before the whole. Divide → analyze one sector at a time → local recommendation → merge.

**Phase 1 — Divide the reference** into logical sectors following the interface's natural structure (not a fixed grid). Label each with a letter.
```
Simple:            Complex:
A | B              A → Header      E → Main Content
-----              B → Navigation  F → Side Panel
C | D              C → Toolbar     G → Footer
                   D → Filters
```

**Phase 2 — Analyze ONE sector at a time**, in reading order (top-left → A → B → C → next row → … → bottom-right). Finish each sector fully before moving to the next. Per sector determine: business purpose · information hierarchy · candidate floorplan/pattern · SAP components · parent-child · Auto Layout · spacing/alignment · typography/tokens · interactions · dependencies on neighboring sectors.

**Phase 3 — Local recommendation per sector**: best floorplan contribution · recommended SAP components · layout strategy · grouping/containment · interaction · a11y. Think locally before globally.

**Phase 4 — Merge into a unified architecture** (only after ALL sectors analyzed): connect related regions → resolve cross-sector dependencies → build the full hierarchy → select the OVERALL floorplan → validate it forms a coherent SAP Fiori app. Only then plan implementation.

```
Sector map (required artifact — label every sector A, B, C...):
Screen
├── Sector A — [name]   → [floorplan contribution + components]
├── Sector B — [name]   → [...]
│     ├── A1 sub-sector
│     └── A2 sub-sector
└── Sector N — [name]   → [...]
```

**Reading order within each sector:**
Top → Bottom → Left → Right → Primary → Secondary → Container → Component → Detail

**For every element detected, record:**
- What you observe (describe before naming)
- Confidence tier: ● ○ ? (see confidence-system.md)
- SAP component mapping with variant and relevant properties
- Framework availability: SAPUI5 / Web Components / both

**Image quality check:**
Assess tier (1–4) from references/image-quality.md before reading.
State the tier at the top of the output. Adjust confidence defaults accordingly.

---

### Stage 3 — Requirement parsing (text/document inputs)

Extract from the business requirement:

| Extract | Question to answer |
|---------|-------------------|
| Persona | Who is using this screen? What is their role? |
| Task | What are they trying to accomplish? |
| Data | What data do they need to see or input? |
| Actions | What can they do? What triggers what? |
| States | What conditional states exist? (empty, error, loading, success) |
| Constraints | Required fields, validation rules, optional paths |
| Context | Is this a dialog, a full page, a step in a wizard? |
| Interaction | What shows/hides/enables/disables based on user actions? |

Map extracted items to SAP floorplan candidates before selecting one.

---

### Stage 4 — Screen classification + floorplan scoring

Classify using `references/screen-types.md`.

**Floorplan scoring (L2 loop) — score all candidates, pick highest:**

| Floorplan candidate | Business fit | Interaction fit | SAP compliance | Total |
|--------------------|-------------|----------------|----------------|-------|
| [Candidate A] | /10 | /10 | /10 | /30 |
| [Candidate B] | /10 | /10 | /10 | /30 |

State:
- Chosen floorplan + score
- Why the runner-up was not chosen
- Any constraints that override the score (mobile viewport, modal context, etc.)

**Then score canonical-screen similarity** (RULE 28 clone target): run `references/canonical-similarity-rubric.md` — score each candidate canonical screen (floorplan 50% + region 30% + component 20%), pick the highest, cite the % (e.g. "Outage List 96% → clone `750:174925`"). ≥85% = clone directly; 60–84% = clone + note deltas; <60% = combine two or build fresh (flag it).

---

### Stage 5 — Component mapping with scoring

For each zone and element, produce the full entry:

```
Element: [observed name]
Zone: [A / B / C...]
Confidence: ● / ○ / ?
Observation: [what you see — describe before naming]
SAP component: [exact sap.m.* or ui5-web-component name]
Variant/property: [specific property values]
Framework: SAPUI5 / Web Components / both
Parent: [containing component]
States: [enabled, disabled, required, error, selected — as applicable]
Token: [SAP Horizon token for color, spacing, or typography]
Data source: Static / JSON Model / OData V4 / unknown ?
```

**Component scoring (L3 loop) — when two components are valid:**

Never pick silently. Always produce a scored table:

```
Options for [element]:
  | Component | SAP compliance | Interaction fit | Framework | Complexity | Total |
  |-----------|---------------|----------------|-----------|------------|-------|
  | A) sap.m.SegmentedButton | 10 | 9 | 10 | 9 | 38 |
  | B) sap.m.ToggleButton ×4 | 9 | 7 | 10 | 7 | 33 |
  → Recommend A (score 38/40) — single-select enforced; use B only if multi-select required
```

---

### Stage 6 — Interaction model

For every interactive element, document the complete behavior:

```
Interaction: [element name]
Trigger: [press / select / change / check / expand]
Target: [what changes — another element, visibility, state, navigation]
Binding: [visible= / enabled= / selectedKey= / value= pattern]
State before: [what the user sees before the action]
State after: [what the user sees after the action]
```

Examples from this session:

```
Interaction: Recurrence checkbox
Trigger: select (check/uncheck)
Target: Recurrence type section + Monthly pattern section
Binding: visible="{/recurrenceEnabled}"
State before: Recurrence section hidden
State after: SegmentedButton + conditional pattern shown
```

```
Interaction: Filter toggle button "Hide Filters"
Trigger: press
Target: Filter bar VBox
Binding: visible="{/filtersVisible}" — toggle on press
State before: Filter bar visible, button text="Hide Filters"
State after: Filter bar hidden, button text="Show Filters"
```

This stage is mandatory. Interaction model is what developers implement. Without it, the spec is incomplete.

---

### Stage 7 — Layout reconstruction + token loop

**Read `references/vd-scan-measurement.md` before this stage on any screen with a filter row,
card grid, multi-column layout, or a repair (`/sap-fix`).** It defines the measured / calculated /
inferred / design-system tagging discipline and the component-boundary / standalone-vs-composite
classification this stage depends on — added 2026-09-08 after a build forced 6 unequal-content
filter columns to equal widths and used guessed round-number gaps instead of real SAP spacing
tokens. On simple single-column screens the short version below is enough.

Infer the layout system. State all measurements as estimated unless directly confirmed — tag each
one measured / calculated / inferred / design-system, never present an inference as a direct
measurement.

- Grid system: SimpleForm / Grid / CSSGrid / HBox+VBox
- Column count and breakpoints (S/M/L/XL) — size each column to its actual content; do not force
  equal widths when the reference's content clearly needs different widths (e.g. a toggle control
  next to a dropdown with a long placeholder)
- Spacing: SAP spacing tokens only — never raw px values. Look up the real token
  (`mcp__sap-design__getFoundation` name `spacing`, or `get_tokens_for` the specific component)
  before choosing a gap; do not invent a round number
- Visual rhythm: section separators, dividers, grouping logic
- Density: Cozy (default) or Compact — flag if context suggests Compact
- Responsive behavior: what collapses, what stacks, at which breakpoint

**Token loop (L5 loop) — enforce zero hard-coded values:**

For every visual property, resolve to a SAP Horizon token:
- If token found → use it
- If token uncertain → flag as ? and direct to SAP Web UI Kit Figma
- If no token exists → flag as non-standard, propose closest token, note deviation

Typography tokens → see `references/tokens.md`
Color tokens → see `references/tokens.md`
Spacing tokens → see `references/tokens.md`

---

### Stage 8 — Produce output + RCA block

Output in this order — always:

1. **Image quality tier** (Tier 1–4, one line)
2. **Designer Reasoning Pass** — for each zone, the 6 questions answered
3. **Screen classification** — type + floorplan score table + justification
4. **Zone overview table** — all zones, A/B/C... labels, content, key component
5. **Zone-by-zone component map** — full element entries with ● ○ ? tiers
6. **Full component architecture tree** — nested container hierarchy
7. **SAP Horizon token mapping table** — every visual property resolved
8. **Interaction model** — every interactive element with trigger/target/binding
9. **Validation and error states** — per input field, per interactive control
10. **Open questions** — everything marked ? as named, actionable questions
11. **RCA block** — Root Cause Analysis for every ? item
12. **Confidence table** — one row per area

**RCA block format — mandatory for every ? item:**

```
RCA: [element or decision name]
What is uncertain: [specific gap]
Why it is uncertain: [image quality / two valid options / requirement gap / missing context]
Affects other screens: [yes — describe / no]
Resolution path:
  Immediate: [what to do right now — ask one question / check UI Kit / verify API]
  Rule update: [if this recurs — add to component-map.md or screen-types.md]
  Architecture update: [if systemic — describe the pipeline change needed]
```

**Clarifying question gate:**
If 3 or more ? items share the same root cause → ask ONE focused question before producing the full output.
Maximum 1 question per run. Never block output entirely — ask the question, then continue with best inference.

**Confidence table — end every output with this:**

| Area | Confidence | Notes |
|------|-----------|-------|
| Screen classification | % | |
| Floorplan selection | % | |
| Layout reconstruction | % | |
| Component mapping | % | |
| Typography tokens | % | |
| Color tokens | % | |
| States and variants | % | |
| Interaction model | % | |

Rows below 80% must have a corresponding RCA entry.

---

## Output rules — always enforced

- **Only real SAP components.** If a component does not exist in sap.m.*, sap.f.*, sap.ui.layout.*, or SAP Web Components — do not use it. Say "no standard SAP component for this pattern" and present the closest alternative.
- **Only SAP Horizon tokens.** Never output raw hex, RGB, or px values as design decisions. Measurements estimated from images are labeled "estimated" and given as relative references, not hard values.
- **Confidence is mandatory.** Every component mapping carries ● ○ or ?.
- **Scoring over guessing.** When two components are valid, produce a scored table. Let the designer decide.
- **Framework availability.** Always note whether a component is SAPUI5 only, Web Components only, or available in both.
- **Interaction model is required.** Every spec must document triggers, targets, and binding patterns — not just visual states.
- **No hallucinations.** If you do not know whether a token, component, or property exists — say so and instruct the designer to verify in the SAP Web UI Kit Figma file or SAPUI5 API docs.
- **Zone labels.** Every output must use A/B/C... zone labels consistently across: zone overview table, component map entries, architecture tree, and interaction model.

---

## What this skill does NOT do

- Does not produce HTML, CSS, or JavaScript implementation code
- Does not reference Material, Fluent, Carbon, or any non-SAP design system
- Does not invent component names or token names
- Does not produce Figma-specific layer instructions (use sap-fiori-copywriting for that)
- Does not write component guideline copy (use sap-fiori-copywriting for that)
- Does not write specification prose (use sap-specification for that)

---

## Pattern library — learned from this session

Successful patterns extracted from completed outputs. Read before running to avoid re-solving known problems.

### Pattern 001 — Schedule dialog (Dialog + conditional sections)
- Modal task → sap.m.Dialog contentWidth=560px
- CheckBox toggling a section → visible="{/booleanFlag}" on VBox
- RadioButtonGroup with disabled row → enabled=false on all child controls of inactive row
- Two-column date+time → sap.ui.layout.form.SimpleForm columnsL=2 columnsM=1
- Recurrence type pills → sap.m.SegmentedButton (single-select enforced)
- Reference: `examples/schedule-dialog.md`

### Pattern 002 — Flight result card (CustomListItem + HBox zones)
- Search result card → sap.m.CustomListItem inside sap.m.List mode=SingleSelectMaster
- Multi-zone horizontal layout → sap.m.HBox with 5 named zones (A–E)
- Airline logo → sap.m.Avatar shape=Circle size=XS (handles broken image fallback)
- Duration pill → custom HBox with sapUiNeutralBG (no standard SAP pill component)
- Price display → sap.m.ObjectNumber number emphasized=true
- Offer badge (green) → sap.m.ObjectStatus state=Success (not a native pill)
- Stopover link → sap.m.Link (underline confirms interactive)
- Reference: `examples/flight-card.md`

### Pattern 003 — Object Page Steps tab (DynamicPage + mobile list)
- Activity object mobile → sap.f.DynamicPage + sap.m.IconTabBar
- Tab count badge → count property on sap.m.IconTabFilter
- Inline filter toggle → sap.m.VBox visible="{/filtersVisible}" toggled by toolbar button
- Selected+success list item → sap.m.CustomListItem highlight=Success selected=true type=Navigation
- Left border accent (green) → highlight=Success property (not custom CSS)
- Sub-fields in list item → sap.m.ObjectAttribute ×N inside VBox
- Overflow menu mobile → sap.m.Button opening sap.m.ActionSheet (not sap.m.Menu)
- Reference: `examples/object-page-steps.md`

---

## Failure log — known pitfalls

### Failure 001 — Colored pill badges
**What failed:** Mapping green offer badges (Beste Option, Günstigste Verbindung) to a non-existent SAP pill component.
**Why:** SAP Fiori has no generic colored pill/chip component. sap.m.Tag is deprecated.
**Fix applied:** Use sap.m.ObjectStatus state=Success for semantic green. Flag non-semantic brand colors as requiring CSS override + designer confirmation.
**Rule update:** Added to component-map.md ambiguous patterns section.

### Failure 002 — Raw hex in token assignments
**What failed:** Stating specific hex values (#185FA5) as design decisions.
**Why:** Hex values are not portable across Horizon themes (light/dark/HC).
**Fix applied:** Map to nearest named token (sapUiButtonTextColor) and note the hex only as an observational reference, not a token value.
**Rule update:** Token loop (L5) now enforces zero hard-coded values.

### Failure 003 — Missing interaction model
**What failed:** Specs described static component states but not what happens on user interaction.
**Why:** Visual analysis reads layout, not behavior. Behavior requires an explicit additional stage.
**Fix applied:** Stage 6 (Interaction model) added as mandatory stage with trigger/target/binding format.
**Rule update:** Interaction model is now a required output section.

### Failure 004 — Guessed spacing + forced-equal layout (2026-09-08)
**What failed:** A rebuild used round-number gaps with no source (not a real SAP spacing token),
and forced 6 filter-row columns (1 toggle + 5 dropdowns) to equal width even though a toggle is
visually and functionally much narrower than a dropdown with a long placeholder. Separately, a
component's default sample text ("Typed Text", "Label:") shipped as final content because nothing
explicitly set `.characters` after `createInstance()`, and elements were positioned at raw
page-absolute coordinates before a real parent frame existed.
**Why:** No measurement-confidence discipline — inferred/guessed values got treated the same as
directly measured ones, and no component-boundary pass ran before deciding how to lay things out.
**Fix applied:** `references/vd-scan-measurement.md` — measured/calculated/inferred/design-system
tagging, spacing-token lookup requirement, component-boundary + standalone-vs-composite
classification (§3–4), and a measurement QA pass (§10) before accepting layout numbers.
**Rule update:** Stage 7 now points to this reference for any screen with a filter row, card grid,
multi-column layout, or repair.

---

## Worked example references

- `examples/schedule-dialog.md` — Dialog with conditional sections, CheckBox toggle, RadioButtonGroup
- `examples/flight-card.md` — CustomListItem with 5 horizontal zones A–E
- `examples/object-page-steps.md` — DynamicPage mobile, IconTabBar, inline filter, highlighted list item
