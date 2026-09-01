# AUDIT-V2 — performance, tokens, time, quality (2026-09-01)

**Scope:** version 2 only (`sap-pipeline-v2`, branch `pipeline-v2`). Nothing here touches version 1.
**Targets (CLAUDE.md, "Adaptive Execution"):** one screen in **3–5 min** and **≤10–12k output tokens**, real SAP instances only, one screenshot at hand-off.
**Method:** every number below comes from the raw Claude Code session logs (`~/.claude/projects/**/*.jsonl`) via `build/measure-build.sh` (new, read-only). Every claim has a proof pointer (a file:line or a log timestamp). Three background investigator agents were used; one of their claims was wrong (it said the v1 scope guard walks up from the session cwd — it does not, see §1.1) and was refuted against the raw file. Nothing in this document is taken from an agent without a raw-file check.

Reproduce:
```bash
bash build/measure-build.sh ~/.claude/projects/-Users-C5408360/e4549909-ade8-422e-b77f-afa752ab57b4.jsonl --day 2026-09-01
bash build/measure-build.sh ~/.claude/projects/-Users-C5408360-Downloads-sap-pipeline-v2/a9da4b29-459d-4b30-8a27-dfba8f2706aa.jsonl
```

---

## 0. The two runs, side by side

| | **Run A — Sep 1 (the run you judged)** | **Run B — Aug 28 (v2 with gates on)** | Target |
|---|---|---|---|
| Launched from | `$HOME` (wrong) | `sap-pipeline-v2` (right), via `/sap-screen` | project folder |
| SAP gates | **DORMANT** (0 gate events in log) | **ACTIVE** (blocked 4×, approval captured 2×) | active |
| Build time | **7.1 min** (18:24:11 → 18:31:16) | **13.8 min** (10:47:20 → 11:01:10); 17.5 min session | 3–5 min |
| Output tokens | **33,122** in the build; 37,628 session | **43,895** in the build; 44,234 session | ≤12k |
| `use_figma` calls | 9 (2 failed on Figma API errors) | 5 (**all 5 blocked by gates**) | 1 (2 for 8+ components) |
| Code generated for Figma | 65 KB | 75 KB — **none of it ever ran** | ~15 KB once |
| Screens built | 1 (native-heavy) | **0** | 1 |
| Native : SAP instance (code) | 55 : 10 ⚠ | 11 : 45 ✓ (never executed) | ~0 : n |
| Screenshots | 6 | 0 | 1 |
| Context before first word | 88k | 109k | — |
| Avg context / turn | 120k | 136k | — |
| Ran out of context (compaction) | yes, 1 min after hand-off | yes | never |

**Reading this table:** Run A built the wrong thing fast. Run B refused to build the right thing, five times. Neither is v2 working as designed. The fixes are different for each, and both are needed.

---

## 1. What was actually tested

### 1.1 Run A never ran v2 (Sep 1, session `e4549909`)

The first prompt of the session was, literally:
```
cd "/Users/C5408360/Downloads/sap-pipeline-v2"
claude
```
typed **into Claude**, not into the terminal (log 18:23:50). The session's project root was therefore `$HOME` (`.cwd = /Users/C5408360` for the first 25 turns; the build request arrived at 18:24:11 while cwd was still `$HOME`).

Consequences, each verified:
1. **v2's `.claude/settings.json` (24 hook registrations) was never loaded.** Project settings load from the launch directory at startup; a later `cd` inside Bash does not reload them.
2. **v2's `CLAUDE.md` was never loaded** — none of the hard rules, the gate sequence, or the token targets were in context.
3. **The global hooks are pinned to v1's path** and no-op everywhere else. v1 `.claude/hooks/sap-scope-guard.sh:21` sets `SAP_PROJECT="/Users/C5408360/Downloads/Task to Figma SAP layouts components"`; lines 32–35: `case "$CWD" in "$SAP_PROJECT"|"$SAP_PROJECT"/*) ;; *) exit 0 ;;`. cwd was `$HOME`, then v2 — both fall into `*) exit 0`. (v2's copy of this dispatcher walks up from cwd; v1's does not. The investigator agent read v2's copy and reported it as v1's.)
4. **Proof of zero gates:** the session log contains 0 × `wireframe-first-gate`, 0 × `approval-captured`, 0 × `workflow-contract-directive`, 0 × `GATE … BLOCKED`. The only "BLOCKED" string is inside a hook *definition* echoed from global settings, not a fired hook.
5. **Claude chose the global legacy skill** `SAP-Figma-screen-creator` (the 7-step JSON-spec pipeline that CLAUDE.md marks "retained but NOT the default"), wrote `output/purchase-order-overview-spec.json` (18:25:23, 3,477 output tokens), validated it with `sap-spec-validate`, then built through `use_figma` anyway. The spec was dead weight.

