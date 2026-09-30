---
name: workflow-v4-split
description: "Best SAP-screen-from-image method (measured 2026-09-27): Claude Code plans + validates, Figma Agent builds the pasted plan, Claude Code audits MATCH %"
metadata:
  node_type: memory
  type: project
  originSessionId: d8906426-7ce6-48c2-a407-597e4c9b7e42
  modified: 2026-09-28T05:38:20.575Z
---

For a new SAP screen from a reference image, use the v4 split flow on branch `v4`:
`/plan-screen <image>` (Claude Code: measure → gold start → plan.json → `route.js --plan` → logos → pbcopy)
→ Figma Agent builds the pasted plan (PLAN MODE) → `/check-build <node link>` (dump → `audit-plan.js`
MATCH % ≥ 90, hygiene 0 → logos via upload_assets → one fix list).

**Why:** 2026-09-27 audit of ~17 builds of the same two references. Split plan→paste: 301:7074 plan
session ~3 min / 10k tokens / $2, score 7 → 9–10 after fixes (270:6722 = 99%). All-in-one terminal
build (Claude plans + builds live): 286:5646, $8, >50k tokens, score 4. main-branch v2 system:
291:6032, 18 min / 59k, placeholders ("Tab Text", "[swap slot]"). Figma Agent alone: 251:4825 / 261:9605, 1–5.

**The eye (added 2026-09-27, commit a279948):** `build/see.py read <img>` reads a screen like a person (Vision OCR,
size/weight/token per text, boxes with border/radius/padding/shadow, groups, logo crops) — verified exact on
gold 270:6722 (box 217×229, 1px sapList_BorderColor, r8; 38/40 text sizes). `build/see.py diff <gold|ref>
build@2x.png --tree geometry.json` is the FINAL gate: EYE MATCH ≥ 95% or a fix.md with node ids for the
Figma Agent. Build image = `download_assets` scale 2; always look at diff-sheet.png before trusting a line.

**3 gates, strict order (user rule, 2026-09-27; agent `.claude/agents/reference-build-and-verify.md`):**
GATE 1 `see.py spec` on the REFERENCE (sections, boxes, rows/columns, components + states, SAP styles, ASK must be
empty) → GATE 2 build ONLY from the spec → GATE 3 `see.py diff <ref> build@2x.png --tree geometry.json` ≥ 95%.
Target = the reference image itself at its own crop size (2026-09-28: the 1440 gold-style build 348:8435 was
rejected, EYE 19%; the 1:1 rebuild 364:6465 passed EYE 97% + MATCH 100%). A gold plan only seeds rows; all
numbers come from the spec, and the plan is corrected where the gold disagrees with the reference.
Eye rules since 2026-09-28: SAP control look (blue, 36 px button, slider handles) and brand→closest-SAP-token
colours are listed as expected, not counted; icon = 6–64 px; weight judged relative to the screen.
Fastest path to ≥95%: Claude builds from measured numbers with the runtime, then eye-gate rounds (19 → 97% in 5).

**How to apply:** default to this flow for any image→screen request; small edits later = Figma Agent
ACT mode. Details and evidence: `docs/V4-PLAN.md` on branch v4. Related: [[pitfall-branch-main-is-v2]],
[[pitfall-figma-agent-no-files]], [[pitfall-terminal-json-copy]], [[gold-nodes]], [[v4-run-log]].

**SAP Bridge = the default entry (built 2026-09-28, user rule: "open Figma → click the tool → it
works", text prompts work like images).** Figma plugin `plugin/sap-bridge/` ⇄ `bridge/server.js`
(localhost:41778; the old SAP Agent v2 bridge keeps 41777) ⇄ headless `claude -p` running the same v4
pipeline (`bridge/prompts/job.md` + `check.md`): Route → Plan → Analyse → Execute → Check → fix ≤ 2.
Auto-detect + trust-on-first-use pairing, no token field; logos placed by the plugin from
`logos/index.json`. Mode "Figma Agent builds": plan → file mailbox (`sapfiori/mbx_*`), user types
`build plan`. CLI: `node build/mailbox.js status|ensure|push|wait|unpair|install`. Contract:
`bridge/README.md`. Correction: the 97 % screen 364:6465 was built by **Claude directly** from
measured numbers — not by the Figma Agent (its build 348:8435 got EYE 19 %).

**LOCKED IN as the only method (2026-09-28), confirmed by user after seeing 364:6465 (EYE 97%, MATCH
100%) and calling it the closest-to-reference result seen yet.** User instruction: "this is the only
way to build based on image reference" — never skip a step (measure → plan → validate → build from
plan → dump → audit-plan MATCH % → eye-diff EYE % → fix → re-audit) for any future reference-image
request, regardless of how simple the image looks or how much time pressure there is.
