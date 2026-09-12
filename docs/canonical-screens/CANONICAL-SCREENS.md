# Canonical SAP Fiori Screens — Ground Truth Reference

> **These are the approved, validated reference screens. Always use them.**
> They are the quality bar for every future build.
> Structure, layout, components, tokens, instances — everything comes from these screens.
> Do NOT deviate from these patterns without explicit user approval.

Figma file: `p7zm5EMBk5DRRZdxNeJ4f5` (SAP application builder)
Saved: 2026-07-16 (screens may be deleted from Figma — this doc + PNGs are the permanent record)

---

## How to use these references

**Before every build:**
1. Identify which canonical screen is closest to what you're building
2. Read that screen's section below — note the components, layout, tokens
3. Clone the canonical node (never build from scratch — RULE 28)
4. Match the exact structure — headers, spacing, component types, naming

**These screens override any other pattern.** If figma-build-patterns.md says one thing and a canonical screen shows another — the canonical screen wins.

---

## Screen 01 — Design System Governance Console
**Node:** `750:177443`
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=750-177443
**Floorplan:** Flexible Column Layout (FCL) + SideNavigation
**Screenshot:** `01-design-system-governance-console.png`

### Layout structure
```
ShellBar (SAP Integration Suite branding, search, notifications, avatar)
├── SideNavigation (260px, 20+ items, hierarchical, Monitoring selected)
│   ├── Overview
│   ├── Operations (expandable → Operations, Operation Templates, Schedules)
│   ├── Automation Studio (expandable → Content Mgmt, Provider Defs, Custom Ops...)
│   ├── UI Customizations (expandable → Links, Menu Items)
│   ├── Monitoring (SELECTED, blue highlight, 3px left border)
│   │   ├── Activities
│   │   └── Logs
│   ├── Configuration
│   ├── Configuration Ex...
│   └── Infrastructure
└── Main Content (FCL mid column)
    ├── DynamicPageHeader (breadcrumb: Design System Studio / Design System Studio)
    │   ├── Title: "Design System Governance"
    │   ├── Subtitle: "4 tokens · 152 components tracked · Next review: 2026-07-10"
    │   └── Actions: Edit, Copy, share, fullscreen, ×
    ├── IconTabBar: Proposals (active) | Token Assignments | Review Calendar | More ▾
    ├── Main area (two columns)
    │   ├── Left: Table "Pending Component Proposals"
    │   │   ├── Toolbar: "Proposals (12)" search + Create + Delete + icons
    │   │   ├── Nested Table: "Sales Orders (15)" with Search, Create, Delete, gear, export
    │   │   └── Columns: Document Number (link), Company, City, Contact Pers., Posting Date, Amount, Currency, ›
    │   └── Right: DynamicSideContent "Review Focus — This Week"
    │       ├── Calendar widget (July 2023, week 27 highlighted)
    │       └── MessageStrip (Information): "3 proposals require attention before Friday's review"
    └── Footer: "Approve Selected" (Primary) + dropdown arrow
```

### Key components
- `ShellBar` — SAP Integration Suite, full right-side icons
- `SideNavigation` — hierarchical, icons, expandable groups, selected state with blue bg + 3px left border
- `DynamicPageHeader` — breadcrumb, collapsible
- `IconTabBar` — 3 tabs + More overflow
- `Table` (nested) — toolbar with Create/Delete/gear/export icons
- `DynamicSideContent` — calendar + MessageStrip(Information)
- `Button` (Primary) + dropdown `MenuButton`