So the three defects you saw — no approval question, header not full width, native checkbox — all have the same first cause: **no v2 gate was active.** The two fixes committed earlier today (`8f8c24f`: F-11 approval-needs-a-demand; DPH FILL guard) close real gaps that the investigators found in v2's *code*, but they are not what Run A hit. Run A hit "nothing was on."

### 1.2 Run B was v2 with gates on — and it built nothing (Aug 28, session `a9da4b29`)

Launched correctly from the v2 folder with `/sap-screen`. Gates ACTIVE (`wireframe-first=1 approval-captured=2 blocked=4`). Then:

| Time | `use_figma` code | Result |
|---|---|---|
| 10:53:06 | 17 KB (cf 3 · ci 9) | ⛔ blocked — `guard-reuse-gate.sh` |
| 10:55:03 | 15 KB (cf 2 · ci 9) | ⛔ blocked — `guard-architect-gate.sh` |
| 10:57:15 | 15 KB (cf 2 · ci 9 · clone 1) | ⛔ blocked — `guard-reuse-gate.sh` |
| 10:59:08 | 13 KB (cf 2 · ci 9 · clone 1) | ⛔ blocked — `guard-reuse-gate.sh` |
| 11:01:10 | 13 KB (cf 2 · ci 9 · clone 1) | ⛔ blocked — `guard-wireframe-gate.sh` |
| 11:02:59 | — | context exhausted → compaction |

Five times the agent generated the full screen (≈7k output tokens each, ≈35k total), and five times a gate refused it — a *different* gate each time. The log shows exactly one gate's message per refusal, so each attempt taught the agent one missing precondition. The "approved" prompt at 10:55:35 cost 22,307 tokens of follow-up with three blocked builds inside it. Three bare `continue` prompts (10:51–10:53) were needed to get the agent moving after stops.

**The gates did their job. The cost model around them is the defect:** the check happens *after* the expensive step (code generation), one precondition at a time, on a monolithic 13–17 KB payload.

---

## 2. Time and tokens — where they went

### 2.1 Run A, minute by minute (Sep 1, ungated)

| Time | Output tok | What | Verdict |
|---|---|---|---|
| 18:24:11–18:24:56 | ~2,000 | skill load, 9 Bash calls, legacy pipeline steps | detour |
| 18:25:23 | 3,477 | `Write output/purchase-order-overview-spec.json` — JSON path, never used by the MCP build | **waste** |
| 18:26:04 | 2,002 | plan/wireframe text — then built without waiting | no gate |
| 18:26:13 | — | `get_screenshot` #1 (reference) | ok |
| 18:27:44 | **8,420** | `use_figma` #1, 21.7 KB — **failed**: `primaryAxisSizingMode … received 'HUG'` (valid: FIXED/AUTO) | **waste — documented gotcha** |
| 18:28:58 | **7,060** | `use_figma` #2, 18.1 KB — **failed**: `FILL can only be set on children of auto-layout frames` (FILL before append) | **waste — documented gotcha** |
| 18:30:06 | 6,461 | `use_figma` #3, 16.3 KB — success, node `4:11560` | the build |
| 18:30:28–18:30:38 | — | `get_screenshot` #2, #3 | over budget |
| 18:30:50–18:31:11 | 2,247 | 3 property-injection calls (buttons, ObjectStatus) | ok |
| 18:32:35 | — | **compaction** — context 159k | quality risk |

Sum in the build window: **33,122 output tokens, 7 min 05 s.** 21,941 of them (66 %) were the three full-screen generations; 15,480 (47 %) were the two that threw away. Both errors are already written down: `skill/references/figma-build-patterns.md` gotcha table rows 3 and 15, CLAUDE.md "NEVER set FILL before appendChild". Nothing checks the code against those rows before it is sent.

### 2.2 Run B, prompt by prompt (Aug 28, gated)

