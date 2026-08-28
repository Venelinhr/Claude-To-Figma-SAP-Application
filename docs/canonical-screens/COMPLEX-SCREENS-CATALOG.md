# Canonical SAP Screens — Extended Catalog (14 screens, verified 2026-07-16)

> ⭐⭐⭐ Source-of-truth reference examples. Structure, components, layout, tokens fully extracted + adversarially verified.
> Companion to `COMPLEX-SCREENS-REFERENCE.md` (the first 4). Raw PNGs privacy-excluded (`_private-refs/`, gitignored).
> Source files: `E083sNBH7JNEOBFrG7Bqge` (Schedule Op states, Flight Card, Outage List) · `p7zm5EMBk5DRRZdxNeJ4f5` (SideNav, Wizards, Governance).

---

## SCHEDULE OPERATION DIALOG — 5 states (the canonical progressive-disclosure form)

**Shared anatomy (all states):** Self-contained card, NOT a page — 8px radius + 1px `sapList_BorderColor` #e5e5e5 border + white `sapGroup_ContentBackground` + `sapContent_Shadow1`. Sections separated by **full-width 1px dividers** (divider-driven, zero root gap). All sections 24px horizontal padding; 16px vertical; header asymmetric pt-20/pb-16. Footer: right-aligned Cancel (Type=Tertiary, blue text) + Save schedule (Type=Primary). Two-up field row: 512px content, two 248px cols, 16px gap, each col = 46px vertical stack (16px label + 4px gap + 26px Compact field). Required asterisk = separate text node `sapNegativeColor` #aa0808.

| State | Node | Dims | What's shown |
|---|---|---|---|
| **A Collapsed** | `9:1470` | 560×354 | Minimal — Recurrence + End date both UNCHECKED. Header/Timing/Rec/End/Footer via 4 dividers. |
| **B Recurring** | `9:1498` | 560×556 | Recurrence CHECKED → reveals SegmentedButton (Hourly/Daily/Monthly[sel]/Yearly) + Monthly Pattern box |
| **B2 Daily** | `9:1696` | 560×420 | Recurrence CHECKED, Daily selected, Monthly Pattern HIDDEN. Start date empty (placeholder). |
| **C End Date** | `9:1550` | 560×632 | Recurrence(Monthly) + End date both CHECKED — fully expanded, tallest state |
| **D EndOnly** | `9:1609` | 560×430 | End date CHECKED, Recurrence UNCHECKED → End date/time row visible |

### Components
`Input` (Date, Compact, trailingAction calendar icon, placeholder "e.g. Jul 15, 2026") · `Input` (Time, Compact, trailingAction clock, "4:30 PM") · nested `Calendar` popover (272×272, weekNumbers, Day selection, 56 date cells, hidden until opened) · `Checkbox` (Recurrence / End date, Compact) · `Segmented Button` (Compact/Text, 4 segments, 5th hidden) · `Radio Button` (Day / Relative day) · `Select` ×5 (Day-of-month/Interval/Ordinal/Weekday/Relative — all reuse Input control) · `Button` Cancel (Type=Tertiary) + Save (Type=Primary).

### Signature patterns
1. **Divider-driven sections** — 4 full-width 1px dividers, no root gap.
2. **Monthly Pattern inset box** — bg `sapBackgroundColor` #f5f6f7, 8px radius, p-16; sentence-style layout ("Day [1] of every [1] month(s)").
3. **Disabled row = 45% opacity on the whole RelativeDayRow** (radio + selects), not per-control disabled.
4. **Selects reuse the Input control** (SAP guideline) with chevron-down trailing action.

### Tokens
`sapGroup_ContentBackground` #ffffff · `sapList_BorderColor` #e5e5e5 (border + dividers) · `sapTitleColor` #131e29 (title) · `sapContent_LabelColor` #556b82 (subtitle/labels/TIMING) · `sapNegativeColor` #aa0808 (asterisk) · `sapField_BorderColor` #556b81 · Monthly box `sapBackgroundColor` #f5f6f7. Fonts: title 72 Bold 16px, body 72 Regular 14px, TIMING 72 Regular 12px, Cancel 72 Semibold Duplex 600, Save 72 700.

