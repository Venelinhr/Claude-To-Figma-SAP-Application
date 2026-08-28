# SAP Token Assignment Rules

## Source of truth
These heuristics are seeded from confirmed builds and updated via the post-build learning loop.
Every entry is verified from `get_design_context` on confirmed-quality screens.

## Canonical reference screens
- Schedule Operation State C (node 355:39080) — best dialog example
- Schedule Operation State Machine section (node 387:34194) — best overall
- Flight Result Card v2 (node 413:34244) — best card example
- **Flight Result Card v3 (node 472:34431) — CONFIRMED EXCELLENT ⭐ 2026-07-13** — auto-layout, SAP tokens, SAP text styles, real SAP icon instances

---

## Typography rules

| Element type | SAP text style | px | Weight | Style Key |
|---|---|---|---|---|
| Screen/dialog title | LargeText/LHAuto/Bold | 16 | Bold | `8d0bf06542dc8fbc5b16b073e83cd2eb8f1bb061` |
| Subtitle / description | MediumText/LHAuto/Regular | 14 | Regular | `a55fdfa6995034dee7c5758e479e7f554c457291` |
| Section label (TIMING, RECURRENCE) | SmallText/LHAuto/Regular | 12 | Regular | `3630ff040c7662da157c94f39ca000434866af79` |
| Field label (Start date, Start time) | MediumText/LHAuto/Regular | 14 | Regular | `a55fdfa6995034dee7c5758e479e7f554c457291` |
| Bold label (Monthly pattern) | MediumText/LHAuto/Bold | 14 | Bold | `405de2565edf459a754f1e72823e3f4d7c8cbb3b` |
| Body text (checkbox descriptions) | MediumText/LHAuto/Regular | 14 | Regular | `a55fdfa6995034dee7c5758e479e7f554c457291` |
| Caption / date / carrier text | SmallText/LHAuto/Regular | 12 | Regular | `3630ff040c7662da157c94f39ca000434866af79` |
| IATA airport codes (SOF, LHR) | H4/Bold | 20 | Bold | `7263cb9889e84c192d1ebf77a45cfbc8c13ca5d0` |
| Large emphasis (times, big numbers) | H4/Bold | 20 | Bold | `7263cb9889e84c192d1ebf77a45cfbc8c13ca5d0` |
| Prominent price / object header | Main Header / sapObjectHeader_Title | 24 | Black | `57bc266f295c53a7ba3b8dbb050a06e9ff92cde3` |
| Toolbar title (`toolbarTitle`) | LargeText/LHAuto/Regular | 16 | Regular | `fcd48b218e51130a9fd37d5ac590587c0b86b556` |
| Step label (`stepLabel`) | SmallText/LHAuto/Bold | 12 | Bold | `4635f9147cd7445edfd6c5095e0269a74b31d93d` |
| H5 bold (`h5Bold`) | H5/Bold | 16 | Bold | `2f7e6166497d2aabce5becd7cca08ac983527c47` |
| H5 regular (`h5Regular`) | H5/Regular | 16 | Regular | `eafe040ca349722d64228570677c0341f52e8ebf` |
| **Flight departure/arrival times** | LargeText/LHAuto/Bold + 28px override | 28 | Bold | `8d0bf06542dc8fbc5b16b073e83cd2eb8f1bb061` + `overrideSize:28` |
| **Card main price (768 €)** | LargeText/LHAuto/Bold + 28px override | 28 | Bold | `8d0bf06542dc8fbc5b16b073e83cd2eb8f1bb061` + `overrideSize:28` |
| **Card surcharge (+92 €)** | LargeText/LHAuto/Bold + 18px override | 18 | Bold | `8d0bf06542dc8fbc5b16b073e83cd2eb8f1bb061` + `overrideSize:18` |

**Typography rule:** Always use `[typo:role]` name tags on text nodes. The bind plugin imports and applies named SAP library text styles. For custom sizes (28px flight times, 28px prices), use `[typo:flightTime]` / `[typo:priceHeader]` / `[typo:surcharge]` — the plugin applies the style then overrides size (shows ↺ in panel, which is correct and expected).

**NEVER** set raw `72` font family directly. Always apply through a named SAP text style so the Typography panel shows the SAP style name.

---

## Color token rules

