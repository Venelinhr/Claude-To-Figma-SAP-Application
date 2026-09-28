# v5 — ask Claude in chat (image or text) → it builds the SAP screen in Figma → it checks it

## Context
v4 works, but it needs the plugin, the bridge and (in agent mode) the Figma Agent. The user wants
the `main` feeling back: talk to Claude Code, give an image or a text + the Figma file link, and the
screen appears in Figma — with v4's proven quality steps, not v2's (18 min, placeholders).
Evidence: the best screen ever (364:6465, EYE 97 %, MATCH 100 %) was built exactly this way —
Claude in chat, from `see.py spec` numbers, at the reference size, with gate rounds. Headless
(bridge) builds of the same plan scored EYE 9–13 %. So v5 = make that interactive method the
one command.

## Step 0 — the branch (user asked: "create a branch of v4 and work only in it, make it v5")
- `git checkout -b v5` from `v4` (v4 = up to `b8a075a`, stays untouched as the fallback).
- The 4 untracked scratch files (`plan.json`, `plan.min.json`, `ref.json`, `tree.json`) are left
  as they are — not committed, not deleted.
- `CLAUDE.md` branch rule changes from "must be `v4`" to "must be `v5`" (v4 = previous, proven).
- Memory: `pitfall-branch-main-is-v2.md` updated — build only on `v5` now; `MEMORY.md` index line.
- All later commits go to `v5` only.

## What the user does
```
/screen <image path or pasted image> <figma file link>
/screen "purchase order list report, filter by supplier and status" <figma file link>
```
Claude answers with the node link + `MATCH n% · EYE n% · hygiene 0 · Done in Xm`.
Small edit later: `/screen "make Save primary" <node link>` → ACT, one call.

## The one pipeline (new command `.claude/commands/screen.md`)
Reuses v4 steps word-for-word where they exist; nothing new is invented.
1. **Branch + route** — `git branch --show-current` = `v5`; `node build/route.js "<text>"`
   → ACT / QUICK / THINK. ACT → one `use_figma` with the router's `act`, read back, done.
2. **Plan** (from `plan-screen.md` steps 2–7, no hand-off):
   - image: sha → plans-cache hit? else `measure-ref.py --json`, `see.py spec` (Gate 1, answer
     ASK lines), `route.js --closest-gold` as seed only, `plan.json` with measured numbers,
     frame = reference size.
   - text: `route.js --closest-gold - "<words>"` → adapt that gold plan (1440, Compact, shell).
   - `route.js --plan plan.json --map --min` until exit 0; `crop-logos.py` if logos.
3. **Build** (rules from `bridge/prompts/job.md` Execute): one `use_figma` = prelude
   `build/templates/sap-kit.prelude.js` + `KIT` from `kit.js pack`, every row in order, layers
   named after `element`, logos = frames of the crop size → `upload_assets`. `WARN` must be empty.
4. **Check** (from `check-build.md`): `dump-tree` → `tree.json`; `download_assets` @2x →
   `build@2x.png`; `dump-geometry` → `geometry.json`; then ONE script:
   `node build/gates.js <plan> <jobDir> [--ref ref.png]` → MATCH / HYGIENE / EYE / PASS.
   Claude reports only what this script prints.
5. **Fix** — ≤ 2 rounds from `audit.txt` + `see-out/fix.md` (hygiene first), re-run step 4.
6. **Record** — only `gates.js --record` on a real pass writes plans-cache + `v4-run-log.md`.
All work files in `bridge-out/<jobId>/` (already git-ignored).

## Files
- NEW `build/gates.js` — the gate logic moved out of `bridge/server.js` (`measureGates`
  L689–712, `recordPass` L715): runs `audit-plan.js` + `see.py diff`, prints one summary,
  exit 0 = pass; `--record` writes cache + run log. `bridge/server.js` then calls it (same
  behaviour, one source of truth — the bridge keeps working).
- NEW `.claude/commands/screen.md` — the pipeline above (short; points to the existing files
  for detail, like `check-build.md` does).
- EDIT `CLAUDE.md` — top: branch `v5`, "default = `/screen` in Claude Code"; SAP Bridge plugin
  stays as option 2; manual v4 table stays as fallback.
- EDIT memory `workflow-v4-split.md` (+ v5 line) and `MEMORY.md` index.
- NEW `test/gates.test.js`: `gates.js` on the gold fixture (`test/fixtures/tree-gold-270-6722.json`
  + `knowledge/gold/plans/flight-search-results.plan.json`) → MATCH 97 %, exit 0; a broken tree →
  exit 1 with the reason. Existing `bridge.test.js` must still pass (proves the server refactor
  kept behaviour).
- Git: branch `v5` from `v4` (v4 stays untouched as the proven fallback).

## Verification
1. `node --test test/*.test.js` — all pass (46 + new).
2. Text run in chat: `/screen "purchase order list report, filter by supplier and status" <file>`
   → node link, MATCH ≥ 90 %, hygiene 0, time printed.
3. Image run: the BG flight results reference → `/screen ref.png <file>` → EYE ≥ 95 % target
   (baseline 364:6465 = 97 %); diff-sheet looked at by eye.
4. Edit run: `/screen "make the Save button primary" <node link>` → ACT, one call, read-back OK.
5. Plugin still works (bridge uses `gates.js`): one plugin job end-to-end.
