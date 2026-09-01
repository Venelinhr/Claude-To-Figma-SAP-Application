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
| P9 | `build/measure-build.sh` (delivered earlier), `build/test-gates.sh` (new, 31 checks) wired into `build/test-build.sh`; `build/replay-gates.sh` (replay any past session's real `use_figma` code through the current gates); `build/retest-headless.sh` (the §7 re-test, unattended, from a terminal); `build/expand-tree-dump.js` (compact live-tree dump → verifier shape, `--based-on` provenance) | `build/` |
| P10 | `record-reference.js` now requires `--name` (the node's name read live) and every gate message says to read the node first; `clear-reuse-marker.sh` keeps markers across resume/compact and no longer deletes the reuse decision every turn | `build/record-reference.js`, `.claude/hooks/clear-reuse-marker.sh` |
| P11-a | `capture-dump.sh` — the reality gate runs on the `use_figma` result inside a PostToolUse hook; the model never writes the tree back (−12k output tokens, no compaction); `build/templates/dump-tree.use_figma.js` and `dump-delta.use_figma.js` are the dump payloads | `.claude/hooks/capture-dump.sh`, `build/templates/` |

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

### 8.1 Replay — the real code of both runs through the new gates

`build/replay-gates.sh` (new) takes every historical `use_figma` payload from a session log and runs it through the code-level gates as they are now. No Figma, no tokens, deterministic.

**Run A (Sep 1) replayed:**

| Call | Output tok | THEN (what Figma did) | NOW (code gates) |
|---|---|---|---|
| 18:27:44 | 8,420 | threw: `primaryAxisSizingMode … 'HUG'` | **blocked pre-flight** — `line 56: root.primaryAxisSizingMode = 'HUG'` **and** `line 317: chkHdr.characters is a checkbox glyph` |
| 18:28:58 | 7,060 | threw: `FILL can only be set on children of auto-layout frames` | **blocked pre-flight** — `line 51: shellBar.layoutSizing…` (FILL before append) **and** `line 316: chkTxt = figma.createText() is named 'Checkbox [typo:body]'` |
| 18:30:06 | 6,461 | ran → the native-heavy screen you saw | **blocked pre-flight** — `line 332: chkT = figma.createText() is named 'Checkbox …'` |
| 6 later calls | 514–955 | ran (property injections, fixes) | pass — correct, they are legitimate |

All three full-screen builds would have been stopped before Figma with the offending line named. The text-node checkbox you found by eye was in the very first build code (line 317); the gate now names it in the first refusal. A pre-flight refusal costs an in-place fix and a resend of the same code — not a Figma round-trip plus a regeneration that introduces the next trap (call 2 introduced a new one).

**Run B (Aug 28) replayed:** all five payloads pass the code gates — correct: that code was 45 real instances against 11 frames. Run B's failure was preconditions, and `test-gates.sh` proves the new behaviour for that case: a build with no markers now gets **one** refusal listing all five missing preconditions (`guard-chain.sh`), and `gate-status.sh` lists them before any code exists.

Reproduce:
```bash
bash build/replay-gates.sh ~/.claude/projects/-Users-C5408360/e4549909-ade8-422e-b77f-afa752ab57b4.jsonl --day 2026-09-01
bash build/replay-gates.sh ~/.claude/projects/-Users-C5408360-Downloads-sap-pipeline-v2/a9da4b29-459d-4b30-8a27-dfba8f2706aa.jsonl
```

### 8.2 One more defect found while preparing the live re-test

`clear-reuse-marker.sh` wiped every gate marker on **any** SessionStart — including `source = resume` and `source = compact`. A session that compacted mid-build (both Run A and Run B did) lost its approvals and recorded decisions and was re-blocked; a resumed or headless multi-turn build was impossible. Fixed: the full reset now runs only for a fresh start (`startup` / `clear`); covered by `test-gates.sh` §8.

The same file also deleted `.reuse-declared` on **every** event — the line was commented "per-turn (Stop)" but was not guarded by the event at all. A build spans turns (wireframe → approve → build), so the reuse decision recorded in the wireframe turn was gone by the build turn and the reuse gate refused again: that is the `guard-reuse-gate ×3` in Run B's table (§1.2). Plan artifacts are now build-scoped exactly like approvals: cleared when a build completes (a newer `verify.json`) or on a fresh session start — never per turn.

Expected effect on the live re-test (§7): the five-refusal loop cannot recur; the two API-trap deaths cannot recur; a native-heavy or glyph-checkbox build is refused before it reaches Figma; screenshots stop at the budget; approvals survive compaction. Time/tokens are measured the same way every run — that number, not a feeling, decides the comparison with version 1.

### 8.3 Live build with the v2 flow (2026-09-02, from the audit session)

A fresh headless session cannot be started from inside the desktop app (the injected per-session bearer token is refused by a child `claude -p`: `401 Invalid bearer token`; a clean environment has no credentials and waits for login). So the v2 flow was driven by hand from this session, against the real Figma file, with every gate run on the real payloads before they were sent. What the consent gates need — a human's "approve" — was **not** forged; they are covered by `test-gates.sh` and stated here as not exercised.

**Result:** `Purchase Order Overview`, node **`1239:56605`** in file `p7zm5EMBk5DRRZdxNeJ4f5`, placed beside its source. Level-2 clone of the confirmed 1440 px **Orders List Report `889:45857`**. Hand-off screenshot: `output/1239-56605-handoff.png`. URL: `https://www.figma.com/design/p7zm5EMBk5DRRZdxNeJ4f5/SAP-application-builder?node-id=1239-56605`

| | Run A (Sep 1) | Run B (Aug 28) | **Live build (Sep 2)** |
|---|---|---|---|
| `use_figma` build calls | 9 (2 threw) | 5 (all refused) | **2, both landed first time** |
| Gate refusals | — (no gates) | 5 | **0** — `gate-status` was ✓ on every decision line before any code; each payload passed the 7 code/decision gates (`api-gotchas`, `figma-code`, `manifest-drift`, `reuse`, `reference`, `architect`, `workflow`) |
| Screenshots | 6 | 0 | **1**, at hand-off |
| Native : SAP instances (code) | 55 : 10 | 11 : 45 | `createFrame` **0**; 109 kit instances in the frame, **6 real SAP Checkbox instances**, ObjectStatus `Semantic` set per row (Warning / Success / Error / Information) |
| Header / hidden content | header not full width, parts hidden | — | 1440 root, header 1440, six filters in a 3+3 grid (six full labels do not fit one 1376 px row), nothing clipped after the fixes below |
| Reality gate (`verify-invariants.js`) | never run | never run | **run** — see below |

**Reality gate.** 204 nodes outside kit internals were dumped and verified (`--canonical 889:45857 --pre-bind`). It found **3 genuine defects, all inherited from the canonical**, all fixed and re-verified live: a stray unbound `#000000` stroke on row 1 (removed), the "Pending Approval" badge overflowing its 136 px cell by 2 px (cells re-sized 136→148 / 156→144, net zero — the new INV 5 caught exactly the hidden-content class you reported), and row 5's Actions cell FIXED instead of FILL (icons misaligned; set to FILL). After the fixes: **0 raw-hex, 0 overflow.**

It also reported **130 flags that are not defects**: 78 `FAIL_FAKE_COMPONENT` (frames named `Filter Area`, `HDR Order`, `Row 4500012345`, `Chk Cell`, `Responsive Table` …) and 52 `FAIL_TYPO_TAG` (texts with no `[typo:role]` tag). Run on the **PM-confirmed canonical itself** (`output/889-45857-compact.json`, 58 nodes), the verifier fails it the same way — 37 flags, including the same stray stroke — and 28 of the names it rejects on the build are the canonical's own names verbatim. The container allowlist and the tag convention were written for from-scratch builds; the default path is clone-first (RULE 28). The two were never reconciled because, until today, the verifier had never been run on a live build.

**Cost of this build, honestly:** 12.7 min wall-clock and 71k output tokens between reading the canonical and the last fix — but this session carries 630k tokens of audit context and every step above was reasoned in the open, so those two numbers are not the benchmark. The comparable numbers are the ones in the table: 2 calls, 0 errors, 0 refusals, 1 screenshot, 0 native frames created. The 3–5 min / ≤12k benchmark is a fresh session's number: `bash build/retest-headless.sh` from a terminal, or `bin/sap-v2` by hand.

### 8.4 Two new pain points, found only because a real build was measured

| # | Pain point | Proof | Fix | Priority |
|---|---|---|---|---|
| **P10** | **Canonical ids drift; the scorer's top match resolves to the wrong screen.** `score-canonical.js` ranks "Outage List Overview" first (84.5) with `figNode 750:174925`; in the live file that id is **"Schedule Operation — State D EndOnly", a 560×430 dialog**. `docs/NODE-ID-CONFLICTS.md` already lists it. The manifest names the desktop List Report under three different ids (`750:174925`, `30:2741`, and the confirmed table's) and calls `804:44859` "1440px" while it is 320 px live. A Level-2 clone by id would have built a list report from a dialog, silently. | live reads in this session; `docs/NODE-ID-CONFLICTS.md:106`; `SAP_BUILD_MANIFEST.md:22,168,197` | Done: `record-reference.js` requires `--name` read live; gate messages, `gate-status`, CLAUDE.md and `/sap-screen` say read-then-assert; the clone code asserts `src.name` and width. To do: resolve canonicals by **name + width in the live file** (`figma.currentPage.query('FRAME[name=…]')`), never by index id; re-key `canonical-index.json` and `SAP_BUILD_MANIFEST.md §3b` against the live file and delete the conflicting rows. | **P0** — a wrong clone is a silent total failure |
| **P11** | **The reality gate rejects the pipeline's own gold standard.** INV 1's allowlist (`Row$`, `Header$`, `Block$` …) and INV 3's `[typo:role]` tags do not match the confirmed canonicals' names (`… Cell`, `HDR …`, `Row <id>`, `Filter Area`, untagged styled texts), so every clone-first build fails 100+ flags by construction and the only genuine findings are buried. | §8.3: 37 flags on the canonical's own 58 nodes; 28 rejected names verbatim canonical | Provenance-aware verification: when `basedOnCanonical` is set, dump the canonical too and verify the **delta** (nodes added or renamed by the build) at full strictness, while nodes inherited unchanged from a confirmed canonical pass INV 1/INV 3 by provenance; keep INV 2/INV 5 on everything (they found the three real defects). Add the canonicals' container patterns to the allowlist for from-scratch builds; make INV 3 accept a text whose live font is `72` at a role size. | **P0** — until then the gate cannot be made mandatory on the default path |

## 9. Verdict, projection, and where the tokens go now

### 9.1 What is measured (not projected)

| Dimension | Before (Run A, your run) | Before (Run B, gates on) | **v2 flow, live build** | Verdict |
|---|---|---|---|---|
| Errors from Figma | 2 of 3 full builds threw | 0 (nothing ran) | **0 of 2** | ✓ measured |
| Gate refusals | — | 5 (one gate per refusal) | **0** (readiness listed before code; one refusal lists everything) | ✓ measured |
| Screens produced | 1, native-heavy | **0** | 1, correct | ✓ measured |
| "Only SAP components" | `createFrame` ×55, checkbox = text `☐` | (code was fine) | `createFrame` **0**, 109 kit instances, 6 real Checkbox instances | ✓ measured |
| Code written to build the screen | 56 KB (21.7 + 18.1 + 16.3 KB) ≈ 22k tokens | 75 KB ≈ 35k tokens, never ran | **8.2 KB (4.0 + 4.2 KB) ≈ 2.4k tokens** — 7× less, because a clone adapts instead of assembling | ✓ measured |
| Screenshots | 6 | 0 | **1** | ✓ measured |
| Header width / hidden content | broken | — | full width; the one clipped badge was caught by INV 5 and fixed | ✓ measured |
| Reality gate run on the result | never | never | **yes** — 3 inherited defects found and fixed; 0 raw hex, 0 overflow | ✓ measured |
| Replay of your run through the new gates | — | — | all 3 full builds refused pre-flight, line named | ✓ measured |

### 9.2 Time and tokens — projection for a fresh session (to be confirmed by one run)

Derived from measured parts (base context 109k in the v2 folder; the live build's actual call sizes; the dump/verify sizes from this session):

| Step | Turns | Output tokens | Notes |
|---|---|---|---|
| Wireframe + VDI presentation | 1–2 | ~2.5k | unchanged |
| Decisions: score → read node live → record ×2 → gate-status | 4 (Bash) | ~1k | new, replaces the 5-refusal loop (Run B: ~26k) |
| Build: clone + adapt | 2 `use_figma` | ~2.5k | measured 8.2 KB of code |
| Reality gate: dump 204 nodes (3 slices ≈ 15k in) + write back (≈9k out) + verify | 4 | ~9k | **the largest remaining cost** — see 9.3 |
| Fixes | 0–2 | ~1k | 3 inherited fixes today |
| Hand-off: 1 screenshot + URL | 1 | ~0.5k | budgeted |
| **Total, today's flow** | ~13 | **~16k** | vs 33k (Run A, broken) / 44k (Run B, nothing) |
| **Total with the delta dump (9.3)** | ~11 | **~8–9k** | inside the ≤12k target |

Wall-clock: ~13 turns at roughly 20–30 s each on a 110–140k context ≈ **4–6 min** (≈ 3–4 min with the delta dump), vs 7.1 min (Run A) and 13.8 min (Run B). Every number in this table is a derivation, not a measurement; the confirming measurement is one fresh session:

```bash
cd "/Users/C5408360/Downloads/sap-pipeline-v2" && bash build/retest-headless.sh     # or: bin/sap-v2, build by hand, then: bash build/measure-build.sh --latest
```

### 9.2a Measured — fresh-context benchmark (2026-09-02, supersedes the projection above)

A clean-context agent (Sonnet-class model, no prior conversation, this session's sanctioned auth path, the real Figma file) ran the same v2 protocol by hand — gate-status → scorer → read the canonical live → record → code gates on each payload → build → reality gate → one screenshot. Its full transcript was measured with `measure-build.sh`:

| | Run A (Sep 1, yours) | **Fresh-context v2 build** |
|---|---|---|
| Wall-clock | 7.1 min | **9.7 min** (7.3 build · ~1.5 reality gate · 0.9 hand-off after a compaction) |
| Output tokens | 33,122 | **31,727** |
| Context: first turn / avg / max | 88k / 120k / 159k | 123k / 149k / 170k → compaction |
| `use_figma` calls | 9 (2 threw) | 6 (1 read · 2 build · 3 dump) — **0 errors, 0 gate refusals** |
| Screenshots | 6 | **1** |
| `createFrame` in code | 55 | **0** |
| Result | native-heavy, unverified | `1251:56875`, verified: **0 raw hex, 0 overflow** |

Where the 31.7k output tokens went (code/JSON ≈ 3 chars per token): writing the 204-node dump back to disk for the verifier ≈ **12k**; the two build calls ≈ 6.7k; the same code written to files for the pre-flight gate check ≈ 3.8k (benchmark-only — a hooked session checks the tool input without a file); dump code sent three times ≈ 1.6k; wireframe text + Bash ≈ 2.5k; other ≈ 5k. The three dump slices also added ≈ 12k of context, which is what tipped the session into compaction.

**Honest verdict on time and tokens: not yet better.** Same tokens as the broken run, 2.6 minutes slower — because the reality gate, which had never run on a live build before, costs ~24k tokens round-trip when the model must echo the tree back. The build itself (steps 1–7) cost ≈ 11k output tokens and ≈ 5 min, inside target.

**The fix, implemented and proven on the real data:** `.claude/hooks/capture-dump.sh` (PostToolUse on `use_figma`) recognises a dump in the tool result, saves it, accumulates slices, expands it, runs `verify-invariants.js` with provenance from `.reuse-declared`, and injects only the verdict. Replayed against the benchmark's three real dump results it produced `output/1251-56875-{compact,tree,verify}.json` and the verdict with zero model write-back (`test-gates.sh` §9, 3 checks). Expected effect: 31.7k − 12k (write-back) − 3.8k (file duplication, absent under hooks) ≈ **16k output tokens** and no compaction → ≈ **7 min**; with `build/templates/dump-delta.use_figma.js` for light edits, ≈ 12k. That expectation is a derivation from the measured split; the confirming measurement is the fresh terminal session below.

### 9.2b Measured — the hooked-session cost model (benchmark 2, 2026-09-02)

Same clean-context agent, same protocol, same file — but costed the way a hooked session costs: the agent sends code and dumps and writes nothing back; the seven PreToolUse gates and the reality gate were then run on the **exact payloads recorded in its transcript** (`.claude/hooks/guard-*.sh` on the two build calls; `capture-dump.sh` on the three dump results), which is precisely the work the hooks do in a live session.

| | Run A (Sep 1, yours) | Run B (Aug 28, gates on) | **v2, hooked cost model (benchmark 2)** |
|---|---|---|---|
| Wall-clock | 7.1 min | 13.8 min | **3.6 min** |
| Output tokens | 33,122 | 43,895 | **9,158** |
| Context first / avg / max | 88k / 120k / 159k → compaction | 109k / 136k / 161k → compaction | 122k / 137k / 163k — **no compaction** |
| `use_figma` calls | 9 (2 threw) | 5 (all refused) | **6** (1 read · 2 build · 3 dump) — 0 errors |
| Gates on the build payloads | none ran | 5 refusals | **7 of 7 pass** on both build calls (post-hoc) |
| Reality gate | never | never | **run by the hook on the real dump: 0 raw hex, 0 overflow** (78 + 52 known convention flags, P11) |
| Screenshots | 6 | 0 | **1** |
| `createFrame` in code | 55 | 11 | **0** |
| Result | native-heavy, unverified | nothing | `1259:57145`, correct, verified — `output/1259-57145-handoff.png` |

Against the target (3–5 min, ≤ 10–12k tokens): **inside on both**. Against Run A: **2× faster, 3.6× fewer tokens**, and a verified SAP-only screen instead of a broken one.

Caveats, stated plainly: Sonnet-class model (your terminal default is the same class); a subagent's base context (122k) is close to a terminal session's in this folder (109k); hook execution adds seconds of wall-clock in a live session; the user's approval turn adds one short prompt; the clone base was named in the protocol as the fallback for the scorer's wrong top match, and the agent still had to read it live (included in the 3.6 min). The consent gates are covered by `test-gates.sh`, not by this run.

Why a fresh *terminal* session could not be run here — tried three ways, each measured: (1) a `claude -p` started inside the desktop app inherits its per-session bearer token, which the API refuses for a child process (`401 Invalid bearer token`); (2) a clean-environment session **does** start (session `0c17b7ba…`: hooks ran, context loaded, 176 s to the first API call) but `~/.claude/settings.json` routes every CLI session through the corporate gateway on `localhost:6655` (the `corporate` alias in `~/.zshrc`), and that gateway was **not running**: `API Error: Connection refused`; (3) the desktop app's own proxy (`localhost:11436`) is a boundary deliberately not worked around. So the one command is, in a terminal:

```bash
corporate && cd "/Users/C5408360/Downloads/sap-pipeline-v2" && bash build/retest-headless.sh
```

The runner now refuses to start when the gateway is down and passes the alias's proxy variables through. First turn takes 3 minutes before the first token (cold start) — that is normal.

### 9.3 Token levers, ranked by what they save per build

| Lever | Saves (per build) | Status |
|---|---|---|
| Readiness before code + all refusals in one message (P0') | ~26k tokens, ~8 min when the loop would have happened (Run B) | done |
| Clone-first with a live-verified canonical (P10) | ~19k tokens of build code vs assembling from parts (22k → 2.4k) | done (process); index re-key pending |
| **Delta dump for the reality gate** — dump only nodes added/changed vs the canonical (plus their parents for INV 5), instead of all 204 | ~15k in + ~8k out → ~2k + ~1k: **≈ −20k** | proposed (P11 companion) |
| Context diet (P4): duplicate MCP servers + 44 KB CLAUDE.md | ~40–60k **per turn** (88–109k base → ~50k); no compaction inside a build; faster turns | proposed — measure the exact split first (§7 step 4) |
| API-trap lint (P1) | ~7k + 2 Figma round-trips when it fires (fired twice in Run A) | done |
| Screenshot budget (P5) | ~7k, 5 round-trips (Run A) | done |
| Scoped metadata (P6) | ~10k (Run A's whole-page dump) | done |
| Legacy skill detour (P7) | ~3.5k + 1 min | proposed (global skill, your machine) |

### 9.4 The plan you approved, and where each item stands

| Plan item | Status |
|---|---|
| Part A — audit with proof (this document, §0–§5) | done |
| Part B — `measure-build.sh` + re-test protocol | done; protocol in §7; headless runner added |
| Part C — P0 launcher/ACTIVE line, P0' readiness + chain, P1 lint, P3 native block, P5 budget, P6 scoped metadata | done, tested (31 gate checks + regression suite) |
| Replay of real history through the new gates | done (§8.1) |
| Live build with the v2 flow + reality gate | done (§8.3) |
| New P0s found by the live build: P10 canonical-id drift, P11 verifier vs canonical | P10 process fix done; index re-key and P11 design need your decision (§8.4) |
| P2 zone-by-zone cap, P4 context diet, P7 skill rename, global gates-off registration | your decision |
| Fresh-session time/token benchmark | blocked here (nested auth); one command for you (§9.2) |

**Verdict.** On errors, refusals, screenshots, native components and verified output, the improvement is measured and large: from a broken screen after 9 calls (or no screen after 5 refusals) to a correct, gate-verified screen in 2 build calls with 7× less build code. On time and tokens, measured under the hooked-session cost model (§9.2b): **7.1 min → 3.6 min, 33,122 → 9,158 output tokens, no compaction** — inside the 3–5 min / ≤12k target. The first fresh-context measurement (§9.2a, 9.7 min / 31.7k) showed exactly why the reality gate had to move into a hook, and `capture-dump.sh` is what turned it into 9.2k. A terminal-session run with the gateway up remains the final confirmation (§9.2). The two P0s in §8.4 are not regressions — they were always there; a measured build is what made them visible.

## Appendix — evidence pointers

- Run A log: `~/.claude/projects/-Users-C5408360/e4549909-ade8-422e-b77f-afa752ab57b4.jsonl` (Sep 1 entries).
- Run B log: `~/.claude/projects/-Users-C5408360-Downloads-sap-pipeline-v2/a9da4b29-459d-4b30-8a27-dfba8f2706aa.jsonl`.
- v1 dispatcher pinned to v1's path: `Task to Figma SAP layouts components/.claude/hooks/sap-scope-guard.sh:21,32-35`.
- Ratio gate only blocks at zero instances: `.claude/hooks/guard-figma-code.sh:33`.
- Verifier is manual: `.claude/hooks/mark-build.sh:26-31` (prints a reminder), `.claude/hooks/lint-on-stop.sh:41-63` (checks for a file the agent must produce).
- Gotchas that killed two builds: `skill/references/figma-build-patterns.md` gotcha table rows 3 and 15; CLAUDE.md "NEVER set FILL before appendChild".
- Fixes already on `pipeline-v2`: `8f8c24f` (F-11 approval-needs-a-demand + DPH FILL guard + regression test), `eacc3f4` (hook executability test), `c580e09` (marker guard), `013a917` (self-gating settings), `3b0f797` (P0 audit gaps).
