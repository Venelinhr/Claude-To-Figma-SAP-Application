# Claude to Figma SAP Application

> Describe a SAP Fiori screen in plain words (or attach a reference image). The system builds a **real SAP screen in Figma** — real SAP Web UI Kit components, live Horizon tokens, verified layer structure.

![Plugin](https://img.shields.io/badge/Plugin-33--39_s-purple?style=flat-square)
![Figma Agent](https://img.shields.io/badge/Figma-Agent_skill_v9-blue?style=flat-square)
![Claude Code](https://img.shields.io/badge/Claude_Code-/screen-orange?style=flat-square)
![Token Optimization](https://img.shields.io/badge/Token-Optimization-blueviolet?style=flat-square)
![Learning](https://img.shields.io/badge/Learning_%26-Improving-yellow?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)

## Examples

| Schedule Operation Dialog | Flight Result Card | Design System Governance |
|:---:|:---:|:---:|
| ![Schedule Operation](docs/canonical-screens/07-schedule-operation-monthly-end-date.png) | ![Flight Result Card](docs/canonical-screens/12-flight-result-card.png) | ![Design System Governance](docs/canonical-screens/01-design-system-governance-console.png) |
| Complex dialog · timing · recurrence · monthly pattern · end date | Custom card layout · flight legs · price zone · action CTA | FCL layout · SideNav · nested table · review calendar |


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

### 3. Download and load the plugin
1. **Download the project** (it contains the plugin): **[Download ZIP](https://github.com/Venelinhr/Claude-To-Figma-SAP-Application/archive/refs/heads/main.zip)**. Unzip it and keep the folder on your disk — Figma reads the plugin from there. (The plugin source: [`plugin/sap-bridge`](https://github.com/Venelinhr/Claude-To-Figma-SAP-Application/tree/main/plugin/sap-bridge).)
2. Open the **Figma desktop app** → **Plugins → Development → Import plugin from manifest…**
3. Choose the file `plugin/sap-bridge/manifest.json` inside the unzipped folder.
4. Start the local bridge. Open Terminal in the unzipped folder and run:
```bash
node build/mailbox.js restart
```
5. In your Figma file open **Plugins → Development → SAP Bridge**. It shows **Connected to Claude**.

### 4. Build your first screen
Type a request in the plugin text box and press **Go**:

> *Build a SAP Fiori Procurement Overview for a purchasing manager who must stop late deliveries. Show four summary cards: Open Purchase Orders, Late Deliveries, Pending Approvals and Spend This Month. Below, a table of purchase orders with PO number, supplier, material, ordered quantity, delivery date, buyer and status. Filters: supplier, plant, buyer, delivery date and status.*

The screen appears in about 40 seconds. Every finished job has a **log icon** in the history list — one click copies the full log.

## Claude Code

Open Terminal in the project folder and start a **fresh session for every screen** (it is faster):
```bash
cd Claude-To-Figma-SAP-Application
claude
```
Then type `/screen`, your request and the Figma link:
```
/screen <your request> https://www.figma.com/design/<FILE_KEY>/…
```
Claude shows the plan and waits. Answer **Approve**, **Reject** or **Modify** — only then it builds.

## Figma Agent

**Install (once):**
1. Open the **SAP Bridge** plugin in your Figma file once. Wait for *Installed for the Figma Agent*, then close it.
2. Download **[SKILL.md](https://github.com/Venelinhr/Claude-To-Figma-SAP-Application/blob/main/.claude/skills/sap-figma-agent/SKILL.md)**.
3. In Figma: **Agent → Skills → Add skill** → upload `SKILL.md`.

**Use:** open a new Agent chat and type your request.
- **New screen:** the Agent shows the plan and asks **Approve / Modify?** before it builds.
- **Change a screen:** select the frame and say what to change. It runs at once.

## Example — what Claude shows you at the PLAN stage

After you send your request, you do **not** get a finished screen right away. First you see a **plan**, and nothing is built until you approve it. This is what you see in Claude Code `/screen` (the Figma Agent shows the same plan and the layer tree):

1. **A wireframe** — the screen drawn in text, region by region.
2. **The SAP components** — which real component is used for each region, and why.
3. **The layer structure (L1–L5)** — the exact layer names the Figma frame will get.

Read it, then answer **Approve**, **Reject** or **Modify**. Only after **Approve** the screen is built in Figma. (The plugin text box builds at once and shows no plan.)

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

## How it works

1. **Route and match** — the request is matched to the closest stored layout.
2. **Content** — the model writes one content-only file (filters, cards, table, steps, title). It never writes geometry.
3. **Audits (no model tokens)** — leftover old words, column count, one colour per status, one date format, text length, required amounts and names, date filter on the date picker, no numbers in coloured status cells.
4. **Door** — only real kit components, bound colour variables, text styles, responsive sizing.
5. **Build, gates, rename** — the plugin builds the frame.

## Three ways to use it

| Route | Where you type | Asks before it builds? | Time to the screen |
|---|---|---|---|
| **SAP Bridge plugin** | the plugin text box in Figma | No — builds at once | **33–39 s** |
| **Claude Code `/screen`** | Claude Code in this folder | **Yes** — plan, then Approve | about 50 s |
| **Figma Agent chat** | the Agent panel in Figma | **Yes** — plan, then Approve | about 1 min 30 s |

All three use the same engine: stored SAP layouts, one content file written by the model, audits that refuse bad content before any Figma call, and scripts that build, check and name the frame.

## How they differ

| | **SAP Bridge plugin** | **Claude Code `/screen`** | **Figma Agent chat** |
|---|---|---|---|
| What it is | A Figma plugin plus a small bridge on your computer | Claude Code in this folder; it plans, then the same plugin builds | Figma's own Agent inside your file, with the skill |
| Who builds the frame | Scripts (the plugin) | Scripts (the plugin) — Claude does **not** type the Figma build | Fixed tool calls stored in the file |
| Model tokens | **Very few.** The model writes one short content file. Layout, build, checks and naming are scripts and cost no tokens. | More: a full chat (reads the rules, shows the 5-section plan and the report) | Runs on Figma's Agent, not on Claude Code |
| Asks before it builds | No | Yes | Yes |
| Time | 33–39 s | about 50 s | about 1 min 30 s |
| Best for | The fastest new screen | A plan, your approval, and a full report | Plans and small edits inside the file |

**Claude → Figma through MCP (the old way, kept only as a fallback).** Claude Code types the Figma Plugin API calls itself through the Figma MCP server (`use_figma`). That is slow and uses many tokens: one screen took about 18 min and 59k tokens in v2, and one hand-written build took 219 turns, 34 min and about $9.5. The current system replaced it: Claude writes the content, scripts do the building through the plugin.

## Token Optimization

The build pipeline is token-optimised — each session uses a fraction of what a naive implementation would consume.

A plugin job writes **one** content file and builds **once**. The audits and the layout hints run as scripts and cost no model tokens — a retry loop of 12 refused content files before one build went to zero.

## Learning & Improving

The system gets smarter with every session. When you confirm something is right, it's saved as a canonical reference for future builds. When something is wrong, the correction is captured automatically and applied from the next build onward. You never need to say "remember this" — every piece of feedback, positive or negative, is stored and recalled when relevant.

You can also add your own rules at any time — just tell Claude "hard rule: always do X" and it will save it to memory and follow it in every future build.

## More documentation

| File | What |
|---|---|
| [`plugin/sap-bridge`](plugin/sap-bridge) | the SAP Bridge Figma plugin |
| [`.claude/skills/sap-figma-agent/SKILL.md`](.claude/skills/sap-figma-agent/SKILL.md) | the Figma Agent skill (source) |

## License

MIT License — free to use, modify, and distribute.
July 2026
