# 08 - Validate System Log Panel — Schedule Operation State B (Recurring Monthly)

> Screenshot is kept private (local only). This .md is the source of truth — node ID, components, tokens, and layer structure are all here.


> ⚠ **The Node ID below is historical and unverified — never clone by it.** Resolve canonicals live by name + width (`skill/references/canonical-index.json` → `resolution`); evidence in `docs/NODE-ID-CONFLICTS.md`.

**Node ID:** 750:174814  
**File Key:** p7zm5EMBk5DRRZdxNeJ4f5  
**Screenshot:** 08-validate-system-log-panel.png  
**Dimensions:** 560 x 556px

## Screen Description

"Schedule operation" form — State B (Recurrence checked, Monthly tab selected). Shows the expanded recurrence pattern section with monthly configuration options using Radio Buttons and Selects.

## Layout Structure

```
Card (white, border, rounded 8px)
  Header: "Schedule operation" + subtitle
  Divider
  Timing: TIMING + DateTimeRow (Start date*, Start time*)
  Divider
  RecurrenceExpanded (px-24 py-16, gap-12)
    ☑ Recurrence — repeat this operation on a schedule
    "Recurrence type" (label, muted)
    SegmentedButton: [Hourly] [Daily] [Monthly✓] [Yearly]
    Monthly Pattern Box (gray bg, p-16, rounded-8)
      "Monthly pattern" (Bold, 14px)
      DayRow: ○ Day [1 v] of every [1 v] month(s)
      RelativeDayRow (45% opacity): ○ [1st v] [Monday v] of every [1 v] month(s)
  Divider
  EndWrap: ☐ End date — leave unchecked to run indefinitely
  Divider
  Footer: [Cancel] [Save schedule]
```

## Monthly Pattern Details

- Two radio button rows for day selection
- Row 1 (active): RadioButton + "Day" + DayOfMonth Select + "of every" + Interval Select + "month(s)"
- Row 2 (dimmed, 45% opacity): RadioButton + Ordinal Select + Weekday Select + "of every" + RelativeInterval Select + "month(s)"
- Pattern container: `--sapBackgroundColor` gray background, p-16, rounded-8

## Recurrence Type SegmentedButton

Shows 4 segments: Hourly / Daily / Monthly (selected) / Yearly

## SAP Components Used

- CheckBox (checked)
- Label
- SegmentedButton (Compact, Text, 4 segments)
- RadioButton (2x)
- Select (DayOfMonth, Interval, Ordinal, Weekday, RelativeInterval)
- Input (DatePicker, TimePicker)
- Button (Cancel, Save schedule emphasized)

## Design Tokens

- Card background: `--sapGroup_ContentBackground` (white)
- Monthly pattern BG: `--sapBackgroundColor` (#f5f6f7)
- Border: `--sapList_BorderColor` (#e5e5e5)
- Dimmed row: 45% opacity (CSS `opacity: 0.45`)
- Bold pattern title: `--sapTextColor` (#131e29)
- Required asterisk: `--sapNegativeColor` (#aa0808)
