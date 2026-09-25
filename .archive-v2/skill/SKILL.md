# SAP Figma Design Agent

> ## ⛔ DEFAULT PATH IS MCP-FIRST — use the `/sap-screen` skill, NOT this JSON pipeline
> Per **RULE 25**, the default way to build any SAP Fiori screen in Figma is the **`/sap-screen` skill**
> (`.claude/skills/sap-screen/SKILL.md`) — Claude builds real SAP instances directly via `use_figma`,
> then the plugin binds tokens. **That is the authoritative execution spine.**
>
> The JSON-spec pipeline documented below is the **LEGACY path**, retained ONLY for bulk standard-floorplan
> generation via the plugin's `Build Screen` button. Do NOT use it for a normal build-from-reference request.
> When a user says "build an SAP screen", invoke `/sap-screen`.

Transform a business requirement into a validated SAP Fiori screen spec by combining AI reasoning with live SAP documentation fetched from the official sources.

---

## Which Mode? (choose one)

### Mode 1 — Screen Building  *(the pipeline below)*
Route here when the user provides a **requirement, ticket, user story, or feature description** — anything of the form "build a screen for…", "generate a spec for…", "I need a worklist that…".

### Mode 2 — Component Guidance
Route here when the user asks **"which component should I use for X?"**, **"help me choose between Y and Z"**, **"what are the do/don'ts for W?"**, or any other targeted design question that does not describe a full screen.

**Handler:** `agents/component-guidance.md`

**MCP wiring** (Wave A of 2026-07-07 registered these):
- `sap-fiori-guidelines` — `getFioriGuideline`, `searchGuidelines`, `getPattern`, `listComponents`
- `ui5-mcp-server` — `get_api_reference` (live UI5 API JSON)
- `sap-figma-community` — `getRegistryEntry`, `listKnownComponents`

**Example prompts** (Mode 2 fires on any of these):
- *"I need to show 'Approved / Pending / Rejected' status on each row of my table. Which component?"*
- *"Should I use `Bar` or `OverflowToolbar` for the dialog footer?"*
- *"What are the accessibility requirements for `RatingIndicator`?"*
- *"Compare `ObjectStatus` vs `GenericTag` vs `InfoLabel` — when do I use which?"*
- *"What's the correct empty state pattern inside a `Card`?"*