---

## FLIGHT RESULT CARD — `2:5355` (two-zone split card)

**Floorplan:** Composite result-row card (repeats in List Report). **Dims:** 751×278, corner radius **12px**.

**The signature: TWO-ZONE SPLIT** — Zone A (Legs, 483w fixed) + full-height 1px vert-separator + Zone B (Price/CTA, 267w fixed). Both fixed-width, NOT fill.

### Components
`Button` "Auswählen" Type=Primary (227×36) · Icons: `pushpin-on`, `flight`, `suitcase`×3, `favorite` (star), `action`/share, `heart-2` (outline), `validate` (shield-check).

### Signature patterns
1. **Flight-leg connector row:** dep-time | grow-line | duration-pill | flight-icon | grow-line | arr-time — the two 1px lines use `flex-grow` to keep pill+icon centered regardless of time widths.
2. **Semantic price coloring:** surcharge "+92 €" = `sapPositiveTextColor` #256F3A; total price = neutral `sapTitleColor`; guarantee text = `sapPositiveElementColor` #30914C.
3. **Transfer badge pill:** outline `sapField_BorderColor`, fill `sapGroup_ContentBackground`, leading favorite icon.

### Tokens
`sapShellColor` #FFFFFF · `sapList_BorderColor` #E5E5E5 (border/dividers/connectors) · `sapContent_LabelColor` #556B82 (section labels, dur-pill) · `sapTitleColor` #131E29 (times/airports/price) · dur-pill fill #F0F2F5 (⚠ raw hex — bind to neutral chip token). Times = H4/Bold 20px. Card shadow = SAP "Page Shadow" 2-layer.

---

## OUTAGE LIST OVERVIEW — `30:2741` (desktop List Report)

**Floorplan:** List Report. **Dims:** 1440×776 = SideNav 224 + Content 1216.

### Structure
```
AppLayout [Sidebar 224 (SideNav, 3 items, "Outage List Overview" selected) | Content 1216]
Content: DynamicPageHeader (1216×76) — "Outage List Overview" (24px 72 Black) + "10 records total"
                                        + 3 title actions: Manage Teams / Tool Registry (Type=Tertiary) / + New Outage (Type=Primary)
         Filter Bar (1216×60) — SearchField (452) + Select "All tools" (180) + Select "All statuses" (180) + 2 DatePickers (170 each)
         Table (1184×472, 16px inset) — 8 bold columns, 10 ColumnListItem rows (44px each)
```

### Signature: status ObjectStatus with 4 semantic variants
- Success = green `sapPositiveTextColor` #256f3a (sys-enter-2 check)
- NEW/UPDATED/CLOSED = Informative blue `sapInformativeTextColor` #0064d8 (info-circle)
- UPDATED critical = orange `sapCriticalTextColor` #b44f00
- UPDATED negative = red `sapNegativeTextColor` #aa0808

ID column = `Link` `sapLinkColor` #0064d9 ×10. **+ New Outage = Type=Primary button in page-header title actions (not toolbar).**

---

## SIDE NAVIGATION — 3 canonical variants

| Node | File | Variant |
|---|---|---|
| `688:37816` | p7zm | Left Rail expanded, 224×776, Quick Create footer button + sticky Footer nav |
| `699:38309` | p7zm | Expanded, 224×776, FULL Navigation Item state matrix (default/expandable/selected-child/unselected-child) |
| (also `750:174158` from earlier batch) | | |

### Signature patterns
1. **space-between root layout** pins Footer to bottom regardless of item count (sticky footer nav).
2. **Two-Click-Area** — expandable parents split into label-navigate zone + separate 36px chevron-toggle zone (px-12 py-8) — key SAP a11y affordance.
3. **Slot architecture** — `⿻ Navigation Items` + `⿻ Footer` named slots with pre-provisioned HIDDEN placeholders (16 total: 12 top + 4 footer) → items toggle via boolean visibility, not add/remove.
4. **Selected accent = 3px ABSOLUTELY-positioned bar** (left:0 top:0 bottom:0), `sapList_HighlightColor` #0064D9, over the rounded-8 bg — NOT a border.
5. **Quick Create** = Type=Secondary button, Compact, 1px `sapButton_BorderColor` #BCC3CA border, blue `sapButton_TextColor` #0064D9 label, leading `write-new` icon.

