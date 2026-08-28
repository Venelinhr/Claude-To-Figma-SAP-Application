# 12 - Flight Result Card

> Screenshot is included in this repo as `12-flight-result-card.png`. This .md is the source of truth — node ID, components, tokens, and layer structure.

**Node ID:** `E083sNBH7JNEOBFrG7Bqge:2:5355`
**File:** `E083sNBH7JNEOBFrG7Bqge`
**Confirmed:** ✅ canonical — user confirmed excellent build (2026-07-13)

---

## Pattern

Two-zone horizontal split card — flight legs on the left, price + CTA on the right.

**Zones:**
- **Zone A (left ~75%):** flight legs (outbound + return), flex-grow connector lines, duration pill, flight icon, stop info
- **Zone B (right ~25%):** price delta badge, guarantee indicator, total price, passenger count, CTA button

---

## Components

| Region | SAP Component | Notes |
|--------|--------------|-------|
| Card container | Native frame | `borderRadius: 8px`, `sapList_BorderColor` border, `sapContent_Shadow1` |
| Flight leg rows | Auto Layout frames | `flex-grow` connector lines keep pill+icon centered |
| Duration pill | Native frame | `borderRadius: 12px`, `sapNeutralBackground` fill |
| Price delta | `ObjectNumber` | Green semantic color for positive delta |
| CTA button | `Button` | Type=Primary, full width in zone B |
| Baggage icons | `◆ICON/suitcase` | 3× baggage, `◆ICON/flight` for airplane |

---

## Key measurements
- Card height: ~200px
- Zone split: ~75% / 25%
- Card radius: 8px
- Connector lines: 1px, `sapList_BorderColor`, `flex-grow: 1`
- Duration pill: `borderRadius: 12px`

---

## Tokens
- Background: `sapBackgroundColor`
- Border: `sapList_BorderColor` (#e5e5e5)
- Shadow: `sapContent_Shadow1`
- Price positive: `sapPositiveColor`
- Price total: `sapTextColor` bold

---

## Layer structure
```
Flight Result Card
├── Left Zone                    L2  region (~75%)
│   ├── Outbound Leg             L3  flight leg row
│   │   ├── Departure Time       L4  ObjectNumber
│   │   ├── Connector Left       L4  1px grow line
│   │   ├── Duration Pill        L4  native frame
│   │   ├── Flight Icon          L4  ◆ICON/flight
│   │   ├── Connector Right      L4  1px grow line
│   │   └── Arrival Time         L4  ObjectNumber
│   ├── Stop Info                L3  text row
│   ├── Divider                  L3  1px separator
│   └── Return Leg               L3  (same as Outbound)
└── Right Zone                   L2  region (~25%)
    ├── Price Delta               L3  ObjectNumber (green)
    ├── Guarantee Badge           L3  ObjectStatus
    ├── Total Price               L3  ObjectNumber (bold)
    ├── Passenger Count           L3  Text
    └── CTA Button                L3  SAP Button Type=Primary
```
