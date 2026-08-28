# QA Certification Agent
## Stage 6.5 — Validate Before Handoff (RULE 21)
## Runs: after Step 6 (JSON spec generated) — before presenting to user

> Pipeline note: the default build path is RULE 25 MCP-first (`use_figma` + plugin bind). This agent's role fits within ANALYZE→PLAN→EXECUTE→VALIDATE→LEARN.

---

## Mission

The QA Certification agent is the post-generation quality gate. It ensures that no spec reaches the user without a full review pass covering SAP UX quality, visual completeness, design system compliance, and a final certification checklist.

This is **not** a passive validator. It is an active repair engine. The user receives the highest-quality specification the system can produce — not merely the first draft.

**Self-repair loop:** If the certification finds ✗ failures, it triggers up to 3 repair passes before presenting to the user. ⚠ warnings are documented but do not block.

**Full v2 architecture:** `docs/V2-REASONING-PIPELINE.md`

---

## Governing Principles

### Zero-Defect Policy

Never present a first draft as the final output. Every generated spec automatically enters this certification pipeline. The objective is to detect, classify, repair, and certify before the user sees the result.

### Design Flexibility & Exception Engine

Before any repair attempt, determine whether the detected "defect" is actually an **intentional exception**. If it is intentional — **preserve it, do not repair it**.

SAP Fiori guidelines are the **default strategy**, not absolute rules. User intent always takes priority.

**Progressive decision strategy — always choose the simplest approach that fulfills the user's objective:**
```
Standard SAP Solution
        ↓
Small, Well-Justified Adaptation
        ↓
Custom SAP-Based Solution
        ↓
Hybrid Solution
        ↓
Fully Custom Solution
```

**Before modifying any non-standard element, ask:**
1. Did the user explicitly request this pattern?
2. Is it present in the reference screenshot/wireframe?
3. Does removing it make the spec less faithful to the user's intent?

If YES to any → treat as intentional exception, **preserve it**.

**Significant deviations must be explained** in the Repair Diff output:
- Which guideline was not followed
- Why a different approach was chosen
- How it better satisfies the user's request
- Any trade-offs the user should be aware of

---

## When to Run

After:
- ✓ Step 6 (JSON spec generated)
- ✓ spec.meta.validationStatus = "pass"
- ✓ `docs/REPAIR-PATTERNS.md` has been read (apply known patterns immediately)

Before:
- Presenting the spec to the user

---

## Step A — Defect vs. Exception Classification ★ MANDATORY BEFORE ANY REPAIR

Every detected issue must be classified before any repair attempt. This is the most important step — it prevents the repair engine from "fixing" intentional design decisions.

### Unintentional Defect → MUST REPAIR

| Defect | Description |
|---|---|
| Wrong SAP component | Not what the spec intended |
| Missing design tokens | Raw hex value used instead of SAP token |
| Incorrect Auto Layout | Direction, gap, padding, or sizing wrong |
| Broken accessibility | No icon+text pairing, wrong contrast, missing label |
| Missing required labels | Text/label prop empty or missing |
| Incorrect parent-child | Component placed in wrong parent container |
| Broken composition | validParents/validChildren rules violated |
| Kit defaults leaking | "Page Title", "Tab Text", "60%", "Product Identifier" still showing |

### Intentional Exception → PRESERVE, DO NOT REPAIR

| Exception | Description |
|---|---|
| Custom layout | User explicitly requested non-standard structure |
| Detached component | Detaching was necessary to achieve the behavior |
| Non-standard floorplan | Chosen for a valid business reason |
| Hybrid SAP composition | Intentionally combining multiple SAP patterns |
| Pixel-faithful reconstruction | Deviations required to match an existing interface |
| Exploratory / experimental | User is prototyping, guidelines are informational |
| Enterprise workflow preserved | Existing workflow maintained per user request |
| Plugin limitation workaround | The "defect" is actually a plugin constraint |

### Decision rule when uncertain

1. Did the user explicitly request this pattern?
2. Is it present in the reference screenshot/wireframe?
3. Does removing it make the spec less faithful to the user's intent?

**YES to any → treat as intentional exception, preserve it.**

---

## Step B — Root Cause Analysis ★ MANDATORY BEFORE REPAIRING A DEFECT

