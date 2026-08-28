# Canonical Node ID Conflicts

**Generated:** 2026-08-28 · **Scope:** `/Users/C5408360/Downloads/sap-pipeline-v2/`
**Status:** REPORT ONLY — no conflicting value in this repo was changed.

This file records every Figma node ID that carries **more than one screen label**, and every
screen label that is claimed by **more than one node ID**. Both directions are a
"clone-the-wrong-node" hazard: `/sap-screen` and the Figma Agent pick a clone target by *name*,
then resolve it to an ID from whichever table they happened to read.

Node IDs are normalised to colon form (`A:B`). `A-B` in a URL is the same node.
`build/`, `*.bundled.js` and `audit-output.md` findings text are excluded as sources of truth.

---

## 1. One node ID → many labels

### `750:174556` — 4 distinct labels

| File | Line | Label as written |
|---|---|---|
| `SAP_BUILD_MANIFEST.md` | 208 | `Yanatest Steps` — "Object Page narrow 320px: DPH + IconTabBar + Filter Bar + List" |
| `skill/references/canonical-index.json` | 276 | `yanatest Steps — Object Page Narrow` |
| `docs/canonical-screens/CANONICAL-SCREENS.md` | 227–228 | `## Screen 07 — yanatest Steps (Object Page narrow)` |
| `CONTRIBUTING.md` | 154 | `Outage List Overview` — "List Report + Filter Bar + Table" |
| `.claude/memory/rule_reuse_approved_screens.md` | 69 | `Activities View (List Report)` — "List Report with progress rows" |
| `docs/canonical-screens/02-schedule-operation-form.md` | 1, 3 | `02 - Schedule Operation Form (Outage List Overview)` |
| `docs/canonical-screens/10-outage-list-overview.md` | 12 | "The Outage List Overview (table view) is actually at node 750:174556 (file 02)." |

Four incompatible readings: **yanatest Steps** / **Outage List Overview** / **Activities View** /
**Schedule Operation Form**.

### `750:174290` — 2 distinct labels

| File | Line | Label as written |
|---|---|---|
| `SAP_BUILD_MANIFEST.md` | 209 | `Schedule Operation — Monthly pattern` — "Dialog with Panel + RadioButton pattern" |
| `.claude/memory/rule_reuse_approved_screens.md` | 72 | `Schedule Op — Monthly` — "Dialog with recurrence pattern" |
| `.claude/skills/sap-screen/SKILL.md` | 104 | `Schedule Operation Monthly` — "Dialog + RadioButton panel" |
| `docs/canonical-screens/CANONICAL-SCREENS.md` | 117–118 | `## Screen 03 — Schedule Operation Form (Monthly pattern)` |
| `CONTRIBUTING.md` | 157 | `Activities View` — "320px mobile: Progress Row pattern" |
| `docs/canonical-screens/05-schedule-operation-monthly.md` | 1, 3 | `05 - Schedule Operation (Monthly) — Activities View` |

### `750:174442` — 3 distinct labels

| File | Line | Label as written |
|---|---|---|
| `SAP_BUILD_MANIFEST.md` | 210 | `Activities View (List Report)` — "List Report + Progress Rows" |
| `skill/references/canonical-index.json` | 304 | `Activities View — List Report with Progress` |
| `skill/references/canonical-similarity-rubric.md` | 34 | `Activities View` — "List Report (narrow)" |
| `docs/canonical-screens/CANONICAL-SCREENS.md` | 271–272 | `## Screen 08 — Activities View (List Report)` |
| `CONTRIBUTING.md` | 158 | `Validate System` — "Floating panel: DPH + message list" |
| `.claude/memory/rule_reuse_approved_screens.md` | 73 | `Schedule Op — Activities` — "List Report variant" |
| `docs/canonical-screens/06-activities-view.md` | 1, 6 | `06 - Activities View (Validate System Log Panel)` |

### `750:174786` — 4 distinct labels