| Prompt | Window | Output tok | `use_figma` | Notes |
|---|---|---|---|---|
| `/sap-screen …` 10:47:20 | 2 min | 6,292 | 0 | VDI + wireframe presentation |
| `go` 10:49:22 | 1 min | 1,233 | 0 | 2 × `get_design_context` |
| `continue` 10:51:02 | 0 | 1 | 0 | agent had stopped |
| `continue` 10:51:46 | 1.5 min | 7,253 | 1 (blocked) | |
| `continue` 10:53:43 | 1.5 min | 6,809 | 1 (blocked) | |
| `approved` 10:55:35 | 5.6 min | **22,307** | 3 (all blocked) | 25 Bash calls fighting markers |
| compaction 11:02:59 | 1 min | 339 | 0 | out of context |

### 2.3 The fixed cost — context before you type

Measured at the first assistant turn: **88k tokens from `$HOME`, 109k from the v2 folder.** Average per turn 120–136k; ceiling hit at ~160k after 45–50 turns → compaction. Every turn re-reads this (cache reads are cheap per token, but each turn is slower and the window fills faster).

Estimated composition (the 88k/109k totals are measured; the split is estimated — see §7 for how to measure it exactly):

| Component | Size | Loaded |
|---|---|---|
| MCP tool schemas — ≈190 tools from ~15 servers, with duplicates: `figma` ×3 (`figma`, `Figma`, plugin), `sap-design` ×2, UI5 ×2, `chrome-devtools` ×3, `visualize` ×2 | ~55–65k (est.) | every turn |
| Claude Code system prompt + user CLAUDE.md (2.5 KB) + RTK.md | ~9–11k (est.) | every turn |
| Global memory index `MEMORY.md` (17.4 KB, 130 files) | ~4.4k | every turn |
| Skill index (≈120 skills, one line each) | ~3–5k (est.) | every turn |
| **v2 `CLAUDE.md` (44,426 B)** | **~11.1k** | every turn, in v2 folder |
| v2 skill descriptions (6 skills) + SessionStart hook output | ~1–2k | every turn, in v2 folder |
| `enforce-wireframe-first.sh` directive (≈50 lines) | ~0.7k | every build prompt |
| `recall-lessons.sh`, `recall-vdi.sh`, `feedback-learn.sh` output | 0–2k | every prompt |

Knowledge a correct v2 build then loads on top: `/sap-screen` SKILL.md 35.4 KB (~8.9k), Figma `figma-use` skill (~4k est.), `SAP_BUILD_MANIFEST.md` 21.9 KB (~5.5k), `figma-build-patterns.md` 33.9 KB (~8.5k) if read, `skill/SYSTEM_PROMPT.md` 92 KB (~23k) if read. So a gated build starts its first `use_figma` call at ≈135–150k context — ~10–25k from the ceiling. That is why both runs compacted.

Missing: `.claude/hooks/.sap-session-banner.txt` does not exist in v2 (settings.json cats it at SessionStart; `2>/dev/null` hides the failure). There is no visible "v2 gates ACTIVE" signal at session start — which is exactly what would have caught Run A in second one.

---

## 3. Quality — what came out, and why

### 3.1 Run A defects and root causes

| Defect (your words) | Root cause | Status |
|---|---|---|
| "It didn't ask to approve" | No gate active (§1.1). Separately, v2's `capture-approvals.sh` could convert an approval-shaped word into `.wireframe-approved` with no wireframe ever demanded — a real gap. | Launch-dir: **open (P0)**. Regex gap: **fixed `8f8c24f`** (F-11: `.wireframe-pending` must exist first; regression test added). |
| "Dynamic Page Header wasn't fit wide, components hidden" | `figma-build-patterns.md` DPH snippet set `layoutSizingHorizontal='FILL'` with no parent-FIXED guard and no read-back — the documented HUG-parent silent no-op (gotcha row 3) that the Form Field fix already handles. | **fixed `8f8c24f`** (3-level guard + post-strip read-back). Automated INV 5 width/overflow check: **in progress** (`build/verify-invariants.js` + 3 fixtures, other session, uncommitted). |
| "Checkbox was native, not SAP" | Final build code: `createFrame` ×17, `createInstance` ×3, `import` ×6. Checkbox drawn as text `☐` (18:40:54 fix: "Replaced 8 native checkbox text nodes"). Then Select cells too. `guard-figma-code.sh:33` blocks only when instances == 0 — a 17:3 ratio passes. `lint-instance-ratio.js` (aggregate ≥0.20) is not wired to live builds. `verify-invariants.js` (per-node, would have named it) runs only if Claude remembers. | Auto-run of `verify-invariants.js`: **in progress** (other session). Ratio threshold: **open (P3)**. |

