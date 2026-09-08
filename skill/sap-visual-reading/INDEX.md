# sap-visual-reading — skill index

Complete skill for reading UI images, business requirements, and specification documents — producing structured SAP Fiori design plans grounded in the real SAP design system.

**Version:** 2.0 — updated July 2026
**Total files:** 10 skill files + 9 reference images
**Worked examples:** 3 complete screens

---

## File structure

```
sap-visual-reading/
│
├── SKILL.md                          ← START HERE — trigger rules + 8-stage pipeline
├── INDEX.md                          ← this file
│
├── references/
│   ├── confidence-system.md          ● ○ ? tier definitions + application examples
│   ├── component-map.md              visual pattern → sap.m.* lookup + avoid-when guide
│   ├── screen-types.md               floorplan classification + decision rules
│   ├── tokens.md                     SAP Horizon typography, color, spacing tokens
│   ├── states.md                     field states, validation, empty, loading, error
│   ├── image-quality.md              Tier 1–4 reading strategy per image type
│   ├── prompt-template.md            copy-paste prompt templates for any new screen
│   └── vd-scan-measurement.md        VD Scan engine — measured/calculated/inferred/design-system
│                                      tagging, spacing-token lookup, component boundary detection,
│                                      standalone-vs-composite classification. Run before filling
│                                      in the zone table below when precision matters (repairs,
│                                      anything with a filter row, card grid, or multi-column layout).
│
├── examples/
│   ├── schedule-dialog.md            Dialog — conditional sections, CheckBox toggle
│   ├── flight-card.md                CustomListItem — 5 horizontal zones A–E
│   └── object-page-steps.md          Object Page mobile — IconTabBar, filter, list
│
└── images/
    ├── object-page/
    │   ├── 01-steps-tab-filter-active.png
    │   └── 02-validate-system-log-dialog.png
    ├── schedule-dialog/
    │   ├── 01-monthly-recurrence.png
    │   ├── 02-end-date-revealed.png
    │   └── 03-zones-annotated.png
    └── flight-card/
        ├── 01-lot-round-trip.png
        ├── 02-condor-phone-photo.jpg
        ├── 03-lofi-wireframe-light.png
        └── 04-lofi-wireframe-dark.png
```

---

## How to use this skill

### Triggering

Provide any combination of:
- A UI screenshot, Figma frame, wireframe, or photograph
- A business requirement, user story, or acceptance criteria
- A specification document

The skill adapts to whatever is provided — image only, text only, or both together.

### What you get back

Every output follows this structure:

1. Image quality tier (Tier 1–4)
2. Designer Reasoning Pass — 6 questions per zone before any component is named
3. Screen classification — floorplan scoring table
4. Zone overview table — A/B/C... labeled zones
5. Zone-by-zone component map — full ● ○ ? entries
6. Full component architecture tree
7. SAP Horizon token mapping table
8. Interaction model — trigger / target / binding
9. Validation and error states
10. Open questions — actionable, named
11. RCA block — root cause + resolution path per ? item
12. Confidence table

---

## Worked examples — quick reference

### Example 1 — Schedule operation dialog
**File:** `examples/schedule-dialog.md`
**Screen type:** sap.m.Dialog
**Key patterns:**
- CheckBox toggling a VBox section: `visible="{/recurrenceEnabled}"`
- SegmentedButton for single-select recurrence type
- RadioButtonGroup with inactive row: `enabled=false` on all child controls
- 2-column SimpleForm: `columnsL=2 columnsM=1`
- End date pre-fills to `23:59` (opinionated default)
- Dialog expands height dynamically when end date revealed

**Images:**
![Monthly recurrence active](images/schedule-dialog/01-monthly-recurrence.png)
![End date revealed](images/schedule-dialog/02-end-date-revealed.png)
![Zone annotations](images/schedule-dialog/03-zones-annotated.png)

---

### Example 2 — Flight search result card
**File:** `examples/flight-card.md`
**Screen type:** sap.m.CustomListItem inside sap.m.List
**Key patterns:**
- 5 horizontal zones (A–E) in sap.m.HBox
- Airline logo: sap.m.Avatar shape=Circle size=XS
- Duration pill: custom HBox (no standard SAP pill component)
- Offer badge: sap.m.ObjectStatus state=Success
- Stopover: sap.m.Link (underline confirms interactive)
- Price: sap.m.ObjectNumber emphasized=true
- Teal CTA: non-standard color — requires CSS token override