| File | Line | Label as written |
|---|---|---|
| `SAP_BUILD_MANIFEST.md` | 211 | `Schedule Operation — Monthly + End date` — "Fully-expanded dialog state" |
| `skill/references/canonical-index.json` | 107 | `Schedule Operation — Monthly with End Date` |
| `docs/canonical-screens/CANONICAL-SCREENS.md` | 136–137 | `## Screen 04 — Schedule Operation Form (Monthly + End date)` |
| `CONTRIBUTING.md` | 159 | `Schedule Op — State A` — "Card shell: Header + Timing + Footer" |
| `CONTRIBUTING.md` | 165 | "Clone source for confirmation/success screens: `750:174786` (Schedule Op State A — proven card shell)" |
| `.claude/memory/rule_reuse_approved_screens.md` | 74 | `Schedule Op — State B2` — "Dialog variant" |
| `docs/canonical-screens/07-schedule-operation-monthly-end-date.md` | 1, 3 | `07 - Schedule Operation (Monthly + End date) — State A Collapsed` |
| `docs/canonical-screens/09-schedule-operation-form-full.md` | 48 | `A (750:174786) \| 354px \| unchecked \| unchecked` |

**Highest-risk row in the report.** "Fully-expanded" (manifest/index) and "State A Collapsed"
(CONTRIBUTING, doc 07, doc 09) are opposite ends of the same dialog. `rule_reuse` calls it B2.

### `750:174814` — 2 distinct labels

| File | Line | Label as written |
|---|---|---|
| `SAP_BUILD_MANIFEST.md` | 21 | `Log / Message panel \| Validate System — node 750:174814` |
| `SAP_BUILD_MANIFEST.md` | 212 | `Validate System Log Panel` — "Log/message panel, severity pills, SegmentedButton filter" |
| `skill/references/canonical-index.json` | 332 | `Validate System Log Panel` |
| `skill/SYSTEM_PROMPT.md` | 1311 | `750:174814` (Validate System) |
| `skill/references/figma-build-patterns.md` | 39 | `750:174814` Validate System |
| `skill/references/canonical-similarity-rubric.md` | 40 | `Validate System Log` — "Dialog / Log panel" |
| `.claude/memory/rule_29_visual_recovery_protocol.md` | 29 | `Log panel / severity pills \| 750:174814` |
| `.claude/memory/rule_reuse_approved_screens.md` | 75 | `Validate System` — "Log panel, severity pills" |
| `.claude/skills/sap-screen/SKILL.md` | 107 | `Validate System Log` — "Log / message panel" |
| `docs/canonical-screens/CANONICAL-SCREENS.md` | 317–318 | `## Screen 09 — Validate System Log Panel` |
| `CONTRIBUTING.md` | 160 | `Schedule Op — State B` — "+ Recurrence + Monthly Pattern" |
| `docs/canonical-screens/08-validate-system-log-panel.md` | 1, 6 | `08 - Validate System Log Panel — Schedule Operation State B (Recurring Monthly)` |
| `docs/canonical-screens/09-schedule-operation-form-full.md` | 49 | `B (750:174814) \| 556px \| checked + monthly \| unchecked` |
| `docs/canonical-screens/11-design-system-governance-fcl.md` | 44 | `B (Monthly) \| 750:174814 \| Monthly \| Monthly pattern box` |

### `750:174866` — 3 distinct labels

| File | Line | Label as written |
|---|---|---|
| `SAP_BUILD_MANIFEST.md` | 213 | `Schedule Operation Form (base)` — "Collapsed dialog base state" |
| `skill/references/canonical-index.json` | 136 | `Schedule Operation — Full / Collapsed` |
| `docs/canonical-screens/CANONICAL-SCREENS.md` | 153–154 | `## Screen 05 — Schedule Operation Form (full / collapsed)` |
| `CONTRIBUTING.md` | 161 | `Schedule Op — State C` — "+ End Date fields" |
| `.claude/memory/rule_reuse_approved_screens.md` | 76 | `Schedule Op — State D` — "Dialog end-date variant" |
| `docs/canonical-screens/09-schedule-operation-form-full.md` | 1, 3 | `09 - Schedule Operation Form (Full) — State C (Recurring + End Date)` |
| `docs/canonical-screens/09-schedule-operation-form-full.md` | 50 | `C (750:174866) \| 632px \| checked + monthly \| checked + fields` |
| `docs/canonical-screens/11-design-system-governance-fcl.md` | 45 | `C (Monthly+End) \| 750:174866 \| Monthly \| Monthly pattern box + end date` |

