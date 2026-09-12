---
name: rule-29-visual-recovery-protocol
description: "RULE 29 (2026-07-16): When Claude is lost/wrong/guessing — STOP, read the .fig file + reference PNGs, extract ground truth, then build once correctly."
metadata:
  type: feedback
  node_type: memory
---

# RULE 29 — Visual Recovery Protocol

**Triggers:** output is wrong · guessing a component/token/layout · user says "wrong/fix this/not SAP" · native frames appeared · 3rd+ iteration

## The 5 steps
```
1. STOP. No retry. No guess.
2. get_design_context on closest canonical node (table below)
3. Read reference PNG from docs/canonical-screens/
4. Extract: component names, slot frames, token names, layer structure
5. Build ONCE from ground truth — clone canonical, never from scratch
```

## Canonical lookup — resolve by NAME + WIDTH, never by the hint id

⛔ Recovery is exactly when a wrong id does the most damage. Find the node live and assert it:
```js
const [src] = figma.currentPage.findAll(n => n.name === "Outage List Overview" && Math.abs(n.width - 1440) <= 2);
```
Assert `src.name` and `src.width` before `.clone()`. Ids are hints and have drifted — `750:174925` is live a 560×430 `Schedule Operation` dialog, not the Desktop List Report; `750:174814` is `State B Recurring`, not the log panel. Contract: `skill/references/canonical-index.json` → `resolution`. See AUDIT-V2 §8.4 (P10).

| Building | Name to resolve | Width | Hint id (verify before use) |
|---|---|---|---|
| List Report / progress rows | Activities View | 320 | `615:36810` |
| Object Page narrow / DPH / IconTabBar | yanatest Steps | 320 | `560:36552` |
| SideNavigation | SideNavigation | 260 | `699:37890` |
| Dialog / Form | Schedule Operation | 560 | `727:42563` |
| Log panel / severity pills | Validate System | 678 | `750:174442` |
| Desktop List Report | Outage List Overview | 1440 | `750:174556` |
| FCL + SideNav + Table | Governance Console | 1440 | `750:177443` |

## The .fig file (ground truth)
`docs/canonical-screens/Claude to Figma SAP Application.fig`
Ships with the repo. This file overrides ALL other pattern references.

[[feedback_sap_build_methodology]] [[reference_canonical_sap_screens_750]]