| Element type | SAP token | Hex (Horizon Light) | Layer tag |
|---|---|---|---|
| Card / frame background | `sapGroup_ContentBackground` | #ffffff | `[sapGroup_ContentBackground]` |
| Card stroke/border | `sapList_BorderColor` | #e5e5e5 | `[stroke:sapList_BorderColor]` |
| Screen/dialog title text | `sapTitleColor` | #1d2d3e | fill on text layer |
| Body / default text | `sapTextColor` | #131e29 | fill on text layer |
| Field labels / subtitles / captions | `sapContent_LabelColor` | #556b82 | fill on text layer |
| Required asterisk `*` | `sapNegativeColor` | #bd2920 | fill on text layer |
| Section background (Monthly pattern box) | `sapBackgroundColor` | #f5f6f7 | `[sapBackgroundColor]` |
| Divider lines | `sapList_BorderColor` | #e5e5e5 | `[sapList_BorderColor]` |
| Field border | `sapField_BorderColor` | #556b81 | fill on frame |
| Field background | `sapField_Background` | #ffffff | fill on frame |
| Selected/active state | `sapButton_Emphasized_Background` | #0070f2 | SAP Button instance |
| Positive / success text | `sapPositiveTextColor` | #1e8f56 | fill on text layer |
| Critical / warning text | `sapCriticalTextColor` | #df7b01 | fill on text layer |
| Error / negative text | `sapNegativeTextColor` | #bb0000 | fill on text layer |
| Disabled text | `sapContent_DisabledTextColor` | #89919a | fill on text layer |
| Link / interactive | `sapLinkColor` | #0064d9 | fill on text layer |
| Duration pill background | `sapNeutralBackground` | #f5f6f7 | `[sapNeutralBackground]` |

---

## Spacing rules (from confirmed builds)

| Context | Value | SAP token |
|---|---|---|
| Dialog/card outer padding (horizontal) | 24px | — (confirmed from design context) |
| Section top/bottom padding | 16px | — |
| Dialog header top | 20px | — |
| Dialog header bottom | 16px | — |
| Footer height | 60px | — |
| Date/time row height | 64px | — |
| FILL columns in date/time row | `flex-[1_0_0]` | — |
| Section gap (between items in a section) | 12px | — |
| Label+field gap | 4px | — |
| Icon + text gap in rows | 4–8px | — |

---

## Layout rules (from confirmed builds)

| Pattern | Rule | Source |
|---|---|---|
| Date + time fields | Two FILL columns (`flex-[1_0_0]`), NOT fixed width — prevents cropping | 355:39080 |
| Monthly pattern box | `p-[16px] rounded-[8px] bg-[var(--sapBackgroundColor)]` | 355:39080 |
| Relative/disabled row | `opacity-45` on the HBox wrapper | 355:39080 |
| Section label (TIMING) | `SmallText/Regular` + `sapContent_LabelColor` — always uppercase text | 355:39080 |
| Dividers | `h-px w-full bg-[var(--sapList_BorderColor)]` | 355:39080 |
| Footer | `h-[60px] px-[24px] py-[12px] justify-end items-center` | 355:39080 |
| Primary button (footer) | kit `Type=Primary` — blue, right-aligned | 355:39080 |
| Secondary button (footer) | kit `Type=Tertiary` — left of primary | 355:39080 |
| **Flight card horizontal layout** | Two zones: Zone A — Legs (FILL) + vertical separator + Zone B — Price (276px FIXED) | 472:34431 |
| **Flight leg structure** | VERTICAL auto-layout: label-row → flight-row → airport-row, gap 8 | 472:34431 |
| **Flight time row** | HORIZONTAL, gap 8: dep-time → line (layoutGrow:1) → dur-pill → icon → line (layoutGrow:1) → arr-time | 472:34431 |
| **Airport row** | HORIZONTAL, gap 8: origin → Spacer (layoutGrow:1) → stop-link → Spacer (layoutGrow:1) → dest | 472:34431 |
| **Spacers for flex distribution** | Use HORIZONTAL auto-layout frames with `layoutGrow:1` as spacers between elements | 472:34431 |
| **Zone B price panel** | VERTICAL auto-layout, 276px FIXED, center-aligned: icons → spacer → surcharge → guarantee → gap → price → sub-label → spacer → button | 472:34431 |

---

## Icon rules (from confirmed builds)

