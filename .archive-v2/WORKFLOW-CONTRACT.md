# ⛔ WORKFLOW CONTRACT — Read and OBEY before ANY Figma SAP task

> **AUTHORITY — this doc governs the WORKFLOW (what to do, in what order, which rules/skills apply).**
> Scope hierarchy (declared in CLAUDE.md): gate ORDER + PASS/FAIL → `skill/SYSTEM_PROMPT.md` gate sequence ·
> build DATA (component keys, token hexes, canonical clone nodes) → `SAP_BUILD_MANIFEST.md` ·
> where any rule lives → `docs/OPERATING-MANIFEST.md` (a map, not a rulebook).
> Before building a new screen, suggesting improvements, planning a next step, editing,
> or proposing a variant — you MUST load, read, understand, and strictly follow this
> workflow. It governs every task, every time. Nothing ships that violates it.

---

## The contract (acknowledge before you act)

When the user asks you to build, improve, extend, edit, or suggest anything for a
Figma SAP application screen, you **first**:

1. **Load this contract** and the linked rules below.
2. **Analyze the source screen** (if one exists) — read its SAP tokens, instances,
   component states, menu/nav states via `get_design_context` / `get_metadata`.
3. **Follow the 10-step build flow and the 31 rules** — no shortcuts, no drift.
4. **Use ONLY real SAP components, tokens, and text styles** — never native look-alikes,
   never raw hex, never raw `72` font.
5. **Preserve states** — menu/nav active states, component states (ObjectStatus Semantic,
   Button Type, Interaction State) must be intentional and correct.
6. **Verify against this checklist, then hand off** with a validated node URL + Bind reminder.

This applies to **follow-up edits and improvement suggestions too** — not just fresh
builds. An "improve this screen" request goes through the same discipline as a new build.

---

## Compliance checklist — EVERY output must satisfy all of these

- [ ] **ASCII wireframe + L1–L5 shown BEFORE any build** — even for clones, even for "same screen", even when recognizing a canonical. The wireframe IS the visual confirmation when user shares an image. `enforce-wireframe-first.sh` injects this as a hard directive.
- [ ] **Analyzed the source screen first** (tokens, instances, states) before proposing anything
- [ ] **Real SAP instances only** — `importComponentSetByKeyAsync` → `createInstance()`. Never `createFrame()` for a component (Button, Input, Select, Table, ObjectStatus, IconTabBar, ShellBar, etc.)
- [ ] **SAP text styles** — every text node has a `[typo:role]` name tag. NEVER raw `fontName:{family:'72'}` alone. (Raw 72 = Bind fails.)
- [ ] **SAP tokens** — every fill/stroke is a `[sapToken]`-tagged SAP variable. Never raw hex.
- [ ] **Dividers** — NEW builds: 1px lines = stroke on the parent (`strokeBottomWeight`/`strokeTopWeight`), never `createFrame()`. EXCEPTION — cloned canonical/gold-standard nodes (e.g. the Schedule dialog) KEEP their existing 1px native `Divider` frames: PM-approved, never convert to strokes. `/sap-fix` may flag them, never remove them.
- [ ] **Compact form factor** by default on all instances. Never switch to Cozy to silence a11y warnings.
- [ ] **Two-line stacked text** → `counterAxisAlignItems='CENTER'`.
- [ ] **32px side padding** on containers (never 48).
- [ ] **IconButtons Type:Tertiary** for action icons.
- [ ] **Full horizontal FILL** — set `layoutSizingHorizontal='FILL'` AFTER appendChild.
- [ ] **L1–L5 semantic naming** — no "Frame 1", "Group", generic names.
- [ ] **Horizon Light theme** always (dark reference → build light).
- [ ] **Menu/nav labels correct** — no placeholder "Tab Text"; active tab matches the screen.
- [ ] **Ends with a validated Figma node URL** (hyphen form) + "run Bind SAP Tokens".
- [ ] **Auto-save all feedback** — never ask "should I save this?"; positive and negative feedback is captured automatically by `feedback-learn.sh`.

---

## The mandatory sources (load these — they are the law)

| Source | File | What it governs |
|---|---|---|
| **31 Rules + gate sequence** | `skill/SYSTEM_PROMPT.md` | The full rule glossary + canonical gate order |
| **10-step build flow** | `skill/SYSTEM_PROMPT.md` (top) + `CLAUDE.md` | Step 1→10, never skip a step |
| **Hard rules** | `CLAUDE.md` (top) | Horizon Light · node URL · typo:role · 5 build rules · auto-save feedback · horizontal FILL |
| **Skills** | `/sap-vdi` (analyze) · **`/sap-screen` (build — canonical, project 10-step)** · `/sap-fix` (repair) · `/sap-figma-agent` (Figma Agent on-canvas) · `/sap-bind` (global alias of the build path — prefer `/sap-screen` in this repo) | Invokable pipeline stages |
| **Canonical screens** | `docs/canonical-screens/CANONICAL-SCREENS.md` | Clone sources — reuse before rebuild |
| **Suggestion catalog** | `docs/SAP-SUGGESTION-CATALOG.md` | Proactive "suggest X not Y" — surfaced at the wireframe gate |
| **Lessons** | `MEMORY.md` index (global memory) | Every confirmed fix + correction, applied automatically |
| **Build manifest** | `SAP_BUILD_MANIFEST.md` | Component keys §3 · canonical nodes §3b · token tags §4 · typo roles §5 |

---

## Repairing an existing non-compliant screen

If a screen already violates the contract (raw 72, dividers, placeholder tabs, native
components), run **`/sap-fix <nodeId>`** — the reusable auto-repair skill. It audits the
node, fixes typo tags / dividers / tabs / buttons / generic names, verifies, and hands off.

---

## Why this exists

Rules spread across many files were only applied when remembered. On follow-up edits and
"improve this" requests, the agent drifted — raw 72 fonts, native dividers, placeholder
nav. This contract is the ONE entry point loaded first, every task, so compliance is the
default, not an afterthought. The agent is a compliant assistant of this project.
