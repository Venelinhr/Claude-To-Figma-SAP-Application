# SAP Figma Design Agent — Session Start Instructions

**READ THIS FILE AT THE START OF EVERY SESSION.**

> ## 📚 DOC AUTHORITY HIERARCHY (resolves the "5 single-source-of-truth" conflict — 2026-07-21)
> Each doc is authoritative for ONE scope. No doc is "the" single source of everything. On any conflict, resolve by scope:
> | Scope | Authoritative source |
> |---|---|
> | The WORKFLOW (what to do, in what order, which rules/skills apply) | `WORKFLOW-CONTRACT.md` |
> | Gate ORDER + PASS/FAIL semantics | `skill/SYSTEM_PROMPT.md` gate sequence |
> | Build DATA (component keys, token hexes, canonical clone nodes, name-tags) | `SAP_BUILD_MANIFEST.md` |
> | WHERE any rule lives (a map, never restates rules) | `docs/OPERATING-MANIFEST.md` |
> | Component / token / variant / icon truth | the live SAP Web UI Kit (RULE 23) |
> | Canonical screen structure/patterns to clone | the gold-standard `.fig` nodes (SAP_BUILD_MANIFEST §3b) |
> This file (CLAUDE.md) declares the hierarchy and is always loaded. When two docs seem to conflict, pick by scope above — they are not competing, they are scoped.