### Tokens observed
- SideNav selected: `sapList_SelectionBackgroundColor` (blue tint bg) + `sapList_SelectionBorderColor` (3px left)
- Table bg: `sapList_Background`
- Header: `sapObjectHeader_Background`
- Link text: `sapLinkColor` (#0064D9)

---

## Screen 02 — Schedule Operation Form (Daily)
**Node:** `727:42563`  <!-- corrected 2026-07-21: 750:174190 now resolves to "Yanatest Steps"; the live Schedule Operation dialog is 727:42563 -->
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=727-42563
**Floorplan:** Dialog / Form
**Screenshot:** `02-schedule-operation-daily.png`

### Layout structure
```
Dialog (540px wide)
├── Dialog Header: "Schedule operation"
│   └── Subtitle: "Define when and how often this operation runs"
├── Content
│   ├── Section label: "TIMING"
│   ├── Row: Start date* (DatePicker, placeholder "e.g. Jul 15, 2026") + Start time* (TimePicker, "4:30 PM")
│   ├── Divider
│   ├── CheckBox: "Recurrence — repeat this operation on a schedule" (CHECKED)
│   ├── Label: "Recurrence type"
│   ├── SegmentedButton: Hourly | Daily (SELECTED, blue outline) | Monthly | Yearly
│   └── Divider
│       └── CheckBox: "End date — leave unchecked to run indefinitely" (unchecked)
└── Footer
    ├── Button (Tertiary/Ghost): "Cancel"
    └── Button (Primary): "Save schedule"
```

### Key components
- `Dialog` — standard SAP modal, 540px
- `DatePicker` — with calendar icon
- `TimePicker` — with clock icon
- `CheckBox` — standard SAP
- `SegmentedButton` — 4 segments: Hourly/Daily/Monthly/Yearly; Daily selected
- `Button` Primary + Tertiary in footer

### Critical detail
SegmentedButton selected segment uses blue border outline (not filled). Unselected = no border.

---

## Screen 03 — Schedule Operation Form (Monthly pattern)
**Node:** `750:174290`
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=750-174290
**Floorplan:** Dialog / Form (expanded state)
**Screenshot:** `03-schedule-operation-monthly.png`

### Difference from Screen 02
Monthly selected → shows expanded "Monthly pattern" section:
```
Monthly pattern (Panel, grey bg)
├── Radio: ○ Day [1 ▾] of every [1 ▾] month(s)
└── Radio: ○ [1st ▾] [Monday ▾] of every [1 ▾] month(s)  (greyed/disabled row)
```
- `Panel` background: `sapGroup_ContentBackground`
- `Select` dropdowns for day/ordinal/weekday/month count
- `RadioButton` pair for pattern type

---

## Screen 04 — Schedule Operation Form (Monthly + End date)
**Node:** `750:174786`
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=750-174786
**Floorplan:** Dialog / Form (fully expanded state)
**Screenshot:** `04-schedule-operation-monthly-enddate.png`

### Difference from Screen 03
End date checkbox CHECKED → shows end date/time row:
```
CheckBox: "End date — leave unchecked to run indefinitely" (CHECKED)
├── End date (DatePicker, placeholder "dd.mm.yyyy")
└── End time (TimePicker, "23:59")
```
This is the tallest state of the Schedule Operation dialog.

---

## Screen 05 — Schedule Operation Form (full / collapsed)
**Node:** `750:174866`
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=750-174866
**Floorplan:** Dialog / Form (base state — recurrence unchecked)
**Screenshot:** `05-schedule-operation-form-full.png`

### Layout — base/collapsed state
```
Dialog
├── Header: "Schedule operation" / "Define when and how often this operation runs"  
├── Content
│   ├── TIMING section: Start date* + Start time*
│   ├── Divider
│   └── CheckBox: "Recurrence..." (unchecked — pattern section hidden)
└── Footer: Cancel (Tertiary) + Save schedule (Primary)
```
Smallest/collapsed state of the dialog.

---

## Screen 06 — Side Navigation
**Node:** `750:174158`
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=750-174158
**Floorplan:** SideNavigation component
**Screenshot:** `06-side-navigation.png`

### Full navigation tree (canonical)
```
SideNavigation (260px wide)
├── 🏠 Overview                                    →
├── ⚙ Operations                           |  ∨
│   ├── Operations
│   ├── Operation Templates
│   └── Schedules
├── ⚙ Automation Studio                    |  ∨
│   ├── Content Management
│   ├── Provider Definitions
│   ├── Custom Operations
│   ├── Custom Hooks
│   ├── Custom Notifications
│   ├── Custom Processes
│   └── Auto-Heal Configurations
├── 👤 UI Customizations                   |  ∨
│   ├── Links
│   └── Menu Items
├── 👤 Monitoring  [SELECTED — blue bg]    |  ∨
│   ├── Activities
│   └── Logs
├── 🔧 Configuration                               →
├── 🔧 Configuration Ex...                         →
└── 🏗 Infrastructure                              →
```

### Key patterns
- Selected item: `sapList_SelectionBackgroundColor` bg + 3px left `sapList_SelectionBorderColor` border
- Child items: 40px left padding indent
- Separator lines between groups
- Right arrows (›) for collapsed groups, down arrows (∨) for expanded
- Icon + Label + indicator layout per item

### setProperties keys (SideNavigation, confirmed 2026-07-15)
```js
inst.setProperties({
  '✏️ Text#283293:137': 'Operations',
  'Icon#328810:0': iconKey,
  'Navigation Indicator / External Link Icon#283293:50': arrowKey,
  'Navigation Indicator / External Link#283218:12': true,  // show divider+arrow
  'Two Click-Area#283293:112': true,
  'Selected': 'True',
});
```

---

## Screen 07 — yanatest Steps (Object Page narrow)
**Node:** `750:174556`
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=750-174556
**Floorplan:** Object Page (sap.f.DynamicPage + IconTabBar), ~320px narrow
**Screenshot:** `07-yanatest-steps.png`
**Confirmed:** 2026-07-14 — user: "Great result!"

### Layout structure
```
Yanatest Steps (320px)
├── DynamicPageHeader
│   ├── Title: "yanatest" (Bold H1)
│   ├── Subtitle: "Activity | Activity Number 765"
│   └── ··· (absolute IconButton, overflow icon, top-right, x=width-btnW-8, y=10)
├── IconTabBar
│   ├── General (Regular Inactive)
│   └── Steps (Regular Active — blue underline)
├── Dialog Header (cloned from 560:36171)
│   ├── Left: "Steps (1)" + Hide Filters (Tertiary Button)
│   └── Right: Sort + Column Settings (IconButtons, SPACE_BETWEEN)
├── Filter Bar (2 rows)
│   ├── Status: Label + Select (Typed Text)
│   └── Operation: Label + Input (String) + Clear IconButton + Add IconButton
├── Section label: "Operation"
└── List Item (blue-tinted selected bg)
    ├── 3px green left border (sapPositiveElementColor)
    └── Content
        ├── Entry Header: ObjectStatus(Success) + "Validate System" (bold) + › arrow
        └── Meta Block
            ├── ID: 1
            ├── Next: (empty)
            ├── Previous: (empty)
            └── Hook for ID: (empty)
```

### Key patterns confirmed
- DPH: ~40 sublayer hides at 320px; H1 = biggest fontSize text node; titleArea.itemSpacing=4
- IconTabBar: walk TEXT→INSTANCE, setProperties `Interaction State: 'Regular Active'`
- Three-dots: absolute sibling, NOT inside DPH
- SPACE_BETWEEN for toolbar, NO spacer frames
- ObjectStatus(Semantic=Success) checkmark in entry header

---

## Screen 08 — Activities View (List Report)
**Node:** `750:174442`
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=750-174442
**Floorplan:** List Report, 320px
**Screenshot:** `08-activities-view.png`
**Confirmed:** 2026-07-15 — user: "Perfect"

### Layout structure
```
Activities View (320px)
├── DynamicPageHeader (cloned from 601:36910)
│   ├── Title: "Activities View" (H1)
│   ├── Subtitle: "Latest Server Time: 2026-07-08 13:29:43 (UTC)"
│   └── ··· (absolute IconButton overflow, top-right)
├── Filter Bar
│   ├── Name: Label + Input (String)
│   └── Status: Label + Select (Typed Text) + × clear + + add
├── Dialog Header (cloned)
│   ├── Left: "Activities (6)"
│   └── Right: Sort (↕) + Column Settings (⚙)
├── Column Header: "Name"
└── 3 List Items
    ├── yanatest — Actions ▾ | ›
    │   ├── Activity Number: 765
    │   ├── Progress: 100% ████ ✓  ← Progress Row canonical pattern
    │   ├── Note: (empty)
    │   └── Start Time: 2026-07-06 12:22:48
    ├── Validate Instance — Actions ▾ | ›
    │   └── (same structure, Activity Number: 426)
    └── Validate System — Actions ▾ | ›
        └── (same structure, Activity Number: 425)
```

### Canonical Progress Row (use EXACTLY this)
```js
// Native green frame — NOT SAP ProgressIndicator
const bar = figma.createFrame();
bar.name = 'Progress Bar';
bar.fills = [{type:'SOLID', color:{r:0.118, g:0.561, b:0.337}}]; // sapPositiveElementColor
bar.resize(40, 12);
bar.cornerRadius = 6;
// + ObjectStatus(Semantic=Success) with all TEXT nodes hidden (icon-only checkmark)
```

---

## Screen 09 — Validate System Log Panel

> ⚠ **Historical, unverified.** The Node line below is an archived hint, not a clone address — live it resolves to `Schedule Operation — State B Recurring`. Resolve by name + width instead (see the Summary table). Evidence: `docs/NODE-ID-CONFLICTS.md`.

**Node:** `750:174814`
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=750-174814
**Floorplan:** Dialog / Object Page detail panel
**Screenshot:** `09-validate-system-log-panel.png`

### Layout structure
```
Panel/Dialog (full width)
├── Header
│   ├── Title: "Validate System" (bold)
│   ├── Subtitle: "Step | ID 1 | Activity Number 765"
│   ├── Right: Filter (funnel icon, active blue) + Hide Filters button + Fullscreen + ×
├── Filter Bar
│   ├── Message: Label + Input (String)
│   └── Severity: Label + Select ("Select Value")  + filter-add + filter-remove
├── Dialog Header (table header)
│   ├── Left: "Messages (10)" + SegmentedButton: All | Platform (SELECTED) | AI | Analytics
│   └── Right: Sort (↕) + Column Settings (⚙)
└── Message List (10 items)
    ├── Row 1: [Trace] purple pill | "Message Code: LVM" | Time: 2026-07-06 12:22:48
    │         Serialized Trace ID: 5edcc166deea460e93545f658a867055$db6024539ac749c2...
    ├── Row 2: [Debug] grey pill  | "Message Code: LVM" | Time...
    │         "Cluster integration is not enabled. No cluster related checks necessary."
    ├── Row 3: [Trace] | "Message Code: ValSchedule"
    │         "Scheduling validation for SystemID.A00.SystemHost.simdba00"
    ├── Row 4: [Trace] | LVM | "Scheduled validation for SystemID..."
    ├── Row 5: [Information] green pill | LVM | "The validations for entity with id..."
    ├── Row 6: [Trace] | LVM | "Validations for validator 'Solution Manager Assignment'..."
    └── Row 7: [Trace] | LVM | "Validations for validator 'Solution Manager Version'..."
```

### Key patterns
- Severity pills: Trace=purple (`sapNeutralColor`), Debug=grey, Information=blue (`sapInformativeColor`), Warning=orange, Error=red
- Each row: pill + bold "Message Code: X" label + timestamp on same line; body text below
- SegmentedButton for message type filter (All/Platform/AI/Analytics)
- Filters shown (not collapsed)

---

## Screen 10 — Outage List Overview

> ⚠ **Historical, unverified.** The Node line below is an archived hint, not a clone address — live it resolves to `Schedule Operation — State D EndOnly`, a 560×430 dialog. Resolve by name + width instead (see the Summary table). Evidence: `docs/NODE-ID-CONFLICTS.md`.

**Node:** `750:174925`
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=750-174925
**Floorplan:** List Report (desktop 1440px, SideNavigation + FCL)
**Screenshot:** `10-outage-list-overview.png`

### Layout structure
```
Full desktop (1440px)
├── SideNavigation (left, 3 items)
│   ├── New Outage Checklist F...
│   ├── Outage List Overview  [SELECTED]
│   └── Tool Registry
└── Main Content
    ├── Page Header
    │   ├── Title: "Outage List Overview"
    │   ├── Subtitle: "10 records total"
    │   └── Actions: Manage Teams (link icon) | Tool Registry (wrench icon) | + New Outage (Primary)
    ├── Filter Bar (inline, single row)
    │   ├── Search input: "Search by tool, member, status..."
    │   ├── Select: "All tools"
    │   ├── Select: "All statuses"
    │   ├── DatePicker: "From date..."
    │   └── DatePicker: "To date..."
    └── Table (10 rows)
        Columns: ID (link) | TOOL | OUTAGE TYPE | STARTED AT (UTC) | RECEIVED AT (UTC) | STATUS | UPDATED AT | UPDATED BY
        Row examples:
        OC-SPC001 | SPC (NZA)      | Disruption         | 07 Jul 06:30 | 06:35 | ✓ Success (green)  | —         | —
        OC-TIC002 | Plato / TIC    | Disruption         | 07 Jul 07:00 | 07:05 | ℹ NEW (blue)       | —         | —
        OC-LAM005 | LAMA (LVP...) | Disruption         | 07 Jul 05:00 | 05:10 | ℹ UPDATED (blue)   | 07 Jul 07:45 | Llil Zaf
        OC-WTS003 | ECS WTS        | Degradation        | 07 Jul 08:15 | 08:20 | ℹ NEW (blue)       | —         | —
        OC-SPC006 | SPC (NZA)      | Degradation        | 07 Jul 05:30 | 05:40 | ⚠ UPDATED (orange) | 07 Jul 08:30 | Llil Zaf
        OC-TIC007 | Plato / TIC    | Disruption + De... | 07 Jul 06:00 | 06:10 | ✗ UPDATED (red)    | 07 Jul 09:15 | Llil Zaf
        OC-LAM010 | LAMA (LVP...) | Degradation        | 07 Jul 02:30 | 02:45 | ℹ CLOSED (blue)    | 07 Jul 09:45 | Llil Zaf
```

### Key patterns
- Status ObjectStatus pills: Success=green, NEW/UPDATED/CLOSED=blue(Information), UPDATED(warning)=orange, UPDATED(error)=red
- ID column = links (sapLinkColor)
- Header columns: bold, all-caps
- + New Outage = Primary Button top-right of page header (NOT in toolbar)
- SideNavigation: minimal, 3 items only

---

## Screen 11 — Design System Governance (Worklist variant)
**Node:** `750:174960`
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=750-174960
**Floorplan:** Worklist / List Report (desktop 1440px)
**Screenshot:** `11-design-system-governance-worklist.png`

Similar to Screen 01 but worklist variant. Use Screen 01 for FCL reference, this for worklist layout.

---

## Screen 12 — Schedule Activated (Confirmation)
**Node:** `850:45411`
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=850-45411
**Floorplan:** Confirmation / Success State (Dialog step 4)
**Screenshot:** `12-schedule-activated.png`
**Confirmed:** 2026-07-18 — user: "Bravo. Great result!"

### Layout structure
```
Schedule Activated (460px)
├── Demo Wrapper                          [sapBackgroundColor]
│   └── DEMO pill (green stroke, green text)
├── Hero                                  [sapBackgroundColor]
│   ├── Success Icon Circle 56px          [sapPositiveElementColor] green filled + ✓
│   ├── Title "Schedule activated"        [typo:heading] [sapTitleColor]
│   └── Subtitle (inline bold "Validate System") [typo:body] [sapContent_LabelColor]
├── Summary Card Wrapper                  [sapBackgroundColor]
│   └── Activation Summary Card          [sapShellColor] [stroke:sapList_BorderColor]
│       ├── Card Header                  [sapBackgroundColor]
│       │   ├── Icon/document (SAP icon instance, 16×16)
│       │   └── "ACTIVATION SUMMARY"     [typo:caption]
│       ├── Row Schedule ID              SCH-2026-0047
│       ├── Row Status                   ObjectStatus(Information) ⓘ Active
│       ├── Row Created by               Alex (sysadmin)
│       ├── Row Created at               16 Jul 2026 · 14:32
│       ├── Row Pattern                  Day 1 · every month
│       ├── Row Runs until               ObjectStatus(Success) ∞ Indefinitely
│       └── Next Execution Box           [sapBackgroundColor] rounded-8
│           ├── Icon/date-time (SAP icon, 20×20)
│           ├── "Next execution" + "1 Aug 2026 at 08:00"
│           └── ObjectStatus(Warning) ⚠ In 16 days
├── Primary Actions                      [sapShellColor]
│   ├── Button(Secondary,Compact) 📅 View schedule
│   ├── Button(Secondary,Compact) 🗓 Back to steps
│   └── Button(Secondary,Compact) 📄 Add another
└── Secondary Actions                    [sapShellColor]
    └── Button(Secondary,Compact) 📋 Deactivate this schedule
```

### Key patterns confirmed
- **Horizon Light always** — reference was dark, built light. Dark hex = Bind failure.
- **ObjectStatus semantics:** Information=blue(Active), Success=green(Indefinitely), Warning=orange(In 16 days)
- **Icon visibility fix:** ObjectStatus icon vector is hidden by default — force `iconVector.visible = true` after setProperties
- **Plugin bind requires direct page child:** frame nested in GROUP → bind finds 0 fills. Move frame to page root before binding, move back after.
- **Icon keys:** `document` = `47593f4f8e7f752e8bb05c6489c2ce610eb012c6`, `date-time` = `f8211de35a7e07c14fa178fa3769db7b16306f11`, `add-calendar` = `035388107a60472d49a67c55e79c775c24239330`, `add-document` = `39276ef38b2e219a387c35a485135210520e9820`
- **Button icon swap:** `setProperties({ 'Icon#112533:487': comp.id, 'Icon Left#112533:293': true, 'Form Factor': 'Compact' })`
- **DEMO pill:** `[sapBackgroundColor]` fill + `sapPositiveElementColor` stroke + green text — NOT a dark custom color

---

## Screen 13 — Orders List Report (Desktop)
**Node:** `889:45857`
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=889-45857
**Floorplan:** List Report (desktop 1440px) with Shell Navigation
**Confirmed:** 2026-07-19 — user: "Great result, bravo! Really happy with results!"

### Layout structure
```
Orders List Report (1440px)
├── Shell Bar (SAP ShellBar, EMA title, Search, Notification, Avatar)
├── Icon Tab Bar (Shell Navigation, XL) — 6 tabs, Orders active (blue underline)
│   Dashboard | Inventory | Store | Customers | [Orders] | Analytics
├── Page Header [sapShellColor]                    pad 32px
│   ├── Title "Orders" [typo:heading]
│   ├── Subtitle "Track and manage customer orders" [typo:body]
│   └── Button "Create Order" (Type=Primary, Compact)
├── Filter Area [sapShellColor]                    pad 32px
│   ├── Input "Search orders..." (Compact)
│   └── Filter Row: Status Select | Payment Select | Fulfillment Select
└── Table Area [sapBackgroundColor]                pad 32px
    └── Responsive Table [sapList_Background] [stroke:sapList_BorderColor] rounded-8
        ├── Column Header Row: ☐ Order | Date | Customer | Status | Payment | Fulfillment | Tracking | Total | Actions
        └── Row ×6 (60px each, bottom-stroke divider)
            ├── Order ID (bold, sapLinkColor)
            ├── Date (Regular, sapContent_LabelColor)
            ├── Customer (Regular, sapTextColor)
            ├── Status ObjectStatus (Success/Error/Warning/Information/None)
            ├── Payment ObjectStatus (Success/None)
            ├── Fulfillment ObjectStatus (Success/Warning)
            ├── Tracking (link or —)
            ├── Total (Bold amount + Regular sub-currency, CENTER aligned)
            └── Actions: IconButton(show) + IconButton(edit) + IconButton(delete) — ALL Tertiary, Compact
```

### Key patterns confirmed
- **SAP Shell Navigation IconTabBar** (not custom nav) — `Type=Shell Navigation, Size=XL` — 6 tabs, hide unused
- **`[typo:role]` tags on ALL text nodes** — never raw `fontName:{family:'72'}`
- **32px side padding** on all containers (not 48)
- **IconButtons Type=Tertiary** for all action icons
- **No native Divider frames** — row separation via `strokeBottomWeight=1` on row frame
- **Form Factor=Compact** on all SAP instances
- **Two-line cells (amount+sub)** — `counterAxisAlignItems='CENTER'`
- **ObjectStatus semantics:** delivered/paid/fulfilled=Success, cancelled=Error, pending/unfulfilled=Warning, processing=Information

### Icon keys used
| Icon | Key |
|---|---|
| show (eye/view) | `f4d889dde94203c7d563db1cde8ec8ae695395bd` |
| edit (pencil) | `b346b05bc52f9d648ead280cfbd17baacea391f2` |
| delete (trash) | `6da9bfb78bb57cc96d015531ac16e201423d8558` |
| home (Dashboard) | `ddf4537c2f792179f11f64cae869cd1241e5ec7e` |
| supplier (Inventory) | `3f607cafdbd3a4f0019abc742dd76ddf1e40cbba` |
| cart-5 (Store) | `68f93c28e21146dc19ecce257fbd6a927cb72cf9` |
| customer (Customers) | `573efa86c1c73396dbbefdc93702b3c8818bbf53` |
| customer-order-entry (Orders) | `8bdc87fe8b82ffa2dac8deefcc9cc9528c044afd` |
| vertical-bar-chart (Analytics) | `0a0bfb8c9892cc902d6733d771eaee8dcaaffecd` |

---

## Screen 14 — Products Inventory (EMA)
**Node:** `907:46070`
**Figma:** https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=907-46070
**Floorplan:** List Report (desktop 1440px) — Inventory tab active
**Confirmed:** 2026-07-19 — user: "Great result! Save all and learn!"

### Layout structure
```
Products Inventory (1440px)
├── Shell Bar (SAP, EMA title)
├── Icon Tab Bar (Shell Navigation XL) — Inventory active
├── Page Header [sapShellColor] pad 32px
│   ├── Title "Products Inventory" + Subtitle
│   └── Export CSV + Import CSV (Secondary) + Add Product (Primary) — ALL Compact
├── URL Scraper Bar [sapShellColor]
│   ├── SAP Input FILL "Paste Amazon URL..." — Compact
│   └── SAP Button "Scrape" Secondary Compact
├── Filter Area [sapBackgroundColor] pad 32px
│   ├── Search Input (320px) + Filter Button + Group by Brand Button — Compact
│   └── 5 Filter dropdowns: Collection/Product Type/Availability/Status/Price — Compact
└── Main Content (HORIZONTAL)
    ├── Category Nav (200px) [sapShellColor]
    │   ├── All Products 1 (active, blue bg)
    │   ├── > Матрак
    │   └── Uncategorized 1
    └── Product Table [sapList_Background] rounded-8
        ├── Column Header: Name/ASIN/Brand/Supplier/Price/Change/Stock/Status
        └── Row: Test Pillow Set · 1 var · €35.00/BGN 68.45 · +16.7% · 0 · ObjectStatus(Success)"in stock" · Edit IconButton(Tertiary)
```

### Key patterns confirmed
- **ALL instances Compact** — never switch to Cozy for a11y warnings on desktop back-office
- **ObjectStatus(Success)** for "in stock" — never a custom native pill frame
- **Two-line cells CENTER** — price €35.00/BGN 68.45 → `counterAxisAlignItems='CENTER'`
- **32px side padding** everywhere
- **FILL on URL input** after appendChild (not before)
- **Left nav panel** as FIXED 200px, table wrapper as FIXED W-200px

---

## Summary — Clone sources by floorplan

> ⛔ **Resolve every clone source by NAME + WIDTH in the live file — never by a stored id.**
> ```js
> const [src] = figma.currentPage.findAll(n => n.name === "Outage List Overview" && Math.abs(n.width - 1440) <= 2);
> ```
> Assert `src.name` and `src.width` before `.clone()`. The hint-id column is a hint only and has drifted: live-verified 2026-09-02, `750:174925` is a 560×430 `Schedule Operation — State D EndOnly` **dialog**, not the desktop List Report, and `750:174814` is `State B Recurring`, not the log panel. Cloning either by id silently builds the wrong floorplan. Contract: `skill/references/canonical-index.json` → `resolution`. Evidence: `docs/NODE-ID-CONFLICTS.md`. See AUDIT-V2 §8.4 (P10).

| You're building... | Clone source (name) | Width | Hint id (verify before use) |
|---|---|---|---|
| SideNavigation (any) | SideNavigation | 260 | `750:174158` or `699:37890` |
| Dialog / Form | Schedule Operation | 560 | `727:42563` |
| List Report (narrow) | Activities View | 320 | `615:36810` |
| Object Page (narrow) | yanatest Steps | 320 | `560:36552` |
| Log/Message panel | Validate System | 678 | `750:174442` |
| Full desktop List Report | Outage List Overview | 1440 | `750:174556` |
| Inventory List Report | EMA Products | 1440 | `907:46070` |
| FCL + SideNav + Table | Governance Console | 1440 | `750:177443` |
| Confirmation / Success state | Schedule Activated | 560 | `850:45411` |
| Purchase Orders List Report | Purchase Orders | 1440 | `804:44859` |

---

## What NOT to do (anti-patterns visible in these screens)

- Never `createFrame()` for a real SAP component — every component here is a real SAP kit instance
- Never spacer frames — all spacing is `itemSpacing` / `SPACE_BETWEEN` / `layoutGrow` on real children
- Never raw hex fills — all fills are SAP semantic tokens
- Never rebuild SideNavigation from scratch — clone `699:37890`, clear slot, repopulate (P-026)
- Never use `Regular Active` on more than one IconTabBar tab — only the selected tab is Active