### 3.2 Which quality checks are mechanical, and which depend on memory

| Invariant | Enforced by | Live on a real build? |
|---|---|---|
| Wireframe approved before build | `guard-wireframe-gate.sh` (PreToolUse) | yes — if the session is in the project folder |
| Reference selected, reuse declared, architect approved | `guard-reference-gate.sh`, `guard-reuse-gate.sh`, `guard-architect-gate.sh` | yes — same condition; one failure reported at a time |
| No native frame standing in for a component | `guard-figma-code.sh` | only the extreme case (0 instances, or a `createFrame` named after a SAP component) |
| Instance ratio | `lint-instance-ratio.js` | **no** — CI fixture only |
| Per-node fake-component, raw hex, typography, naming (INV 1-4, 8) | `verify-invariants.js` | **no** — manual; `mark-build.sh` prints a reminder; `lint-on-stop.sh` blocks hand-off only if a `verify.json` is missing/failing inside a 10-min window |
| Width / overflow (INV 5) | — | **no** — being added |
| Known Figma API traps (HUG enum, FILL-before-append, STRETCH, `individualStrokeWeights`) | prose only (gotcha table) | **no** |
| Screenshot budget (1) | prose only | **no** |
| Token/time targets | prose only | **no** — never measured until `measure-build.sh` |

---

## 4. Fixed-cost inventory (what loads, when)

| File / hook | Bytes | ≈ tokens | When |
|---|---|---|---|
| `CLAUDE.md` (v2) | 44,426 | 11,100 | every turn |
| `WORKFLOW-CONTRACT.md` | 5,773 | 1,440 | when read (directive tells the agent to) |
| `SAP_BUILD_MANIFEST.md` | 21,935 | 5,480 | every build (by design) |
| `skill/SYSTEM_PROMPT.md` | 92,014 | 23,000 | when read (gate order authority) |
| `skill/SKILL.md` (legacy JSON path) | 33,730 | 8,430 | when the legacy skill is chosen |
| `skill/references/figma-build-patterns.md` | 33,901 | 8,475 | when read |
| `.claude/skills/sap-screen/SKILL.md` | 35,419 | 8,850 | every `/sap-screen` |
| `.claude/skills/sap-figma-agent/SKILL.md` | 22,385 | 5,600 | when invoked (Figma-Agent side; was invoked in Run A) |
| `.claude/skills/sap-fix/SKILL.md` | 6,190 | 1,550 | `/sap-fix` |
| `docs/SAP-SUGGESTION-CATALOG.md` | 7,810 | 1,950 | Gate 3 suggestions |
| `enforce-wireframe-first.sh` directive | ~2,800 | ~700 | every build/edit prompt |
| `load-workflow-contract.sh` directive | ~700 | ~170 | session start |
| `.sap-session-banner.txt` | **missing** | 0 | session start (should print "gates active") |
| Global `MEMORY.md` index | 17,420 | 4,350 | every turn |

Note the duplication: the gate sequence, the 10-step flow, the hard rules and the token targets appear in `CLAUDE.md`, `WORKFLOW-CONTRACT.md`, `SYSTEM_PROMPT.md`, `sap-screen/SKILL.md` and the hook directives. CLAUDE.md's own "DOC AUTHORITY HIERARCHY" already assigns one owner per scope — the restatements are the ~11k that could go.

---

## 5. Pain points, ranked

Priority = risk (what breaks) × frequency (how often) × cost (tokens/minutes). Effort S/M/L.