> ⛔⛔⛔ **HARD RULE — REFERENCE IMAGE = MANDATORY WIREFRAME FIRST (format updated 2026-07-22)**
> Whenever the user attaches a reference image (any image, screenshot, sketch, wireframe),
> you MUST run the full Gate 0→3 pipeline and show ALL FOUR MANDATORY SECTIONS in this exact order BEFORE writing anything else:
>
> **1. Gate 0 — VDI Sector Analysis TABLE** (`| Zone | Content | SAP Component | Key properties |` — every visible zone A/B/C… mapped to a real SAP component)
> **2. Floorplan recommendation TREE** (use `sap.x.ComponentName` tree notation with `└─ ├─ │` branch characters for THIS artifact specifically — not L1–L5 prefixes. Show every component, container, and relationship. This is a separate artifact from #4's layer tree, not an alternative to it — SYSTEM_PROMPT.md's Gate 3 still requires the L1–L5 layer tree there.)
> **3. Confidence table** (`| Area | Conf.% | Notes |` — all major areas rated with % and a concrete note)
> **4. ASCII wireframe + L1–L5 layer tree** (full box-drawing layout, per SYSTEM_PROMPT.md Gate 3/RULE 19 — see there for the canonical definition)
>
> Then Gate 1 (clone/build), Gate 2 (width), HARD STOP waiting for approval.
> No exceptions — not for clones, not for "same screen", not for "obvious" layouts.
> EVERYTIME. User confirmed 2026-07-22: "Hard rules! EVERYTIME!!!!!!"
> Enforced by `enforce-wireframe-first.sh` (UserPromptSubmit hook, fires on every image reference).

> ⛔ **BEFORE ANY Figma SAP task — new screen, improvement, next step, edit, or variant —
> READ AND OBEY `WORKFLOW-CONTRACT.md` (project root).** It is the single mandatory source
> of truth linking all 31 rules + 10-step flow + hard rules + skills + lessons. Analyze the
> source screen first; use only real SAP components/tokens/text-styles. Applies to follow-up
> edits and "improve this" requests too — repair existing screens with `/sap-fix <nodeId>`.

---

## ⛔⛔⛔ HARD RULE — ADAPTIVE EXECUTION + FAIL-TWICE-THEN-SWITCH (2026-07-22, Performance Recovery)

**Target every build: 3–5 min / ≤10–12k tokens at the SAME quality. Prioritize reuse, but never get blocked by it.**

- **Stage 1 (bounded reuse search, single pass):** score canonical/gold-standard once; if the reference image was analyzed before, LOAD `semantic-models/<hash>.md` instead of re-running the ~14k VDI pass.
- **Stage 2 (decision point):** clone viable → clone + inject only what changes (don't rebuild unchanged sections). Clone blocked (missing keys · invalid overrides · instance-parent errors · no canonical) → **stop cloning, switch to controlled rebuild**.
- **Stage 3 (controlled rebuild, deterministic top-down):** Shell → Header → Nav → Toolbar → Filters → containers → content → tables/cards/forms → dialogs → footer → spacing. One section fully before the next.
- **⛔ FAIL-TWICE-THEN-SWITCH:** if the SAME `use_figma` op fails twice, STOP, record why, switch strategy. NEVER a 3rd identical retry.
- **Verify by TEXT, not screenshots:** fold QA into the build call's return (counts, instance/native ratio, unbound-hex). ONE screenshot only at final hand-off. Screenshots are the biggest per-call token cost.
- **Small edit on an existing screen = short-form gate** (one-line change summary + confirm), NOT the full VDI table + tree + confidence + ASCII. Full Gate 0→3 is for genuinely NEW screens / new reference images only.

Root causes this rule fixes (from the 2026-07-22 performance audit): re-approval treadmill, full-artifact regeneration on edits, VDI re-derivation, clone→screenshot→fix loops, double-registered hooks. See `docs/PERFORMANCE-RECOVERY.md`.

---

## ⭐ SKILLS — INVOKE THESE, NOT RAW INSTRUCTIONS

**Launch Claude from THIS project folder first** (so all hooks are active) — in the terminal, never by pasting into Claude:
```bash
"/Users/C5408360/Downloads/sap-pipeline-v2/bin/sap-v2"
```
The first turn must print `✅ SAP pipeline v2 — project hooks ACTIVE`. No line = no gates (AUDIT-V2 §1.1).
Before writing any build code: `bash build/gate-status.sh` — every precondition on one screen (AUDIT-V2 P0').

| Skill | Command | When to use |
|---|---|---|
| **Build new SAP screen** | `/sap-screen <image> <Figma URL>` | Any new screen from reference image or description |
| **Repair existing screen** | `/sap-fix <nodeId>` | Fix bind errors, native frames, raw hex, wrong typo tags |
| **Validate spec JSON** | `/sap-spec-validate` | Before pasting spec into plugin |
| **Update registry** | `/sap-registry-update <ComponentName>` | Fix variant props, add slots, correct tokens |
| **Figma Agent skill** | See setup below ↓ | SAP designer inside Figma's AI Agent (NOT a Claude Code command) |

**`/sap-screen` encodes ALL 31 rules.** It enforces: dark-ref→build-light, real SAP instances only, wireframe hard gate, L1-L5 naming, 32px padding, no NEW Divider frames (cloned canonicals keep theirs), no spacer frames, Compact always, one Primary button, FILL after appendChild, validated URL at end.

---

## 🤖 FIGMA AGENT SETUP (v3 Kit-Native — 2026-07-22)

The Figma AI Agent becomes a trained SAP Fiori Product Designer when the skill and design system are correctly loaded. **Both steps are required every session.**

### Step 1 — Load the skill
1. Open the **Agent** panel in Figma (AI chat icon in the toolbar)
2. Click the **`+`** button → **Skills**
3. If `sap-figma-agent` is already listed → verify it is **v3** (274 lines, last updated 2026-07-22). If outdated → update.
4. If not listed → click **Add Skill** → upload `.claude/skills/sap-figma-agent/SKILL.md` from this repo
5. The skill is now active for all Agent requests — no slash command needed

### Step 2 — Attach the SAP Web UI Kit as a Library
1. In the Agent panel, click **`+`** → **Libraries**
2. Select **SAP Web UI Kit** ✓ (must show a checkmark)
3. Also verify: **Created in this file** ✓

> **Why both are required:** The skill provides the *methodology, rules, and canonical references*. The Kit provides the *live component palette, tokens, and variants*. Without the Kit, the Agent will use inlined data (stale). Without the skill, the Agent has no SAP design reasoning or hard rules.

### Step 3 — Verify it's working
Ask the Agent: *"What SAP floorplan should I use for a screen that lets users browse and filter a list of purchase orders?"*
Expected: It should answer "List Report" with a rationale from the SAP methodology — not guess "Dialog" or "Form".

### Skill update rule
**Whenever any rule, canonical node, token, or methodology changes → re-upload `.claude/skills/sap-figma-agent/SKILL.md` to Figma.** The Agent only knows what is in the skill file. Stale skill = wrong output.

### What the Figma Agent can do (v3)
- ✅ Build screens using real SAP Web UI Kit components from the Assets panel
- ✅ Follow SAP Fiori methodology (floorplan decision rules, X-not-Y composition)
- ✅ Clone approved canonical compositions as base, then adapt
- ✅ Present wireframe + VDI analysis before building (Gate 0→3)
- ✅ Suggest SAP-reasoned variants when asked to re-order/improve a screen
- ✅ Detect and fix violations (native frames, wrong layer names, missing token tags)
- ❌ Cannot run the Bind plugin (that requires Claude Code + `/sap-screen`)
- ❌ Cannot run `verify-invariants.js` — use Claude Code for post-build verification

---

This project converts business requirements into real SAP Fiori screens in Figma using a **v2 AI SAP Solution Architect pipeline** with **8 MCP servers** (5 official + 3 custom), a **152-component registry** (100% enriched), **155 guideline JSONs** (100% coverage), a Figma plugin enforcing an **81-token SAP semantic whitelist** and 4 §7 accessibility validators (run on BOTH build paths), and a reasoning pipeline governed by **31 mandatory RULEs**, **9 specialized agents**, and **8 canonical doctrine docs**.

> **Last updated: 2026-07-22** — COMPREHENSIVE BUILD SESSION: deep pipeline audit (10 critical fixes, 5 new guards), SSOT "generate-don't-duplicate" system, architect-first reasoning gate (Gate 0.5), mandatory Gate 0→3 format (VDI table + floorplan tree + confidence table + ASCII), placement hard rule (beside not below), and gold-standard design-reasoning study. **Skills + hooks complete audit (2026-07-22 evening):** `/sap-screen` skill created with all 31 rules; `~/.claude/settings.json` now has all 5 hook events (SessionStart×4, UserPromptSubmit×4, Stop×4, PreToolUse×9, PostToolUse×4) — requires Claude Code restart to activate. Local commits ahead: `66f363f` and back to `3118bb9` (8 commits, not pushed). All gaps confirmed closed. Previous (2026-07-21): S807–S816 audit arc on both remotes at `b9d717e`. ⛔ Figma Plugin v2 OUT of GitHub — local branch `agent-v2-wip`.

## ⛔ THE CANONICAL GATE SEQUENCE (authoritative build order — top of skill/SYSTEM_PROMPT.md)

Every SAP build follows this order; each gate is PASS/FAIL and BLOCKS on fail (exit 2). Gates load at session launch.

> **Authoritative numbering = `skill/SYSTEM_PROMPT.md` gate sequence (Gate 0→7).** The list below mirrors it 1:1 and adds only the enforcing hook per gate — it never renumbers. If this ever disagrees with SYSTEM_PROMPT, SYSTEM_PROMPT wins (per the DOC AUTHORITY HIERARCHY above).

```
Gate 0 Analyze reference (VDI)
Gate 0.7 SELECT & RECORD canonical reference → record-reference.js  [guard-reference-gate.sh]  ⛔ HARD BLOCK — no build until a scored reference is committed
Gate 1 SEARCH CANONICAL FIRST → clone if a match exists   [guard-reuse-gate.sh]  ⛔ build-from-scratch forbidden if canonical exists
Gate 2 Measure width
Gate 3 ASCII wireframe + L1–L5 layer tree → USER APPROVAL  [guard-wireframe-gate.sh]  ⛔ HARD STOP
Gate 4 Verify SAP keys + library + manifest not drifted    [guard-manifest-drift.sh]  ⛔ fail-closed, never createFrame
Gate 5 Build (real SAP instances / clone canonical)        [guard-figma-code.sh]  ⛔ blocks native-frame wireframe pre-build
Gate 6 Verify invariants — tokens bound + zero native frames + layer naming (post-build tree walk)  [verify-invariants.js]  ⛔ fix or STOP
Gate 7 Hand off ONLY if verify.json overallPass:true — validated URL + Bind SAP Tokens  [lint-on-stop.sh]  RULE 27
```

> **Gate 0.7 — Canonical Reference Selection (2026-07-23):** the single highest-leverage decision. Before any build, SELECT the gold reference to clone and RECORD it: `node build/score-canonical.js …` → pick → READ the chosen node live first (use_figma: name + width) → `node build/record-reference.js --node "<id>" --name "<live name>" --score <n> --rationale "…" --effort "…"` → assert `src.name` in the clone code. (2026-09-02: the index's "Outage List Overview" id `750:174925` is "Schedule Operation — State D" in the live file — a clone by id would have built a list report from a dialog. Ids drift; names + widths read live do not.) `guard-reference-gate.sh` hard-blocks the build until `.reference-selected` exists (score ≥60), or — if nothing scores ≥60 — until the recorded low score is paired with `.scratch-approved` (user OK for from-scratch). **The curated gold fallback set + default anchor (`9:1550` for dialogs) live in memory: `reference_gold_standard_screen_set.md` (13 nodes).** Picking the right reference here is what prevents the wizard-style 35k-token cascade. See `docs/superpowers/specs/2026-07-22-gate0-canonical-reference-selection-design.md`.

The 5 invariants: (1) zero native frames, (2) zero raw hex, (3) zero non-SAP typography, (4) clone-first when a canonical exists, (5) fail-closed on any SAP resource error. Approval markers (`.wireframe-approved`, `.scratch-approved`) are written ONLY by the user's own words (capture-approvals.sh) — Claude cannot self-echo them to skip a gate. If a gate blocks you, READ its stderr for the exact missing step.

## SAP Web UI Kit is the single source of truth (RULE 23)

The **SAP Web UI Kit** (Figma file `SILcWzK5uFghKun9jx6D7c`) is the ONLY source of truth for components, properties, tokens, variables, variants, AND icons. Never invent or guess any of them — verify against the kit. Variant property names/options must be read from the live kit, NOT assumed from UI5 vocabulary:
- ObjectStatus uses `Semantic` not `State`
- Button `Type` = Primary/Secondary/Accept/Reject/Attention/Tertiary — NO Emphasized/Transparent
- ObjectStatus `Form Factor` = Compact/Cozy only — `State` prop does not exist

---

## What This Project Is

> **The execution order is THE CANONICAL GATE SEQUENCE** defined at the top of
> `skill/SYSTEM_PROMPT.md` (Gate 0 → Gate 7). That is the single authoritative
> order. The diagram below shows the overall flow; the gate sequence governs
> *when* each step runs and *what stops the build*.

```
Requirement (Jira ticket / user story / screenshot)
    ↓
GATE 0  Analyze reference (VDI)                    — RULE 12/17/18/26
GATE 1  Search canonical FIRST → clone if match    — RULE 28 + RULE 31  ⛔ build-from-scratch forbidden if canonical exists
GATE 2  Measure width                              — RULE 30
GATE 3  ASCII wireframe + layer tree → APPROVAL     — RULE 19  ⛔ HARD STOP
GATE 4  Verify SAP keys + library connected         — RULE 23/24  ⛔ FAIL-CLOSED, never createFrame() fallback
GATE 5  Build (SAP instances ONLY / clone canonical) — RULE 25 + 8/14/28  ⛔ 0 native frames, 0 raw hex
GATE 6  Verify invariants (post-build tree walk)    — RULE 21  ⛔ fix or STOP
GATE 7  Hand off + validated URL + Bind SAP Tokens  — RULE 27
    ↓
Real SAP Figma screen — every element a real SAP Web UI Kit instance
```

**Legacy JSON path** (bulk standard floorplans only): requirement-analyst →
component-architect → registry validation → figma-builder emits spec-schema.json →
plugin builds. Retained but NOT the default. The gate sequence above is the default.
```

---

## ⭐ CANONICAL REFERENCE FILE — READ THIS FIRST

**`docs/canonical-screens/Claude to Figma SAP Application.fig`**

This is the ONLY approved ground truth for structure, layout, components, tokens, and patterns.
It ships with the repo. Every build clones from it. No exceptions.

**Before ANY build:**
1. Identify the closest screen in this file
2. Read `docs/canonical-screens/CANONICAL-SCREENS.md` for exact node IDs, components, patterns
3. Clone that node — never build from scratch (RULE 28)
4. Match structure exactly — this file IS the quality bar

**What's in it:**
- List Report with Progress Rows (Activities View)
- Object Page narrow with DPH + IconTabBar (yanatest Steps)
- Side Navigation (full 20-item tree, expandable, active state)
- Schedule Operation Dialog (4 states)
- Validate System Log Panel (severity pills)
- Outage List Overview (desktop, 8 columns)
- Design System Governance Console (FCL + SideNav + nested tables)

> This file overrides any other pattern. If `figma-build-patterns.md` says one thing and this file shows another — **this file wins.**

---

## Project Location

**Canonical path:** `/Users/C5408360/Downloads/Task to Figma SAP layouts components/`

---

## Current State (2026-09-12)

> **Measured benchmark (docs/AUDIT-V2.md §9.2b) — v2 hooked-session cost model:**
> **3.6 min · 9,158 output tokens · 0 Figma errors · 0 gate refusals · 1 screenshot · `createFrame` 0.**
> Baseline before v2: 7.1 min / 33,122 tokens / native-heavy broken screen. Target 3–5 min, ≤12k. **Inside target.**
> Measure any build with `bash build/measure-build.sh --latest`.

> ⚠ **Launch from the project folder or NO gate runs.** In a terminal:
> `cd "/Users/C5408360/Downloads/sap-pipeline-v2" && claude` — or `bin/sap-v2`.
> Typing `cd …` *into* Claude does not load this file or the hooks. The first turn must print
> `✅ … project hooks ACTIVE`; `measure-build.sh` reports `GATES DORMANT` when it did not.

### Remotes
- `github` = `github.com/Venelinhr/Claude-To-Figma-SAP-Application`
- `origin` = `github.tools.sap/C5408360/sap-fiori-ai-designer`
- Current work is on branch **`pipeline-v2`** — not pushed. `main` is untouched.
- ⛔ **Figma Plugin v2 (`plugin/figma-builder-v2/`) stays OUT of GitHub** (user's instruction). Source is preserved on local branch `agent-v2-wip`. Do not commit it to `main` or push it.
- Run `git rev-parse --short HEAD` for the current commit — never quote a hardcoded hash, it drifts.

### Plugin state
- `plugin/figma-builder/code.js`: MCP-bind-only. **Fail-closed:** the bind handler posts `type:'error'` (not unconditional success) when any fill/stroke/text fails to bind a SAP variable.
- Three tools only: bind-mcp-frame, harvest-icon-keys, export-variable-keys

### Execution paths
- **RULE 25 (DEFAULT):** Claude builds via `use_figma` with real SAP instances + name-tags → plugin binds tokens
- **Legacy path:** JSON spec → plugin `Build Screen` (retained for bulk standard floorplans)

### Automation hooks (restart Claude Code after editing settings.json)
Registered in `.claude/settings.json` — run `bash build/gate-status.sh` to see every precondition and its exact command.

**PreToolUse — `guard-chain.sh` runs all 8 `use_figma` gates and reports every failure in ONE message**
(`wireframe` → `reuse` → `reference` → `architect` → `figma-code` → `api-gotchas` → `manifest-drift` → `workflow-contract`).
Also registered: `block-codejs-read.sh`, `block-generated-files.sh`, `guard-marker-write.sh`, `guard-private-screens.sh`, `guard-scoped-metadata.sh`, `guard-screenshot-budget.sh`.

**PostToolUse:** `capture-dump.sh` (runs the reality gate on the `use_figma` result — the model never writes the tree back, −12k tokens), `count-build.sh`, `mark-build.sh`, `guard-scoped-metadata.sh`, `manifest-sync-check.sh`, `registry-rebuild.sh`, `validate-lesson.sh`
**UserPromptSubmit:** `capture-approvals.sh` (writes `.wireframe-approved`/`.scratch-approved` from the USER's own words — anti-self-echo), `enforce-wireframe-first.sh`, `feedback-learn.sh`, `recall-lessons.sh`, `recall-vdi.sh`
**SessionStart:** `load-workflow-contract.sh`, `clear-reuse-marker.sh` (full reset only on a *fresh* start — markers survive resume/compact), `surface-learnings.sh`
**Stop:** `lint-on-stop.sh` (Gate 7 — blocks hand-off on failing/missing `verify.json`), `clear-reuse-marker.sh`, `surface-canonical-record.sh`, `verify-learnings.sh`

### The 6 build invariants (docs/SAP-INVARIANT-ARCHITECTURE.md) — enforced by build/verify-invariants.js
1. Zero native frames outside allowlist · 2. Zero raw hex (incl. instance paint overrides) · 3. Zero non-SAP typography (family `72` + valid `[typo:role]`) · 4. Clone-first provenance when a canonical applies · **5. Sizing/overflow — no visible child past a clipping parent, and a page-level header must match its parent's width (±2px)** · 8. Layer naming per `layer-naming.json`.
**verify-invariants.js reads the real frame tree and returns a non-zero exit on any violation** — success only if the frame proves it. Registries: `native-frame-allowlist.json`, `primitive-exceptions.json`, `layer-naming.json`, `keyless-components-allowlist.json`.

### Reuse-First enforcement (RULE 31 — mechanical since 2026-07-17)
- **Score:** `node build/score-canonical.js --floorplan "<fp>" --regions <r> --components <c>` — deterministic, use it
- **Record decision:** `node build/record-reuse-decision.js --level N --score S --base "<id|none>"` (raw writes to the marker are blocked by guard-marker-write.sh)
- **Gate blocks** if missing/invalid, if L1-4 code lacks `.clone(`, or if L5 lacks `.scratch-approved`
- **Integrity:** `node build/check-reuse-integrity.js` · token/key drift now **hard-fails** in `check-manifest-sync.js`

### Canonical confirmed screens (file `p7zm5EMBk5DRRZdxNeJ4f5`)
| Screen | Node | Confirmed |
|---|---|---|
| Schedule Activated Confirmation | `850:45411` | 2026-07-18 — "Bravo. Great result!" |
| Schedule Activated (clone source) | `853:135938` | 2026-07-18 |
| Activities View | `615:36810` | 2026-07-15 — "Perfect" |
| Purchase Orders List Report | `804:44859` | 2026-07-16 — "Bravo" |
| yanatest Steps | `560:36552` | 2026-07-14 — "Great result!" |
| Schedule Form Step 2 | `709:40690` | 2026-07-14 |
| Live Preview Panel | `709:41339` | 2026-07-14 |
| SideNavigation (full) | `701:119633` | 2026-07-15 |
| SideNavigation (proto source) | `699:37890` | 2026-07-15 |

### Privacy: canonical PNGs
- **Private by default** — `.gitignore` uses allowlist model (not blacklist)
- **6 public:** 01, 02, 07, 09, 10, 11 (user-confirmed 2026-07-16)
- **All others private** — `_private-refs/` + any new PNG is gitignored automatically
- `guard-private-screens.sh` warns on any `git add -f` attempt

### GitHub
- `origin` = `github.tools.sap/C5408360/sap-fiori-ai-designer`
- `github` = `github.com/Venelinhr/Claude-To-Figma-SAP-Application`
- Both remotes stay in sync — run `git rev-parse --short HEAD` for the current commit (don't quote a hardcoded hash; it drifts)
- README: gallery, 6-step install, 31 rules dropdowns, clean pipeline · Canonical Pattern Library (RULE 31) enforced

### Snapshots
20 on disk. Latest: `snapshot-20260717-092316-july17-readme-github-cleanup`

### Session memory
- `session_state_current.md` — full today's session summary (global + project mirror)
- `feedback_audit_fixes_workflow_quality.md` — all audit fixes detail
- `session_state_july915_recovered.md` — recovered lessons and canonical screens from a previous session gap

---

## ⛔⛔⛔ HARD RULE — NEVER PLACE A FRAME BELOW EXISTING CONTENT (2026-07-22)

**NEVER** use `maxY + 200` for frame placement — pushes frames to y=130,000+ making them invisible.
**ALWAYS** place beside the rightmost frame at y=200 (near top of canvas, always findable):
```js
const allFrames = figma.currentPage.children.filter(c => c.id !== frame.id && (c.type==='FRAME'||c.type==='SECTION'));
const maxRight = allFrames.length > 0 ? Math.max(...allFrames.map(f => f.x + f.width)) : 200;
frame.x = maxRight + 200;
frame.y = 200; // fixed near top — never stack downward
```
Exception: cloning → place beside the clone source (`frame.x = source.x + source.width + 120; frame.y = source.y`).

---

## ⛔⛔⛔ HARD RULE — NEVER ADD TOKEN TAGS TO TRANSPARENT LAYOUT FRAMES (2026-07-22)

`[sapTokenName]` tags on frame names = **FILL** tokens when Bind runs. A transparent row/stack/wrapper with a `[sapList_BorderColor]` tag gets painted grey by Bind.
- ✅ Token tags on: root frames with a background, panel surfaces, status elements, text nodes
- ⛔ Token tags on: transparent layout containers, row/stack/wrapper frames, spacing frames

---

## ⛔⛔⛔ HARD RULE — MANDATORY GATE 0→3 FORMAT (2026-07-22, confirmed EVERYTIME)

EVERY wireframe presentation (image attached, build request, clone, edit, improvement) MUST show ALL 4 sections in this exact order:
1. **Gate 0 — VDI Sector Analysis TABLE** `| Zone | Content | SAP Component | Key properties |`
2. **Floorplan recommendation TREE** (sap.x.ComponentName with └─ ├─ │ — this artifact only, not the layer tree in #4)
3. **Confidence table** `| Area | Conf.% | Notes |`
4. **ASCII wireframe + L1–L5 layer tree** (see SYSTEM_PROMPT.md Gate 3/RULE 19)

Then Gate 1 (clone/build) → Gate 2 (width) → ⚡ Suggestions → HARD STOP.

---

## ⛔⛔⛔ HARD RULE — SAP FIORI METHODOLOGY IS MANDATORY (2026-07-22 — from 6 PM-approved references)

**User: "save these as hard rule!!!!!!! Dont skipp it - never"**
Full doc: `docs/SAP-FIORI-DEFAULT-METHODOLOGY.md` | Memory: `feedback_sap_methodology_hard_rules.md`

**⛔ PRIME DIRECTIVE (always, no exceptions):** Match the floorplan to the task shape, keep context visible, disclose progressively, reuse the shell verbatim.
- **Floorplan quick-pick:** manage-object→Object Page · browse-many→List Report · create-short-linear→Wizard-in-Dialog · commit-once→Dialog · tune-in-context→Drawer · scan-numbers→Overview · order-is-meaning→Flow editor
- **Component rules:** MultiComboBox not Select (aggregate N with tokens) · Select not radios (closed list) · RadioButton-list not Select (mutually exclusive with bylines) · Wizard not long form · Drawer not Dialog (keep context)
- **Shell:** ShellBar + 256px SideNav verbatim on EVERY screen
- **Layout:** 32px inset · 16px rhythm · cards-on-grey · 195px label column · red required asterisks · 63px KPI numeral · blue selection border

---

## ⭐⭐⭐ SCHEDULE DIALOG GOLD STANDARD (2026-07-22 — SAP PM approved)

- **Divider frames (scoped rule — see Rule 4):** NEW builds: 1px lines = stroke on the parent (`strokeBottomWeight=1`), never `createFrame()`. EXCEPTION — cloned canonical/gold-standard nodes (e.g. the Schedule dialog) KEEP their existing 1px native `Divider` frames (`sapList_BorderColor #e5e5e5`): PM-approved, never convert to strokes. `/sap-fix` may flag them, never remove them.
- **Form labels:** ABOVE fields (not left) in Schedule dialogs. Left-label (Layout Grid 33%/67%) is only for Wizard forms.
- **Inactive row:** `opacity: 0.45` on the entire unselected RadioButton row
- **Footer:** Tertiary "Cancel" + Primary "Save schedule" — no third button
- **States:** A=collapsed, B=recurring, C=end-date, D=end-only, B1=hourly, B2=daily
- **Pattern card** (grey bg `sapBackgroundColor`, radius 8): only for Monthly/Yearly — NOT for Hourly/Daily
- **CLONE source:** `448:162293` (State C, PM-approved gold standard, file p7zm5EMBk5DRRZdxNeJ4f5)

---

## ⛔ RULES DEFINED IN skill/SYSTEM_PROMPT.md (do not restate here — read there)

The following hard rules live in full, with their FAIL conditions and enforcing hooks, in
`skill/SYSTEM_PROMPT.md`. This file only points to them so they are never edited in two
places and drift apart. **If this pointer ever disagrees with SYSTEM_PROMPT.md, SYSTEM_PROMPT.md wins.**

| Rule | Section in `skill/SYSTEM_PROMPT.md` |
|---|---|
| Always build in SAP Horizon Light | `## ⛔ ABSOLUTE HARD RULE #0 — ALWAYS BUILD IN SAP HORIZON LIGHT THEME` |
| Always end with a validated Figma URL to the exact node | `## ⛔ ABSOLUTE HARD RULE #1 — ALWAYS END WITH A VALIDATED FIGMA URL TO THE EXACT NODE` |
| Auto-save all feedback, never ask first | `## ⛔⛔⛔ ABSOLUTE HARD RULE — AUTO-SAVE ALL FEEDBACK WITHOUT BEING ASKED` |
| Always full horizontal width (FILL) | `## ⛔ ABSOLUTE HARD RULE #3 — ALWAYS FULL HORIZONTAL WIDTH (FILL)` |
| Never raw font '72' — always `[typo:role]` tags | `## ⛔ ABSOLUTE HARD RULE #4 — NEVER USE RAW FONT '72' — ALWAYS [typo:role] TAGS` |
| 5 mandatory build rules (padding, IconButton type, 2-line center-align, dividers, Compact form factor) | `## ⛔⛔⛔ 5 MANDATORY BUILD RULES (confirmed 2026-07-19 — NEVER SKIP)` |
| Mandatory 10-step build flow | `## ⭐⭐⭐ THE MANDATORY 10-STEP BUILD FLOW — NEVER SKIP ANY STEP` |

Rules that are **NOT** duplicated (unique to this file, stay here): frame-placement
(never below existing content), no token tags on transparent layout frames, SAP Fiori
methodology mandatory, Schedule Dialog gold standard.

---

## Critical Rules (DO NOT VIOLATE)

1. **Registry gate is HARD** — every component in `hierarchy[]` must have a file in `knowledge/components/registry/`
2. **Token whitelist is HARD** — every color reference MUST be one of the 81 tokens in `MANDATORY_TOKENS`. Raw hex = rejected.
3. **Plugin makes zero design decisions** — all reasoning in skill/SYSTEM_PROMPT.md
4. **Library must be connected** — pre-flight check blocks build if SAP Web UI Kit missing
5. **Floorplan confirmation is mandatory** — wrong floorplan wastes all downstream work
6. **No code.js edits for SAP republishes** — edit registry JSON, run build script, re-import
7. **ASCII wireframe gate (RULE 19)** — HARD STOP before JSON generation. User MUST approve wireframe first. **VDI cache does NOT exempt you — it skips analysis work only, not the gate.** Violated twice on yanatest.
8. **Reasoning Brain (RULE 20)** — 7 mandatory artifacts before component hierarchy design
9. **QA Certification (RULE 21)** — Zero-Defect + Exception Engine before user handoff
10. **Build knowledge = ONE file (RULE 28)** — MCP-first build agent reads `SAP_BUILD_MANIFEST.md` ONLY + reference image or cached semantic model. NEVER read `code.js`. **Call budget (clarified 2026-07-22, F-9):** simple screens = **one** `use_figma` build call + the folded QA + ≤1 screenshot. Screens with **8+ components** MAY use the documented 2-call skeleton+content split (`figma-build-patterns.md`) — that is the ONE sanctioned exception, not a contradiction. Verify by the QA return text, not extra screenshots.
11. **Visual analysis skill is pinned in-project (RULE 26)** — `skill/sap-visual-reading/` is the single source of truth. Global `/sap-vdi` points here.
12. **Clone canonical, never build from scratch (RULE 28)** — For ANY SAP composite with slots: find existing correctly-built node → clone → clear slot → repopulate with fresh prototypes from ORIGINAL. Never `createFrame()` for composites. See `SAP_BUILD_MANIFEST.md §3b` for canonical nodes.
13. **Inspect before build (RULE 28 sub-rule A — scoped 2026-07-22, F-9)** — Call `get_design_context` on the nearest reference node **once per NEW clone source or unknown component**: (a) component unknown/new, (b) previous build failed, or (c) cloning a canonical not yet inspected this session. Do NOT pre-call it before *every* build — for known canonicals/components trust SKILL.md §6 verified keys + SAP_BUILD_MANIFEST §3. This now matches SYSTEM_PROMPT RULE 28-A verbatim (the old "never skip" wording is retired — it caused defensive over-fetching).
14. **Root cause before retry (RULE 28 sub-rule G)** — Silent fail + wrong output = override inheritance or nesting depth. Identify WHY before retrying. See P-027, P-028.

---

## 26 Lessons from July 14-15 (quick reference)

**Build rules:**
1. Real SAP instances only — never `createFrame()` for UI components
2. L1–L5 semantic naming always — no generic names, no ` (SAP)` suffix, no redundant nesting
3. No Spacer frames — SPACE_BETWEEN / layoutGrow on real child. Even a named `Toolbar Fill` frame = banned.
4. ASCII wireframe FIRST — stop, wait approval — even with cached VDI model

**DPH composite:**
5. 52+ nodes to hide to strip chrome at 320px
6. H1 = biggest `fontSize` text node (not by name)
7. Cannot appendChild into DPH — use absolute sibling IconButton instead (x=width-btnW-8, y=10)
8. Clone clean existing DPH — don't strip fresh every time

**ObjectAttribute:**
9. Clips at 74px — use native text rows for long labels

**Progress Row (canonical):**
10. Native green frame (cornerRadius=6, 40×12px) > SAP ProgressIndicator composite
11. ObjectStatus(Semantic=Success) icon-only = confirmed checkmark pattern

**Figma API:**
12. `setProperties()` BEFORE reading sublayer nodes (P-023)
13. `layoutSizingHorizontal='FILL'` silently fails when parent is HUG — set parent FIXED first
14. `individualStrokeWeights` not supported in `use_figma`
15. `counterAxisAlignItems='STRETCH'` is invalid — use MIN/MAX/CENTER
16. Screenshot API caches — screenshot child node for fresh result
17. Cannot `appendChild` inside INSTANCE — insert into parent frame
18. `importComponentByKeyAsync` throws on component SET keys — use `importComponentSetByKeyAsync`

**Token / build:**
18. Never read code.js (45k tokens) — manifest only
19. VDI cache = 96% saving on repeat image analysis
20. One-shot build + one screenshot — no live iteration loop
21. Parallel `Promise.all` imports — 3–4× faster; reuse compSet for multiple instances

**Hooks:**
22. Hook stdin = `.tool_input.file_path` from stdin JSON — NOT `CLAUDE_TOOL_INPUT_FILE_PATH`
23. `settings.json` requires Claude Code restart to activate

**Plugin UI:**
24. `getBoundingClientRect().height` for resize — not `scrollHeight`
25. `body` background = card background eliminates phantom gap

**SAP ObjectStatus:**
26. `setProperties` after insert; `findAll(TEXT)` then `visible=false` for icon-only

---

## SAP_BUILD_MANIFEST.md — what the build agent reads

`SAP_BUILD_MANIFEST.md` is the ONLY file a build reads (plus reference image / cached semantic model).

**DO NOT read:**
- `code.js` (~45k tokens) — use §3 for keys, §4 for tokens
- `component-property-reference.json` (136 KB) — use §3 for 25 common keys
- `horizon-variable-keys.json` (26 KB) — use §4 for 25 common tokens
- Multiple `registry/*.json` files — one file at most, only if component absent from §3

---

## Knowledge layers

| Layer | Status |
|---|---|
| **Registry** | **152 components** — 100% enriched |
| **Guidelines cache** | **155 files** — 100% coverage |
| **Doctrine docs** | **8 files** in `docs/` — incl. REPAIR-PATTERNS.md (28 patterns P-001–P-028), HOOKS-REFERENCE.md |
| **Specialized agents** | **8 files** in `skill/agents/` |
| **System prompt** | `skill/SYSTEM_PROMPT.md` — **31 mandatory RULEs** + 81-token whitelist + Blocked Behaviors table |
| **Build patterns** | `skill/references/figma-build-patterns.md` — Clone-Canonical method, Progress Row, DPH strip, all API gotchas |
| **Build manifest** | `SAP_BUILD_MANIFEST.md` — component keys §3, canonical nodes §3b, token tags §4 |

---

## How to Run the Skill

**Default (MCP-first, RULE 25) — build any screen from a reference/description:**
```
/sap-screen <reference image or description> <Figma URL>
```
This is the authoritative path — real SAP instances via `use_figma`, then plugin binds tokens.

**Legacy (JSON spec → plugin Build Screen, bulk standard floorplans only):**
```
Use the skill at skill/SKILL.md.
Requirement: [paste ticket text here]
```

## How to Load the Figma Plugin

```bash
# 1. Build bundled plugin code (only after registry edits)
cd build && node build-registry-bundle.js

# 2. In Figma: Plugins → Development → Import plugin from manifest...
#    → select plugin/figma-builder/manifest.json
```

## How to Check Project Health

```bash
# Verify all MCP servers connected
claude mcp list

# Validate a spec
node build/validate-spec.js output/<spec>.json

# Run regression suite
bash build/test-build.sh

# Check manifest drift (lint side — curated tables vs source)
node build/check-manifest-sync.js

# SSOT: regenerate derived tables from source (generate, don't duplicate)
npm run generate          # heals manifest §4 hex / §5 typo from source
npm run drift-gate        # FAILS if any build-data drifted (generate-side + lint-side)
```

### Single-Source-of-Truth (SSOT) — no-drift architecture (2026-07-21)
The recurring build-data drift (same hex/key/variant in 5+ files, drifting apart) is closed structurally:
- **Authoritative sources** (hand-edited): `knowledge/components/registry/*.json`, `knowledge/guidelines/horizon-variable-keys.json`, `build/verify-invariants.js` TYPO_ROLES.
- **`build/generate-derived.js`** SYNCS the derived values into the hand-curated tables inside `<!-- GENERATED:… -->` fences (manifest §4 hex, §5 typo size), preserving all curation. Idempotent — `generate → generate` is a no-op.
- **`build/ci-drift-gate.sh`** = `generate --check` (prevent) + `check-manifest-sync.js` (detect). Fails on ANY drift. Wire it as a pre-commit / CI check. Tables whose data lives in no source (TEXT-key hashes, canonical widths) are LINT-only, never generated.
- **Rule: never hand-edit a value inside a `GENERATED` fence** — edit the source and run `npm run generate`.

### Gate 0.5 — Architect-First Reasoning (2026-07-21; artifacts reordered 2026-07-22)
For a NEW screen from a TEXT request (no reference image, no canonical clone), the pipeline now enforces architect-first reasoning BEFORE the wireframe: **Business Statement → Information Architecture → Floorplan + rationale**, approved by the user, before any component is selected. Enforced by `guard-architect-gate.sh` (PreToolUse, runs before the wireframe gate) + `.architect-approved` marker (written only by the user's architecture-approval words via `capture-approvals.sh`, cleared per turn). Skips for canonical clones (L1–4) and repairs.

The brief REUSES the 7 reasoning-brain artifacts in architect-first order (single source: `skill/agents/reasoning-brain.md` — do not restate): Intent Card + Business Entity Model (Ph1–2) → Layout Blueprint = IA (Ph3) → Screen Classification = floorplan chosen FROM the IA (Ph4) → **approve** → Component Planning Table (Ph5) + Relationship Graph (Ph6) at the wireframe → Composition Pre-check (Ph7) pre-build. The floorplan is an OUTPUT of the IA, never defaulted up front. Image requests keep the Gate 0 (VDI) flow unchanged.
```

---

## Architecture Decisions (already made — do not re-litigate)

| Decision | Rationale |
|---|---|
| **MCP-first execution (RULE 25)** | `use_figma` is pixel-accurate; plugin shrank to token-bind bridge. Legacy JSON path retained for bulk builds. |
| **Clone-canonical method (RULE 28)** | Building composites from scratch loses slot frames → setProperties silently fails. 14 failed iterations confirmed. |
| **Parallel Promise.all imports** | 3–4× faster; all imports fire simultaneously. |
| **Skeleton+content 2-call split** | Smaller blocks → fewer errors → less iteration on 8+ component screens. |
| **SAP_BUILD_MANIFEST.md single source** | Prevents ~45k token code.js read; drift guarded by check-manifest-sync.js. |
| **Hard token whitelist** | Eliminates raw hex drift; system prompt + plugin validator enforce together. |
| **§7 validators at build time** | Catches a11y issues before user reviews. |

