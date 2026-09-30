---
name: workflow-v6-build-first
description: "v6 (branch v6, since 2026-09-29): build first, review after — `node build/run.js <ref|text> --file <KEY>` does OCR+gold+door+sim+build+gates in ~1-2 min; state, exit codes, what is done and what waits for the user"
metadata:
  node_type: memory
  type: project
  originSessionId: a1d0debc-88f1-4329-8ff6-34de9ce7bc61
  modified: 2026-09-30T06:52:56.272Z
---

v6 = the v5 engine plus one driver. `node build/run.js <ref.png | "text"> --file <KEY> [--ask]` → analysis ‖ bridge check → door → layout-sim → STRUCT-SIM →
`send.js` builds a `DRAFT — <job>` frame → `gates.js`; the user reviews the REAL screen + the ASSUMED ledger afterwards. Design, evidence, deviations: `docs/V6-PLAN.md`.

**Why:** v5 quality was right but a run cost minutes and dollars (451:9507 = 219 turns / 34 min / $9.5): a human approval in the middle, a model loop on the door, fat turns.
User goal 2026-09-29: request → verified screen in 1–2 min, cheap, no quality compromise, only SAP.

**Rules that stay:** MATCH ≥ 90 · HYGIENE 0 · STRUCTURE 0 · EYE ≥ 95 · responsive; only script-printed numbers count; ≤ 2 fix rounds (driver refuses the 4th build); headless Claude builds banned;
the verbatim ASCII + L1-L5 + components paste stays in the final report (rule 2026-09-29, moved after the build). **New:** geometry (w h xy p g) of measured nodes is script-owned —
`door.js --baseline` rejects a model edit; the text lane is `reskin.js` ops (content only).

**State 2026-09-30 (end of day):** engine built + live-tested on 2 screens (flight, hotel); `test/run.test.js` 14/14; suite 109/110 (the 1 failure = `route.test.js` drift, older than v6). Applied: `CLAUDE.md` v6 block, `screen-builder` note,
`.claude/settings.json` deny rules, `.claude/commands/screen.md` (the user ran the `cp`). NOT applied (classifier blocks `.claude/commands` + SKILL.md for the agent): later edits of `docs/v6/screen.md` need `cp docs/v6/screen.md .claude/commands/screen.md` again;
SKILL.md handoff note (optional). Nothing is committed (v6 work + another session's edits sit uncommitted). New this round: `build/sketch.js` (readable boxed wireframe + ├─ layer tree from the real tree, phone ≤ 600 px), door rule `DEFAULT_ON_PLACEHOLDER`,
`run.js` gold-vs-structure fallback, `--resume --icons`, grouped icon list. Open: phone 3× scale not automated, cropped-reference OUTSIDE rule (user decision), pin/transit icons, plugin frame placement (user says fixed). Lessons: [[project-v6-lessons]]. Report format: [[feedback-show-plan-fully]].

**How to apply:** start a fresh session on `v6`; read `docs/V6-PLAN.md`; run the "Live check" list there. Exit codes of run.js: 0 PASS · 1 door/sim OUT · 2 model decides · 3 bridge down · 4 screen-changing ask · 5 `--ask` · 6 DRAFT/cap.
See [[workflow-v5-trees]], [[project-plugin-runner]], [[pitfall-branch-main-is-v2]], [[feedback-show-plan-fully]].