| # | Pain point | Proof | Fix | Gain | Effort | Risk |
|---|---|---|---|---|---|---|
| **P0** | **Wrong launch directory → all gates silently off.** Nothing tells you. | §1.1; log 18:23:50; v1 `sap-scope-guard.sh:21,32-35`; 0 gate events | (a) `bin/sap-v2` launcher (`cd` + `claude`); (b) SessionStart banner file restored: prints "SAP v2 — 24 gates ACTIVE"; (c) global `UserPromptSubmit` guard: if the prompt asks for a SAP/Figma build and no project hook is active → loud "⛔ GATES OFF — you are in `$HOME`" | never test the wrong thing again; every future number is trustworthy | S | none |
| **P0'** | **Gates fire after code generation, one at a time.** Five 13–17 KB builds refused in a row. | §1.2; 5 × "PreToolUse hook error"; 44k tokens, 0 screens | (a) **Readiness check before code**: `node build/gate-status.js` lists *all* missing preconditions at once (reference · reuse · architect · wireframe · scratch · workflow · manifest); the `enforce-wireframe-first.sh` directive injects it, so the agent satisfies everything in one pass and generates code once. (b) **Aggregate the PreToolUse chain**: one wrapper runs every guard and reports all failures in one block message. (c) Guards run first on a cheap `--dry-run` payload (`use_figma` with `code:"// preflight"`) that the agent sends before generating the real code. | −20–35k tokens and −8 min per gated build; no re-generation loop | M | low |
| **P1** | **Known Figma API traps are prose only.** Two of three builds died on documented gotchas. | §2.1 18:27:44, 18:28:58; `figma-build-patterns.md` gotcha rows 3, 15 | `guard-api-gotchas.sh` (PreToolUse on `use_figma`): grep the code for `primaryAxisSizingMode\s*=\s*['"]HUG`, `counterAxisSizingMode\s*=\s*['"](HUG|FILL)`, `counterAxisAlignItems\s*=\s*['"]STRETCH`, `individualStrokeWeights`, `layoutSizingHorizontal\s*=\s*['"]FILL` on a node before its `appendChild` (same-line or preceding-line heuristic). Block with the exact fix text from the gotcha table. | −15k tokens, −2.5 min whenever it fires (it fired twice in one build) | S | low — false positives only cost one re-read of the message |
| **P2** | **Monolithic build code.** One error or one block throws away 13–21 KB. | §2.1, §1.2 code sizes | Zone-by-zone build as the default for List Report/Object Page: skeleton (shell + page) → header → filters → table → footer, each call ≤5 KB and returning `{created, instances, native, unboundHex}`. The 2-call split is already sanctioned for 8+ components — make it 4–5 calls with QA folded in. | halves the cost of any failure; partial progress survives | M | low |
| **P3** | **"Only SAP components" is not mechanical.** 17:3 native ratio passed; checkbox was text. | §3.1; `guard-figma-code.sh:33`; no live `verify-invariants` run ever (0 `*-verify.json` on disk, ever) | (a) `guard-figma-code.sh`: block when `createFrame > 2 × (createInstance + clone)` unless the code declares `// layout-only: N frames`; (b) auto-run `verify-invariants.js` from `mark-build.sh` on the built node (in progress); (c) per-component rule: any `createFrame`/`createText` whose name matches a registry component name is a hard block (extend Block 2's list from 8 names to the full registry). | "only SAP" becomes a guarantee, not a hope | S | low |
| **P4** | **88–109k tokens before the first word; compaction after ~45 turns.** | §2.3; first-turn usage in both logs | (a) Disable duplicate/unneeded MCP servers *for this project* (`.claude/settings.json` → `disabledMcpjsonServers`, plugin scoping) — keep `figma` and one SAP knowledge server; (b) slim `CLAUDE.md` 44 KB → ≤10 KB: keep the authority hierarchy, the launch instruction, the gate table and the targets; move every restated rule to its owner file; (c) audit the 130-file global memory index for SAP entries that belong in the project. | base context 88k → ~40–50k (measure exactly, §7); no compaction inside a build; faster turns | M | medium — a dropped hard rule is a regression; verify by diffing rule inventories before/after |
| **P5** | **Screenshots over budget.** 6 in Run A (3 inside the build). | §2.1 | `guard-screenshot-budget.sh` (PreToolUse on `get_screenshot`/`take_screenshot`): allow 1 per build marker; 2nd+ returns "use the QA text return; screenshot only at hand-off" unless the user asked. | −5 round trips, ~−7k tokens | S | low |
| **P6** | **Whole-page `get_metadata`** = 41 KB (~10k tokens) in one call. | §2.1; `READS get_metadata 41 KB` | Rule + hook: `get_metadata` only with a `nodeId` (never the page id) during a build; use the canonical index (`docs/canonical-screens/CANONICAL-SCREENS.md`) to find nodes. | −10k tokens per build | S | none |
| **P7** | **Legacy JSON-spec skill is still selectable** and was selected. | §1.1 item 5; `Write output/…-spec.json` 3,477 tok | Rename the global `SAP-Figma-screen-creator` → `sap-legacy-spec` with a description that says "JSON spec path — NOT for MCP builds"; make v2's `/sap-screen` the only match for "build a SAP screen". (Global skill = user's machine config — propose, you apply.) | −3.5k tokens, −1 min, no dead spec files | S | low |
| **P8** | **The agent stops mid-flow.** Three bare `continue` prompts in Run B. | §2.2 | Once P0' lands (all preconditions listed up front) the stops should disappear; keep this as a metric in `measure-build.sh` (prompts that are just "continue") and re-check after P0'. | fewer human nudges | — | — |
| **P9** | **No baseline, no measurement.** "Not improved" could not be tested. | §0; no `*-verify.json`, no metrics anywhere | `build/measure-build.sh` (delivered) + Stop hook that appends one line per build to `output/metrics.jsonl` + a golden prompt (Purchase Order Overview) run after every pipeline change. | every change is measured the same way | S | none |