| Use case | SAP icon component | Key | Library |
|---|---|---|---|
| Airline/flight placeholder | `flight` | `37f208b56dd5b18274498d369d5aeee9a5f02afe` | SAP Signavio Web UI Kit |
| Luggage / baggage | `suitcase` | `f861bc4a553fe5e7c040763638c2f3ede56f01a0` | SAP Signavio Web UI Kit |
| Guarantee / shield / security | `validate` | `85892e18d63c258516c63753dc9f1bfb2951393d` | SAP Signavio Web UI Kit |
| Heart / favourite | `heart-2` | `bcf83e0c441b8a7c72423093ded69bcf652dbc55` | SAP Signavio Web UI Kit |
| Share / forward | `action` | `be898786d0401b7013f48a21ce88b191996f9231` | SAP Signavio Web UI Kit |
| CTA Button | `Button` (component set) | `85f04ccf02f2d1ae2ff760aa181b348b8c39783f` | SAP Signavio Web UI Kit |

**Icon rule:** Always use `importComponentByKeyAsync(key)` to get REAL SAP icon instances. Never use emoji or text as icon placeholders in final builds. Icon instances can be resized to 16×16 or 20×20 for inline use.

---

## RULE 25 name-tag contract (complete)

| Layer type | Required tag | Example |
|---|---|---|
| Frame fill (background) | `[sapTokenName]` | `Zone A — Legs [sapGroup_ContentBackground]` |
| Frame stroke | `[stroke:sapTokenName]` | `Flight Result Card [sapGroup_ContentBackground] [stroke:sapList_BorderColor]` |
| Text color fill | `[sapTokenName]` | `dep-time [sapTitleColor]` |
| Text typography | `[typo:role]` | `dep-time [typo:flightTime]` |
| Icon placeholder | `◆ICON/name` | `◆ICON/flight` |
| Root frame | `◆SAP-UNBOUND/Name` or descriptive name | `Flight Result Card [sapGroup_ContentBackground]` |
| Spacer frames | `Spacer` with `layoutGrow:1` | used in airport rows and price zone |

---

## Plugin capabilities (as of 2026-07-13)

- `[stroke:sapToken]` tag support added — resolveNameAnnotations now handles stroke binding
- `[typo:flightTime]`, `[typo:priceHeader]`, `[typo:surcharge]` roles added with `overrideSize` support
- Plugin code.js: **3,524 LOC** (lean — JSON build path removed)

---

## Post-build learning entries

(This section grows automatically via the Ground Truth Update loop after confirmed builds.)

### 2026-07-12 — Schedule Operation State C (355:39080)
Confirmed via `get_design_context`:
- `px-[24px] py-[16px]` section padding ✓
- `h-[64px]` date/time row ✓
- `flex-[1_0_0]` FILL columns ✓
- `h-[60px]` footer ✓
- `LargeText/LHAuto/Bold` for title (16px) ✓
- `MediumText/LHAuto/Regular` for field labels (14px) ✓
- `SmallText/LHAuto/Regular` for TIMING caption (12px) ✓
- ALL typography uses `Font/Family/sapFontFamily` CSS var — NOT Inter, NOT hardcoded px ✓

### 2026-07-12 — Flight Result Card v2 (413:34244)
Confirmed via `get_design_context`:
- Zone A: 386px, Zone B: 300px, Zone C: 120px, Zone D: 220px ✓
- H4/Bold (20px) for flight times ✓
- sapObjectHeader_Title (24px Black) for price ✓
- Cozy form factor (44px touch targets) ✓

### 2026-07-13 — Schedule Operation Full Section (387:34194) — BEST OVERALL ⭐
User confirmed: "rock solid well done result". 9 states + prototype, verified visually.
Section bounds: 2633×1856px. Contains: State A, B, C, D, B1(Hourly), B2(Daily), B4(Yearly), E(Error), F(Success).

**Confirmed correct in all states:**
- Date/time pickers: `flex-[1_0_0]` FILL, no cropping ✓
- Monthly pattern box: shown only in B/C states ✓
- Form factor: Compact throughout ✓

### 2026-07-13 — Flight Result Card v3 (472:34431) — EXCELLENT RESULT ⭐⭐
User confirmed: "Excellent! Bravo. This is the expected result. Better layout structure with auto layout, correct color and font type SAP token."