"Collapsed base state" vs "State C fully expanded 632px" vs "State D" — three incompatible readings.

### `750:174925` — 2 distinct labels

| File | Line | Label as written |
|---|---|---|
| `SAP_BUILD_MANIFEST.md` | 22 | `Desktop List Report \| Outage List — node 750:174925` |
| `SAP_BUILD_MANIFEST.md` | 214 | `Outage List Overview` — "Desktop List Report, status pills, inline filter bar" |
| `skill/references/canonical-index.json` | 169 | `Outage List Overview` |
| `skill/references/canonical-similarity-rubric.md` | 21, 35, 49 | `Outage List Overview` — "List Report (desktop)" |
| `skill/SYSTEM_PROMPT.md` | 1312 | `750:174925` (Outage List) |
| `skill/references/figma-build-patterns.md` | 40 | `750:174925` Outage List |
| `skill/references/delta-spec-schema.json` | 11, 104 | `baseCanonical: "750:174925"` (Outage List example) |
| `.claude/skills/sap-figma-agent/SKILL.md` | 122, 184 | `List Report` / `Desktop List Report — Outage List` |
| `.claude/skills/sap-screen/SKILL.md` | 105 | `Outage List Overview` — "Desktop List Report" |
| `.claude/memory/rule_reuse_approved_screens.md` | 77 | `Outage List Overview` — "Desktop List Report, 8 columns" |
| `docs/canonical-screens/CANONICAL-SCREENS.md` | 357–358 | `## Screen 10 — Outage List Overview` |
| `CONTRIBUTING.md` | 162 | `Schedule Op — State D` — "End date only" |
| `docs/canonical-screens/10-outage-list-overview.md` | 1, 3 | `10 - Outage List Overview / Schedule Operation Form (End-Only State D)` |
| `docs/canonical-screens/09-schedule-operation-form-full.md` | 51 | `D (750:174925) \| 430px \| unchecked \| checked + fields` |

A 1440px desktop List Report and a 430px dialog state cannot be the same node.

### `750:174960` — 4 distinct labels

| File | Line | Label as written |
|---|---|---|
| `SAP_BUILD_MANIFEST.md` | 215 | `Design System Governance (worklist)` — "Worklist variant" |
| `skill/references/canonical-index.json` | 198 | `Design System Governance — FCL Variant` |
| `docs/canonical-screens/CANONICAL-SCREENS.md` | 402–403 | `## Screen 11 — Design System Governance (Worklist variant)` |
| `CONTRIBUTING.md` | 163 | `Schedule Op — State B1` — "Hourly recurrence" |
| `.claude/memory/rule_reuse_approved_screens.md` | 78 | `Schedule Op — State E` — "Dialog final state" |
| `docs/canonical-screens/11-design-system-governance-fcl.md` | 1, 3 | `11 - Design System Governance (FCL) — Schedule Operation Hourly (State B1)` |
| `docs/canonical-screens/11-design-system-governance-fcl.md` | 46 | `B1 (Hourly) \| 750:174960 \| Hourly \| No pattern box` |

Note "Worklist variant" vs "FCL Variant" is a second, independent disagreement inside the
governance reading.

### `727:42563` — 2 distinct labels

| File | Line | Label as written |
|---|---|---|
| `SAP_BUILD_MANIFEST.md` | 20 | `Dialog / Form \| Schedule Operation — node 727:42563` |
| `SAP_BUILD_MANIFEST.md` | 195 | `Schedule Operation Dialog (PERFECT)` — "⭐ Define/Schedule/recurrence dialog … **full recurrence**" |
| `SAP_BUILD_MANIFEST.md` | 207 | `Schedule Operation — dialog (PERFECT)` — "Dialog / Form, **full recurrence** + SegmentedButton" |
| `.claude/memory/rule_reuse_approved_screens.md` | 71 | `Schedule Op — dialog` — "Dialog/form, date+time, **full recurrence**" |
| `.claude/skills/sap-screen/SKILL.md` | 103 | `Schedule Operation dialog (PERFECT)` |
| `docs/canonical-screens/CANONICAL-SCREENS.md` | 79–80 | `## Screen 02 — Schedule Operation Form (Daily)` |
| `skill/references/canonical-index.json` | 71 | `Schedule Operation — **Daily**` |

