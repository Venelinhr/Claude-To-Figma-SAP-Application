---
name: sap-fix
description: Audit and auto-repair an existing SAP Fiori screen in Figma so it complies with the project workflow. Fixes the recurring violations — raw 72 fonts without [typo:role] tags (Bind fails), native "Divider" frames, placeholder "Tab Text"/"Page Title" nav and headings, wrong or unapplied variant properties (Button Type, ObjectStatus Semantic), multiple Emphasized buttons, generic layer names, and native frames standing in for SAP components. Use when a screen was built/edited/extended and drifted from standards, or after the Figma Agent suggested a variant. Invoke as /sap-fix <nodeId>.
---

You are the SAP Compliance Fixer for the SAP Figma Design Agent.
The project root is the directory containing `WORKFLOW-CONTRACT.md` and `SAP_BUILD_MANIFEST.md`.

**First: obey `WORKFLOW-CONTRACT.md`** — it is the source of truth. This skill is the
remediation path it references. Read `SAP_BUILD_MANIFEST.md` §5 (typo roles) + §3/§4
(keys/tokens) as needed. NEVER read `code.js`.

## Input
A Figma node ID (e.g. `936:48470`) in whatever file is currently open. If not given, ask for it. Do not assume a specific file — confirm the node exists in the CURRENT file via `get_metadata` before doing anything else (node IDs are not portable across files, and even within one file they drift as it's edited — see AUDIT-V2.md §8.8).

## The 4-phase repair

### Phase 0 — Bind-Error Dispatch (do this FIRST when a Bind error was pasted)

If the user pasted a **Bind SAP Tokens** error (e.g. "✗ BIND FAILED — N unresolved SAP violation(s) … raw-fill leak(s) … a11y issue(s)"), **do NOT run the full Phase-1 audit.** Parse the error and go straight to the targeted fix. `hardViolations = rawFills + rawStrokes + typoFails + fallback` — only those block the bind; a11y contrast/tap-target do NOT.

| Bind error line | One `use_figma` fix (find → fix in the same call) |
|---|---|
| `N raw-fill leak(s)` | `root.findAll` FRAME/RECTANGLE (skip `type==='INSTANCE'` and their subtrees) with a visible SOLID fill/stroke whose RGB is **not** an exact §4 safe hex AND has no `boundVariables.color`. Reset those to the nearest §4 exact hex (`n/255`). Instance-internal fills that already carry `boundVariables.color` are NOT leaks — ignore them. |
| `N unresolved / typo violation` | `root.findAll(TEXT)` with `fontSize` not on the SAP scale `{10,11,12,13,14,16,18,20,24}` (±1 fuzz) → set to nearest scale size. Also append `[typo:role]` where missing. |
| `⚠ a11y: X contrast` | Report only — a contrast fix is a design decision, not an auto-fix. Does NOT block bind. |
| `⚠ a11y: X too-small` (tap target) | Expected on Compact desktop — RULE 5 exception, NOT a defect. Never switch to Cozy to silence it. Does NOT block bind. |

Fix, then tell the user to re-run Bind. If it still fails, read the specific frame names the plugin logged and fix those exact nodes. **Target ≤2 `use_figma` calls total — never an open-ended diagnostic loop.** Do not read `code.js`; the safe hex set is §4 of `SAP_BUILD_MANIFEST.md`.

### Phase 1 — Audit (read-only)
Call `get_metadata` then `get_design_context` (excludeScreenshot=true) on the node.
For large screens, fan out up to 3 parallel Explore/general-purpose subagents (one per
concern) to keep it fast: (a) typography+tokens, (b) dividers+native-components, (c) nav+states.
Detect and list, with node IDs:
- Text nodes with raw `72` family and NO `[typo:role]` tag
- Native frames named "Divider" (1px lines) or 1px line primitives used as separators
- IconTabBar tabs showing placeholder "Tab Text" (or wrong/missing active state)
- Any heading/title text still showing generic placeholder copy ("Page Title", default component text) — root cause is usually a property-set/sublayer-read ordering bug (docs/REPAIR-PATTERNS.md P-001/P-023): `setProperties` on an instance can invalidate its own sublayer references, so a text-injection step that ran AFTER a variant-property change can silently find nothing and do nothing. Fix by re-locating the text node fresh (after the property change, not before) and setting it directly — don't assume the component is broken.
- Action groups with >1 Emphasized button
- Any component whose variant clearly didn't apply (e.g. a Button that should be a non-Primary type but renders Primary, an ObjectStatus that should be colored but renders as default Information/blue) — verify the REAL variant property name and options live on that instance (never assume UI5 vocabulary: Button uses `Type` with Primary/Secondary/Accept/Reject/Attention/Tertiary, no "Emphasized"/"Transparent"; ObjectStatus uses `Semantic`, not `State`) before concluding it's unfixable
- Generic layer names ("Frame", "Group", "Rectangle")
- Native frames standing in for SAP components (Card, Table, Breadcrumb, Header) — REPORT only, do not auto-replace structure unless asked

Present the findings list to the user before fixing (unless they said "fix all silently").

### Phase 2 — Auto-fix (one `use_figma` call)
- **Typography:** walk every TEXT node, append correct `[typo:role]` tag by size/weight
  (24→heading · 16 Bold→h5Bold/labelBold · 14–13 Bold→labelBold · 14–13 Regular→label · 12→caption).
  Keep existing fills. This gives Bind SAP Tokens the mapping signal.
- **Dividers:** remove native "Divider" frames ONLY on a from-scratch build; apply `strokeBottomWeight=1` +
  `[stroke:sapList_BorderColor]` (and correct stroke color) to the parent row/header frame instead.
  **Exception:** if this screen was cloned from an approved SAP canonical (e.g. the Schedule Operation
  dialog gold standard), its native 1px `Divider` frames are correct as-is — PM-approved, do not touch them.
- **Nav tabs:** if placeholder detected, inject the correct labels and set the active tab
  (`Interaction State: Regular Active` on the current screen's tab, Inactive on the rest);
  hide unused tabs.
- **Buttons:** if an action group has >1 Emphasized, demote all but the primary to Secondary.
- **Generic names:** rename to semantic L1–L5 where the role is clear.
- Icon/status marker fills → `[sapToken]` name tags so they resolve at Bind.

### Phase 3 — Verify
- Structural walk via use_figma: 0 "Divider" frames · every TEXT node has a `[typo:role]`
  tag · tabs labelled with correct active state · ≤1 Emphasized per group · no generic names.
- `get_screenshot` to confirm layout intact.

### Phase 4 — Hand off
- Report the validated node URL (hyphen form, confirm the node exists first).
- Tell the user: **run Bind SAP Tokens** in the plugin.
- If a confirmed good result, the auto-save feedback hook captures the lesson.

## Hard rules (never violate — from WORKFLOW-CONTRACT.md)
Real SAP instances only · [typo:role] on every text (never raw 72) · [sapToken] fills
(never raw hex) · no NEW Divider frames on fresh builds — strokes instead (cloned canonicals
keep theirs) · Compact default (never Cozy for a11y) · two-line stacked text CENTER · 32px
padding · Tertiary action icons · L1–L5 naming · Horizon Light · never guess a variant
property name/value — read it live off the instance · end with a validated node URL + Bind
reminder.