**Layer structure (exact):**
```
Flight Result Card [sapGroup_ContentBackground] [stroke:sapList_BorderColor]
  ├── Zone A — Legs                    (FILL, VERTICAL auto-layout, pad 24/24/20/16)
  │   ├── leg-hinreise                 (FILL, VERTICAL, gap 8)
  │   │   ├── label-row               (FILL, HORIZONTAL, SPACE_BETWEEN)
  │   │   │   ├── section-label       (MediumText/LHAuto/Regular, sapContent_LabelColor)
  │   │   │   └── pin icon            (TEXT placeholder)
  │   │   ├── flight-row              (FILL, HORIZONTAL, gap 8, center-aligned)
  │   │   │   ├── dep-time            (72 Bold 28px, [typo:flightTime], sapTitleColor)
  │   │   │   ├── line-l              (HORIZONTAL, layoutGrow:1, sapList_BorderColor fill)
  │   │   │   ├── dur-pill            (HORIZONTAL, pad 8/3, r:12, sapNeutralBackground)
  │   │   │   │   └── dur-text        (SmallText/LHAuto/Regular, sapContent_LabelColor)
  │   │   │   ├── icon-flight         (SAP flight component instance, 24×24)
  │   │   │   ├── line-r              (HORIZONTAL, layoutGrow:1, sapList_BorderColor fill)
  │   │   │   └── arr-time            (72 Bold 28px, [typo:flightTime], sapTitleColor)
  │   │   └── airport-row             (FILL, HORIZONTAL, gap 8, center-aligned)
  │   │       ├── origin              (H4/Bold 20px, sapTitleColor)
  │   │       ├── Spacer              (HORIZONTAL, layoutGrow:1)
  │   │       ├── stop-link           (MediumText/LHAuto/Regular, sapLinkColor)
  │   │       ├── Spacer              (HORIZONTAL, layoutGrow:1)
  │   │       └── dest                (H4/Bold 20px, sapTitleColor)
  │   ├── Divider                     (FILL, 1px, sapList_BorderColor)
  │   ├── leg-rückreise               (same structure as leg-hinreise)
  │   ├── Divider                     (FILL, 1px, sapList_BorderColor)
  │   └── baggage-row                 (FILL, HORIZONTAL, gap 12)
  │       ├── baggage-item ×3         (HORIZONTAL, gap 4: suitcase icon 16×16 + count text)
  │       └── chevron text
  ├── Divider                         (1px, FILL height, sapList_BorderColor)
  └── Zone B — Price                  (276px FIXED, VERTICAL, pad 20, gap 8, center)
      ├── Actions                     (FILL, HORIZONTAL, MAX-aligned)
      │   ├── icon-share              (SAP action component, 20×20)
      │   └── icon-heart              (SAP heart-2 component, 20×20)
      ├── Spacer
      ├── surcharge                   (72 Bold 18px, [typo:surcharge], sapPositiveTextColor)
      ├── guarantee-row               (HORIZONTAL, gap 4: validate icon 16×16 + text)
      │   ├── icon-validate           (SAP validate component, 16×16)
      │   └── guarantee-text          (MediumText/LHAuto/Regular, sapPositiveTextColor)
      ├── price                       (72 Bold 28px, [typo:priceHeader], sapTitleColor)
      ├── price-sub                   (SmallText/LHAuto/Regular, sapContent_LabelColor)
      ├── Spacer
      └── Select Button               (SAP Button Type=Primary instance, FILL width)
```

**Color tokens confirmed bound:**
- Card fill: `Shell/sapShellColor` (white) ✓
- Card stroke: `List/sapList_BorderColor` ✓
- Dep/arr times: `Text/sapTitleColor` ✓
- IATA codes: `Text/sapTitleColor` ✓
- Stop links: `Link/sapLinkColor` ✓
- Surcharge / guarantee: `Semantic/Text/sapPositiveTextColor` ✓
- Section labels: `Text/sapContent_LabelColor` ✓

**Typography confirmed bound:**
- Section labels: `MediumText/LHAu... · 14/Auto` ✓
- IATA codes: `H4/Bold · 20/Auto` ✓
- Stop links: `MediumText/LHAu... · 14/Auto` ✓
- Guarantee text: `MediumText/LHAu... · 14/Auto` ✓
- Price sub-label: `MediumText/LHAu... · 14/Auto` ✓
- Flight times: LargeText style + 28px override (shows ↺, correct) ✓