---

## 6. New capabilities (beyond fixing)

1. **`build/measure-build.sh` — delivered.** One command, one number set: duration, output tokens, context per turn, `use_figma` calls split into blocked/API-error, native ratio, screenshots, reads, compactions, gates ACTIVE/DORMANT, build episodes vs target. Read-only. Reproduces Run A's numbers to the token.
2. **Gate readiness check (`gate-status`)** — lists every missing precondition before any code is written. Turns five sequential refusals into one checklist. (P0')
3. **Gotcha lint** — the gotcha table becomes a machine check. (P1)
4. **Launch guard + banner** — the state of the gates is visible in the first second of every session. (P0)
5. **Build telemetry** — `output/metrics.jsonl`, one line per build, written by a Stop hook; the golden prompt makes runs comparable. (P9)
6. **Aggregate gate report** — one block message listing all failing gates. (P0')

---

## 7. Re-test protocol (apples to apples)

1. **Launch correctly — in the terminal, not in Claude:**
   ```bash
   "/Users/C5408360/Downloads/sap-pipeline-v2/bin/sap-v2"
   ```
   The first assistant turn must show `✅ SAP pipeline v2 — project hooks ACTIVE`. If it does not, stop: the gates are off.
2. **Same prompt as Run A** (Purchase Order Overview: 6 filters, 7 columns, status badges, search/sort/drill-down, save to the same Figma file). Fresh session. Answer the wireframe question with one word: `approve`.
3. **Measure:**
   ```bash
   bash build/measure-build.sh --latest
   ```
   Expected today (after `8f8c24f`, before Part C): gates ACTIVE; the wireframe question is asked; likely still over target on tokens because P0'/P1/P2 are not in place — that number is the true v2 baseline.
4. **Measure the fixed cost exactly:** start one session with only the `figma` MCP server enabled (`claude --mcp-config` with a minimal file, or disable the others in settings), read the first-turn context from `measure-build.sh --latest`. The difference to 109k is the exact price of the duplicate servers — this decides how much of P4 is worth doing.
5. **Then the same prompt on version 1**, launched from its own folder, measured with the same script. That is the comparison you asked for — later, and only after v2 is fixed.

---

## 8. Status after Part C (2026-09-01, same day — "fix first, then re-test")

Implemented in v2, tested by `build/test-gates.sh` (28 synthetic-payload checks) and `build/test-build.sh`:

| # | Delivered | Where |
|---|---|---|
| P0 | `bin/sap-v2` launcher; `✅ … project hooks ACTIVE` line at every session start; `global-gates-off-warning.sh` (warns when a SAP build is requested outside a project — needs one global registration, see below); CLAUDE.md launch block corrected (it pointed at version 1's folder) | `bin/sap-v2`, `.claude/hooks/load-workflow-contract.sh`, `.claude/hooks/global-gates-off-warning.sh`, `CLAUDE.md` |
| P0' | `build/gate-status.sh` — every precondition on one screen with the exact command for each; injected into every build prompt by `enforce-wireframe-first.sh`; `guard-chain.sh` runs all 8 use_figma gates and reports every failure in one message; gate messages now name the sanctioned `record-reuse-decision.js` (they told the agent to `echo >` a marker that the marker guard blocks — a contradiction that cost Run B 25 Bash calls) | `build/gate-status.sh`, `.claude/hooks/guard-chain.sh`, `.claude/hooks/enforce-wireframe-first.sh`, `.claude/hooks/guard-reuse-gate.sh`, `CLAUDE.md` |
| P1 | `guard-api-gotchas.sh` — blocks `'HUG'`/`'FILL'` on sizing modes, `'STRETCH'`, `individualStrokeWeights`, FILL-before-append (by character offset), FILL into a `createFrame()` parent with no `layoutMode`, FILL on a page-level frame | `.claude/hooks/guard-api-gotchas.sh` |
| P3 | `guard-figma-code.sh` Block 2 (a `createFrame/createText` variable named after any of the 152 registry components, or a checkbox glyph in `characters`) and Block 3 (more frames than instances, ≥6, unless `// layout-only: N`); `guard-workflow-contract.sh` scoped to builds like every other gate | `.claude/hooks/guard-figma-code.sh`, `.claude/hooks/guard-workflow-contract.sh` |
| P5 | `guard-screenshot-budget.sh` (1 + one per completed build; the user's own words grant one more via `capture-approvals.sh`) + `count-build.sh` | `.claude/hooks/guard-screenshot-budget.sh`, `.claude/hooks/count-build.sh`, `.claude/hooks/capture-approvals.sh` |
| P6 | `guard-scoped-metadata.sh` — blocks `get_metadata` on `0:1`; flags any result > 20 KB with the scoped alternative | `.claude/hooks/guard-scoped-metadata.sh` |
| P9 | `build/measure-build.sh` (delivered earlier), `build/test-gates.sh` (new) wired into `build/test-build.sh` | `build/` |

Still proposed (each needs a separate decision):

| # | Item | Why not yet |
|---|---|---|
| P2 | Zone-by-zone build as the default | Guidance only for now (`gate-status` READY text + directive). A hard cap on build-code size is possible but should be sized from the re-test numbers. |
| P4 | Context diet (duplicate MCP servers, `CLAUDE.md` 44 KB → ≤10 KB) | Measure the exact split first (§7 step 4); a dropped hard rule is a regression. |
| P7 | Retire/rename the global legacy `SAP-Figma-screen-creator` skill | Lives in `~/.claude/skills` — your machine, your call. |
| P0 (global) | Register the gates-off warning globally | One command, your global settings: |

```bash
jq '.hooks.UserPromptSubmit += [{"hooks":[{"type":"command","command":"\"/Users/C5408360/Downloads/sap-pipeline-v2/.claude/hooks/global-gates-off-warning.sh\""}]}]' ~/.claude/settings.json > /tmp/s.json && mv /tmp/s.json ~/.claude/settings.json
```

Expected effect on the re-test (§7): the five-refusal loop cannot recur (all preconditions are listed before any code is written, and one refusal lists everything); the two API-trap deaths cannot recur; a native-heavy or glyph-checkbox build is refused before it reaches Figma; screenshots stop at the budget. Time/tokens are now measured the same way every run — that number, not a feeling, decides the comparison with version 1.

## Appendix — evidence pointers

- Run A log: `~/.claude/projects/-Users-C5408360/e4549909-ade8-422e-b77f-afa752ab57b4.jsonl` (Sep 1 entries).
- Run B log: `~/.claude/projects/-Users-C5408360-Downloads-sap-pipeline-v2/a9da4b29-459d-4b30-8a27-dfba8f2706aa.jsonl`.
- v1 dispatcher pinned to v1's path: `Task to Figma SAP layouts components/.claude/hooks/sap-scope-guard.sh:21,32-35`.
- Ratio gate only blocks at zero instances: `.claude/hooks/guard-figma-code.sh:33`.
- Verifier is manual: `.claude/hooks/mark-build.sh:26-31` (prints a reminder), `.claude/hooks/lint-on-stop.sh:41-63` (checks for a file the agent must produce).
- Gotchas that killed two builds: `skill/references/figma-build-patterns.md` gotcha table rows 3 and 15; CLAUDE.md "NEVER set FILL before appendChild".
- Fixes already on `pipeline-v2`: `8f8c24f` (F-11 approval-needs-a-demand + DPH FILL guard + regression test), `eacc3f4` (hook executability test), `c580e09` (marker guard), `013a917` (self-gating settings), `3b0f797` (P0 audit gaps).
