# 10 - Outage List Overview / Schedule Operation Form (End-Only State D)

> ⚠ **The Node ID below is historical and unverified — never clone by it.** Resolve canonicals live by name + width (`skill/references/canonical-index.json` → `resolution`); evidence in `docs/NODE-ID-CONFLICTS.md`.

**Node ID:** 750:174925  
**File Key:** p7zm5EMBk5DRRZdxNeJ4f5  
**Screenshot:** 10-outage-list-overview.png  
**Dimensions:** 560 x 430px

## Screen Description

"Schedule operation" form — State D: End date only. Recurrence checkbox is unchecked but End date checkbox IS checked, revealing the end date/time fields without the recurrence pattern section. Despite the task label "Outage List Overview", the actual Figma frame name and content is "Schedule Operation — State D EndOnly".

Note: The Outage List Overview (table view) is actually at node 750:174556 (file 02).

## Layout Structure

```
Card (white, border, rounded 8px)
  Header: "Schedule operation" + subtitle
  Divider
  Timing: TIMING + DateTimeRow
    Start date* [e.g. Jul 15, 2026 📅]    Start time* [4:30 PM 🕐]
  Divider
  RecWrap: ☐ Recurrence — repeat this operation on a schedule
  Divider
  EndWrapExpanded (gap-12)
    ☑ End date — leave unchecked to run indefinitely
    EndDateTimeRow (64px tall)
      EndDateCol: "End date" + DatePicker [dd.mm.yyyy 📅]
      EndTimeCol: "End time" + TimePicker [23:59 🕐]
  Divider
  Footer: [Cancel] [Save schedule]
```

## State D Unique Elements

- No recurrence expanded section (shorter than State B/C)
- End date section IS expanded (unique to States C and D)
- Height: 430px (between State A's 354px and State B's 556px)

## SAP Components Used

- Input (DatePicker x2, TimePicker x2)
- Calendar (2x, hidden)
- CheckBox (2x: Recurrence unchecked, End date checked)
- Button (Cancel, Save schedule emphasized)

## Design Tokens

- Card: `--sapGroup_ContentBackground` (white)
- Border: `--sapList_BorderColor` (#e5e5e5)
- Title: `--sapTitleColor` (#131e29)
- Label: `--sapContent_LabelColor` (#556b82)
- Required: `--sapNegativeColor` (#aa0808)