The guidance agent returns a **structured guidance report** (purpose · when to use · when NOT to use · do/don't · configuration · accessibility · compatible with) and can optionally emit a small ready-to-paste JSON snippet.

---

## The Pipeline

```
User describes business need (text) OR provides visual reference (image/Figma/PDF/sketch)
        ↓
Step 0: [MANDATORY when reference provided] Complete Reference Analysis
        12-step pipeline · 7 verification passes · Zero-Omission Policy
        Container-First mapping · SAP best-fit component selection
        Generation BLOCKED until all passes succeed (RULE 12 + RULE 14)
        ↓
Step 0.5: [MANDATORY for reference images] Spatial Analysis + Region Map
        Phase 1 global shell → Phase 2 decompose → Phase 3 analyze each region
        Measure column ratios / padding / gaps before selecting any component
        Emit region map with SAP component for every region
        Generation BLOCKED until region map is complete (RULE 17 + RULE 18)
        ↓
Step 0.75: [MANDATORY when visual reference provided] Visual Design Intelligence Phase (RULE 26)
        Agent: skill/agents/visual-design-intelligence.md
        Runs AFTER draft-preview approval, BEFORE Reasoning Brain
        Produces 7 artifacts:
          A1  Region Hierarchy (reuse from Step 0.5)
          A2  Element Classification Map (every element → SAP component + confidence ●/○/?)
          A3  Spatial Measurement Report (dimensions with evidence citations or ⚠ INFERRED)
          A3b Design Decision Record (WHY each major decision, with observable evidence)
          A4  Token Assignment Proposal (every color/typography → exact SAP token)
          A4b SAP Compliance Notes (deviations flagged, user intent followed)
          A5  Completeness + A11y Audit (binary checklist ≥95%)
        Gate: "VISUAL ANALYSIS COMPLETE — 7/7 artifacts produced"
        Post-build: run Ground Truth Update after confirmed-quality build
        ↓
Step 1: Claude reads and understands the requirement
        ↓
Step 1.5: ★ REASONING BRAIN — MANDATORY BEFORE COMPONENT SELECTION (RULE 20):
        Intent Card (who / what / North Star)
        Business Entity Model (root entity → children → attributes)
        Screen Classification (Monitoring / ListReport / ObjectPage / etc.)
        Layout Blueprint (structural skeleton — no SAP components yet)
        Component Planning Table (Region → SAP Component → Confidence %)
        Relationship Graph (structural containment tree)
        Composition Pre-check (every parent-child pair validated)
        ────────────────────────────────────────────────────────
        ★ Step 4 (hierarchy design) is BLOCKED until all 7 artifacts produced ★
        ────────────────────────────────────────────────────────
        ↓  (only after all 7 artifacts complete)
Step 2: Claude researches SAP sources (DemoKit API + Fiori Guidelines + Samples)
        ↓
Step 3: Claude presents proposed structure — asks questions, explains choices
        ↓
Step 3.5 ★ ASCII WIREFRAME — HARD STOP — MANDATORY (RULE 19):
        Claude renders ASCII wireframe + region map in chat BEFORE any JSON.
        NEVER skip this. NEVER generate the spec without user approval first.
        User can iterate freely. Loop until user says "approved" / "go" / "build it".
        ──────────────────────────────────────────────────────
        ★ JSON spec generation is BLOCKED until explicit approval is received. ★
        ──────────────────────────────────────────────────────
        ↓  (only after approval)
Step 4: User confirms, refines, or requests changes
        ↓
Step 5: Claude generates validated JSON spec
        ↓
Step 6.5: ★ QA CERTIFICATION — MANDATORY BEFORE HANDOFF (RULE 21):
        SAP UX Review (spacing · typography · density · consistency · a11y)
        Visual Comparison (missing / different / extra / misplaced)
        Completeness Score (N% covered, list of gaps)
        Architectural Suggestions (could this be better?)
        Design System Compliance (every token, type, icon, component)
        Final Certification Checklist (21 items ✓/⚠/✗)
        Self-Repair Loop (auto-fix ✗ failures, max 3 passes)
        ────────────────────────────────────────────────────────
        ★ Spec is NOT presented to user until certification is complete ★
        ────────────────────────────────────────────────────────
        ↓  (only after certification: CERTIFIED or CERTIFIED WITH WARNINGS)
User pastes JSON into Figma plugin → Build Screen
```
```

---

## Step 0.5 — Canonical Reference Analysis  ★ MANDATORY for all reference images and complex screens  (RULE 17)

**Source of Truth:** `docs/CANONICAL-ANALYSIS-METHODOLOGY.md`

The plugin must never analyze a reference screen as a single flat image.
Instead, apply the **5-phase canonical methodology** below.
See also: RULE 16 (Design Flexibility) and RULE 17 (Divide-and-Conquer) in `skill/SYSTEM_PROMPT.md`.

---

### Phase 1 — Identify the Global Shell

Begin with the highest-level application structure:
ShellBar · Global Navigation · Side Navigation · Application Frame · Footer.

This establishes the architectural foundation before any detail work.

**Example (SAP LaMa):** Region A = the ShellBar strip spanning the full viewport width.

---

### Phase 2 — Decompose the Interface

After understanding the global shell, divide the remaining interface into independent logical work areas:
Navigation/Side Panel · Master List · Detail View · Inspector Panel · Dialog · Card Area · Table · Form · Dashboard Region.

Each region becomes an independent analysis task.

**Example (SAP LaMa):** Regions B (SideNavigation) · C (Activities master) · D (yanatest detail) · E (Validate System sub-detail).

---

### Phase 3 — Analyze One Region Completely

Never analyze multiple regions simultaneously.

For each region apply all three core principles in order:

#### Reading Order — always top-left to bottom-right

Scan the region exactly as you read text: start top-left, move right, then down. Never jump to the visually prominent element first. SAP regions are hierarchical top-to-bottom and left-to-right — following reading order surfaces the correct parent-child relationships.

#### Divide the Screen into Logical Sub-regions

Before touching any component, name every sub-section. An unnamed element is a skipped element. This is a checklist — if a sub-region is absent, you need a reason why:

- Region title / heading area
- Filter / search area
- Toolbar (with all icons and actions)
- Content list, table, or card group
- Detail row / card / selected item
- Footer / action area

#### Complete One Sub-region Before Starting the Next

Work through all 10 steps completely before moving on:

1. **Purpose** — what is this region for in the business flow?
2. **Detect all elements** — every text node, icon, control, badge, divider
3. **Extract all text** — literally every visible string, placeholders, timestamps, counts
4. **Identify actions** — buttons, menus, icons, chevrons, interactions
5. **Understand business purpose** — what does the user accomplish here?
6. **Identify relationships** — what contains what? what triggers what?
7. **Determine SAP floorplan** — which Fiori pattern is this?
8. **Select SAP components** — from the registry, matching exactly what is visible
9. **Apply SAP tokens** — design tokens, typography, spacing, accessibility
10. **Validate completeness** — walk the region one more time before proceeding

**Only after all 10 steps are complete for region N do you move to region N+1.**

---

### Phase 4 — Apply Recursive Decomposition

If a region is still complex, divide it further and repeat Phase 3:

```
Application
├── Shell Bar
├── Navigation
├── Content
│   ├── Toolbar
│   ├── Filter Bar
│   ├── Table
│   │   ├── Header row
│   │   ├── Column headers
│   │   ├── Data rows
│   │   └── Row actions
│   └── Detail Panel
└── Footer
```

Continue dividing until each section is small enough to analyze confidently.

---

### Phase 5 — Assemble and Verify

Only after every region is analyzed, assemble the complete SAP application. Validate:

- Parent-child relationships · Navigation flow · Layout consistency
- SAP component composition · Auto Layout · Design tokens · Typography
- Spacing · Accessibility · Business workflow

---

### Phase 0 — Spatial Analysis  (RULE 18 · runs before any component selection)

Before choosing any SAP component, measure the layout from the reference. Never assign arbitrary dimensions, spacing, or padding.

**Measure in this order:**

| What to measure | How to estimate from the reference |
|---|---|
| Overall screen proportions | Estimate total width/height ratio |
| Region widths | Express as % of total width (e.g. 28% / 28% / 44%) |
| Region heights | Note if equal rows or unequal |
| Margins (outer) | Space between screen edge and first content |
| Internal padding | Space between container border and its children |
| Gaps between components | Vertical and horizontal spacing between siblings |
| Column distribution | How many columns? What ratio? |
| Alignment | Left-edge, center, right-edge, baseline aligned? |

**Assign confidence levels:**
- **HIGH** — clear spacing, alignment, or repeated interval visible
- **MEDIUM** — inferred from surrounding elements and proportions
- **LOW** — ambiguous; state the assumption explicitly in `meta.decisions.layout`

**Reconstruct with Auto Layout:**
- Infer direction (HORIZONTAL / VERTICAL), gap, padding, align, hug vs fill
- Avoid spacer frames — use gap values instead
- Fixed sizes only where the reference clearly shows a fixed element

**Validate before generating:**
- Major region proportions match the reference
- Spacing is consistent (not a random mix of 8/17/23px)
- Auto Layout values reflect measurements, not guesses

**Document in spec's `meta.decisions.layout`:**
```json
"layout": {
  "sizingStrategy": "explicitWidth=2000; SideNav 200px (10%); FCL splits 28/28/44",
  "paddingRationale": "16px internal panel padding (compact SAP default); 8px inter-item gap",
  "confidence": {
    "overallWidth": "HIGH — reference shows full desktop viewport",
    "columnRatio": "MEDIUM — 28/28/44 estimated from visual proportions",
    "rowHeight": "HIGH — compact density = 32px row height per SAP spec"
  }
}
```

---

### Mandatory Output: Region Map (before generating any spec)

Before generating any spec, produce a labeled region map. This is mandatory. Use the LaMa example as the template for depth and precision:

```
Region A · Shell Bar (global shell, full viewport width)
  ≡ · ← → · SAP logo · "SAP Landscape Management" (bold) · "yana" chip (blue)
  ⚠ "Active System User" (orange warning link) · "Refresh |" ∨
  "Working Set: All" · "OPU on lama-runtime-5749d75c5c-z5kd9 (13:29)"
  🔍 · ❓ · "Adam Administrator"
  → SAP: ShellBar(title="SAP Landscape Management", secondaryTitle="yana", showSearchField=true)
  → Note: warning line is a MessageStrip type=Warning BELOW ShellBar, not inside it

Region B · Side Navigation (left rail, ~200px)
  Overview → · Operations ↓ [Operations · Operation Templates · Schedules]
  Automation Studio ↓ [Content Mgmt · Provider Definitions · Custom Operations ·
    Custom Hooks · Custom Notifications · Custom Processes · Auto-Heal Configurations]
  UI Customizations ↓ [Links · Menu Items]
  Monitoring (selected — blue bg, left blue stripe) ↓
    → Activities (active sub-item) · Logs
  Configuration → · Configuration Ex... → · Infrastructure →
  → SAP: SideNavigation + NavigationItem tree (Monitoring: expanded=true; Activities: selected=true)

Region C · Column 1 — Activities View (master, ~28% width)
  "Activities View ▼" (blue bold) · ⓘ · ⋯
  "Latest Server Time: 2026-07-08 13:29:43 (UTC)"
  Filter: Name Input("String") + Status Select("Select Value") + Fx + F+
  "Activities (6)" bold + copy + ↑↓ + grid + ⚙
  Column header: "Name"
  Row 1 (selected — green left stripe, blue bg):
    ✅ yanatest [Actions ▾] >  |  Activity Number: 765  |  Progress: 100% ████✅
    Note:  |  Start Time: 2026-07-06 12:22:48
  Row 2: ✅ Validate Instance [Actions ▾] >  |  #426  |  100%  |  2026-07-02 14:57:49
  Row 3: ✅ Validate System [Actions ▾] >  |  #425  |  100%
  → SAP: DynamicPage → Panel(filter) + Panel("Activities (6)") → 3 row Panels each:
    ObjectStatus(✅, text=name) + MenuButton("Actions") + Labels + ProgressIndicator(100%)

Region D · Column 2 — yanatest Activity Detail (detail, ~28% width)
  "yanatest" (bold H1) · "Activity | Activity Number 765" · ⋯
  Tabs: General | Steps (Steps active — blue underline)
  "Steps (1)" · ∇ Hide Filters · ↑↓ · ⚙
  Status Select("Select Value") + Operation Input("String") + Fx + F+
  "Operation" section header (bold)
  Row (selected — green left stripe, blue bg):
    ✅ Validate System >  |  ID: 1  |  Next:  |  Previous:  |  Hook for ID:
  → SAP: DynamicPage → IconTabBar(General, Steps; selectedKey=steps)
    + Panel(filter) + Panel("Operation") → ObjectStatus(✅ "Validate System") + Labels

Region E · Column 3 — Validate System Step Detail (sub-detail, ~44% width)
  "Validate System" (bold H1) · "Step | ID 1 | Activity Number 765"
  Hide Filters (funnel icon + text) · ⛶ fullscreen · ✕ close
  Message Input("String") + Severity Select("Select Value") + Fx + F+
  "Messages (10)" (bold) · [Plain Text] [List] (List selected — blue border) · ↑↓ · ⚙
  Card 1: [Trace] | LVM | 12:22:48 | Serialized Trace ID: 5edcc...ac749c2 · Trace:... · Span:...
  Card 2: [Debug] | LVM | 12:22:48 | Cluster integration not enabled. No cluster checks.
  Card 3: [Trace] | ValSchedule | 12:22:48 | Scheduling validation for SystemID.A00...simdba00
  Card 4: [Trace] | LVM | 12:22:48 | Scheduled validation for SystemID.A00...simdba00 on all validators
  Card 5: [Information] | LVM | 12:22:48 | Validations for "SystemID.A00...simdba00" validatorId "ALL" triggered
  Card 6: [Trace] | LVM | 12:22:49 | Validations for 'Solution Manager Assignment' not executed yet
  Card 7: [Trace] | LVM | 12:22:49 | Validations for 'Validate System Version' not executed yet
  → SAP: DynamicPage → Panel(filter) + Panel("Messages (10)") →
    SegmentedButton([Plain Text][List]; selectedKey=list)
    + 7× Panel: ObjectStatus(severity) + Label(code) + Label(time) + Text(body)
```

Full detailed region map with complete component mapping: `docs/CANONICAL-ANALYSIS-METHODOLOGY.md`

---

### Per-Region Validation Checklist (before moving to the next region)

- [ ] Every visible element has been detected
- [ ] Every text element has been extracted (including labels, placeholders, timestamps, counts)
- [ ] Every icon has been identified
- [ ] Every interaction has been classified (clickable, filterable, sortable, expandable)
- [ ] Every SAP component has been selected from the registry
- [ ] Every parent-child relationship is correct
- [ ] Nothing meaningful has been omitted

---

## Step 1.5 — Reasoning Brain  ★ MANDATORY BEFORE COMPONENT DESIGN (RULE 20)

**Agent:** `skill/agents/reasoning-brain.md` — read this for the full agent spec.

Runs after Step 1 (requirement understood) and Step 0.5 (region map produced). Produces 7 mandatory artifacts before Step 4 (hierarchy design) can start.

**7 mandatory artifacts:**

1. **Intent Card** — Application, problem, user persona, primary/secondary workflows, critical/optional actions, North Star sentence
2. **Business Entity Model** — Root entity → children → attributes, key relationships, enumerations
3. **Screen Classification** — One of 14 types (Dashboard/ListReport/ObjectPage/Wizard/Dialog/Settings/MasterDetail/Analytical/Overview/Timeline/Inbox/Approval/Administration/Monitoring)
4. **Layout Blueprint** — Structural skeleton with named regions, proportions, nesting, direction — **no SAP components yet**
5. **Component Planning Table** — Region → Purpose → SAP Component → Confidence %. Items below 65% must be resolved before instantiation.
6. **Relationship Graph** — Structural containment tree showing every parent-child relationship
7. **Composition Pre-check** — Verify every pair against registry `validParents`/`validChildren`; 0 violations to proceed

**Step 4 (hierarchy design) is BLOCKED until all 7 artifacts are complete.**

For full templates and the SAP LaMa worked example: `docs/V2-REASONING-PIPELINE.md`

---

## Step 1 — Understand the Requirement

Read the user's message carefully. Extract:

- **Who** is the user (role, context)
- **What** they need to do (task, goal)
- **What data** they work with (entities, fields)
- **What actions** they take (approve, reject, search, create, edit)
- **Scale** (how many items, how often)
- **Context** (desktop/mobile, SAP system, density)

Do NOT jump to components yet. Understand the problem first.

---

## Step 2 — Research SAP Sources

For every component you are considering using, fetch live documentation before recommending it.

### Source A — UI5 API JSON (always fetch first, no browser needed)

```
sap.m controls:  https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json
sap.f controls:  https://ui5.sap.com/test-resources/sap/f/designtime/apiref/api.json
sap.uxap:        https://ui5.sap.com/test-resources/sap/uxap/designtime/apiref/api.json
```

From each control's entry extract:
- `description` — what it does
- `properties` — all configurable options with defaults
- `aggregations` — what it contains (slots)
- `events` — what it fires
- `uxGuidelinesLink` — the Fiori guidelines URL (auto-discovered)

**Fetch script (use with Chrome MCP evaluate_script on ui5.sap.com):**
```javascript
const res = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
const json = await res.json();
const ctrl = json.symbols.find(s => s.name === 'sap.m.Button');
return {
  name: ctrl.name,
  description: ctrl.description?.replace(/<[^>]+>/g, ''),
  uxGuidelinesLink: ctrl.uxGuidelinesLink,
  properties: (ctrl.properties||[]).map(p => ({ name: p.name, type: p.type, default: p.defaultValue })),
  aggregations: (ctrl.aggregations||[]).map(a => ({ name: a.name, type: a.type }))
};
```

### Source B — Fiori Design Guidelines (Chrome MCP, bypasses 403)

Use `uxGuidelinesLink` from Source A as the URL:
```
Chrome MCP:
  navigate_page(ctrl.uxGuidelinesLink)
  wait_for(['When to Use', 'Usage', 'Do', "Don't"])
  take_snapshot()  → full page text
```

Extract:
- Purpose (1-2 sentences)
- When to use (bullet list)
- When NOT to use (bullet list)
- Do / Don't
- Available variants
- Responsive behavior
- Accessibility notes

### Source C — UI5 DemoKit Samples (Chrome MCP)

```
navigate_page('https://ui5.sap.com/#/entity/sap.m.Button/samples')
take_snapshot()  → available sample names and descriptions
```

Use to understand real-world usage patterns.

### Cache results

After fetching, write a summary to `knowledge/guidelines/{slug}.md`.
Check this file first before fetching — if it exists, read it and skip the fetch.

### If Chrome MCP is unavailable

Fall back to:
1. `knowledge/components/registry/{Component}.json` — local schemas with props, composition, a11y
2. `knowledge/guidelines/{slug}.md` — previously cached summaries
3. Training knowledge of SAP Fiori patterns

---

## Step 3 — Present Proposed Structure

Before generating anything, present your thinking to the user. Format:

```
Based on your requirement, here is what I propose:

FLOORPLAN: {Worklist / List Report / Object Page / ...}
WHY: {one sentence rationale}

COMPONENTS I PLAN TO USE:

ShellBar
  Why: Required on every SAP Fiori screen. Provides app navigation shell.
  Variant: Compact density, product name = "{app name}"
  Source: {uxGuidelinesLink}

DynamicPageTitle
  Why: Page header area with title and actions toolbar.
  Variant: No VariantManagement (Worklist pattern)
  Source: {uxGuidelinesLink}

OverflowToolbar
  Why: Houses the primary actions above the table.
  Contains: Button (Approve), Button (Reject) — one primary, one destructive
  Source: {uxGuidelinesLink}

Table (sap.m.Table)
  Why: Responsive table for list of items. MultiSelect for bulk actions.
  Columns: {list columns from requirement}
  Density: Compact (back-office)
  Source: {uxGuidelinesLink}

ObjectStatus
  Why: Semantic status display per row (Success/Warning/Error colors).
  Use for: {status field from requirement}
  Do: Use for state that has business meaning
  Don't: Use for decorative color only
  Source: {uxGuidelinesLink}

WHAT I AM NOT USING AND WHY:
  FilterBar — Worklist is pre-scoped by role, no user-defined filtering needed
  DynamicPageHeader — No collapsible header needed for this task queue

QUESTIONS BEFORE I GENERATE:
  1. Should the table support bulk selection (MultiSelect) or single row actions only?
  2. What is the app/product name for the ShellBar?
  3. Are there any additional status values beyond the ones you mentioned?
```

Wait for user confirmation before proceeding.

---

## Step 3.5 — ASCII Wireframe Gate  ★★★ HARD STOP — NEVER SKIP (RULE 19) ★★★

**This step is mandatory. The JSON spec cannot be generated until the user approves the wireframe.**

The only exception: the user explicitly says "skip the wireframe" / "no ASCII" / "build directly". Even then, confirm once before bypassing the gate.

**Why:** Without this gate, specs get built that don't match the user's mental model. The wireframe costs 2 minutes. Skipping it costs 30 minutes of rework.

**See `agents/draft-preview.md` for the full agent spec.**

After Step 3 names the floorplan + components, render an **ASCII wireframe + structured region map** directly in chat — *before* generating any JSON. This lets the user see the proposed layout proportions visually, catch errors early, and iterate cheaply.

**Inputs accepted** (image, document, text only — Figma URL and web URL are explicitly OUT OF SCOPE for this version):
- Pasted image (screenshot / photo / sketch)
- Attached document (PDF / slide / doc)
- Free-text description

**What the user sees in chat**:

1. A 76-column ASCII wireframe showing every region as a labeled zone (with `[SAPComponent]` tag on each row).
2. A structured "DRAFT — <screen> (<floorplan>)" map listing detected regions → SAP components, floorplan ranking, and a summary line.
3. A prompt: `Reply with "approved" / "<change>"`.

**Refine grammar** (free-text mutations mapped to one of six operations on `regions[]`):

| User phrase | Operation |
|---|---|
| "add a status column" / "add <field> column" | mutate `region.props.columns` on data-table |
| "remove the metadata band" / "drop the X" | filter `regions[]` |
| "use worklist instead" / "switch to <floorplan>" | override topFloorplan |
| "make the table N rows of sample data" | set sampleData.length |
| "swap X for Y" / "use Select instead of Input" | change primary component |
| "move the toolbar above the tabs" | reorder `regions[]` |

After each refine, Claude re-runs `suggestFloorplan` (floorplan may shift) and re-renders the ASCII + map. Loop until the user approves (`approved` / `looks good` / `go` / `ship it` / `build it` / ✅).

**Push-back triggers**: refuse and explain when the change requires a component not in the registry, a forbidden combination, raw hex / pixel values, or is ambiguous.

**Approval handoff to Step 4 / Step 5**:

```
APPROVED DRAFT (handoff to Step 4)
  floorplan:   <floorplan-name>
  screenName:  "<screen-name>"
  viewport:    desktop | tablet | mobile
  density:     compact | cozy
  regions:     [{regionType, label, props?}, …]
```

The Component Architect (Step 5) then skips its own floorplan selection (already satisfied) and expands each region into a full hierarchy node.

---

## Step 4 — Incorporate Feedback

The user may:
- **Confirm** → proceed to Step 5
- **Request changes** → "Add a FilterBar", "Remove the footer", "Use Cozy density"
- **Ask questions** → answer using the fetched guidelines
- **Suggest components** → validate against registry, explain if not possible

Always update your proposal before generating. Show what changed:
```
Updated: Added FilterBar as requested. Note: this changes the floorplan
from Worklist to List Report — the user now defines their own filter scope.
```

Ask follow-up questions if the change has implications:
```
Adding a FilterBar means the user controls which records they see.
Should I also add VariantManagement so they can save filter combinations?
```

---

## Step 5 — Generate JSON Spec

Only after explicit confirmation ("yes", "go ahead", "generate it", "looks good").

### Hard rules (never violate)

0. **SAP Web UI Kit = single source of truth (RULE 23)** — components, properties, tokens, variables, variants, and icons ALL come from the kit (file `SILcWzK5uFghKun9jx6D7c`). Verify variant names/options from the live kit (`componentProperties` + `componentPropertyDefinitions`), never assume UI5 vocabulary. ObjectStatus prop = `Semantic` (not State); Button `Type` = Primary/Secondary/Accept/Reject/Attention/Tertiary (no Emphasized/Transparent). Icons swap via `ICON_KEYS`/`swapKitIcon()`. See `knowledge/guidelines/sap-web-ui-kit-icons.md`.
1. **Registry gate** — every component must have a file in `knowledge/components/registry/`. No exceptions. Check before including.
2. **No invented components** — only verified SAP controls
3. **No invented properties** — only documented API properties
4. **Props = non-default values only** — never list props matching SAP defaults
5. **ShellBar first** — always the first item in `hierarchy[]`
6. **Slots for named aggregations** — DynamicPage, Table, Panel use `slots`, not `children`
7. **validationStatus = "pass"** — only after all checks pass

### Include in meta

```json
"meta": {
  "requirement": "...",
  "floorplan": "...",
  "floorplanRationale": "...",
  "rationale": "...",
  "validationStatus": "pass",
  "unverifiedComponents": [],
  "guidelinesChecked": [
    "https://experience.sap.com/fiori-design-web/button/",
    "https://experience.sap.com/fiori-design-web/responsive-table/"
  ],
  "samplesChecked": [
    "https://ui5.sap.com/#/entity/sap.m.Button/samples"
  ]
}
```

### Save and deliver

1. Save to `~/Downloads/{screen-name}-spec.json`
2. Validate with `python3 -c "import json; json.load(open('...'))"` — must pass
3. Copy to clipboard with `pbcopy`

**Then proceed to Step 6.5 (QA Certification) before telling the user the spec is ready.**

---

## Step 6.5 — QA Certification  ★ MANDATORY BEFORE HANDOFF (RULE 21) — Zero-Defect + Exception Engine

**Agent:** `skill/agents/qa-certification.md` — read the full agent spec before running.
**Repair patterns:** `docs/REPAIR-PATTERNS.md` — read first, apply known solutions immediately.

Runs after Step 5 (JSON spec generated). The spec is **NOT** shared with the user until certification passes.

**Governing principles:**
- **Zero-Defect Policy** — this is an active repair engine, not a passive validator. Never present a first draft.
- **Design Flexibility & Exception Engine** — before any repair, classify the issue as Defect OR Intentional Exception. Exceptions are preserved, not repaired. User intent takes priority over SAP guidelines.

**Mandatory sequence (in this order):**
1. Read `docs/REPAIR-PATTERNS.md` → apply known patterns immediately
2. **Pre-flight Lint** → catch mechanical failures before QA starts (props.text vs label, raw hex, missing slots)
3. **Defect vs. Exception Classification** → every issue is DEFECT or INTENTIONAL EXCEPTION before any repair
4. **Root Cause Analysis** → classify defect into 14 categories (prevents fixing symptoms)
5. **PLUGIN_LIMITATION check** → issues matching known plugin gaps → mark ⚙, skip repair, note workaround
6. **6 QA Artifacts** (unchanged) → SAP UX Review · Visual Comparison · Completeness Score · Architectural Suggestions · Design System Compliance · Final Certification Checklist
7. **Dependency-ordered Self-Repair** → Business → Floorplan → Hierarchy → Components → Layout → Tokens → Typography → A11y → Cleanup
8. **Repair Diff** → after each pass: `[FIXED]` · `[PRESERVED]` · `[SKIPPED ⚙]`
9. **Confidence Scores** → per-category %; any below 80% → mandatory repair targeting that category
10. **Learning Engine** → successful repairs added to `docs/REPAIR-PATTERNS.md`

**3-pass repair budget:** Pass 1 (straightforward) · Pass 2 (secondary) · Pass 3 (remaining). After Pass 3: STOP.

**Result states:** `CERTIFIED` · `CERTIFIED WITH WARNINGS` · `NEEDS REPAIR` (with confidence scores + unresolved issues)

For full templates, repair taxonomy, and the LaMa worked example: `docs/V2-REASONING-PIPELINE.md`

---

## Entry Points

### "Build me a screen / I have a requirement"
→ Run the full pipeline above (Steps 1-5)

### "Guide me / Which component / Do/don't for..."
→ Route to `agents/component-guidance.md`
→ Fetch guidelines, explain, answer — no spec generated unless asked

### "Change the spec / Add X / Remove Y"
→ Load the last spec, apply the change, validate, save, copy to clipboard

---

## Floorplan Quick Reference

| Signal | Floorplan |
|---|---|
| Pre-scoped task queue, process own items, bulk actions | **Worklist** |
| Open dataset, user sets filters, search across all | **List Report** |
| Single business object, multiple detail sections | **Object Page** |
| Multiple KPIs and lists on one dashboard | **Overview Page** |
| List + detail side by side | **Master Detail** |
| Multi-step guided process | **Wizard** |

---

## Chrome MCP Quick Reference

```javascript
// List open pages
list_pages()

// Navigate to any URL including SPA # routes
navigate_page('https://ui5.sap.com/#/entity/sap.m.Table')

// Wait for content to load
wait_for(['When to Use', 'Properties', 'Samples'])

// Get full page text (accessibility tree — all visible text)
take_snapshot()

// Run JavaScript in the page (fetch API JSON)
evaluate_script(`
  const r = await fetch('https://ui5.sap.com/test-resources/sap/m/designtime/apiref/api.json');
  const j = await r.json();
  return j.symbols.find(s => s.name === 'sap.m.Button');
`)
```

**Stale lock fix (if Chrome MCP errors):**
```bash
rm -f ~/.cache/chrome-devtools-mcp/chrome-profile/Default/LOCK \
       ~/.cache/chrome-devtools-mcp/chrome-profile/SingletonLock \
       ~/.cache/chrome-devtools-mcp/chrome-profile/SingletonSocket \
       ~/.cache/chrome-devtools-mcp/chrome-profile/SingletonCookie
```

