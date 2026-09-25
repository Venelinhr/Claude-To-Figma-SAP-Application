# Gold screens — how production SAP screens are built (local, zero-cost)

Measured 2026-09-25 with `build/templates/study-gold.use_figma.js` from 16 PM-approved
screens. Read this instead of opening the live nodes. Re-run the script only if a gold
screen changes. All numbers are real px from the Figma files.

## Rules the gold screens agree on

1. **Frame = reference size.** Gold screens are not all 1440. Examples: Flight worklist
   895×598, Dialog 560×354–556, Flight card 751×278, app shells 1440×797–1080 or 1710×870–950.
   Build at the reference size first. Change to a breakpoint only if the user asks.
2. **Density.** Almost all gold screens are **Compact** (buttons 26 high, rows 32, Form Item
   Compact). **Cozy** is used only when the reference shows big controls (Kiwi flight card:
   Button 36 high, Cozy). Mixing is allowed: a Cozy collapsed Side Navigation with Compact
   content (Governance 382:56081).
3. **Shell.** `Shell Bar` (Size=XL, Hamburger=False) 52 high, full width. Below it an
   `App Body` HORIZONTAL gap 0: `Side Navigation` (Form Factor=Compact, Type=Expanded,
   224–260 wide; Type=Floating 48 wide when collapsed) + content VERTICAL gap 0.
   Always the kit Side Navigation. Never draw a side menu from frames.
4. **Everything is a kit instance.** Buttons, inputs, status, tabs, table cells, form items,
   dialogs, headers, footers. Frames only for layout. Fills bound to variables (bound ≫ raw).
5. **Spacing scale:** gaps 0 / 4 / 8 / 12 / 16 / 24 / 32. Nothing else in clean screens.

## Floorplan recipes (real paddings as T/R/B/L)

**List Report** (Purchase Order Overview 24:6139, Outage list 30:3159)
- Breadcrumb Row H p8/32/8/32 → `Dynamic Page Header` (Compact, Size=XL and XXL, Collapsed=True)
- Filter Bar H gap8 p12/32/12/32; each filter V gap4, 163 wide: label + `Input`/`Select`/
  `Date (Range) Picker` (Compact); Go/Adapt buttons H gap8
- Table Area V p16/32/32/32 → table built from `Table Cell` (Compact) rows, `Object Status`,
  `Check Box`, `Icon Button` Tertiary for row actions
- Text: `MediumText/LHAuto/Regular` in cells

**Object Page** (PO detail 24:6405)
- Breadcrumb Row p12/32/4/32 → `Dynamic Page Header` Collapsed=False → Tab Bar Wrap p0/16
  with `Icon Tab Bar` (Inline Mode, Size=S, 44 high)
- Tab content V gap24 p24; Form Row H gap24 of `Form Item` (Type=Input, Compact, Edit Mode,
  4:8 Horizontal); item table = `Toolbar` + `Table Cell` rows; card title
  `Title of Components/sapGroup_TitleFontSize`

**Dialog** (Schedule Operation 9:1469)
- Width 560. Header V gap2 p20/24/16/24 · sections V gap8–12 p16/24/16/24 · rows H gap16 ·
  Footer H gap12 p12/24/12/24, `Button` Tertiary + Primary (Compact, 26 high)
- Controls: `Date (Range) Picker`, `Time Picker`, `Select`, `Check Box`, `Radio Button`,
  `Segmented Button` — all Compact. Section title `LargeText/LHAuto/Bold`

**Wizard in Dialog** (AI Gateway 219:114244, MCP 219:123053)
- `Dialog Block Layer` → `Header` (Compact, Type=Title) → `Wizard Page Header` (Size=M 834px)
  with `.base/Wizard Step` → input area V gap10 p16 → `Footer` (Compact, Type=Footer)

**Overview / governance console** (382:56048 / 56081 / 56168)
- Content V gap8: `Dynamic Page Header` → Bar H gap8 p8/16/8/16 (`Segmented Button`,
  `Split Button`, `Input`) → `Icon Tab Bar` → DynamicSideContent H gap16 p16 with `Table`,
  `Calendar`, `Message Strip`, `List`

**Split / master-detail** (Validate System 42:2570)
- Columns 320 wide, each: `Dynamic Page Header` Size=S → filter V gap8 p12/16 → list items;
  column headers H p8/16/8/16 32 high

**Consumer-style cards** (Kiwi 9:1467, Flight worklist 534:9922)
- Card H: legs zone V gap16 p20/24/16/24 + price zone V gap12 p16/20/20/20; CTA `Button`
  full width of zone. Tags via `Tag`, sort via `Icon Tab Bar`.
- ⚠ Flight worklist uses raw font sizes (13/15/22/28) and 15 raw fills — copy its layout,
  NOT its text styling. Map sizes to kit styles (13–14 → MediumText, 22 → H3, 28 → H2).

## Text styles actually used
Body `MediumText/LHAuto/Regular` · emphasis `MediumText/LHAuto/Bold` · small
`SmallText/LHAuto/Regular` · section `LargeText/LHAuto/Bold` · card title
`Title of Components/sapGroup_TitleFontSize` · page title comes from `Dynamic Page Header`.

## Kayak case (1321:142222) — the size lesson
Reference image 733×518 → built screen 895×598 (22% too big). Correct build: 736×520
(ref rounded to 8), Compact (buttons in the image are small). `measure-ref.py` now prints
this `FRAME →` line first.
