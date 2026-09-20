# Claude to Figma SAP Application

> Describe your business use case in plain language, or attach a screenshot or Figma reference. Claude reads official SAP guidelines, measures the reference, selects components, previews the layout as an ASCII wireframe for your approval, then builds a real SAP Fiori screen directly in Figma — real library components, live tokens, zero manual drag-and-drop. **ANALYZE → PLAN → EXECUTE → VALIDATE → LEARN.** Use the **Figma Agent** to refine, apply changes, or suggest ideas — directly on the canvas.

A complete build system: 31 rules, 6 skills, a Figma plugin with SAP token binding and WCAG AA checks, and 5 MCP servers — everything needed to produce consistent, production-ready SAP Fiori screens.

![Claude to Figma](https://img.shields.io/badge/Claude_to_Figma-SAP_Application-0070F2?style=flat-square)
![Rules](https://img.shields.io/badge/Rules-31-orange?style=flat-square)
![Skills](https://img.shields.io/badge/Skills-6-brightgreen?style=flat-square)
![Figma Agent](https://img.shields.io/badge/Figma-Agent-blue?style=flat-square)
![Figma Plugin](https://img.shields.io/badge/Figma-Plugin-purple?style=flat-square)
![MCP Servers](https://img.shields.io/badge/MCP_Servers-5-green?style=flat-square)
![Token Optimization](https://img.shields.io/badge/Token-Optimization-blueviolet?style=flat-square)
![Learning](https://img.shields.io/badge/Learning_%26-Improving-yellow?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)


## Examples — screens built by the system

| Schedule Operation Dialog | Flight Result Card | Design System Governance |
|:---:|:---:|:---:|
| ![Schedule Operation](docs/canonical-screens/07-schedule-operation-monthly-end-date.png) | ![Flight Result Card](docs/canonical-screens/12-flight-result-card.png) | ![Design System Governance](docs/canonical-screens/01-design-system-governance-console.png) |
| Complex dialog · timing · recurrence · monthly pattern · end date | Custom card layout · flight legs · price zone · action CTA | FCL layout · SideNav · nested table · review calendar |

All screens built from a plain-language description or reference image — real SAP components, live Horizon tokens, verified layer structure.


## Installation


### Step 1 — Clone and run the installer

```bash
git clone https://github.com/Venelinhr/Claude-To-Figma-SAP-Application.git
cd Claude-To-Figma-SAP-Application
./install.sh
```

The installer handles everything automatically: installs dependencies, registers all 5 MCP servers in Claude Code, and copies the skill files.

**You need:** Node.js ≥ 20 · [Claude Code CLI](https://claude.ai/code) · Figma desktop app


### Step 2 — Add your Figma API token

**Why you need it:** Claude communicates with Figma through the Figma API — it reads your existing screens, inspects component structure, and writes new screens directly to your canvas. The API token is how Figma knows the request is coming from you and has permission to access your files. Without it, Claude cannot read from or build into Figma at all.

The installer adds a placeholder automatically. Replace it with your real token:

1. Go to **figma.com → Settings → Personal access tokens** → generate a new token
2. Open `~/.claude/settings.json` and find this line:
   ```
   "FIGMA_API_TOKEN": "YOUR_FIGMA_TOKEN_HERE"
   ```
3. Replace `YOUR_FIGMA_TOKEN_HERE` with your token

> **Internal SAP users:** if your organisation uses SSO or a managed Figma account, generate the token the same way — personal access tokens work regardless of how your account is administered. Keep the token private; treat it like a password.


### Step 3 — Load the Figma plugin

> ⚠️ **This plugin does not build SAP components.** It only binds design tokens onto a
> screen Claude already built with `use_figma`. If you run it first — before Claude builds
> anything — you will get plain shapes, not real SAP components, even with the SAP Web UI
> Kit linked as a library. Do Step 6 (build with Claude) before you click **Bind SAP Tokens**.

The plugin connects Claude's output to real SAP design tokens. After Claude builds the screen, you run the plugin once to bind live SAP variables, swap icons, and apply text styles.

**Download and run the plugin locally:**

1. Clone this repo to your machine (if you haven't already)
2. Open **Figma desktop**
3. Go to **Plugins → Development → Import plugin from manifest...**
4. Select `plugin/figma-builder/manifest.json` from the cloned repo folder
5. The plugin now appears under **Plugins → Development → SAP Figma Builder** and runs inside any Figma file

> The plugin runs locally from your machine — no publishing or Figma Community install needed. Keep the repo folder on disk so Figma can load it.


### Step 4 — Connect the SAP Web UI Kit in Figma

This is the official SAP component library. Claude pulls components from it for every build — buttons, tables, headers, status indicators, icons, and the full SAP token system.

1. Open [SAP Web UI Kit on Figma Community](https://www.figma.com/community/file/1494295794601744471) and click **Duplicate to your drafts** (free)
2. Open your duplicated copy in Figma desktop
3. In the file: click the file name at the top → **Publish styles and components** → Publish
4. In your working Figma file: open the **Assets panel** (left sidebar) → click the **Libraries** icon → find **SAP Web UI Kit** → toggle **ON**

> **Internal SAP users:** the SAP Web UI Kit is likely already available as a shared library in your organisation — you do not need to duplicate it. Open the **Assets panel** → **Libraries** → find SAP Web UI Kit under your organisation's shared libraries → toggle **ON**. Do not duplicate the community copy on top of the organisation version — this creates two competing libraries.

> **If component imports fail** — the SAP Web UI Kit library is not enabled in the current file, or the wrong version is active. Check the Libraries panel and make sure only one version is toggled on.


### Step 5 — Restart Claude Code and verify

```bash
claude mcp list   # should show 5+ servers including "figma"
```

### You're ready

Open Claude Code in this project folder and describe what you want to build:

> *"Build a Purchase Orders approval screen"*
> *"Create a mobile list view for field service tasks"*
> *"Design an Object Page for a supplier profile"*

Attach a screenshot or wireframe as reference if you have one. Claude analyses it, shows you an ASCII wireframe for approval, then builds the screen directly in Figma. Select the frame, run **Bind SAP Tokens** in the plugin — done.


## How It Works — the full pipeline

```
You: "Build a Purchase Orders screen"
                       │
                       ▼
  ┌─────────────────────────────────────────────────┐
  │  ANALYZE                                        │
  │  • Measure reference width (default 1440px)     │
  │  • Sector-by-sector visual reading (A→B→C)      │
  │  • Floorplan scored + confirmed with you        │
  │  • VDI: 7 artifacts, confidence tiers ●○?       │
  └────────────────────┬────────────────────────────┘
                       │
                       ▼
  ┌─────────────────────────────────────────────────┐
  │  PLAN                                           │
  │  • ASCII wireframe — every region, every        │
  │    component. You approve before any build.     │
  │  • L1–L5 layer structure proposed               │
  │  • Clone source selected from canonical .fig    │
  └────────────────────┬────────────────────────────┘
                       │ "approved" ◄─── iterate here (free, instant)
                       ▼
  ┌─────────────────────────────────────────────────┐
  │  EXECUTE  (one use_figma call)                  │
  │  • Parallel import all SAP components           │
  │  • Clone canonical → clear slot → repopulate    │
  │  • Real SAP instances only — never createFrame()│
  └────────────────────┬────────────────────────────┘
                       │
                       ▼
  ┌─────────────────────────────────────────────────┐
  │  VALIDATE  (one screenshot)                     │
  │  • Compare vs reference                         │
  │  • You click "Bind SAP Tokens" in the plugin    │
  │    → live SAP Horizon variables bound           │
  │    → 4 accessibility validators run             │
  └────────────────────┬────────────────────────────┘
                       │
                       ▼
  ┌─────────────────────────────────────────────────┐
  │  LEARN                                          │
  │  • "bravo / perfect" → canonical saved          │
  │  • "not right / fix this" → lesson captured     │
  │  • Next similar build recalls the right lesson  │
  └────────────────────┬────────────────────────────┘
                       │
                       ▼   
                   loops back
              ANALYZE (next build)
            lesson already recalled,
             canonical clone ready
                                                       
```

### What happens at each stage

| Stage | What Claude does | Key rule |
|---|---|---|
| **ANALYZE** | Reads the closest canonical node · sector-by-sector visual reading · measures reference width · scores floorplan | Never skip |
| **PLAN** | Maps content to slot structure · lists property keys · proposes L1–L5 layer tree · selects clone source | Before any code |
| **EXECUTE** | Single `use_figma` call · Clone-Clear-Repopulate · parallel component imports · real SAP instances only | One shot |
| **VALIDATE** | One screenshot · compare vs reference · plugin binds tokens · 4 accessibility validators | One shot |
| **LEARN** | Approval → canonical saved · correction → lesson captured · next build recalls the right lesson automatically | Every build |


## Example — what Claude shows you at the PLAN stage

After analysis, Claude presents an ASCII wireframe + component breakdown for your approval **before writing a single line of Figma code.**

```
┌─────────────────────────────────────────────────────────────────┐
│  ShellBar                                                       │
│  [≡]  Purchase Orders          [Search]  [?]  [👤 User ▾]       │
├─────────────────────────────────────────────────────────────────┤
│  DynamicPageTitle                                               │
│  Purchase Orders (142)          [Approve]  [Reject]  [Export ▾] │
├─────────────────────────────────────────────────────────────────┤
│  FilterBar                                                      │
│  [Supplier ▾]  [Status ▾]  [Date range ▾]  [Go]  [Adapt]        │
├─────────────────────────────────────────────────────────────────┤
│  Responsive Table                                               │
│  ☐  │ PO Number  │ Supplier        │ Amount       │ Status      │
│─────┼────────────┼─────────────────┼──────────────┼─────────────│
│  ☐  │ 4500012891 │ Acme Corp       │ € 24,500.00  │ ● Pending   │
│  ☐  │ 4500012892 │ GlobalX GmbH    │ € 8,200.00   │ ● Pending   │
│  ☐  │ 4500012893 │ FastLog Ltd     │ € 61,750.00  │ ✔ Approved  │
│  ☐  │ 4500012894 │ NordSupply AG   │ € 3,400.00   │ ✘ Rejected  │
├─────────────────────────────────────────────────────────────────┤
│  Pagination   [◀]  1 of 12  [▶]                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Components Claude will use to build this screen:**

| Region | SAP Component | Why |
|--------|--------------|-----|
| App shell | `ShellBar` | Top-level navigation, branding, user menu |
| Page title + actions | `DynamicPageTitle` | Title with item count + primary action buttons |
| Filter row | `FilterBar` | Standard SAP filter pattern with Go + Adapt |
| Data | `ResponsiveTable` with `MultiSelectMode` | Best for tabular list data with bulk actions |
| Status column | `ObjectStatus` (`Semantic=Warning/Success/Error`) | Semantic color + icon, theme-switchable token |
| Amount column | `ObjectNumber` | Right-aligned number with currency, SAP typography |
| Row actions | `Button` (Accept / Reject) | Type=Accept / Type=Reject — correct SAP affordance |
| Pagination | `PaginationBar` | Standard SAP paging pattern |

**L1–L5 layer structure:**
```
Purchase Orders
├── Shell Bar                            L2  SAP ShellBar
├── Page Header                          L2  region
│   └── Dynamic Page Title               L3  SAP DynamicPageTitle
│       └── Primary Actions              L4  group
│           ├── Approve Button           L5  SAP Button · Type=Accept
│           ├── Reject Button            L5  SAP Button · Type=Reject
│           └── Export Button            L5  SAP Button · Type=Secondary
├── Filters                              L2  region
│   └── Filter Bar                       L3  SAP FilterBar
│       ├── Supplier Filter              L4  SAP FilterGroupItem
│       ├── Status Filter                L4  SAP FilterGroupItem
│       └── Date Range Filter            L4  SAP FilterGroupItem
├── Main Content                         L2  region
│   └── Responsive Table                 L3  SAP ResponsiveTable
│       ├── PO Number Column             L4  column
│       ├── Supplier Column              L4  column
│       ├── Amount Column                L4  column · SAP ObjectNumber
│       ├── Status Column                L4  column · SAP ObjectStatus
│       └── Row 1                        L4  data row
│           ├── PO Number                L5  text cell
│           ├── Supplier Name            L5  text cell
│           ├── Amount                   L5  SAP ObjectNumber
│           └── Status                   L5  SAP ObjectStatus
└── Footer                               L2  region
    └── Pagination Bar                   L3  SAP PaginationBar
```

You can iterate on any part — change the floorplan, add a column, switch to mobile — before Claude builds anything.

## Three-Layer Architecture

Each layer does only what it uniquely can:

```
┌────────────────────────────────────────────────────────────────┐
│  Layer 1 — Claude (Reasoning)                                  │
│  Reads references · runs 31 rules · visual analysis            │
│  Selects floorplan + components · builds via Figma MCP         │
│  QA + self-repair · captures lessons                           │
└───────────────────────────┬────────────────────────────────────┘
                            │ builds screen (one call)
                            ▼
┌────────────────────────────────────────────────────────────────┐
│  Layer 2 — Figma MCP (Execution)                               │
│  Inserts real SAP kit instances                                │
│  Sets variant properties · marks fills and text for binding    │
└───────────────────────────┬────────────────────────────────────┘
                            │ you click "Bind SAP Tokens"
                            ▼
┌────────────────────────────────────────────────────────────────┐
│  Layer 3 — Plugin (Token Bridge)                               │
│  The only piece with access to SAP library variables           │
│  Binds real SAP Horizon tokens (theme-switchable)              │
│  Swaps icon placeholders · binds text styles                   │
│  Runs 4 accessibility validators automatically                 │
└────────────────────────────────────────────────────────────────┘
```

> **Why three layers?** The Figma MCP runs in a sandbox — it can read and write structure, but it cannot access your SAP library's private token variables. Only a real Figma plugin can do that. So Claude builds the structure, the plugin binds the tokens. Each does the one thing only it can do.


## Figma Agent

Design directly inside Figma with the built-in AI Agent. Select an existing screen and ask the Figma Agent to refine it, apply changes, suggest the next step in the user flow, generate a variant, or extend the design. 

**What you can ask:**

| Refine & change | Suggest the next step | Variant & extend |
|---|---|---|
| "Improve this layout" | "Suggest the next screen after this list" | "Build a variant of this screen" |
| "Fix the status column" | "What's the next step in this wizard?" | "Add a filter bar and mass actions" |
| "Make the actions SAP-compliant" | "Add the detail page for this row" | "Extend this into a full Object Page" |

**How to use — setup & run:**

1. **Link the SAP Web UI Kit** — in Figma, `Assets → Libraries` → enable **SAP Web UI Kit**. 
2. **Add the SAP Agent skill** — download the skill file from this repo: [`.claude/skills/sap-figma-agent/SKILL.md`](.claude/skills/sap-figma-agent/SKILL.md). Then click the Figma Agent button → `Skills → Add Skill` → paste or upload the **sap-figma-agent** skill.
3. **Select a screen & describe the change** — select any built SAP screen, open the Agent, and type what you want.

> **Figma Agent vs Claude Code:** Use **Claude Code** for new builds from a reference — it runs the full gated pipeline (wireframe approval, token bind, invariant checks). Use the **Figma Agent** for fast on-canvas iterations — refine, extend, suggest next steps — following the same SAP rules and design system, without leaving Figma.


## Token Optimization

The build pipeline is token-optimised — each session uses a fraction of what a naive implementation would consume.


## The Loop — Learning & Improving

The system gets smarter with every session. When you confirm something is right, it's saved as a canonical reference for future builds. When something is wrong, the correction is captured automatically and applied from the next build onward. You never need to say "remember this" — every piece of feedback, positive or negative, is stored and recalled when relevant.

You can also add your own rules at any time — just tell Claude "hard rule: always do X" and it will save it to memory and follow it in every future build.


## Canonical Reference Screens

**Included in this repo:** `docs/canonical-screens/Claude to Figma SAP Application.fig`

The quality baseline for every build — 14 real, approved SAP Fiori screens with live components, correct tokens, and verified layer structure (not mockups). Covers the core patterns: List Report, Object Page, Dialog form, Side Navigation, FCL governance console, and log panel.

Claude uses this file automatically — before building, it finds the closest match, reads its structure, and clones from it, so you never start from scratch. It ships with the repo and works offline (no private Figma access needed). You can also download the `.fig`, open it in Figma, and point any node to the workflow as a reference — useful if a canonical is lost, needs re-linking, or you want to inspect exactly how a screen was built.


## Project Structure

```
/
├── install.sh                      ← one-command setup
├── SAP_BUILD_MANIFEST.md           ← the ONLY file a build reads (~2k tokens)
├── skill/
│   ├── SKILL.md + SYSTEM_PROMPT.md ← 31 RULEs + 80-token whitelist
│   ├── agents/                     ← 9 specialized agents
│   ├── sap-visual-reading/         ← VDI skill: 8 stages + sector-analysis
│   └── references/                 ← figma-build-patterns, canonical-similarity-rubric
├── plugin/figma-builder/
│   ├── manifest.json               ← load this in Figma
│   └── code.bundled.js             ← pre-built, ready to use
├── mcp-servers/                    ← 3 custom MCP servers
├── knowledge/
│   ├── components/registry/        ← 152 component JSONs (source of truth)
│   └── guidelines/                 ← 154 Fiori guideline caches
├── docs/
│   ├── canonical-screens/          ← .fig + .md files + 6 public reference PNGs
│   ├── REPAIR-PATTERNS.md          ← 28 patterns from real failures
│   ├── KNOWLEDGE-INDEX.md          ← what lives where
│   └── OPERATING-MANIFEST.md       ← single authoritative rule map
└── semantic-models/                ← VDI SHA-1 cache (−96% on repeat images)
```


## MCP Servers

**5 servers auto-installed by `install.sh`.** 3 optional add-ons.

| MCP | What it does | When it runs |
|---|---|---|
| `figma` | Live Figma read/write — reads screen structure, builds components, takes screenshots | Every build — reads the canonical reference, executes `use_figma`, verifies the result |
| `sap-fiori-guidelines` | 154 cached SAP Fiori guidelines — when/how to use each component | ANALYZE stage — Claude checks component guidelines before proposing any component |
| `sap-application-analysis` | Maps screenshots/wireframes to SAP region types and floorplan scores | When you attach a reference image — turns visual zones into SAP vocabulary |
| `sap-figma-community` | Detects stale component keys in the registry vs the live SAP kit | On demand — when Claude suspects a component key may be outdated |
| `chrome-devtools` | Fetches live SAP Fiori guideline pages from the web | Fallback only — when a component isn't in the local guideline cache |
| `sapui5` *(optional)* | Live UI5 API — exact property names, enums, aggregations | When a component property is uncertain (e.g. `Semantic` not `State` for ObjectStatus) |
| `context7` *(optional)* | Live library docs for correct API signatures | When writing UI5 code that calls specific methods |
| `fundamental-styles` *(optional)* | 120+ CSS components, 1,522 design tokens | Edge-case fallback when SAP Web UI Kit registry doesn't cover a pattern |


## Skills

| Skill | What |
|---|---|
| `/sap-figma-agent` | Figma Agent SAP skill — add once to the Figma AI Agent; it then builds, extends, and improves SAP screens on-canvas following all project rules |
| `/sap-fix` | Auto-repair any screen: adds `[typo:role]` tags, converts Divider frames to strokes in NEW builds (cloned canonicals keep theirs — flag only), injects real nav labels, fixes button types, renames generic layers |
| `/sap-vdi` | 8-stage Visual Design Intelligence: sector reading, confidence tiers, floorplan scoring, 12-part output |
| `/sap-bind` | End-to-end MCP-first pipeline: VDI cache → wireframe gate → one-shot `use_figma` → bind reminder |
| `/sap-spec-validate` | Registry gate + token whitelist + no raw hex — pre-flight before any build |
| `/sap-registry-update` | Edit registry JSON → rebuild bundle → run regression tests (the only correct way) |

## Health Check

```bash
claude mcp list                              # expect 5+ servers
node build/validate-spec.js output/any.json  # validate a spec
bash build/test-build.sh                     # regression suite (must exit 0)
node build/check-manifest-sync.js            # manifest drift check
```

## License

MIT License — free to use, modify, and distribute.
July 2026
