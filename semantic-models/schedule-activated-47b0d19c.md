---
vdiVersion: 1.0
sha1: 47b0d19c
screenName: Schedule Activated Confirmation
width: 460
floorplan: Confirmation Dialog (dark shell)
---

# Semantic Model — Schedule Activated

## Zones
- A: Hero zone — success icon + title + subtitle (centered, dark bg)
- B: Summary card — label/value rows + next-execution sub-row
- C: Footer — 3 equal buttons + deactivate text button

## Components & Variants

| Zone | Component | Variant / Props | Token |
|---|---|---|---|
| A | native circle | 56px, radius=28 | sapPositiveTextColor fill |
| A | ◆ICON/sys-enter-2 | 24px white | sapContent_ContrastTextColor |
| A | Text H1 | 72:Bold 24px | sapContent_ContrastTextColor |
| A | Text paragraph | 72:Regular 14px | sapShell_TextColor |
| B | native frame card | radius=8, border 1px | sapList_BorderColor stroke |
| B | ◆ICON/document | 16px | sapContent_LabelColor |
| B | Text caption | 72:Regular 12px uppercase | sapContent_LabelColor |
| B | 6× label/value rows | native text pairs | label=sapContent_LabelColor, value=sapContent_ContrastTextColor |
| B | Status Button | Type=Default, small pill | Active = blue-teal |
| B | "Runs until" value | green text | sapPositiveTextColor |
| B | Next execution row | native sub-card | slightly darker bg |
| B | ◆ICON/appointment-2 | 16px | sapContent_ContrastTextColor |
| B | Timer pill | amber bg | sapCriticalTextColor bg |
| C | Button ×3 | Type=Default, icon+label | sapButton_Background |
| C | Button Deactivate | Type=Tertiary | sapButton_TextColor |

## Token Map
- Page bg: #1A2430 (dark shell — no standard token; use sapShell_Background)
- Card bg: #1D2D3E (sapList_Background dark)
- Success circle: sapPositiveTextColor #256F3A
- Status pill bg: #2C5F8A (information-ish blue)
- Amber pill: sapCriticalTextColor bg

## Notes
- Dark theme screen — NOT Horizon Light
- Width: ~460px (narrow dialog/mobile)
- Ignore bottom arrow (user instruction)
- 3 footer buttons are equal width (flex-1 each)
- "Validate System" in subtitle is bold inline text