For every confirmed **Unintentional Defect**, classify its root cause into one of 14 categories before attempting repair. This prevents fixing symptoms instead of causes — a wrong-token fix that actually has a wrong component underneath will regress on the next pass.

| # | Category | Typical signals |
|---|---|---|
| 1 | Business interpretation | Wrong entity modeled, wrong workflow represented |
| 2 | Layout planning | Blueprint region proportions wrong |
| 3 | SAP floorplan selection | Wrong floorplan type for the use case |
| 4 | SAP component mapping | Wrong SAP component for the UI element |
| 5 | Component composition | validParents/validChildren violated |
| 6 | Parent-child hierarchy | Component in wrong nesting level |
| 7 | Auto Layout | Direction/gap/padding/sizing wrong |
| 8 | Design tokens | Raw hex, wrong token, token not whitelisted |
| 9 | Typography | Raw fontSize/fontFamily instead of token |
| 10 | Accessibility | Missing icon pairing, wrong contrast, no label |
| 11 | Spatial reconstruction | Column widths/proportions wrong vs. reference |
| 12 | Reference interpretation | UI element misread or misclassified from image |
| 13 | Figma implementation | Correct spec but plugin rendered differently |
| 14 | Plugin limitation | Known gap in plugin renderers (see `docs/PLUGIN-COMPOSED-RENDERER-GAPS.md`) |

### Plugin Limitation special handling

Category 14 (Plugin limitation) is classified as **PLUGIN_LIMITATION**, not SPEC_DEFECT.

- Mark with ⚙ symbol in all outputs
- Skip repair attempts (unfixable in the spec)
- Document the known workaround if one exists
- Never waste any of the 3 repair passes on plugin limitations

---

## Step E — Targeted Repair Taxonomy

Map every confirmed defect's root cause to the correct repair type. Never regenerate the entire spec unless architecture is fundamentally wrong.

| # | Repair Type | When to use |
|---|---|---|
| 1 | Replace component instance | Wrong SAP component selected (root cause 4) |
| 2 | Fix Auto Layout constraints | Direction, gap, padding, sizing wrong (root cause 7) |
| 3 | Correct spacing/padding | Values not matching SAP rhythm (root cause 7) |
| 4 | Replace color with token | Raw hex value found (root cause 8) |
| 5 | Apply typography token | Raw fontSize/fontFamily used (root cause 9) |
| 6 | Repair parent-child relationship | Component in wrong parent (root cause 6) |
| 7 | Correct composition | validParents/validChildren violated (root cause 5) |
| 8 | Replace detached with SAP instance | SAP instance incorrectly detached (root cause 13) |
| 9 | Fix accessibility | Missing icon, wrong contrast, no label (root cause 10) |
| 10 | Fix naming | Non-standard layer/component names |
| 11 | Restore missing label | Text/label prop empty or missing |
| 12 | Resolve sizing/alignment | Width/height incorrect vs. blueprint (root cause 11) |
| 13 | Correct icon format | Not using sap-icon:// URI |
| 14 | Update slot key | Wrong slot name (e.g. "contentt" typo) |
| 15 | Fix validParents violation | Composition rule failure (root cause 5) |
| 16 | Remove orphan node | Node with no meaningful parent |
| 17 | Remove empty container | Frame with no children |

### Full regeneration decision

The agent decides case-by-case. Regeneration is only faster when most of the spec would change:

- Count total distinct components in the spec
- Count components needing **structural** change (not just text/prop fixes)
- If >50% of components need structural change → full regen is likely faster
- If floorplan itself is wrong AND >3 major regions need restructuring → full regen
- If only props/tokens/labels need fixing → always targeted repair (never regen)
- When regenerating: **preserve all validated regions**, only regenerate failing sections

---

## Step H — Pre-flight Spec Lint ★ RUNS FIRST, BEFORE ARTIFACTS 1–6

Before the first QA pass, run a quick lint on the JSON draft. Catches ~40% of common failures in seconds without consuming repair passes:

| Lint rule | What to check | Fix |
|---|---|---|
| DynamicPageTitle heading | Has `slots.heading` with a child `{label:"X"}`? | Replace `props.text` → `label` |
| Table columns | Has `slots.columns` with Column entries? | Add columns slot |
| Dialog footer | Has `slots.footer`? | Add `"footer": []` or footer buttons |
| ObjectStatus icon | Has both `state` AND `icon` props? | Add `"icon":"sap-icon://..."` |
| Title injection | Any Title node with `props.text` instead of `label`? | Move to `label` |
| Raw hex | Any `"#[0-9A-Fa-f]{3,6}"` in spec body? | Replace with SAP token |
| Raw typography | Any `props.fontSize` or `props.fontFamily`? | Use typography token component |
| Kit defaults | `slots.breadcrumbs` absent? `slots.actions` absent? | Add `[]` to suppress |

Lint findings are repaired **before** Artifacts 1–6 run. They are cheap, mechanical fixes.

---

## Artifact 1 — SAP UX Review

Ask: "Would a Senior SAP UX Designer approve this without changes?"

Review each dimension. For every ✗ or ⚠, document the exact spec location and the fix:

| Dimension | Question | How to check |
|---|---|---|
| Spacing | Is internal padding consistent (8/16/24px rhythm for compact)? | Inspect meta.decisions.layout.paddingRationale |
| Typography | Is every visible text node using a typography token (no raw fontFamily/fontSize)? | Check hierarchy for any Text/Label/Title nodes with props.fontSize |
| Density | Is compact density applied throughout? | Check screen.density = "compact" |
| Consistency | Are equivalent elements (all filter labels, all toolbar buttons) using the same SAP component? | Scan hierarchy for mixed patterns |
| Accessibility | Does every ObjectStatus pair icon + text? Does every ProgressIndicator have displayValue? | Search hierarchy for ObjectStatus without both state and icon |
| Responsiveness | Would the layout work at 1280px? | Check column widths in meta.decisions.layout |
| Interactions | Are all interactive elements reachable (buttons have labels, icon-only elements have tooltips)? | Check all Button/IconButton for label or tooltip |

**Output format:**
```
SAP UX REVIEW
───────────────────────────────────────────
Spacing:       ✓ / ⚠ [issue] / ✗ [failure]
Typography:    ✓ / ⚠ / ✗
Density:       ✓ / ⚠ / ✗
Consistency:   ✓ / ⚠ / ✗
Accessibility: ✓ / ⚠ / ✗
Responsiveness:✓ / ⚠ / ✗
Interactions:  ✓ / ⚠ / ✗
───────────────────────────────────────────
```

---

## Artifact 2 — Visual Comparison

Look at the original reference one more time. Compare it against the spec. Check all four categories:

- **Missing:** Elements clearly visible in reference but not present in spec
- **Different:** Present in spec but wrong component, wrong text, wrong state, wrong variant
- **Extra:** In spec but not in reference (potential over-generation)
- **Misplaced:** Present but in wrong parent, wrong slot, wrong order

For each finding, note:
- What is it?
- Where in the reference?
- Where in the spec (spec node ID)?
- Severity: ✗ (must fix) / ⚠ (should fix) / ℹ (minor)

**Output format:**
```
VISUAL COMPARISON
───────────────────────────────────────────
Missing:
  [element] at [region] — [severity]

Different:
  [element]: reference shows [X], spec has [Y] — [severity]

Extra:
  [element] in spec — not visible in reference — [severity]

Misplaced:
  [element] is in [wrong parent] — should be in [correct parent] — [severity]
───────────────────────────────────────────
```

---

## Artifact 3 — Completeness Score + Reference Coverage Map

Express the spec's coverage as a percentage of the reference content. List every item that is not fully covered.

**Calculation:**
- Count distinct visible elements in the reference (from region map)
- Count how many are represented in the spec (either directly or equivalently)
- Score = covered / total × 100

**Threshold guidance (aligned to canonical scale — 2026-07-09):**
- 95–100%: Excellent, present as-is
- 65–94%: Present with a gap note; repair only if the miss is material
- Below 65%: Must repair before presenting

**Output format:**
```
COMPLETENESS SCORE: [N]%
───────────────────────────────────────────
Covered ([N] elements):
  [list of covered items]

Low confidence / not fully covered:
  · [element]: [what's missing or uncertain]
  · [element]: [what's missing or uncertain]
───────────────────────────────────────────
```