### Metrics
Item height 32, pitch 36 (32+4 gap), radius 8; top-level pl-16/pr-6 gap-8 (icon 16 + label + chevron); sub-items pl-40 no icon; footer 84px with 1px `sapToolbar_SeparatorColor` #D9D9D9 divider. Font: navigable = `72 Semibold Duplex` 600, children/heading = `72 Regular` 400.

---

## WIZARD DIALOG — 3 examples (the canonical multi-step modal)

| Node | File | Screen |
|---|---|---|
| `143:98040` | p7zm | Add API — Step 2 of 4 (Select a Method) |
| `136:15677` | p7zm | Create MCP Server — Step 2 of 3 (Provide MCP Details) |
| `190:100212` | p7zm | Create MCP Server — Step 2 of 3 (786px, WizardPageHeader variant) |

**Floorplan:** Wizard-in-a-Dialog (modal Dialog + horizontal Wizard progress strip + Panel content + footer button bar).

### Structure
```
Dialog card (771–811px, rounded 8-12px, 1px border)
├── Title Bar (56h, px-24, title left, no close X)
├── Wizard Steps (64-72h, px-40/48, border top+bottom 1px)
│   Step circle (28-32px, rounded-full) + label · Connectors = flex-grow 1px lines
├── Content (Panel with SimpleForm — label:value rows, Compact)
│   Inputs + Selects, right-aligned 200px label cells, required asterisks
└── Footer (border-top 1px) — Previous / Next / Cancel buttons
```

### Signature patterns
1. **Numbered step circles, 2 visual states:** ACTIVE = solid `sapButton_Emphasized_Background` #0070f2 fill + white bold number; DONE/UPCOMING = 1px blue outline (#0064d9) + white fill + blue number.
2. **Active-step label flips to Semibold** (72 Semibold, `sapTitleColor`); inactive stay Regular (`sapContent_LabelColor`). Subtle current-step cue.
3. **Connectors = flex-grow 1px lines** colored #0064d9 (grow to fill between steps).
4. **Some wizards add a 3px Active Plate underline** beneath the active step (dual indicator — node 190:100212).
5. **Footer buttons** — mix of Type=Primary (Next) + Type=Tertiary (Previous/Cancel), Compact 26px, radius 8.

### Tokens
`sapBackgroundColor` #f5f6f7 (overlay) · `sapShellColor` #ffffff (card/panel/field) · `sapShell_BorderColor` #d9d9d9 (borders) · `sapButton_Emphasized_Background` #0070f2 (active circle + Next) · `sapButton_TextColor` #0064d9 (inactive circles/connectors) · `sapNegativeTextColor` #aa0808 (asterisk) · `sapList_SelectionBackgroundColor` #ebf8ff (selected list row).

---

## DESIGN SYSTEM GOVERNANCE — 2 full-page variants (most complex screens)

| Node | File | Variant |
|---|---|---|
| `495:79506` | p7zm | Console — ShellBar + SideNav + DynamicPage + IconTabBar + Table + DynamicSideContent(Calendar) |
| `197:102160` | p7zm | Governance — same shell + FilterBar(SegmentedButton+SplitButton) + ResponsiveTable(RatingIndicator) |

**Floorplan:** Dynamic Page (List Report / Worklist) inside App Layout shell. **Dims:** 1440×825.