"Full recurrence" and "Daily" are different dialog states. `canonical-index.json` also points this
entry's `specFile` at `docs/canonical-screens/02-schedule-operation-form.md`, whose own declared
Node ID is `750:174556` — the index entry and its spec file name two different nodes.

---

## 2. One label → many node IDs (reverse direction)

This is the direction that produces the "which is the dialog gold standard?" question. **Four
disjoint node families carry the same Schedule state names.**

| Label claimed | Node IDs claiming it | Sources |
|---|---|---|
| **Dialog gold standard / clone source** | `727:42563` · `448:162293` · `9:1550` · `750:174290` | `SAP_BUILD_MANIFEST.md:20,128,207` · `CLAUDE.md:356` · `CLAUDE.md:132` (default anchor) · `.claude/memory/rule_reuse_approved_screens.md:72` |
| **Schedule Op — State A** | `9:1470` · `448:162213` · `750:174786` | `SAP_BUILD_MANIFEST.md:170` · `.claude/skills/sap-figma-agent/SKILL.md:178,231` · `CONTRIBUTING.md:159` |
| **Schedule Op — State B** | `9:1498` · `750:174814` | `docs/canonical-screens/COMPLEX-SCREENS-CATALOG.md:16` · `CONTRIBUTING.md:160` |
| **Schedule Op — State B1 (Hourly)** | `448:162391` · `750:174960` | `.claude/skills/sap-figma-agent/SKILL.md:179,232` · `CONTRIBUTING.md:163` |
| **Schedule Op — State B2 (Daily)** | `9:1696` · `750:174786` | `SAP_BUILD_MANIFEST.md:171` · `.claude/memory/rule_reuse_approved_screens.md:74` |
| **Schedule Op — State C (End Date)** | `9:1550` · `448:162293` · `750:174866` | `SAP_BUILD_MANIFEST.md:172` · `CLAUDE.md:356`, `.claude/skills/sap-figma-agent/SKILL.md:177,233` · `CONTRIBUTING.md:161` |
| **Schedule Op — State D (End only)** | `9:1609` · `448:162352` · `750:174866` · `750:174925` | `SAP_BUILD_MANIFEST.md:173` · `.claude/skills/sap-figma-agent/SKILL.md:180,234` · `.claude/memory/rule_reuse_approved_screens.md:76` · `CONTRIBUTING.md:162` |
| **yanatest Steps** | `560:36552` · `750:174190` · `750:174556` | `SAP_BUILD_MANIFEST.md:18,188`, `CLAUDE.md:273` · `CONTRIBUTING.md:156`, `CLAUDE.md:231`, `docs/canonical-screens/04-schedule-operation-daily.md:5,8` · `SAP_BUILD_MANIFEST.md:208` |
| **Activities View** | `68:2928` · `615:36810` · `750:174290` · `750:174442` · `750:174556` | `SAP_BUILD_MANIFEST.md:166` · `SAP_BUILD_MANIFEST.md:17,187`, `CLAUDE.md:271` · `CONTRIBUTING.md:157` · `SAP_BUILD_MANIFEST.md:210` · `.claude/memory/rule_reuse_approved_screens.md:69` |
| **Outage List Overview** | `30:2741` · `750:174556` · `750:174925` | `SAP_BUILD_MANIFEST.md:168`, `docs/canonical-screens/COMPLEX-SCREENS-CATALOG.md:54` · `CONTRIBUTING.md:154` · `SAP_BUILD_MANIFEST.md:214` |
| **Validate System (Log Panel)** | `42:2348` · `750:174442` · `750:174814` | `docs/canonical-screens/COMPLEX-SCREENS-REFERENCE.md:10` · `CONTRIBUTING.md:158` · `SAP_BUILD_MANIFEST.md:212` |
| **Side Navigation** | `68:3262` · `750:174158` | `docs/canonical-screens/COMPLEX-SCREENS-REFERENCE.md:10` · `CONTRIBUTING.md:155`, `skill/references/canonical-index.json:245` |

### The four families