### Reference Coverage Map (per-region — target 100% meaningful coverage)

A structured per-region table proving every region of the reference was mapped to a build element.
This is the anti-omission artifact — the #1 real failure is silently dropping a region/element.

```
REFERENCE COVERAGE MAP
─────────────────────────────────────────────────────────────
Region (from reference)      | SAP component(s) built        | Covered?
─────────────────────────────────────────────────────────────
Header / DynamicPageHeader   | DynamicPageHeader + Title     | ✓
Filter bar                   | SearchField + Select ×2       | ✓
Table                        | Table + 8 Columns + rows      | ✓
Status column                | ObjectStatus (4 variants)     | ✓
Footer action                | Button (Type=Primary)         | ✓
[side panel]                 | —                             | ✗ OMITTED — repair
─────────────────────────────────────────────────────────────
Coverage: 5/6 regions = 83% → the ✗ row MUST be repaired or documented as an exception.
```

Rule: every reference region gets a row. Any `✗` is either repaired or logged in the Exception Engine (Step A) with justification. No silent omissions.

---

## Artifact 4 — Architectural Suggestions

Ask: "Can this become better?" Look beyond what was asked. Suggest improvements that a Senior SAP UX Designer or Solution Architect would make.

Focus areas:
- Could navigation be simplified?
- Are there redundant dialogs that could become inline interactions?
- Could filter patterns be standardized?
- Is the information hierarchy optimal?
- Are there reusable components that should be extracted?
- Does the current structure scale (what happens with 10× more data)?

**Output format:**
```
ARCHITECTURAL SUGGESTIONS
───────────────────────────────────────────
1. [Suggestion title]
   Current: [what the spec does]
   Better:  [what to consider instead]
   Why:     [business or UX rationale]

[repeat for each suggestion]
───────────────────────────────────────────
```

---

## Artifact 5 — Design System Compliance

Verify that every design decision in the spec resolves through SAP design system conventions.

**Checks:**

| What | Rule | Check |
|---|---|---|
| Every text node | Must use SAP typography token (Title/Label/Text/FormattedText) | No `props.fontSize` or `props.fontFamily` in spec |
| Every color | Must be from 80-token MANDATORY_TOKENS whitelist | No `#hex` values in spec |
| Every spacing | Must follow SAP density (8px compact / 16px cozy) | meta.decisions.layout.paddingRationale documents this |
| Every icon | Must use `sap-icon://` URI format | Check all icon references |
| Every component | Must be in the registry | Run registry gate check |
| No detached components | Unless explicitly justified in meta.decisions | Check composition.detachReason if any |

**Output format:**
```
DESIGN SYSTEM COMPLIANCE
───────────────────────────────────────────
Typography tokens:   ✓ / ✗ [N violations]
Color tokens:        ✓ / ✗ [N raw hex values]
SAP spacing rhythm:  ✓ / ⚠ [noted deviation]
SAP icons:           ✓ / ✗ [non-sap-icon references]
Registry gate:       ✓ / ✗ [unknown components]
Detached components: ✓ / ⚠ [N detached, each justified?]
───────────────────────────────────────────
```

---

## Artifact 6 — Final Certification Checklist

The complete 20-item checklist. Every item is either ✓ (verified), ⚠ (warning, documented), or ✗ (failure, must repair).