**Key learnings for future card builds:**
1. Use `layoutGrow:1` on HORIZONTAL frames as spacers — NOT `primaryAxisAlignItems: SPACE_BETWEEN`
2. Lines between flight times also use `layoutGrow:1` HORIZONTAL frames
3. Stroke binding requires `[stroke:sapToken]` in layer name (new plugin feature)
4. 28px custom sizes: apply SAP style first, then override size — style provides font-family token
5. Baggage items: wrap icon+text in HORIZONTAL auto-layout frame (gap 4)
6. All icon instances: import via `importComponentByKeyAsync`, resize after appending to parent

### 2026-07-14 — yanatest Steps (560:36552) — "Great result!" ⭐ (backfilled 2026-07-16)
User confirmed canonical. Object Page narrow (320px). Backfilled by Loop-D fix — the confirmation predated the enforced ground-truth ledger.

**Confirmed structure + tokens:**
- DynamicPageHeader: title "yanatest" 72 Black 24px `sapObjectHeader_Title_TextColor` #131e29; subtitle "Activity | Activity Number 765" 72 Regular 14px `sapObjectHeader_Subtitle_TextColor` #556b82; padding px-16 (Content_Space_S) py-8; **Title Area itemSpacing=4** (fixes title/subtitle overlap); ~40-52 sublayer hides to strip chrome at 320px.
- IconTabBar: General (Regular Inactive) / Steps (Regular Active, blue 3px underline) — set via `Interaction State` variant, walk TEXT→INSTANCE parent.
- Overflow (…): absolute-positioned IconButton sibling of DPH, x=width-btnW-8, y=10 (never appendChild into DPH instance).
- Dialog Header (cloned 560:36171): "Steps (1)" + Hide Filters (Tertiary) left; Sort + Column Settings (IconButtons) right via SPACE_BETWEEN (no spacer frames).
- List item: 3px success rail fill `sapPositiveTextColor` #256f3a / stroke `sapPositiveElementColor` #30914c; ObjectStatus(Success, sys-enter-2) + title + nav arrow; ObjectAttribute rows (ID/Next/Previous/Hook).
- Confirmed pattern: clone canonical, real SAP instances, SPACE_BETWEEN not spacers, IconTabBar via Interaction State.

### 2026-07-15 — Activities View (615:36810) — "Perfect" ⭐ (backfilled 2026-07-16)
User confirmed canonical. List Report 320px. Backfilled by Loop-D fix.

**Confirmed structure + tokens:**
- DynamicPageHeader (cloned 601:36910): title "Activities View" 72 Black 24px; subtitle "Latest Server Time: 2026-07-08 13:29:43 (UTC)"; overflow (…) absolute sibling top-right.
- Filter Bar: Name (Label+Input), Status (Label+Select "Typed Text" + × clear + + add IconButtons, blue #0064d9).
- Dialog Header: "Activities (6)" left; Sort (↕) + Column Settings (⚙) right.
- 3 List Items (yanatest[selected #ebf8ff]/Validate Instance/Validate System): each 3px green success rail `sapPositiveTextColor` #256f3a.
- **Progress Row (canonical — use exactly):** "Progress:" label + bold "100%" + native green frame `{r:0.118,g:0.561,b:0.337}`=sapPositiveElementColor #30914c, 40×12, cornerRadius=6 + ObjectStatus(Semantic=Success) icon-only (hide all TEXT nodes). DO NOT use SAP ProgressIndicator composite.
- Meta rows: Activity Number 765/426/425, Note (empty), Start Time — Label `sapContent_LabelColor` #556b82 + bold value `sapTitleColor` #131e29, 13-14px.

### 2026-07-16 — Purchase Orders List Report (804:44859) — "This is perfect! Bravo" ⭐
Cloned from canonical Activities View (615:36810), adapted to procurement. Confirmed measurements from get_design_context on list item 804:44882:
- List item selected bg `sapList_SelectionBackgroundColor` #ebf8ff · bottom border `sapList_SelectionBorderColor` #0064d9
- 3px success rail `sapPositiveTextColor` #256f3a
- Item Content: flex-col gap 6 / pad 12 · Entry Header: flex-row gap 8 center · Meta Block: flex-col gap 4 pl 26 text 13
- Meta label `72:Regular` sapContent_LabelColor #556b82 (w60/50/70) + value `72:Bold` sapTitleColor #131e29 (w160/110)
- Entry-header ObjectStatus: Semantic=Warning (Pending) / Success (Approved). Amount row = repurposed Progress row with green bar + row-checkmark hidden.
- Actions = MenuButton Secondary Compact. All real SAP instances (clone-canonical, RULE 28).