**Images:**
![LOT round trip card — clean](images/flight-card/01-lot-round-trip.png)
![Condor card — phone photo (Tier 3)](images/flight-card/02-condor-phone-photo.jpg)
![Lo-fi wireframe — light](images/flight-card/03-lofi-wireframe-light.png)
![Lo-fi wireframe — dark with zone labels](images/flight-card/04-lofi-wireframe-dark.png)

---

### Example 3 — Object Page Steps tab (yanatest)
**File:** `examples/object-page-steps.md`
**Screen type:** sap.f.DynamicPage — mobile viewport
**Key patterns:**
- IconTabBar with count badge: `count="1"` on sap.m.IconTabFilter
- Inline filter toggle: `visible="{/filtersVisible}"` on VBox
- Selected + success list item: `selected=true + highlight=Success` stacks blue bg + green border
- Navigation arrow: rendered automatically by `type=Navigation`
- Sub-fields: sap.m.ObjectAttribute ×N inside VBox
- Mobile overflow: sap.m.ActionSheet (not sap.m.Menu)
- Filter bar: custom VBox for ≤3 fields (not FilterBar component)

**Images:**
![Steps tab — filter active, Validate System selected](images/object-page/01-steps-tab-filter-active.png)
![Validate System log dialog — drill-down target](images/object-page/02-validate-system-log-dialog.png)

---

## Pattern library — top 10 reusable decisions

| Pattern | Decision | Reason |
|---------|---------|--------|
| Conditional section | `visible="{/flag}"` on VBox | Clean binding, no DOM removal |
| Recurrence type pills | sap.m.SegmentedButton | Single-select enforced by component |
| Disabled row in group | `enabled=false` on all children | Row stays visible; controls are non-interactive |
| Flight duration pill | Custom HBox + sapUiNeutralBG | No standard SAP pill component exists |
| Offer badge (green) | sap.m.ObjectStatus state=Success | Closest semantic match; not a native pill |
| List item left border | `highlight=Success/Error/Warning` | SAP-native; no CSS needed |
| Selected + highlighted | `selected=true + highlight=X` | Both properties stack simultaneously |
| Mobile overflow menu | sap.m.ActionSheet | Bottom sheet is native mobile pattern |
| Filter bar ≤3 fields | Custom sap.m.VBox | FilterBar too heavy for simple cases |
| Airline/entity logo | sap.m.Avatar shape=Circle size=XS | Handles broken image fallback gracefully |

---

## Failure log — top 3 mistakes to avoid

| Mistake | Why it happens | Correct approach |
|---------|---------------|-----------------|
| Inventing a colored pill component | No native SAP pill exists | Use sap.m.ObjectStatus state= for semantic color |
| Using raw hex values (#185FA5) | Image shows exact pixel color | Map to sapUiButtonTextColor or nearest token |
| Describing static states only | Visual analysis reads layout, not behavior | Always add Interaction Model stage to output |

---

## SAP source references

| Resource | URL |
|----------|-----|
| SAP Fiori Design Guidelines | https://experience.sap.com/fiori-design-web/ |
| SAPUI5 API Reference | https://sapui5.hana.ondemand.com/sdk/#/api |
| SAP Web Components | https://sap.github.io/ui5-webcomponents/ |
| SAP Web UI Kit (Figma) | https://www.figma.com/design/SILcWzK5uFghKun9jx6D7c/SAP-Web-UI-Kit |
| SAP Fiori for Web UI Kit | https://www.figma.com/community/file/1494295794601744471/sap-fiori-for-web-ui-kit |
| SAP Icon Explorer | https://sapui5.hana.ondemand.com/sdk/#/topic/21ea0ea94614480d9a910b2e93431291 |
| SAP Theming Parameters | https://sapui5.hana.ondemand.com/sdk/#/topic/d9c4dea8c51e4f62b66e5d1bfcfab68d |
| List Report floorplan | https://experience.sap.com/fiori-design-web/list-report-floorplan/ |
| Object Page floorplan | https://experience.sap.com/fiori-design-web/object-page/ |
| Flexible Column Layout | https://experience.sap.com/fiori-design-web/flexible-column-layout/ |
