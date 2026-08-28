# SAP Suggestion Catalog — proactive "suggest X not Y" recognition

> **Purpose:** the concrete recognition catalog that operationalizes RULE 12's "suggest
> improvements". The agent scans the request, the reference, and the planned/built screen,
> and — at the **wireframe gate (Gate 3), before building** — surfaces any applicable
> suggestion below with a one-line rationale. The user approves wireframe + suggestions
> together, then the build proceeds.
>
> **Note:** Gate 3 (wireframe approval) applies to **Claude Code CLI builds only**. The
> Figma AI Agent (blue button in Figma) uses this catalog proactively without a gate —
> it surfaces suggestions before executing, but does not require explicit wireframe approval.
>
> This doc is a CATALOG, not a rulebook. Each entry points to the RULE that already enforces
> it — nothing here is restated. Execution recipes are NOT here; see RULE 28 (clone-canonical)
> and `docs/REPAIR-PATTERNS.md`. User intent always wins — these are recommendations, not blocks.

---

## How to use it

1. During analysis (Gate 0) and planning (Gate 3), match the screen against the triggers below.
2. In the wireframe proposal, add a short **"Suggestions"** block:
   `⚡ <trigger observed> → suggest <better SAP solution> (why). [see RULE N]`
3. If the user accepts, apply it in the build. If they decline, proceed with their intent.
4. Keep it brief — only surface suggestions that genuinely improve usability, SAP
   compliance, consistency, or UX. Do not pad the wireframe with obvious/no-op suggestions.

---

## Verb vocabulary (express suggestions consistently)

`Create · Move · Replace · Swap · Convert · Wrap · Merge · Split · Group · Clone · Inject · Reuse · Optimize · Validate · Repair`

Example phrasings: "Replace the plain-text status with ObjectStatus", "Move destructive
actions into the overflow menu", "Clone the approved Orders List and inject the new columns".

---

## Components  [enforced by RULE 8/14/23/25]

| Observed (trigger) | Suggest | Why |
|---|---|---|
| Status shown as plain text | **ObjectStatus** (Semantic) | Semantic color + icon, theme-safe, screen-reader friendly |
| Custom pill / native frame for status | **ObjectStatus** | A native pill is not SAP-bound (the recurring "custom pill" bug) |
| Grid Table for read-mostly data | **Responsive Table** | Adapts across breakpoints; SAP default for lists |
| List with columnar data | **Table** | Columns need a Table, not a List |
| Panel used as a content container | **Card** | Cards are the SAP surface for grouped summary content |
| Custom control (hand-built input/toggle) | **SAP component** | Real kit instance inherits tokens + a11y |
| Native frame standing in for a component | **SAP Web UI Kit instance** | The Layers-panel test (RULE 12) |
| Multiple controls doing one job | **One SAP component** | Simplify composition |

## Navigation  [enforced by RULE 8; canonical SideNav/IconTabBar patterns]

| Observed | Suggest | Why |
|---|---|---|
| Many Segmented Buttons as top nav | **IconTabBar** | Scales, supports overflow + counts |
| Flat tabs for a deep app | **Side Navigation** | Hierarchical, room for groups |
| Deep hierarchy, no wayfinding | **Breadcrumbs** | Orientation for nested detail screens |
| Edit / View / Details / More click | **Open a detail screen or dialog** | Give the action a real destination |
| Long single dialog | **Object Page navigation** or **Wizard** | Break complex tasks into sections/steps |

## Actions  [enforced by RULE 10; hard rule Tertiary icons]

| Observed | Suggest | Why |
|---|---|---|
| >1 `Primary` button in a group | **One Primary; rest Secondary/Tertiary** | SAP allows a single primary action |
| Destructive action inline + prominent | **Move to overflow menu** | Prevents accidental data loss |
| Text buttons for row actions | **Icon-only IconButtons (Tertiary)** | Compact, less clutter in dense rows |
| Scattered related actions | **Group into a toolbar / overflow** | Consistent action affordance |
| Irreversible action, no guard | **Add a confirmation dialog** | Safety for destructive ops |

