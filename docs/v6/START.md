# v6 — start and test in a NEW Terminal session (branch `v6` only)

## What is already applied on `v6` (validated 2026-09-30)
Engine (`build/run.js`, `reskin.js`, `gold.js`, `flip.js`, edits to `door.js` `front.js` `layout-sim.js` `route.js` `send.js`), `test/run.test.js`, `CLAUDE.md` (v6 block),
`.claude/agents/screen-builder.md` (fallback note), `.claude/settings.json` (deny Read of `build@2x.png` `ref.png` `geometry.json` `see-out/*.png`).
Tests: 108 / 109 — the 1 failure is `test/route.test.js` "drift", older than v6 (SKILL.md vs router table).

## Steps only YOU can do (the agent is blocked from writing these instruction files)
```bash
cp docs/v6/screen.md .claude/commands/screen.md
```
**Run this `cp` again after every update of `docs/v6/screen.md`.** The last update (2026-09-30) makes every plan and report show ALL FIVE sections in full — Analyze, Zones, boxed Wireframe, `├─` Layers, Confidence — and puts the plan
before the build for a new screen type. Until you re-copy, the installed command still has the older text.
Optional, for the Figma Agent: add the "v6 HANDOFF" section from `docs/v6/INSTALL.md` §5 to `.claude/skills/sap-figma-agent/SKILL.md`, run `node build/gen-router.js`, re-upload the skill in Figma's Agent panel.
(Without step 1 the slash command `/screen` still runs the v5 text. `node build/run.js …` works either way.)

## Start
1. Close every other Claude session that uses this folder — one of them moved HEAD to `v5` once.
2. In Terminal:
```bash
cd ~/Downloads/Claude-To-Figma-SAP-Application && git switch v6 && git branch --show-current
```
   It must print `v6`. Then:
```bash
node build/mailbox.js ensure && node build/mailbox.js status
```
3. In Figma open the target file → Plugins → Development → **SAP Bridge** → it must say "Connected to Claude". `status` then shows `figma: connected · <file>`.
4. Start Claude Code in the folder: `claude`. Its first line of work: `git branch --show-current` must say `v6`.

## Test — offline first (no Figma)
```bash
node --test test/run.test.js
```
Expect 13 / 13. Then the analysis on the flight reference (about 2 s, prints ≤ 14 lines, exit 0):
```bash
node build/run.js bridge-out/flight-v5b/ref.png --dry
```
Text lane (exit 2, asks for content, prints the layer names): `node build/run.js "purchase order list report with supplier and status filters" --dry`

## Test — live (plugin open). KEY = the part of the file link after `/design/`
In the Claude session: `/screen bridge-out/flight-v5b/ref.png https://www.figma.com/design/<KEY>/…`
or without the slash command: `node build/run.js bridge-out/flight-v5b/ref.png --file <KEY>` (Bash timeout ≥ 240 s).
Expect: `STATUS PASS` or `STATUS DRAFT` with FIX lines, `elapsed`, a node link; a frame named `DRAFT — <job>` in the file. Target ≈ 1 min for a gold hit.
Then: `/screen flip density bridge-out/<job>` → `run.js --job … --resume` (≈ 15 s) · `/screen gold bridge-out/<job> --name flight-v6` (only after PASS).
Text job: `/screen "purchase order list report…" <link>` → exit 2 → write `ops.json` (content only) → `--resume --spec-json ops.json`.
The file connected right now is `L9bomZ4CKDmBGQfGM9C61z` ("Untitled"): safe to delete any `DRAFT — …` frame afterwards.

## Exit codes of `run.js`
`0` PASS · `1` door / sim OUT (fix tree.json content, never geometry; `--resume`) · `2` the model must decide (icons / text content / analysis failed) · `3` bridge down or plugin closed ·
`4` an ask that changes the screen (`--go` after the answer) · `5` `--ask` stop (plan printed) · `6` built but NOT PASSED (DRAFT), or the 2-fix-round cap · `64` usage.

## Not verified yet
The live Figma run (the classifier blocked it here). The 1–2 min figure is offline analysis 1.7 s + the plugin build (11–90 s measured in v5) — report the measured elapsed.
