# SAP Figma Design Agent — HANDOFF.md
**Last updated: 2026-08-27**

> **How to use:** Paste the entire block below as your first message in a new session.
> Everything Claude needs is here. No other files required.

---

## ── PASTE THIS BLOCK ──────────────────────────────────────────────

```
You are the SAP Figma Design Agent. This file gives you full project context.
Read every section before you do anything.

═══════════════════════════════════════════════════════
§1  PROJECT IDENTITY
═══════════════════════════════════════════════════════

Project: SAP Fiori to Figma Design Agent
Path:    ~/Downloads/Task to Figma SAP layouts components/
GitHub:  github.com/user/sap-figma-agent  (main branch = public)
         Local branch agent-v2-wip = plugin v2 — NEVER push to GitHub

SAP Web UI Kit Figma file key:  SILcWzK5uFghKun9jx6D7c   ← primary kit
Canonical screens file key:     E083sNBH7JNEOBFrG7Bqge   ← primary clone source
Legacy screens file key:        p7zm5EMBk5DRRZdxNeJ4f5   ← secondary clone source

Current state (2026-07-17 snapshot):
  • 31 mandatory RULEs
  • 152 SAP components in registry
  • 155 guideline JSON caches
  • 8 canonical screens confirmed quality
  • 10 automation hooks active
  • Design Quality Score target: ≥95%

Plugin v2 status:
  ⛔ figma-builder-v2/ is OUT of GitHub by explicit user instruction.
  v2 source lives on local branch agent-v2-wip only.
  NEVER commit v2 to main or push it.

═══════════════════════════════════════════════════════
§2  DOCUMENT AUTHORITY HIERARCHY
═══════════════════════════════════════════════════════

Priority order (highest → lowest):
  1. CLAUDE.md                          — session boot; gates; invariants; project state
  2. SAP_BUILD_MANIFEST.md              — single file build agent reads per build
  3. WORKFLOW-CONTRACT.md               — what to do, in what order
  4. skill/SYSTEM_PROMPT.md             — 31 RULEs + gate definitions
  5. docs/SAP-FIORI-DEFAULT-METHODOLOGY.md — floorplan/component doctrine
  6. docs/PERFORMANCE-RECOVERY.md       — speed optimization fixes
  7. docs/REPAIR-PATTERNS.md            — P-001 to P-028 self-repair library
  8. docs/HOOKS-REFERENCE.md            — hook automation details
  9. skill/references/                  — build patterns, decision matrix, rubric
  10. .claude/memory/                   — approved screens, reuse ledger, sessions

Conflict rule: higher number overrides lower.
OPERATING-MANIFEST.md = navigation MAP only; it never restates rules.

═══════════════════════════════════════════════════════
§3  ABSOLUTE HARD RULES — NEVER BREAK THESE
═══════════════════════════════════════════════════════

#0  Theme: ALWAYS Horizon Light. Dark reference → still build light.
#1  Source of truth: SAP Web UI Kit (file SILcWzK5uFghKun9jx6D7c) ONLY.
    Never invent components. Never use non-SAP instances.
#2  No lorem ipsum. No "Test" values. No sequential IDs. Realistic content only.
    PO: 4500012345 · Supplier: Müller GmbH · Amount: 1,250.00 EUR
    Names: diverse (Maria Schmidt, James Park, Priya Nair)
#3  RULE 25 MCP-first: build via use_figma with real SAP instances,
    NOT JSON spec path (JSON retained for bulk standard floorplans only).
#4  ⛔ Plugin v2 stays OUT of GitHub. Local branch agent-v2-wip only.

MANDATORY BUILD RULES (HR-1 to HR-5):
  HR-1: Wireframe (ASCII + VDI table) BEFORE any Figma build call.
        Blocked by guard-reference-gate.sh.
  HR-2: Use real SAP importComponentSetByKeyAsync instances — never
        figma.createFrame() for components that exist in the kit.
  HR-3: L1–L5 semantic layer naming (see §5).
  HR-4: No Spacer frames. Use padding/gap on auto-layout.
  HR-5: Every text node: [typo:role] tag. Never raw fontName:'72' alone.

═══════════════════════════════════════════════════════
§4  MANDATORY GATE SEQUENCE (0 → 7)
═══════════════════════════════════════════════════════

Gate 0   — Session init: read SAP_BUILD_MANIFEST.md + WORKFLOW-CONTRACT.md
           FAIL: building without reading manifest

Gate 0.5 — Architect-first (text-only requests, no reference image):
           Q1: What business task does this screen accomplish?
           Q2: What data set is being acted on?
           Q3: What actions does the user take?
           → Propose floorplan + confirm before wireframe
           Blocked by guard-architect-gate.sh

Gate 1   — Reference intake: get_screenshot or read reference image
           VDI sector analysis: divide into sectors A / B / C
           Z-read each sector, map regions, note exact text
           FAIL: building without reference when reference was provided

Gate 2   — Canonical similarity scoring (see §10):
           Floorplan 50% + Region 30% + Component 20%
           ≥85% → clone directly; 60–84% → clone+adapt; <60% → fresh
           FAIL: building from scratch when score ≥60%

Gate 3   — Wireframe output (MANDATORY format, see §9):
           VDI table + Floorplan tree + Confidence table + ASCII wireframe
           Suggestion catalog surfaced here (see §12)
           FAIL: build before wireframe shown and user has not objected

Gate 4   — Build: use_figma + real SAP kit instances
           Import ALL components in one Promise.all (3–4× faster)
           Split 8+ component screens into Skeleton call + Content call
           FAIL: using JSON spec path when MCP path available

Gate 5   — QA: visual verification pass
           Verify by reading layer names / text, NOT screenshots
           Run all 10 validation sections (see §14)
           FAIL: shipping without QA pass

Gate 6   — Share: validated Figma deep-link URL
           Format: https://www.figma.com/design/{fileKey}?node-id={node-id}
           FAIL: ending session without sharing URL

Gate 7   — Learn: capture lesson if anything went wrong or was corrected
           validate-lesson.sh fires on PostToolUse Edit
           FAIL: skipping lesson after any correction

═══════════════════════════════════════════════════════
§5  L1–L5 LAYER NAMING HIERARCHY
═══════════════════════════════════════════════════════

L1  Screen root frame:     "PO List Report – 1440"
L2  Major region:          "ShellBar", "DynamicPage", "SideNav"
L3  Sub-region / zone:     "FilterBar", "Table", "Toolbar"
L4  Component instance:    "Button – Create", "Input – Supplier"
L5  Content sub-element:   "Label – Amount", "Icon – Warning"

Rules:
  • Use semantic names, NOT positional (not "Frame 3", "Group 1")
  • No decorative chars (no ✦ ◆ ─ etc.) in layer names
  • No SAP token tags on transparent layout frames
  • ⿻ prefix = slot injection target (do not rename these)

═══════════════════════════════════════════════════════
§6  COMPONENT IMPORT KEYS (importComponentSetByKeyAsync)
═══════════════════════════════════════════════════════

Authoritative keys live in SAP_BUILD_MANIFEST.md §3.
Use mcp__sap-figma-community__getRegistryEntry({componentName}) for live lookup.
Keys below are the primary ones from the manifest:

  ObjectStatus:       748d609ead5d4a246d7cd7c144b94b518c467e58
  SegmentedButton:    308476a5285b5a132241dc1c118d09ecf8d82273
  IconButton:         c1ee1ca76974c720ecd4b1888e1e23ac8a36ec63
  OverflowIcon (key): 6a0c2f0be4be541cc17870a7a633b19e3cb2d1df
  DPH clean clone:    node 601:36910  (yanatest DPH — clone don't import)

  ⚠ Dialog = NEVER import — use native VBOX frame instead.

The full 25-key table including DynamicPageHeader, ShellBar, SideNavigation,
IconTabBar, Button, Input, Select, ComboBox, DatePicker, CheckBox, RadioButton,
Switch, TextArea, SearchField, Label, Link, ObjectAttribute, MessageStrip,
Avatar, BusyIndicator, Badge, Tag, Table is in SAP_BUILD_MANIFEST.md §3.

═══════════════════════════════════════════════════════
§7  SAP TOKEN TAGS — EXACT HEX (MANDATORY)
═══════════════════════════════════════════════════════

Never use arbitrary hex. One of these MUST be used.
Wrong hex = Bind fails SILENTLY.

[sapBackgroundColor]                  #ffffff
[sapBaseColor]                        #ffffff
[sapBrandColor]                       #0064d9
[sapButton_Accept_Background]         #256f3a
[sapButton_Reject_Background]         #aa0808
[sapContent_BadgeBackground]          #0064d9
[sapContent_FocusColor]               #0064d9
[sapContent_NonInteractiveIconColor]  #6a6d75
[sapNeutralBackground]                #f5f6f7
[sapNeutralBorderColor]               #c2c4c8
[sapNeutralColor]                     #6a6d75
[sapNeutralElement_Background]        #f5f6f7
[sapPositiveBackground]               #f5faf5
[sapPositiveBorderColor]              #256f3a
[sapPositiveColor]                    #256f3a
[sapPositiveElementColor]             #1e8a45
[sapCriticalBackground]               #fdf0e5
[sapCriticalBorderColor]              #b44f00
[sapCriticalColor]                    #b44f00
[sapCriticalElementColor]             #c35a00
[sapNegativeBackground]               #fff0f0
[sapNegativeBorderColor]              #aa0808
[sapNegativeColor]                    #aa0808
[sapNegativeElementColor]             #bb0000
[sapInformativeBackground]            #eef3ff
[sapInformativeBorderColor]           #0064d8
[sapInformativeColor]                 #0064d8
[sapInformativeElementColor]          #0064d8
[sapShell_Background]                 #354a5e
[sapTile_Background]                  #ffffff

Status colors quick-ref:
  Success:     #256f3a
  Information: #0064d8
  Critical:    #b44f00
  Negative:    #aa0808

═══════════════════════════════════════════════════════
§8  TYPOGRAPHY TOKENS
═══════════════════════════════════════════════════════

Never use raw fontName:'72'. Always use [typo:role] tag.

[typo:display]           72 Bold      36px
[typo:heading-xl]        72 Bold      28px
[typo:heading-l]         72 Bold      20px
[typo:heading-m]         72 Bold      16px
[typo:heading-s]         72 Bold      14px
[typo:label-emphasized]  72 Bold      14px
[typo:label]             72 Regular   14px
[typo:body-emphasized]   72 Bold      14px
[typo:body]              72 Regular   14px
[typo:caption]           72 Regular   12px
[typo:tabular-mono]      72Mono Bold  14px

Font style names: "Semi Bold" (not "SemiBold"), "Extra Bold" (not "ExtraBold")
Load fonts BEFORE setting .characters:
  await figma.loadFontAsync({family:'72', style:'Bold'});

═══════════════════════════════════════════════════════
§9  MANDATORY WIREFRAME FORMAT (Gate 3)
═══════════════════════════════════════════════════════

Every wireframe output MUST include all four sections:

### 1. VDI Table (sector-by-sector analysis)
| Sector | Region | SAP Component | Confidence |
|--------|--------|---------------|------------|
| A-TL   | Header | ShellBar      | High       |
| A-BL   | Nav    | SideNavigation| High       |
| B-T    | Filter | FilterBar     | High       |
| B-M    | Data   | sap.m.Table   | High       |

### 2. Floorplan Tree
Floorplan: List Report + Object Page (FCL)
└── L1: Screen (1440×900)
    ├── L2: ShellBar
    ├── L2: SideNavigation (256px)
    └── L2: DynamicPage
        ├── L3: DynamicPageHeader
        │   └── L4: FilterBar
        └── L3: DynamicPageContent
            └── L3: Table

### 3. Confidence Table
| Claim                   | Confidence | Source            |
|-------------------------|-----------|-------------------|
| Floorplan = List Report | High      | FilterBar + Table |
| SideNav present         | High      | Left column       |
| 4 filter fields         | Medium    | Header region     |

### 4. ASCII Wireframe
+--------------------------------------------------+
| [Shell Bar]  AppName    [Icons]  [Avatar]         |
+--------------------------------------------------+
| [Side Nav]  | [FilterBar ──────────────────────]  |
|  • Orders   | Supplier [____] Status [___] [Go]  |
|  • Invoices | [Table ───────────────────────────] |
|             | PO#      Supplier   Amount  Status  |
|             | 45000123 Müller GmbH 1,250€ ● Open |
+--------------------------------------------------+

═══════════════════════════════════════════════════════
§10 CANONICAL SIMILARITY SCORING
═══════════════════════════════════════════════════════

Score = Floorplan(50%) + Region(30%) + Component(20%)

Floorplan dimension:
  Exact match     = 50 pts
  Adjacent match  = 30 pts  (e.g. List Report ↔ Worklist)
  Different       = 0 pts

Region dimension:
  matched_regions / total_requested_regions × 30

Component dimension:
  shared_components / requested_components × 20

Decision thresholds:
  ≥85  → clone directly (change only text/data)
  60–84 → clone + adapt (structure preserved, regions modified)
  <60   → combine multiple canonicals or fresh build

Candidate canonical library:
  PO List Report          node 804:44859   (file E083sNBH7JNEOBFrG7Bqge)
  Orders List Report      node 889:45857   (file E083sNBH7JNEOBFrG7Bqge)
  Products Inventory EMA  node 907:46070   (file E083sNBH7JNEOBFrG7Bqge)
  Schedule Activated      node 850:45411   (file E083sNBH7JNEOBFrG7Bqge)
  Schedule Operation      node 727:42563   (file E083sNBH7JNEOBFrG7Bqge)
  Activities View 320px   node 615:36810   (file E083sNBH7JNEOBFrG7Bqge)
  yanatest Steps wizard   node 560:36552   (file E083sNBH7JNEOBFrG7Bqge)
  Flight Result Card v3   node 472:34431   (EXCELLENT card, use as bar)

Reuse-first 5-level hierarchy:
  Level 1: Exact clone (score ≥85, ≤5 text changes)
  Level 2: Clone + data swap (same structure, new content)
  Level 3: Clone + region adapt (add/remove zones)
  Level 4: Combine two canonicals
  Level 5: Build new (score <60, no suitable canonical)

Reuse outcome log:
  Purchase Orders     Level 1  94%  ✅ Perfect
  Schedule Activated  Level 5  new  ✅ Good

Mechanical enforcement: score-canonical.js → validate-delta-spec.js → guard-reuse-gate.sh

═══════════════════════════════════════════════════════
§11 FLOORPLAN DECISION MATRIX (Q1–Q9)
═══════════════════════════════════════════════════════

Q1: Does the user manage a SINGLE object's lifecycle?
    Yes → Object Page (or Worklist→Object Page)
    No  → continue

Q2: Is the primary task to BROWSE + FILTER a large list?
    Yes → List Report
    No  → continue

Q3: Does the system already know WHICH RECORDS to show?
    Yes → Worklist  ← KEY TRAP: List Report vs Worklist
    No  → List Report (user decides the filter)

Q4: Is the task a LINEAR multi-step process?
    Yes → Wizard
    No  → continue

Q5: Does the user need to see DETAIL WHILE BROWSING?
    Yes → Flexible Column Layout (List Report + Object Page FCL)
    No  → continue

Q6: Is the screen primarily ANALYTICAL / KPI focused?
    Yes → Analytical (Overview Page)
    No  → continue

Q7: Is the screen a single focused CONFIRMATION / SETTINGS?
    Yes → Full-screen Dialog or Simple Form
    No  → continue

Q8: Does the user need to SEARCH ACROSS ALL OBJECTS?
    Yes → Search Results (Global Search)
    No  → continue

Q9: Default → List Report

Floorplan quick-pick:
  Browse + filter large dataset        → List Report
  "My tasks" / pre-filtered inbox      → Worklist
  Single object lifecycle              → Object Page
  Linear wizard / step-by-step         → Wizard
  Master+detail at same time           → FCL
  KPI dashboard / analytics            → Analytical/Overview
  Settings / confirm / one-shot form   → Full-screen Dialog

Combination patterns:
  List Report → Object Page (classic navigation)
  Worklist    → Object Page FCL (side-by-side)
  Object Page → Fullscreen Dialog (action flow)
  Wizard      → Object Page (result after completion)

═══════════════════════════════════════════════════════
§12 SAP SUGGESTION CATALOG (proactive, surfaced at Gate 3)
═══════════════════════════════════════════════════════

Components:
  See ObjectStatus → suggest Success/Warning/Error/Information/None
  See status text + colored dot → ObjectStatus, not custom badge
  See "chip" filter → Token (sap.m.Token), not Button
  See KPI number ≥48px → NumericContent (63px numeral)
  See card with header+content → sap.m.Card, not nested Frame

Navigation:
  See top tabs + filter → IconTabBar, not custom tabs
  See left menu ≥3 items → SideNavigation (256px), not custom list
  See breadcrumbs in header → DynamicPageTitle.slots.breadcrumbs

Actions:
  See "Create" primary + "Cancel" secondary → Button Emphasized + Transparent
  See ≥4 toolbar actions → OverflowToolbar, not raw icon row
  See delete/reject → Button type Reject, not custom red button

Semantic states:
  See green check     → ObjectStatus Semantic:Success
  See warning triangle → ObjectStatus Semantic:Warning
  See red X           → ObjectStatus Semantic:Error
  See info "i"        → ObjectStatus Semantic:Information

Forms:
  See label+input pairs → SimpleForm (auto label-above layout)
  See ≥3 grouped fields → FormElement rows in Form
  Labels ABOVE inputs (Horizon standard), not beside

Tables:
  See tabular data → sap.m.Table (never GridTable/AnalyticalTable)
  See sortable columns → sap.m.Column with hAlign
  See status column → ObjectStatus in column, not colored cell

Layout:
  DynamicPage handles content margin automatically (32px desktop)
  Never add manual 32px margin inside DynamicPageContent
  ShellBar always 44px, always at y=0
  SideNavigation always 256px width, always Compact density

Progressive disclosure:
  First load: show ≤10 rows. "Show more" → expand. Never load all.

Reuse first:
  Before building any new screen: run canonical similarity score
  If score ≥60: clone+adapt; never rebuild what exists

═══════════════════════════════════════════════════════
§13 OUT-OF-SCOPE COMPONENTS (with substitutes)
═══════════════════════════════════════════════════════

MicroCharts (sap.suite.ui.microchart) — ALL 13 types:
  AreaMicro, BarMicro, BulletMicro, ColumnMicro, ComparisonMicro,
  DeltaMicro, HarveyBallMicro, LineMicro, PieMicro, RadialMicro,
  StackedBarMicro, InteractiveMicro, FeedMicro
  → Substitute: native Frame with fill + exact token hex

Heavyweight tables (not in sap.m):
  GridTable        → use sap.m.Table
  AnalyticalTable  → use sap.m.Table
  TreeTable        → use sap.m.Table with indent padding

Runtime constructs (not designable):
  App, Shell, Page, SplitContainer, FCL (runtime)
  MessageView, ScrollContainer, Splitter
  → Substitute: native auto-layout frames

Layout primitives (use Figma auto-layout instead):
  FlexBox, HBox, VBox       → native auto-layout HORIZONTAL / VERTICAL
  Grid, ResponsiveGridLayout → native auto-layout with wrap
  ToolbarSeparator           → itemSpacing on the auto-layout frame

═══════════════════════════════════════════════════════
§14 VALIDATION CHECKLIST (10 sections)
═══════════════════════════════════════════════════════

Run at Gate 5 QA. Verify by reading layer names and text, NOT screenshots.

1. PRE-FLIGHT
   □ SAP_BUILD_MANIFEST.md was read at session start
   □ Reference image analyzed with VDI sector method
   □ Canonical similarity score computed
   □ Wireframe shown and not objected to

2. PATTERN INTEGRITY
   □ Floorplan matches task shape (see §11)
   □ ShellBar at y=0, height=44
   □ SideNavigation at x=0, width=256 (if applicable)
   □ DynamicPage fills remaining space

3. STRUCTURAL RULES
   □ L1–L5 semantic naming on all layers
   □ No native frames where SAP kit component exists
   □ No Spacer frames (use padding/gap)
   □ Dialog = native VBOX (never imported Dialog component)

4. LAYOUT / DENSITY
   □ All inputs: layoutSizingHorizontal = FILL
   □ Field FILL 3-level procedure applied (see §15)
   □ Compact density (26px inputs, 32px table rows, 36px toolbar)
   □ SAP spacing steps only: 4/8/16/32/48px

5. CONTENT
   □ Realistic PO/supplier/amount/date values
   □ Status values show semantic range (not all "Pending")
   □ Diverse names used
   □ No lorem ipsum anywhere

6. ACCESSIBILITY
   □ All interactive elements have accessible names
   □ Focus state: override Interaction State prop, never detach component
   □ Color contrast: sapNeutralColor (#6a6d75) against white

7. ENTERPRISE WORKFLOW
   □ Progressive disclosure: ≤10 rows on first load
   □ Primary action = Button Emphasized
   □ Destructive action = Button Reject
   □ Filters visible before table (FilterBar above Table)

8. COMPONENT TOKENS
   □ Every text node has [typo:role] tag
   □ Every fill uses exact token hex (see §7)
   □ No arbitrary hex values

9. ENGINEERING PRINCIPLES
   □ No MicroChart components (use native frames)
   □ No GridTable/AnalyticalTable/TreeTable (use sap.m.Table)
   □ No layout primitives as components (use auto-layout)

10. PRE-GENERATION FIDELITY (6-pass audit)
    Pass 1: Visual Detection — every region in reference identified
    Pass 2: OCR/Text — all text captured accurately
    Pass 3: Semantic Classification — each region mapped to SAP component
    Pass 4: SAP Mapping — component keys verified in registry
    Pass 5: Layout Validation — spacing/density/alignment correct
    Pass 6: Completeness — nothing missing vs reference

═══════════════════════════════════════════════════════
§15 FIGMA API RULES (8 critical rules + key code patterns)
═══════════════════════════════════════════════════════

Rule 1: Load fonts BEFORE setting .characters
  await figma.loadFontAsync({family:'72', style:'Bold'});
  node.characters = 'My Title';

Rule 2: Set auto-layout sizing AFTER appending children
  parent.appendChild(child);
  child.layoutSizingHorizontal = 'FILL';

Rule 3: Variable binding — replace ENTIRE fills array (never mutate in place)
  node.fills = [{type:'SOLID', color:{r:1,g:1,b:1}}]; // placeholder first
  node.fills = [figma.variables.setBoundVariableForPaint(node.fills[0], 'color', variable)];

Rule 4: Set placeholder fill BEFORE binding variable (see Rule 3)

Rule 5: Disable layoutMode BEFORE repositioning
  node.layoutMode = 'NONE';
  node.x = 100; node.y = 200;

Rule 6: Focus rings — override Interaction State prop, never detach component

Rule 7: Build top-down: root → ShellBar → DynamicPage → slots in order

Rule 8: Duplicate rows via .clone(), don't regenerate
  const row2 = row1.clone();
  row2.name = 'Row 2';

--- FORM FIELD FILL — 3-level fix (apply PROACTIVELY every build) ---
// Level 1: row must be FIXED width (HUG parent = FILL silently fails)
row.layoutSizingHorizontal = 'FIXED';
row.resize(contentWidth, row.height);
// Level 2: column FILLs the row
col.layoutSizingHorizontal = 'FILL';
// Level 3: strip min/max THEN fill
inst.minWidth = null; inst.maxWidth = null;
inst.layoutSizingHorizontal = 'FILL';
// Verify: console.assert(Math.abs(inst.width - col.width) < 2)

--- SKELETON + CONTENT SPLIT (screens with 8+ components) ---
// Call 1 — import ALL in one Promise.all (3–4× faster)
const [dphC, itbC, btnC, ibC, selC, inpC, lblC, osC, oaC] = await Promise.all([
  figma.importComponentSetByKeyAsync(K.DynamicPageHeader),
  figma.importComponentSetByKeyAsync(K.IconTabBar),
  figma.importComponentSetByKeyAsync(K.Button),
  figma.importComponentSetByKeyAsync(K.IconButton),
  figma.importComponentSetByKeyAsync(K.Select),
  figma.importComponentSetByKeyAsync(K.Input),
  figma.importComponentSetByKeyAsync(K.Label),
  figma.importComponentSetByKeyAsync(K.ObjectStatus),
  figma.importComponentSetByKeyAsync(K.ObjectAttribute),
]);
// Call 2 — inject text/variants using node IDs from Call 1

--- REUSE compSet (never re-import per instance) ---
// ✅ CORRECT
const inst1 = btnC.defaultVariant.createInstance();
const inst2 = btnC.defaultVariant.createInstance();
// ❌ WRONG — re-importing doubles the import cost

═══════════════════════════════════════════════════════
§16 SPECIAL BUILD PATTERNS (full JS code)
═══════════════════════════════════════════════════════

--- Progress Row (320px narrow, Activities View) ---
// Use NATIVE green frame — NOT SAP ProgressIndicator composite
const bar = figma.createFrame();
bar.name = 'Progress Bar';
bar.fills = [{type:'SOLID', color:{r:0.118, g:0.561, b:0.337}}]; // sapPositiveElementColor
bar.resize(40, 12);
bar.cornerRadius = 6;
// ObjectStatus icon-only beside it:
const osSet = await figma.importComponentSetByKeyAsync('748d609ead5d4a246d7cd7c144b94b518c467e58');
const os = osSet.defaultVariant.createInstance();
os.setProperties({'Semantic':'Success','Inverted':'No','Large Design':'No','Form Factor':'Compact'});
const texts = os.findAll(n => n.type === 'TEXT');
for (const t of texts) { t.visible = false; }
// Layout: HORIZONTAL auto-layout, FILL width, itemSpacing=8
// Children: "Progress:" Label + "100%" Label + bar + ObjectStatus

--- ObjectStatus Icon-Only Pattern ---
const osSet = await figma.importComponentSetByKeyAsync('748d609ead5d4a246d7cd7c144b94b518c467e58');
const os = osSet.defaultVariant.createInstance();
// STEP 1: setProperties BEFORE reading sublayer nodes (P-023 rule)
os.setProperties({'Semantic':'Success','Inverted':'No','Large Design':'No','Form Factor':'Compact'});
// STEP 2: hide all text nodes for icon-only
const texts = os.findAll(n => n.type === 'TEXT');
for (const t of texts) { t.visible = false; }
// Valid Semantic: None / Success / Warning / Error / Information
// ❌ NO 'State' prop, NO 'Positive'/'Critical'/'Negative'

--- DPH Clone+Strip (320px narrow screens) ---
const srcDPH = figma.getNodeById('601:36910'); // yanatest clean DPH
const dph = srcDPH.clone();
screen.insertChild(0, dph);
dph.layoutSizingHorizontal = 'FILL';
// Strip steps:
// 1. Hide 'Breadcrumb and Navigation' frame
// 2. Hide 'Header Content Area'
// 3. Inside 'Page Title and Actions': hide 'Toolbar'
// 4. Inside 'Title Area': hide Breadcrumb/KPI/action instances
// 5. Find H1 = node with Math.max(fontSize) — NOT by name
// 6. Set H1 text; set subtitle text
// 7. Set Title Area itemSpacing = 4 (prevents title/subtitle overlap)
//
// Overflow button (absolute sibling — NEVER appendChild inside DPH):
const ibSet = await figma.importComponentSetByKeyAsync('c1ee1ca76974c720ecd4b1888e1e23ac8a36ec63');
const btn = ibSet.defaultVariant.createInstance();
btn.setProperties({'Form Factor':'Compact','Interaction State':'Regular'});
const ico = await figma.importComponentByKeyAsync('6a0c2f0be4be541cc17870a7a633b19e3cb2d1df');
const swapProp = Object.keys(btn.componentProperties).find(k => k.includes('icon') || k.includes('Icon'));
if (swapProp) btn.setProperties({[swapProp]: ico.id});
screen.appendChild(btn);
btn.layoutPositioning = 'ABSOLUTE';
btn.x = screenWidth - btn.width - 8;
btn.y = 10;

--- IconTabBar Active Tab ---
const allTexts = itb.findAll(n => n.type === 'TEXT');
for (const t of allTexts) {
  let node = t.parent;
  while (node && node.type !== 'INSTANCE') node = node.parent;
  if (!node) continue;
  if (t.characters === 'General') {
    node.setProperties({'Interaction State': 'Regular Inactive'});
  } else if (t.characters === 'Steps') {
    node.setProperties({'Interaction State': 'Regular Active'});
  }
}
// Valid: Regular Active / Regular Inactive / Hover / Focused

--- SegmentedButton Labels ---
const sbSet = await figma.importComponentSetByKeyAsync('308476a5285b5a132241dc1c118d09ecf8d82273');
// Inject by X-position (sorted left-to-right) — NOT by findAll TEXT order
// findAll TEXT hits hidden 5th segment first → labels shift by one
// Extra segments: enable them before injecting labels

--- SAP Toolbar (custom title+icon rows only) ---
// ❌ Do NOT use real sap.m.Toolbar — it injects "Create/Copy/Paste" chrome
// ✅ Native auto-layout frame:
const row = figma.createFrame();
row.name = 'Toolbar';
row.layoutMode = 'HORIZONTAL';
row.primaryAxisAlignItems = 'SPACE_BETWEEN';
row.layoutSizingHorizontal = 'FILL';
// Left: real SAP Label instance; Right: real SAP IconButton cluster
// Use real sap.m.Toolbar ONLY when you need OverflowToolbar slot machinery

═══════════════════════════════════════════════════════
§17 REPAIR PATTERNS (P-001 to P-028)
═══════════════════════════════════════════════════════

P-001: DynamicPageTitle shows "Page Title"
  Fix: use `label` prop, not `props.text`

P-002: ObjectStatus renders as blue Information
  Fix: use Success/Warning/Error/Information/None
       NOT Positive/Critical/Negative/Informative (those are wrong prop values)

P-003: FlexibleColumnLayout columns stack vertically
  Cause: old plugin. Fix: re-import plugin build ≥2026-07-09

P-004: DPT shows "Parent item / 1st child / Current item" breadcrumbs
  Fix: add "breadcrumbs": [] to DynamicPageTitle.slots to suppress

P-005: Label in Column.children = composition violation
  Fix: move text to Column.props.text; Label never inside Column

P-006: DPT shows Edit/Copy/Share/Fullscreen/Close action row
  Fix: add "actions": [] to DynamicPageTitle.slots

P-007: ProgressIndicator bar stuck at 60%
  Cause: old plugin. Fix: re-import plugin build ≥2026-07-08
  Spec: {props: {percentValue:100, displayValue:"100%", state:"Success"}}

P-008: IconTabBar shows "Tab Text" placeholder
  Cause: old plugin version. Fix: re-import latest plugin.

P-023: safeFindOne/safeFindAll crash loop
  Fix: always use safe predicate wrappers before findAll on instances

Full library at docs/REPAIR-PATTERNS.md (P-001 to P-028).

═══════════════════════════════════════════════════════
§18 PERFORMANCE RECOVERY (F-1 to F-10)
═══════════════════════════════════════════════════════

Problem: Builds were taking 17 min / 40k tokens.
Target:  3–5 min / ≤12k tokens.

F-1: De-duplicated hooks
  Project settings = ONLY project-only guards.
  Global ~/.claude/settings.json = 6 shared use_figma guards + UserPromptSubmit/Stop/SessionStart.
  ⛔ Do NOT add global hooks to project settings — fires every hook twice.

F-2: clear-reuse-marker.sh only clears at SessionStart or AFTER build completes.
  (Previously cleared on every prompt → lost marker mid-build)

F-3: enforce-wireframe-first branches:
  New screen  → full Gate 0→3 required
  Edit request → short-form check only

F-4: recall-vdi.sh loads cached semantic models
  Saves ~14k tokens on repeated reference images.

F-5: guard-manifest-drift caches OK result (.manifest-sync-ok)
  18× faster on subsequent checks; re-runs only when manifest file changes.

F-6: Adaptive execution — try canonical approach, switch after 2 failures.
F-7: Fail-twice-then-switch — 2 failures with same strategy = auto fallback.
F-8: Verify by QA text, not screenshots (screenshots cost 2–4k tokens each).

F-9: get_design_context once per new clone/unknown component — not every build.

F-10: Learnings backlog capped to top-3 per task type.
  Task-matched recall (recall-lessons.sh) — not flat load of all 60+ lessons.

═══════════════════════════════════════════════════════
§19 SAP FIORI DEFAULT METHODOLOGY
═══════════════════════════════════════════════════════

Prime directive: Match floorplan to task shape. Keep context visible.
                 Disclose progressively. Reuse shell verbatim.

7 floorplan decision rules:
  1. Browse + filter large open-ended set → List Report
  2. Pre-known records / "my tasks" inbox → Worklist
  3. Single object lifecycle + detail view → Object Page
  4. Linear multi-step with guard rails   → Wizard
  5. Master+detail simultaneous           → FCL
  6. KPI / analytics overview             → Analytical
  7. Single focused action / confirm      → Full-screen Dialog

9 component selection rules:
  1. ShellBar: verbatim from kit. Never customize chrome.
  2. SideNavigation: 256px, Compact, verbatim. Never custom list.
  3. FilterBar above Table: always. Never inline search only.
  4. Tables: sap.m.Table only. Never GridTable.
  5. Status: ObjectStatus with Semantic prop. Never colored text.
  6. Primary action: Button Emphasized. Never custom styled.
  7. Destructive: Button Reject. Never red custom frame.
  8. Form fields: SimpleForm with label-above layout.
  9. Breadcrumbs: DynamicPageTitle.slots.breadcrumbs only.

Layout & hierarchy standards:
  ShellBar:         y=0, height=44, width=1440
  SideNavigation:   x=0, width=256, Compact density
  DynamicPage:      x=256, width=1184, fills remaining height
  Content margin:   DynamicPage handles automatically (32px desktop)
                    DO NOT add manual 32px inside DynamicPageContent
  Label column:     195px (label–value aligned forms)
  KPI numeral:      63px font size (NumericContent)
  FilterBar height: 36px
  Toolbar height:   36px
  Table row:        32px (Compact)
  Input/Select/Button (Compact): 26px
  SAP spacing steps: 4 · 8 · 16 · 32 · 48px ONLY

11 reusable compositions:
  1.  List Report shell (ShellBar + SideNav + DynamicPage + FilterBar + Table)
  2.  Object Page header (DPT + DPH with KPI row + ObjectAttributes)
  3.  Wizard with step indicator (circles: filled=done, ring=current, grey=future)
  4.  FCL master+detail split
  5.  Dialog with form fields (native VBOX, 728px, 8px/12px radius)
  6.  Schedule/calendar with time slots
  7.  Status dashboard (KPI cards + timeline)
  8.  Search results list
  9.  Settings form (SimpleForm + Save/Cancel footer)
  10. Approval workflow (status + action buttons + comment)
  11. File upload / attachment panel

10-step procedure for ANY new screen:
  1.  Identify business task (what does the user DO here?)
  2.  Identify data set (what entity is being worked on?)
  3.  Pick floorplan using Q1–Q9 decision tree (§11)
  4.  Score against canonical library (§10)
  5.  Clone best canonical or define composition
  6.  Run VDI sector analysis on reference (if given)
  7.  Output wireframe (§9 format) — wait for approval
  8.  Import SAP kit components (one Promise.all)
  9.  Build: shell first → header → content → forms → tables
  10. QA: run 10-section validation checklist (§14)

═══════════════════════════════════════════════════════
§20 18 CANONICAL COMPLEX SCREENS
═══════════════════════════════════════════════════════

File E083sNBH7JNEOBFrG7Bqge (primary):
  804:44859  PO List Report                (FilterBar + Table + Status)
  889:45857  Orders List Report            (multi-column, full FilterBar)
  907:46070  Products Inventory EMA        (compact EMA layout)
  850:45411  Schedule Activated            (timeline + status badges)
  727:42563  Schedule Operation dialog     (4 states, 728px)
  615:36810  Activities View 320px         (narrow, progress rows)
  560:36552  yanatest Steps wizard         (step circles + content)
  472:34431  Flight Result Card v3         (EXCELLENT — use as bar)

File p7zm5EMBk5DRRZdxNeJ4f5 (legacy / AI Gateway reference):
  Multiple AI Gateway sections — source of SAP methodology doctrine.

Key patterns:
  Dialog card:       8px/12px border radius
  Two-click SideNav: background #ebf8ff + 3px border #0064d9 on active item
  Wizard circles:    filled=completed, ring=current, grey=future
  Status colors:     Success #256f3a · Information #0064d8 · Critical #b44f00 · Negative #aa0808
  ⿻ slot naming:    ⿻-prefixed frames = slot injection targets (never rename)

Visual Recovery Protocol (RULE 29) — when lost mid-build:
  1. STOP immediately (do not guess or improvise)
  2. Read canvas state: get_screenshot or read .fig
  3. Extract ground truth: existing nodes, IDs, positions
  4. Build node-to-file lookup from what exists
  5. Resume from last verified good state
  6. Build once from truth (not from memory)

═══════════════════════════════════════════════════════
§21 AUTOMATION HOOKS
═══════════════════════════════════════════════════════

Project settings (.claude/settings.json) — project-only guards only:
  UserPromptSubmit:         recall-vdi.sh
  PostToolUse Edit|Write:   registry-rebuild.sh, manifest-sync-check.sh, validate-lesson.sh
  PostToolUse use_figma:    mark-build.sh
  PreToolUse Edit|Write:    block-generated-files.sh
  PreToolUse Read:          block-codejs-read.sh
  PreToolUse Bash:          guard-private-screens.sh
  PreToolUse use_figma:     guard-reference-gate.sh, guard-architect-gate.sh

Global settings (~/.claude/settings.json) — NOT in project settings:
  UserPromptSubmit:  feedback-learn.sh, recall-lessons.sh
  Stop:              lint-on-stop.sh, verify-learnings.sh
  SessionStart:      surface-learnings.sh
  PreToolUse use_figma: guard-wireframe-gate.sh (6 shared guards via sap-scope-guard.sh)

Hook stdin format — CRITICAL (wrong format is common mistake):
  import json, sys
  data = json.load(sys.stdin)           # ✅ CORRECT
  file_path = data.get('tool_input', {}).get('file_path', '')
  # ❌ WRONG: $CLAUDE_TOOL_INPUT_FILE_PATH  (env var does not exist)
  # ❌ WRONG: sys.argv[1]                  (hooks receive stdin JSON, not argv)

Hook feedback phrases:
  Positive: "perfect", "bingo", "100%", "great result", "rock solid",
            "bravo", "exactly right", "well done"
  Negative: "wrong", "don't do that", "I told you", "not SAP",
            "violated", "again", "fix this"
  Negation guard: "not perfect" → fires as correction, not praise

settings.json requires Claude Code restart to take effect after changes.

Feedback loop v2 (2026-07-16):
  Detection: negation guard, CANON supersedes POS, hedged corrections, word-boundary
  Verified capture: verify-learnings.sh re-injects reminder at Stop if lesson still pending
  Task-matched recall: recall-lessons.sh surfaces ONLY lessons matching prompt keywords
  9 hooks total in the loop

═══════════════════════════════════════════════════════
§22 NAME-TAG CONTRACT
═══════════════════════════════════════════════════════

[typo:role]   — text node typography annotation
               Example: "Page Title [typo:heading-xl]"

[TOKEN:hex]   — ONLY on leaf nodes with actual fills
               Example: "Status Badge [sapPositiveBackground:#f5faf5]"

⛔ NEVER put token tags on:
  • Transparent layout frames (no fill = no tag)
  • Container frames (DynamicPage, Section, Group)
  • Any frame where fill comes from a child node

Root frame naming:
  {ScreenName} – {Width}   e.g. "PO List Report – 1440"

New frames placement:
  ALWAYS beside rightmost existing frame: x = maxRight + 200, y = 200
  NEVER below (y = maxY + offset)

═══════════════════════════════════════════════════════
§23 CRITICAL SECURITY RULES
═══════════════════════════════════════════════════════

1. Plugin v2 (figma-builder-v2/) stays OUT of GitHub.
   Local branch: agent-v2-wip
   NEVER: git add plugin/figma-builder-v2/
   NEVER: push agent-v2-wip to any remote

2. Canonical screen images (*.png in .claude/memory/screenshots/) are PRIVATE.
   gitignore model = ALLOWLIST (private-by-default).
   Only 6 confirmed public PNGs are tracked.
   When unsure: do NOT git add image files.

3. guard-private-screens.sh blocks Bash commands that could expose private screens.

═══════════════════════════════════════════════════════
§24 MCP SERVERS AVAILABLE
═══════════════════════════════════════════════════════

Official (5):
  mcp__figma__use_figma              — primary build tool
  mcp__figma__get_design_context     — read design (once per new component)
  mcp__figma__get_screenshot         — reference intake at Gate 1
  mcp__figma__search_design_system   — find components by name
  mcp__figma__get_metadata           — structure overview

Custom (3):
  mcp__sap-fiori-guidelines__getFioriGuideline(componentName)
  mcp__sap-fiori-guidelines__searchGuidelines(query)
  mcp__sap-figma-community__getRegistryEntry(componentName)  ← live component key lookup
  mcp__sap-application-analysis__suggestFloorplan({regions})
  mcp__sap-application-analysis__mapRegionToSAP({regionType, label})

Build path priority:
  MCP-first (RULE 25): use_figma + real SAP instances  ← ALWAYS USE THIS
  JSON spec path: retained for bulk standard floorplans only

Guideline URL pattern:
  LATEST first: https://experience.sap.com/fiori-design-web/v1-151/ui-elements/{slug}/
  Old version only as fallback. Always stamp guidelineVersion.

═══════════════════════════════════════════════════════
§25 SKILLS TABLE
═══════════════════════════════════════════════════════

Skill name          Trigger                    What it does
/sap-figma-agent    Any SAP Figma build task   Full 10-step build pipeline
/sap-fix            QA / repair task           Repair pattern lookup + apply
/sap-suggest        Design review              Suggestion catalog scan
/sap-canonical      Reuse scoring task         Canonical similarity score
/sap-learn          Post-build lesson          Lesson capture + validate

Load skills BEFORE responding to any build request.

═══════════════════════════════════════════════════════
§26 WHAT TO DO RIGHT NOW (first steps in a new session)
═══════════════════════════════════════════════════════

1. Read SAP_BUILD_MANIFEST.md (§3 keys · §4 tokens · §5 typography)
2. Read WORKFLOW-CONTRACT.md (compliance checklist)
3. Ask the user: "What screen do you want to build?"
4. When user gives a request:
   a. Image attached → Gate 1: VDI sector analysis first
   b. Text only      → Gate 0.5: ask the 3 architect questions
   c. Gate 2: canonical similarity score
   d. Gate 3: wireframe (4-section mandatory format)
   e. User approves → Gate 4: build with use_figma
   f. Gate 5: QA (read layers, not screenshots)
   g. Gate 6: share validated Figma URL
   h. Gate 7: capture any lessons

Hard stops:
  ⛔ Never build without wireframe approval
  ⛔ Never use JSON spec path when MCP available
  ⛔ Never place frames at y=maxY+offset (use x=maxRight+200, y=200)
  ⛔ Never push plugin v2 to GitHub
  ⛔ Never use arbitrary hex (must match §7 token list exactly)
```

---

## ── END PASTE BLOCK ──────────────────────────────────────────────

## How to paste

1. Copy everything inside the triple-backtick block above.
2. Paste as your **first message** in the new session.
3. Add your request on a new line at the end.

Example:
```
[paste the block]

Now build me a Purchase Order approval screen for 3 approvers with status tracking.
```

That is all Claude needs to start at full speed.