```
FINAL CERTIFICATION
═══════════════════════════════════════════

PRE-GENERATION REASONING (Stage 1.5)
  [✓/⚠/✗] Intent Card produced (who, what, North Star)
  [✓/⚠/✗] Business entities extracted
  [✓/⚠/✗] Screen classified
  [✓/⚠/✗] Reference analyzed (Divide-and-Conquer, region map)
  [✓/⚠/✗] Spatial relationships measured (RULE 18)
  [✓/⚠/✗] Layout blueprint produced
  [✓/⚠/✗] Component planning table produced (confidence per component)
  [✓/⚠/✗] Relationship graph produced
  [✓/⚠/✗] Composition pre-check passed (0 violations)
  [✓/⚠/✗] ASCII wireframe approved by user (RULE 19)

GENERATION
  [✓/⚠/✗] SAP floorplan selected and confirmed (RULE 3)
  [✓/⚠/✗] All components in registry (RULE 1)
  [✓/⚠/✗] All colors from 80-token whitelist (RULE 2)
  [✓/⚠/✗] Typography tokens applied, no raw px
  [✓/⚠/✗] Auto Layout values documented with confidence (RULE 18)
  [✓/⚠/✗] SAP guidelines reviewed per component (RULE 9)
  [✓/⚠/✗] Accessibility: WCAG AA · icon+text pairing · tap targets

POST-GENERATION QA (Stage 6.5)
  [✓/⚠/✗] Visual comparison completed
  [✓/⚠/✗] Completeness score ≥ 90%
  [✓/⚠/✗] Reference Coverage Map — 100% regions mapped (or ✗ rows justified)
  [✓/⚠/✗] Architectural suggestions produced
  [✓/⚠/✗] Design system compliance validated
  [✓/⚠/✗] DESIGN QUALITY SCORE ≥ 95% (see below)

RESULT: [CERTIFIED — ready for plugin build]
        [CERTIFIED WITH WARNINGS — N items for user review]
        [NEEDS REPAIR — N failures, initiating repair pass]
═══════════════════════════════════════════
```

### Design Quality Score — the single consolidated gate (≥95%)

Rolls up the sub-scores that already exist across QA into ONE number, so a screen that passes each
sub-check individually but is weak overall is still caught. Weighted average (0–100):

| Component | Weight | Source |
|---|---|---|
| Reference completeness | 20% | Artifact 3 Completeness Score |
| Reference coverage | 15% | Reference Coverage Map (regions mapped) |
| SAP compliance (tokens/typography/naming) | 20% | Artifact 5 Design System Compliance |
| Component reuse (real SAP instances) | 15% | RULE 1 / RULE 25 conformance |
| Layout accuracy (spacing/alignment) | 10% | Artifact 2 Visual Comparison |
| Accessibility (WCAG AA / tap / pairing) | 10% | §7 validators |
| Canonical similarity (cloned the right pattern) | 10% | canonical-similarity-rubric.md score |

**Gate:** `DESIGN QUALITY SCORE = Σ(component × weight)`.
- **≥95%** → CERTIFIED, present to user.
- **85–94%** → CERTIFIED WITH WARNINGS (list the sub-scores dragging it down).
- **<85%** → NEEDS REPAIR (self-repair loop targets the lowest-weighted-contribution first).

This does NOT replace the existing sub-thresholds (95% pre-build completeness, 65%/80% per-category repair triggers) — it sits on top as the final holistic gate. Cross-ref: `docs/OPERATING-MANIFEST.md` §Success Criteria.

---

## Step D — Self-Repair Loop (upgraded with dependency ordering)

### Preparation: Read REPAIR-PATTERNS.md first

Before attempting any repair, check `docs/REPAIR-PATTERNS.md`.
If the detected failure matches a known pattern → apply the proven fix immediately.
No reasoning required — just apply P-001 through P-010 (and any added since).

### Dependency-ordered repair sequence

Repairs must follow this dependency order. **Never repair downstream issues before upstream ones** — a wrong token fix on top of a wrong component will regress on the next pass:

```
1. Business understanding
2. Screen classification
3. Floorplan
4. Component hierarchy
5. Component selection
6. Layout / spatial
7. Auto Layout
8. Design tokens
9. Typography
10. Accessibility
11. Layer cleanup
```

### The 3-pass repair loop

```
for each ✗ failure (in dependency order):
  1. Classify: Defect or Intentional Exception?
     → Exception: mark [PRESERVED], skip, continue
     → Plugin limitation: mark [SKIPPED ⚙], skip, continue
  2. Identify root cause category (1–14)
  3. Select repair type (1–17)
  4. Apply targeted repair to the spec node
  5. Re-verify that specific check
  6. If still failing: log and continue (will surface in next pass)

Emit Repair Diff after each pass (see Section F)

max repair passes: 3
After pass 3: STOP, present best spec + unresolved issues + confidence score
```

**When to stop and escalate to user:**
- After 3 repair passes with unresolved ✗ failures
- When the failure requires information only the user can provide
- When the fix would significantly change the intended design
- When >50% of components need structural change → recommend full regen instead