### Full structure (the most complex composition in the set)
```
ShellBar (1440×52) — Branding "SAP Integration Suite"/"Product Identifier" + logo · Search 400px · Notification · Help · Overflow · Avatar
AppLayout (1440×773)
├── SideNavigation (224) — 8-11 nav items, Navigation Group header, selected item, Quick Create + footer
└── Content (1216)
    ├── DynamicPageHeader (104) — Breadcrumb + Title "Design System Governance" (24px Black)
    │                            + Subtitle "4 tokens · 152 components tracked · Next review: 2026-07-10"
    │                            + Toolbar: Edit (Type=Primary) / Copy (Type=Secondary) / share / fullscreen / close X
    ├── Bar / FilterBar (44) — SegmentedButton (4 segs) + SplitButton (right)
    ├── IconTabBar (44) — Proposals[sel, 3px indicator] / Token Assignments / Review Calendar / More
    └── DynamicSideContent
        ├── Main Panel "Pending Component Proposals" — OverflowToolbar (title + SearchField 280) + Table
        │     Table: 6-9 cols, ColumnListItem rows, Link cells, RatingIndicator (5 stars, 2 filled),
        │            ObjectStatus (Information), MenuButton per row
        └── Side Panel "Review Focus — This Week" (320) — Calendar (July 2023, day 4 selected, weekNumbers)
                                                          + MessageStrip (Information, dismissable)
```

### Signature patterns
1. **SplitButton** "Approve Selected" (Type=Primary + dropdown) = primary bulk action on selected rows.
2. **DynamicSideContent** — main table + side panel (calendar + message strip) responsive split.
3. **Collapsible DynamicPageHeader** — Expand/Collapse + Pin toggle centered at bottom edge; snapped title uses Header4/900.
4. **RatingIndicator** — Compact, 5 stars, partial fill.
5. **MessageStrip** (Information) — "N proposals require attention", info icon + close X.
6. **⚠ Placeholder content note:** the table is titled "Sales Orders (15)" with sales-order sample data (reused List Report template) OR uses "Button"-labeled placeholder controls — these are template stand-ins, not final content.
7. **COMPACT everywhere** — buttons 26px, cells 32px — information-dense desktop admin console.

### Tokens
Full set: `sapObjectHeader_Background` white · `sapObjectHeader_Title_TextColor` #131E29 · `sapLinkColor` #0064D9 · `sapButton_Emphasized_Background` #0064D9-#0070f2 · `sapList_SelectionBackgroundColor` #ebf8ff · `sapContent_Space_XL` 48px (title padding) · `sapInformativeTextColor` #0064d8. Page Title `72 Black` 900 (snapped Header4); panel titles 72 Bold 16px.

---

## Cross-cutting canonical rules (all 18 screens)

1. **Dialogs/cards** = 8px radius (12px for cards like Flight/some wizards) + 1px `sapList_BorderColor` #e5e5e5 + `sapContent_Shadow1`, NOT app-shell pages.
2. **Divider-driven sections** — full-width 1px dividers, zero root gap (Schedule Op, Flight card).
3. **Two-Click-Area** on expandable SideNav parents (label vs chevron hit zones).
4. **Selected state** = `sapList_SelectionBackgroundColor` #ebf8ff + 3px `sapList_HighlightColor`/`sapList_SelectionBorderColor` #0064d9.
5. **Wizard step circles** = filled-emphasized (active) vs outline-blue (done/upcoming); active label Semibold.
6. **Semantic status colors:** Success #256f3a/green · Information #0064d8/blue · Critical #b44f00/orange · Negative #aa0808/red.
7. **Selects reuse the Input control** with chevron-down.
8. **All interactive icons/buttons render BLUE** (#0064d9 lite / #0070f2 emphasized), never neutral grey.
9. **Compact density** for dense admin screens: buttons 26px, cells 32px, fields Compact.
10. **Named slots** (`⿻`) with pre-provisioned hidden placeholders — toggle by visibility, not add/remove.

## Source Figma files (may be deleted — this doc is permanent)
- `E083sNBH7JNEOBFrG7Bqge` — From Claude to SAP Figma screen
- `p7zm5EMBk5DRRZdxNeJ4f5` — SAP application builder
Raw screenshots: `docs/canonical-screens/_private-refs/*.png` (gitignored).