## Semantic states  [enforced by RULE 2; ObjectStatus Semantic]

| Observed | Suggest | Why |
|---|---|---|
| Custom hex for status color | **SAP semantic color** | Theme-switchable, audit-clean |
| Error shown as Success/neutral | **Negative** semantic | Correct meaning |
| Info used for a caution | **Warning** semantic | Correct meaning |
| Pending/at-risk state | **Critical / Warning** as appropriate | Communicates urgency |
| ObjectStatus with wrong Semantic | **Correct the Semantic prop** | Semantic ≠ decoration |

## Forms  [enforced by RULE 24; field FILL hard rule]

| Observed | Suggest | Why |
|---|---|---|
| Free-text Input for a fixed set | **Select** | Constrains to valid values |
| Select with many options / typing | **ComboBox** | Type-ahead over long lists |
| Reference to another entity | **Value Help** | Standard SAP entity picker |
| One field, multiple values | **MultiInput** | Tokenized multi-value entry |
| Unordered / ungrouped fields | **Group + order by task** | Faster completion |
| Required fields not marked | **Mark mandatory** | Clear validation intent |

## Tables  [enforced by RULE 8; Responsive Table pattern]

| Observed | Suggest | Why |
|---|---|---|
| All columns equal priority | **Column priority + hide low-priority** | Focus on what matters at each width |
| No way to narrow results | **Filters / sort / group** | Findability at scale |
| Per-row work needed | **Row actions** | Direct manipulation |
| Bulk work needed | **Selection + mass actions** | Efficiency for queues |

## Layout  [enforced by hard rules: 32px padding, two-line CENTER, FILL]

| Observed | Suggest | Why |
|---|---|---|
| Cramped / inconsistent spacing | **SAP spacing tokens** | Rhythm + consistency |
| Everything one column | **Two/three-column** for summary cards | Scan efficiency |
| Header + content ad-hoc | **Dynamic Page / Object Page** | SAP floorplan structure |
| Visual clutter | **Simplify / regroup sections** | Reduce cognitive load |

## Content  [enforced by RULE 16; realistic enterprise data]

| Observed | Suggest | Why |
|---|---|---|
| Placeholder / lorem text | **Realistic business data** | Every screen supports a real process |
| "Tab Text" / generic labels | **Meaningful labels** | The placeholder-tab bug |
| Vague button text | **Action-oriented verb labels** | Clarity of outcome |
| Generic section names | **Business-oriented terminology** | Domain fit |

## Reuse first  [enforced by RULE 28 + RULE 31]

| Observed | Suggest | Why |
|---|---|---|
| Similar approved screen exists | **Clone it + inject content** — don't rebuild | Consistency + speed (RULE 31) |
| SAP composite with slots | **Clone canonical → clear slot → repopulate** | Slots survive; scratch build loses them (RULE 28) |
| Only a few components differ | **Swap only what changed** | Minimal-diff edit |

## Business logic / workflow  [enforced by RULE 16/20]

| Observed | Suggest | Why |
|---|---|---|
| Screen ends with no next step | **Suggest the next logical action** | Guide the workflow |
| Status changes with no trail | **Activity timeline / audit history** | Traceability |
| Approval-shaped process | **Approval flow + status transitions** | Model the real process |
| Derivable values entered by hand | **Calculated fields** | Reduce manual work |

---

## What this catalog does NOT do
- It does not restate execution recipes → see RULE 28 + `docs/REPAIR-PATTERNS.md`.
- It does not block builds → suggestions are advisory; user intent wins (RULE 16).
- It does not replace the hard rules → those are enforced regardless (Horizon Light,
  real instances, [typo:role], no Divider frames, Compact, node URL, etc.).