---

## Section C — Confidence Scoring

Every QA pass produces a confidence % per category. This **augments** the ✓/⚠/✗ system (doesn't replace it) and drives repair priority.

**Template (populate after each QA pass):**
```
CONFIDENCE SCORES — Pass N
─────────────────────────────────────────────
| Category               | Confidence |
| Business understanding | ___% |
| Floorplan              | ___% |
| SAP components         | ___% |
| Auto Layout            | ___% |
| Design tokens          | ___% |
| Typography             | ___% |
| Accessibility          | ___% |
| Reference coverage     | ___% |
| Overall                | ___% |
─────────────────────────────────────────────
```

**Scoring rules (aligned with Reasoning Brain confidence scale — 2026-07-09):**
- 95–100%: No action needed
- 65–94%: Document, targeted repair only if the finding materially affects usability
- Below 65%: **Mandatory repair pass targeting this category first**
- Overall = weighted average, lowest areas get 3× weight

**Canonical confidence scale (unified across pipeline):**
- **95–100%:** Ship as-is
- **65–94%:** Ship with note; targeted repair optional
- **Below 65%:** Blocking — must resolve before proceeding

This scale applies to: component selection confidence (Reasoning Brain), reference
coverage (QA), individual repair category confidence (QA), and any other
percentage-based quality metric in the pipeline. Formerly QA used 80% as the
repair trigger and Reasoning Brain used 65%; consolidated to 65% (2026-07-09).

---

## Section F — Repair Diff Output

After each repair pass, emit a structured diff of exactly what changed. Every preserved exception and every skipped plugin limitation appears in the diff — full transparency.

**Template:**
```
Repair Pass N — X changes, Y preserved, Z skipped:

  [FIXED]     {component id} — {what changed}: {before} → {after}
  [FIXED]     {component id} — {what changed}: {before} → {after}
  [PRESERVED] {component id} — {why it was kept}: {reason}
  [SKIPPED ⚙] {component id} — Plugin limitation: {gap description}
```

**Example:**
```
Repair Pass 1 — 3 fixed, 1 preserved, 1 skipped:

  [FIXED]     DynamicPageTitle.slots.heading.Title
              props.text → label  (P-001: plugin reads label not props.text)
  [FIXED]     Button id="btn-delayed"
              label prop added (was missing)
  [FIXED]     ObjectStatus id="act1-s"
              state "Positive" → "Success"  (P-002: canonical SAP variant name)
  [PRESERVED] HBox as horizontal rail
              User requested horizontal navigation layout — not a Panel (RULE 16)
  [SKIPPED ⚙] IconTabBar label injection
              Plugin limitation — cannot inject slots.items labels in current build
              Workaround: labels will show after plugin re-import (build 2026-07-09+)
```

---

## Section G — Learning Engine

After each successful repair, record the pattern for future sessions.

**After every repair that holds through subsequent QA passes:**
1. Check `docs/REPAIR-PATTERNS.md` — does this pattern already exist?
2. If YES → update the Confidence level if the fix confirmed it again
3. If NO → add a new pattern entry with all fields populated
4. Update the "Current count" and "Last updated" line at the bottom of REPAIR-PATTERNS.md

**Pattern match logic for next session:**
- Read REPAIR-PATTERNS.md at the start of every QA pass
- For each ✗ failure, scan pattern Triggers
- On match → apply the Fix directly, set confidence to pattern confidence
- This eliminates redundant reasoning for known-good solutions

---

## Example (SAP LaMa Activities Screen)

```
SAP UX REVIEW
───────────────────────────────────────────
Spacing:       ✓ 16px panel padding, 8px gap (SAP compact defaults)
Typography:    ✓ Title/Label/Text components throughout; no raw fontSize
Density:       ✓ screen.density = "compact"
Consistency:   ⚠ Activity row layout varies slightly from message card layout
               (both Panel-based but different Label arrangement)
Accessibility: ✓ All ObjectStatus have icon + text; ProgressIndicator has displayValue
Responsiveness:⚠ 44% sub-detail column may be narrow at 1280px viewport (not tested)
Interactions:  ✓ All Buttons have labels; SegmentedButton items have labels
───────────────────────────────────────────

VISUAL COMPARISON
───────────────────────────────────────────
Missing:  None significant
Different:
  · "Actions ▾" button: spec uses Button; reference shows dropdown → should be MenuButton  ✗
  · Message severity chips: spec uses ObjectStatus; reference shows distinct chip colors
    suggesting InfoLabel or custom Panel → ⚠
Extra:    None
Misplaced:None
───────────────────────────────────────────
ACTION: Repair "Actions ▾" → MenuButton (✗ failure, auto-repair)

COMPLETENESS SCORE: 94%
───────────────────────────────────────────
Covered: ShellBar · MessageStrip · SideNavigation(8 groups, correct expand/select)
         FlexibleColumnLayout · 3×DynamicPage · 3×filter Panel
         Activity rows (3) with ObjectStatus+ProgressIndicator+Labels
         Steps panel with filter+Operation section
         Messages(10) with SegmentedButton(Plain Text/List) + 7 cards

Low confidence:
  · Activity rows: Panel-based (87%); List may be more scalable
  · Message chips: ObjectStatus used; InfoLabel may be more accurate for
    categorical severity labels (Trace/Debug/Information vs. state indicators)
───────────────────────────────────────────

ARCHITECTURAL SUGGESTIONS
───────────────────────────────────────────
1. Message severity → InfoLabel
   Current: ObjectStatus (state=Information/None/Success)
   Better:  InfoLabel (categorical tag, no semantic state)
   Why:     Trace/Debug/Information are categories, not UI states.
            ObjectStatus is for Success/Warning/Error/Information states.
            InfoLabel is the correct component for categorical labels.

2. "Actions ▾" → MenuButton
   Current: Button with text "Actions ▾"
   Better:  MenuButton (spec: type="Default", props: {menu: {items:[...]}})
   Why:     The reference shows a dropdown action menu, not a standalone button.
            MenuButton renders the chevron natively and opens a proper Menu.

3. Activity rows → consider List for scalability
   Current: Panel × 3 (works for 3 rows)
   Better:  sap.m.List with ObjectListItem when data grows past 10 items
   Why:     Panel rows are correct for the current 3-item reference but do not
            scale — a List provides sorting, growing, and selection state natively.
───────────────────────────────────────────

DESIGN SYSTEM COMPLIANCE
───────────────────────────────────────────
Typography tokens:   ✓ All text via Title/Label/Text components
Color tokens:        ✓ 0 raw hex values; 16 tokens, all in 80-token whitelist
SAP spacing rhythm:  ✓ 16px padding, 8px gap documented in meta.decisions.layout
SAP icons:           ✓ All icons use sap-icon:// format
Registry gate:       ✓ All 18 distinct components in registry (152/152 enriched)
Detached components: ✓ 0 detached components
───────────────────────────────────────────

FINAL CERTIFICATION
═══════════════════════════════════════════

PRE-GENERATION REASONING (Stage 1.5)
  ✓ Intent Card produced
  ✓ Business entities extracted (Activity→Step→Message)
  ✓ Screen classified (Monitoring)
  ✓ Reference analyzed (Divide-and-Conquer, region map produced)
  ✓ Spatial relationships measured (28/28/44% columns documented)
  ✓ Layout blueprint produced
  ✓ Component planning table produced (2 low-confidence items noted)
  ✓ Relationship graph produced
  ✓ Composition pre-check passed (0 violations)
  ✓ ASCII wireframe approved by user

GENERATION
  ✓ SAP floorplan selected (master-detail, FCL)
  ✓ All 18 components in registry
  ✓ All colors from 80-token whitelist
  ✓ Typography tokens applied
  ✓ Auto Layout values documented with confidence
  ✓ SAP guidelines reviewed per component
  ✓ Accessibility: WCAG AA throughout

POST-GENERATION QA (Stage 6.5)
  ✓ Visual comparison completed (1 repair applied: Actions→MenuButton)
  ✓ Completeness score: 94%
  ⚠ 2 architectural suggestions (InfoLabel for chips; consider List for rows)
  ✓ Design system compliance validated

RESULT: CERTIFIED WITH WARNINGS
        · 2 architectural suggestions for user review
        · Activity row pattern may need revisiting if data grows
═══════════════════════════════════════════
```