| Family | Range | Where it is treated as canonical |
|---|---|---|
| **`9:1xxx`** | `9:1470` `9:1498` `9:1550` `9:1609` `9:1696` | `SAP_BUILD_MANIFEST.md:168-173` · `docs/canonical-screens/COMPLEX-SCREENS-CATALOG.md:15-19` · `CLAUDE.md:132` (default dialog anchor) · `skill/references/figma-build-patterns.md:582,586,589,590` |
| **`448:162xxx`** | `448:162213` `448:162293` `448:162352` `448:162391` | `.claude/skills/sap-figma-agent/SKILL.md:124,177-180,231-234` · `CLAUDE.md:356` |
| **`750:174xxx`** | `750:174158` … `750:174960` | `SAP_BUILD_MANIFEST.md:208-215` and `skill/references/canonical-index.json` treat these as **distinct screens**; `CONTRIBUTING.md:154-163` treats the same IDs as **Schedule dialog states** |
| **`30/42/68/560/615:xxxxx`** | `30:2741` `42:2348` `68:2578` `68:2928` `68:3262` `560:36552` `615:36810` | `SAP_BUILD_MANIFEST.md:17,18,166,168,187,188` · `CLAUDE.md:271,273` · `skill/references/canonical-similarity-rubric.md:34-37` · `docs/canonical-screens/COMPLEX-SCREENS-REFERENCE.md:10` |

---

## 3. Pattern behind the conflict

`CONTRIBUTING.md:154-163` and `SAP_BUILD_MANIFEST.md:208-215` list the **same eight `750:174xxx`
IDs in the same order** but with two completely different name sets. Every
`docs/canonical-screens/NN-*.md` file carries a **dual title** (e.g.
`06 - Activities View (Validate System Log Panel)`, `10 - Outage List Overview / Schedule
Operation Form (End-Only State D)`), which is the signature of a rename that was applied to the
filenames but never reconciled with the tables.

`CLAUDE.md:231` records that one such conflict (`750:174190`) was resolved against live Figma on
2026-07-21 and claims "All docs corrected" — but `750:174556` still carries four labels, so that
correction pass was incomplete.

`audit-output.md:111,222,305` already flagged this as a **[High]** finding and proposed generating
the prose tables from `skill/references/canonical-index.json` plus a
`build/check-reuse-integrity.js` drift guard. That guard exists at
`build/check-reuse-integrity.js` but does not cover
canonical-index ↔ CANONICAL-SCREENS ↔ manifest ↔ CONTRIBUTING node IDs.

---

## RESOLUTION NEEDED — requires checking live Figma

Nothing above can be resolved from the repo alone: every candidate is asserted by at least one
file, and the files contradict each other symmetrically. **Do not pick a winner from this
document.**

To resolve, open file `p7zm5EMBk5DRRZdxNeJ4f5` (and `E083sNBH7JNEOBFrG7Bqge` for the `9:1xxx`
family) and read the live frame name for each ID:

1. **Resolve the eight `750:174xxx` IDs first** — `750:174290`, `750:174442`, `750:174556`,
   `750:174786`, `750:174814`, `750:174866`, `750:174925`, `750:174960`. These carry the most
   labels and drive `CONTRIBUTING.md` vs `SAP_BUILD_MANIFEST.md`.
2. **Decide which family is the live Schedule dialog gold standard** — `9:1xxx`, `448:162xxx`, or
   `750:174xxx`. `CLAUDE.md:132` (anchor `9:1550`) and `CLAUDE.md:356` (clone `448:162293`)
   currently disagree inside the same file.
3. **Confirm `727:42563`** — "full recurrence" (manifest) or "Daily" (canonical-index).
4. **Confirm yanatest Steps** — `560:36552`, `750:174190`, or `750:174556`.
5. **Check whether the `30/42/68/560/615` family still exists** or is superseded; several entries
   are dated "confirmed Jul 14".

Once the live names are known:

- Make `skill/references/canonical-index.json` the single source of truth.
- Regenerate the tables in `SAP_BUILD_MANIFEST.md`, `CONTRIBUTING.md`, `CANONICAL-SCREENS.md`,
  `.claude/memory/rule_reuse_approved_screens.md` and `.claude/skills/*/SKILL.md` from it.
- De-duplicate the `docs/canonical-screens/NN-*.md` dual titles.
- Extend `build/check-reuse-integrity.js` to fail when any two files give one node ID two labels,
  or one label two node IDs.
