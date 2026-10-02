# SAP Fiori in Figma — v6 summary (2026-10-02)

One engine, four ways to use it. Goal: a correct SAP Fiori screen in Figma from a text request, **fast**, with **real SAP kit parts only**.
Restart facts and lessons are in `SNAPSHOT-2026-10-02.md`. This file is the overview and the comparison.

## 1. The four routes
| Route | What it is | Asks before the build? | Time (Procurement prompt) |
|---|---|---|---|
| **SAP Bridge plugin** | A Figma plugin with a text box. A headless Sonnet job writes the content; scripts build and check. | **No — builds at once** | **33–39 s** |
| **Claude Code `/screen`** | The same engine, started from Claude Code. | **Yes** (5-section plan, Approve) | ≈ 50 s to the frame (1:24 with the long report) |
| **Figma Agent chat + skill** | The Agent inside Figma uses the skill `sap-figma-agent` v9 and tools stored in the file. | **Yes** (plan → show → Approve → build) | ≈ 1:30 with the user's Approve |
| **Figma Make** | Figma's own app builder (SAPUI5 app). Not part of v6. | n/a | **> 2 min** |

Rules (user, 2026-10-02): Claude Code and the Figma Agent **ask first**. Only the plugin builds at once.

## 2. How it works (all three v6 routes)
1. **Route and match.** `route.js` picks the mode; `front.js` picks the closest stored layout (a "gold" tree: `knowledge/gold/trees`, `knowledge/gold/v6`).
2. **Content.** The model writes **one ops file, content only**: `filters`, `cards` (+`sem`), `table`, `steps` (timeline), `title`, `set`, `remove`, `clone`. It never writes geometry.
3. **Audits (0 tokens)** refuse bad content before any Figma call: leftover old words · column count · layer names · one colour per status · one date format · text too long (status label ≤ 22 chars) · amount or "by Name" of the request missing · date filter on the wrong control · numbers in coloured status cells.
4. **Door and layout simulation.** Only real kit parts, bound colour variables, text styles, responsive sizing. Geometry is script-owned; a cloned step or row grows the stack and the frame by script.
5. **Build** through the plugin (≈ 4–7 s in Figma), **gates** (MATCH ≥ 90, HYGIENE 0, STRUCTURE 0), **rename** of the frame by script.

## 3. The plugin bridge
- Plugin + local bridge (`bridge/server.js`, localhost:41778). One **Go** button; the job is a headless Sonnet run of `bridge/prompts/job.md`.
- Built for speed: pre-routing by the bridge, `LAYOUT` hints in the NEED output (exact layer names, op forms, link columns, "must show" slot), compact ops, no `--as-is` for text jobs, hook facts off for plugin jobs only.
- **Log icon** on every history item and on the result card: one click copies the full job log (`trace.md`: steps, seconds, gate lines). Claude Code runs write the same `trace.md`.
- Opening the plugin once in a file installs the **in-file pack** for the Figma Agent (`/v6/pack`).

## 4. The Figma Agent chat and the skill
- Skill `sap-figma-agent` v9, about 10.4 K characters (`docs/v6/figma-agent-skill.md` → `.claude/skills/sap-figma-agent/SKILL.md`; the user re-uploads it after every change).
- The heavy parts are **stored in the Figma file** (runtime, kit helpers, stored layouts, ops, plan drawing, check). The Agent types short fixed calls: `list → names → plan → (Approve) → build → check`. Small edits (`▸ EDIT`) run at once.
- Rules in the skill: coverage checklist (every named filter, card, column and status must exist), card colours with `sem`, quantities and dates in text columns, date filter on the date picker, status label ≤ 22 characters, "late" rows have a date before today.

## 5. Speed results
**Plugin, Procurement prompt:** 3 min 53 s → 2:16 → 1:31 → 0:58 → **0:33–0:39**.
**Plugin, mobile approval timeline (6 approvers):** 3 min 44 s (broken, 3 builds) → 2:05 → 1:39 → 0:58 → **0:34**.
| Step in a 39 s job | Time |
|---|---|
| Route and layout hints | 0–16 s |
| Model writes the ops file once | 16–24 s |
| Build (Figma 6 s) and gates | 26–35 s |
| Frame rename by script | ≈ 1 s |

Claude Code: the frame appeared at 49 s in a **fresh session**; the long report added about 35 s. A long chat is slower (62 s to PASS, 1:20 felt) because every turn re-sends the whole chat.

## 6. Quality results (the same Procurement prompt)
| Frame | Route | Time | Findings |
|---|---|---|---|
| `677:46400` | Plugin (early) | 1:31 | Delivery Date and Status controls swapped; red/orange icons next to quantities; link line repeats the supplier |
| `680:50022` | Plugin | 39 s | Same swap; icon noise; table title "(142)" with 6 rows |
| `680:51086` | Claude Code (long chat) | 62 s | **Best at the time:** filters right, all 3 labels, clean quantities; one "Late" row with a future date |
| `680:52140` | Claude Code (fresh) | 49 s to the frame | Extra "Order Type" filter, filter order changed, icon noise |
| `689:34967` | Agent (first) | – | "Partial Delivery" label missing, icon noise |
| `691:35308` | Agent | 1:30 | Clean; 2 labels missing (the prompt given had lost one sentence); card colour kept from the old layout |
| `693:35643` | Agent | 1:40 | All 3 labels; "Awaiting Supplier Confirmation" stuck out 29 px |
| `698:35643` | Agent (latest) | **1:30** | **Clean:** all labels, filters, quantities, dates, card colours, label fits |

Bugs found in the plugin frames became audits: **FILTER** (date label ↔ date picker), **NOISE** (numbers in coloured status cells), **LENGTH** for status labels, **COVERAGE**. The plugin has not been re-run visually after these audits; the Agent frame `698:35643` shows the result with them.

## 7. Figma Make (comparison)
Make built a working **SAPUI5 web app** (source read from `0E49GCmRVFbbyX7BDw7Zgw`), in **more than 2 minutes**.
- **Strong:** real UI5 controls (tool page, dynamic page, tiles, table, status with icons); all 3 required labels with icons; "N days late" and "X of Y received" computed from today's date; filters that really filter plus a search field; clickable cards that filter the table; 18 consistent purchase orders sorted by status.
- **Weak for design work:** the result is code, not a Figma frame — no layers, no kit instances, no named tokens, not editable in Figma. A Make → Figma route exists in the plugin (other session, branch `figma-make`).
- The rendered look was not seen (the tool returned the source only).

## 8. Which route when
| You want | Use |
|---|---|
| A new, editable Figma screen as fast as possible | **Plugin text box** (33–39 s) |
| A plan and your approval first, with a full report | **Claude Code `/screen`** (fresh chat per screen) |
| Plans and small changes inside the file | **Figma Agent chat** |
| A clickable prototype with real data logic | **Figma Make** |

## 9. Open
- About 20 old draft and test frames on the Figma page (deletion needs the user's word).
- One default date style (`28 Sep 2026`).
- Idea: copy Make's data logic ("N days late", "received of ordered", sorting by status) into the content hints.
- Two failing Make tests belong to the other session.
