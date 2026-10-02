# Claude to Figma SAP Application — v6

> Describe a SAP Fiori screen in plain words (or attach a reference image). The system builds a **real SAP screen in Figma** — real SAP Web UI Kit components, live Horizon tokens, verified layer structure — in about **40 seconds** with the plugin. No manual drag-and-drop.

![Version](https://img.shields.io/badge/version-v6-0070F2?style=flat-square)
![Plugin](https://img.shields.io/badge/Plugin-33--39_s-purple?style=flat-square)
![Figma Agent](https://img.shields.io/badge/Figma-Agent_skill_v9-blue?style=flat-square)
![Claude Code](https://img.shields.io/badge/Claude_Code-/screen-orange?style=flat-square)
![Token Optimization](https://img.shields.io/badge/Token-Optimization-blueviolet?style=flat-square)
![Learning](https://img.shields.io/badge/Learning_%26-Improving-yellow?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)

## Three ways to use it

| Route | Where you type | Asks before it builds? | Time to the screen |
|---|---|---|---|
| **SAP Bridge plugin** | the plugin text box in Figma | No — builds at once | **33–39 s** |
| **Claude Code `/screen`** | Claude Code in this folder | **Yes** — plan, then Approve | about 50 s |
| **Figma Agent chat** | the Agent panel in Figma | **Yes** — plan, then Approve | about 1 min 30 s |

All three use the same engine: stored SAP layouts, one content file written by the model, audits that refuse bad content before any Figma call, and scripts that build, check and name the frame.

## Examples — screens built by the system

| Schedule Operation Dialog | Flight Result Card | Design System Governance |
|:---:|:---:|:---:|
| ![Schedule Operation](docs/canonical-screens/07-schedule-operation-monthly-end-date.png) | ![Flight Result Card](docs/canonical-screens/12-flight-result-card.png) | ![Design System Governance](docs/canonical-screens/01-design-system-governance-console.png) |
| Complex dialog · timing · recurrence · monthly pattern · end date | Custom card layout · flight legs · price zone · action CTA | FCL layout · SideNav · nested table · review calendar |

All screens built from a plain-language description or reference image — real SAP components, live Horizon tokens, verified layer structure.

## Quick start

**You need:** Node.js ≥ 20 · [Claude Code CLI](https://claude.ai/code) · Figma desktop app · Python 3 (for image references).

### 1. Get the code
```bash
git clone https://github.com/Venelinhr/Claude-To-Figma-SAP-Application.git
cd Claude-To-Figma-SAP-Application
./install.sh
```

### 2. Connect the SAP Web UI Kit in Figma
1. Open the [SAP Web UI Kit on Figma Community](https://www.figma.com/community/file/1494295794601744471) → **Duplicate to your drafts** (free). Publish its styles and components.
2. In your working Figma file: **Assets → Libraries →** switch **SAP Web UI Kit** on. (SAP-internal users: the kit is usually already shared in your organisation.)

### 3. Load the plugin
1. Figma desktop → **Plugins → Development → Import plugin from manifest…**
2. Choose `plugin/sap-bridge/manifest.json` from this folder.
3. Start the local bridge (from this folder, in a normal Terminal):
```bash
node build/mailbox.js restart
```
4. Open **SAP Bridge** in your file. It shows **Connected to Claude · v6**.

### 4. Build your first screen
Type a request in the plugin text box and press **Go**:

> *Build a SAP Fiori Procurement Overview for a purchasing manager who must stop late deliveries. Show four summary cards: Open Purchase Orders, Late Deliveries, Pending Approvals and Spend This Month. Below, a table of purchase orders with PO number, supplier, material, ordered quantity, delivery date, buyer and status. Filters: supplier, plant, buyer, delivery date and status.*

The screen appears in about 40 seconds. Every finished job has a **log icon** in the history list — one click copies the full log.

## Claude Code — `/screen` (plan first)

```bash
cd Claude-To-Figma-SAP-Application
claude
```
Start a **fresh session for every screen** (it is faster). Then:
```
/screen "<your request>" https://www.figma.com/design/<FILE_KEY>/…
```
Claude analyses the request, shows the plan (wireframe, layer tree, SAP components, confidence) and waits. Answer **Approve**, **Reject** or **Modify** — only then it builds. A reference image works too: `/screen <image path> <Figma link>`.

## Figma Agent — set up once, then just type

The Figma Agent works inside your file. The heavy parts (runtime, SAP kit helpers, stored layouts, content tools, checker) are stored **in the Figma file**, so the Agent only types short fixed calls.

1. **Link the SAP Web UI Kit** (step 2 above).
2. **Install the tools into the file:** open the **SAP Bridge plugin once** in the file (the bridge must be running). Wait for the message *v6 installed for the Figma Agent*, then close it. Repeat once per file, and again after an update.
3. **Add the skill:** open the skill folder, then in Figma click the Agent button → **Skills → Add skill** and upload `SKILL.md` of **sap-figma-agent** (replace an old version).
```bash
open .claude/skills/sap-figma-agent
```
4. **Start a new Agent chat** and write your request in plain words — no `/screen`, no command.

**How the Agent works:**
- **New screen:** it picks the closest stored layout, writes the content, then **shows you the plan and the layer tree and asks "Approve / Modify?"**. Only after your Approve it builds and checks. Its first line shows the route: `▸ NEW · <layout>`.
- **Small change:** select the frame (or paste its link) and say what to change — it runs at once (`▸ EDIT`).
- **Not for the Agent:** matching a reference image 1:1 — the Agent tells you to use Claude Code `/screen`.

**What you can ask:**

| Refine & change | Suggest the next step | Variant & extend |
|---|---|---|
| "Improve this layout" | "Suggest the next screen after this list" | "Build a variant of this screen" |
| "Fix the status column" | "What's the next step in this wizard?" | "Add a filter bar and mass actions" |
| "Make the actions SAP-compliant" | "Add the detail page for this row" | "Extend this into a full Object Page" |

> **Which route when:** plugin = fastest new screen · Claude Code `/screen` = plan, approval and a full report · Figma Agent = plans and small edits inside the file.

**Live SAP knowledge in the Figma Agent — how to load it and its real limit:** the `sap-figma-agent` skill's methodology and hard rules are static text uploaded to Figma. They don't call anything live by themselves. Two ways to actually ground the Figma Agent in current SAP data:

1. **Native MCP connector (best, if your org allows it)** — Figma's Agent panel supports connecting directly to a live MCP server: `Add context → Connectors → Manage → Create` → name it, paste `https://sap-design-mcp.cfapps.us10-001.hana.ondemand.com/mcp`, no auth needed. Once connected, `@`-mention it in chat so the Agent pulls live SAP guidance itself. **This needs custom connectors enabled for your Figma org** (an admin-only toggle by default — `Admin → Settings → Connections → MCP connectors in Figma`). If `Connectors → Created by you` says your org doesn't allow it, this needs a request to your Figma admin, not a workaround.
2. **Claude-Code-refreshed grounding (works today, no admin needed)** — ask Claude Code to pull current guidance from `sap-design-cf-live` and bake it into the skill file or a Figma tool's source (this is how the SAP Screen Builder generative tool's component choices are kept current). Not live-at-runtime, but genuinely verified as of the date stamped in the file — re-run it periodically to keep it fresh.

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

## Results (same prompt: Procurement Overview, 4 cards, 5 filters, 7-column table)

| Route | Time to the screen | Quality gates |
|---|---|---|
| SAP Bridge plugin | **33–39 s** (was 3 min 53 s) | MATCH 100 · HYGIENE 0 · STRUCTURE 0 |
| Claude Code `/screen` (fresh session) | about 50 s | same gates, full 5-section report |
| Figma Agent chat | about 1 min 30 s with your Approve | clean frame, all required labels |
| Figma Make (for comparison) | more than 2 min | a working SAPUI5 app, not an editable Figma frame |

Full overview and the frame-by-frame comparison: [`docs/v6/SUMMARY-v6.md`](docs/v6/SUMMARY-v6.md).

## How it works (v6 in short)

1. **Route and match** — the request is matched to the closest stored layout (`knowledge/gold/`).
2. **Content** — the model writes one content-only file (filters, cards, table, steps, title). It never writes geometry.
3. **Audits (no model tokens)** — leftover old words, column count, one colour per status, one date format, text length, required amounts and names, date filter on the date picker, no numbers in coloured status cells.
4. **Door** — only real kit components, bound colour variables, text styles, responsive sizing.
5. **Build, gates, rename** — the plugin builds the frame in about 5 s; scripts measure MATCH / HYGIENE / STRUCTURE and name the frame.

## Token Optimization

The build pipeline is token-optimised — each session uses a fraction of what a naive implementation would consume.

In v6 a plugin job writes **one** content file and builds **once**. The audits and the layout hints run as scripts and cost no model tokens — a retry loop of 12 refused content files before one build went to zero.

## The Loop — Learning & Improving

The system gets smarter with every session. When you confirm something is right, it's saved as a canonical reference for future builds. When something is wrong, the correction is captured automatically and applied from the next build onward. You never need to say "remember this" — every piece of feedback, positive or negative, is stored and recalled when relevant.

You can also add your own rules at any time — just tell Claude "hard rule: always do X" and it will save it to memory and follow it in every future build.

## More documentation

| File | What |
|---|---|
| [`docs/v6/SUMMARY-v6.md`](docs/v6/SUMMARY-v6.md) | one-page overview, comparisons, results |
| [`docs/v6/SNAPSHOT-2026-10-02.md`](docs/v6/SNAPSHOT-2026-10-02.md) | state, restart steps, lessons, open items |
| [`docs/v6/screen.md`](docs/v6/screen.md) | the `/screen` command |
| [`docs/v6/figma-agent-skill.md`](docs/v6/figma-agent-skill.md) | the Figma Agent skill (source) |
| [`docs/legacy/README-v7.md`](docs/legacy/README-v7.md) | the complete previous README (pipeline, architecture, project structure, skills, health check) |

**The previous system (v2–v5, the old `main`) is kept whole on branch [`v7`](../../tree/v7).**

## License

MIT License — free to use, modify, and distribute.
July 2026
