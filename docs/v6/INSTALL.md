# v6 — the 5 config steps that are yours to apply

The permission classifier blocked me from writing into `.claude/` (the `/screen` command, settings, agent, skill) and I did not work around it.
Everything else of v6 is built and tested. Apply these on branch `v6`, then start a fresh session.

## 1. The `/screen` command (one line)
```bash
cp docs/v6/screen.md .claude/commands/screen.md
```

## 2. `.claude/settings.json` — a warm bridge at session start + the "never open PNGs" rule made mechanical
Add next to the existing `"hooks"` block (keep the existing `PreToolUse` and `UserPromptSubmit` entries):
```json
"permissions": {
  "deny": [
    "Read(bridge-out/**/build@2x.png)",
    "Read(bridge-out/**/ref.png)",
    "Read(bridge-out/**/geometry.json)",
    "Read(bridge-out/**/see-out/*.png)"
  ]
},
"hooks": {
  "SessionStart": [
    { "hooks": [ { "type": "command", "command": "cd \"$CLAUDE_PROJECT_DIR\" && node build/mailbox.js ensure", "async": true } ] }
  ]
}
```
(`crop-*.png` stays readable: a ≤ 400 px crop is the allowed way to look at one doubt.)

## 3. `CLAUDE.md` — replace the first block (title + branch rule + "v5 — the default" paragraph) with:
```markdown
# SAP Figma Build System v6 — read this file only

**Branch must be `v6`.** If `git branch --show-current` is not `v6`, stop and tell the user `git switch v6` — `v5` is the proven previous
system (fallback), `v4` before it, `main` is the old v2 (18 min / 59k tokens per screen). Work and commit on `v6` only. Plan: `docs/V6-PLAN.md`.

## v6 — the default: BUILD FIRST, REVIEW AFTER (`/screen`)
`/screen <image | "text"> <figma link>` → `node build/run.js <ref|"text"> --file <KEY>`: at t=0 in parallel bridge check ‖ `front.js` (OCR, gold
match, door); then door → layout-sim (position, overflow ×1 ×0.85 ×1.15) → STRUCT-SIM → `send.js` builds a `DRAFT — <job>` frame → `gates.js`.
No human wait in the middle; the user reviews the real screen + the ASSUMED ledger after (`--ask` restores the old stop). Bar unchanged:
MATCH ≥ 90 · HYGIENE 0 · STRUCTURE 0 · EYE ≥ 95 · responsive; only numbers a script prints count; ≤ 2 fix rounds (the driver refuses the 4th build).
**Geometry (w h xy p g) of measured nodes is script-owned** — `door.js --baseline` rejects a model edit of it (the headless EYE-9 % channel).
Text jobs: `reskin.js` ops (content only). Verbs: `tweak · flip · show · gold · fix` (`route.js`). Gold flywheel: `gold.js` (measured admission).
Exit codes of `run.js`: 0 PASS · 1 door/sim OUT · 2 the model must decide · 3 bridge down · 4 screen-changing ask · 5 `--ask` stop · 6 DRAFT / cap.
```
The v5 paragraphs below it stay as the fallback description.

## 4. `.claude/agents/screen-builder.md` — first line of the body
```
First reply line: `via subagent fallback` plus an honest ETA (5-10 min, ~40-60k tokens). The 1-2 min promise does not hold on this lane.
```

## 5. `.claude/skills/sap-figma-agent/SKILL.md` — a handoff note (outside the generated JEV-ROUTER block), then re-upload the skill in Figma's Agent panel
```
v6 handoff: a request for a NEW screen, or anything that needs a reference image or the measured gates → reply `ask Claude chat: /screen "…" <file link>`
(only chat has see.py and gates.js). Small edits stay here (ACT). After a long edit session in Figma the user can re-gold the screen in chat:
`/screen gold --from-node <link>`.
```
Also `node build/gen-router.js` — `test/route.test.js` "drift" fails at the committed HEAD already (SKILL.md is out of date against the router table); this regenerates it.
