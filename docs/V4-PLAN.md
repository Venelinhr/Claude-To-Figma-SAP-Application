# Plan — v4: ONE standard way to build SAP screens from an image (best quality, least time, least cost)

**v4 = new version on a new branch `v4`, cut from v3 + today's rescued work.** v3 and main stay
untouched (no commits, no edits, stashes kept as backup). All steps below land on `v4` only.
First commit on v4 saves this plan as `docs/V4-PLAN.md` (the idea + plan), then the build steps.

## Context
Today the same two reference screens (German Kayak ticket selection; Bulgarian Wizz/Ryanair
results) were built ~17 times with different systems. We audited every build (screenshots +
layer tree vs the gold nodes 174:4211 and 270:6722), read the repo on both branches, the memory
dirs and the session cost logs. Goal: pick the winner, fix its known gaps, and make it the
default so the next screen costs ~$2 / a few minutes, not $8–$300.

## Verdict (evidence)
| Method | Example nodes | Score (vs gold) | Time / cost |
|---|---|---|---|
| **A. v3 split: Claude Code writes + validates JSON plan → paste into Figma Agent → short fix prompts** | 301:7074, 270:6722→gold, 266:6379 | **7 raw → 9–10 after 1–3 fix prompts** | plan ≈3 min / 10k tok / **$2** |
| B. v3 terminal all-in-one (plan + live Figma build in one session) | 260:6678, 286:5646 | 6.5 / 4 | 7.5+ min / >50k / **$8** |
| C. main branch v2 system (28 hooks, wireframe/VDI gates, sap-bind tags) | 291:6032, 88:3174, 138/160 | 3–5 | 18 min / 59k |
| D. Figma Agent alone (image or filename, no validated plan) | 251:4825, 261:9605, 237/239/244 (◆SAP-UNBOUND) | 1–5 | 19 min / 36k |

**Winner: A.** Decisions are made and checked as cheap JSON before Figma is touched; Figma only
places pre-decided parts. B pays "learn the Figma API" tuition live every run. C and D invent
structure (placeholders, "Tab Text", "[swap slot]", default globe/info icons, wrong screen).

**Gaps that still cost points in A (seen in every build except the golds):**
1. **Logos** — the #1 divider: every node scoring ≥8 has real logo images; all others show text
   chips / colour blocks / empty frames. The Figma Agent cannot read local files, so it can't crop.
2. **Default icons left in place** (globe, info everywhere) — the icon row was never checked.
3. **Plan hand-off corruption** — copying JSON out of the terminal truncated lines (seen today).
4. **Figma Agent invents when input is missing** (261:9605).
5. **Environment drift** — sessions on `main`, or global skills `sap-bind` / `sap-vdi`, and v2
   leftovers on v3 (`sap-screen` skill, 15 v2 files in `.claude/memory/`) pull a v3 session back
   into v2 behaviour (291:6032).
6. **Risk: today's v3 work is only in `stash@{1}`** (route.js `--plan`, router-table additions,
   audit-plan.js, CLAUDE.md, SKILL.md PLAN MODE, tests, both gold plans, icons-extra.json).
7. Auto-memory is empty — nothing tells a new session which method works.

## v4 targets (hard numbers)
- **Match ≥ 90%** = audit-plan score: plan rows present + correct (component, props, style,
  colour role, icon, logo) ÷ all rows. Build is "done" only at ≥ 90% and 0 hygiene errors.
- **Plan session ≤ 12k tokens / ≤ 5 min** (main's own budget rule — v3 split already hit 10k / 3 min).
- **Repeat image = ~0 tokens** (plan cache). **Fix rounds ≤ 1.** Fail twice → switch approach (main's rule).

## Best of all versions — what v4 takes
| Block | Take from | Why (evidence) |
|---|---|---|
| Image reading | **v3** `measure-ref.py` (real px, colours → tokens) + Z-sections with plain-words `describe` | real numbers beat eyeballing; VDI 8-stage costs ~14k tokens |
| Repeat-image cache | **main** VDI cache idea (`semantic-models/<slug>-<sha1>.md`) → v4 caches the **validated plan** by image sha1 | same reference again = no re-analysis |
| Start point | **main** reuse-first idea, done at plan level: closest **gold plan** (`knowledge/gold/plans/`, matched by recipe/section words) is adapted, not rewritten; same screen type → clone the gold frame in Figma | cloned-gold 200:5284 scored 8; golds 174:4211 / 270:6722 are 99% |
| Approval view | **v3** element plan + `route.js --map`, plus **main**'s short ASCII wireframe + top-3 suggestions (`SAP-SUGGESTION-CATALOG`) — **one stop**, not 4 gates | main's 4-gate ceremony = 18 min / 59k |
| Validation | **v3** `route.js --plan` (kit keys, colour by role, icon per meaning, logo crop, Z order) | caught 8 real errors before Figma today |
| Build | **v3 split**: Figma Agent builds from the pasted plan; BUILD KIT + ACT mode for edits | $2 vs $8 all-in-one |
| Audit | **v3** `audit-plan.js` (plan vs build, gives the % score) + **main** `verify-invariants.js` best checks folded in as "hygiene": font 72 only, no raw hex, no generic names, no painted native frame — **skipping instance children** (the source of main's 38 false positives) | exact, cheap, no allowlist fights |
| Visual check | **v3** `audit-screen.py` MISSING list as checklist only (never its score) | box-finder score is unreliable |
| Hooks | **v3** 5 hooks only | main's 28 hooks = friction and cost |
| Naming | **gold** style: plain meaningful layer names ("Price Block", "Booking.com Row") | golds use it; "Frame"/tags lower quality |

## Implementation steps

1. **Create v4 and rescue the work.** From `v3`: `git checkout -b v4`, then
   `git stash apply stash@{1}` (apply, not pop — the stash stays as a backup), move the stray
   `plan2.json`/`ref2.json` into `knowledge/gold/plans/` only if they validate, else scratchpad.
   Run the verification below, commit on v4 ("v4: rescued element-plan validator, gold plans,
   PLAN MODE"). Leave `stash@{0}` (main leftovers) alone. v3 and main are not changed.

2. **One-command start: `.claude/commands/plan-screen.md`** (new slash command). Body = the prompt
   that worked today: confirm branch is v3 (stop if not) → save image → `measure-ref.py --json`
   → `route.js --image` trace → Z-reading sections with plain-words `describe` → `plan.json`
   → `route.js --plan` until exit 0 → `route.js --plan --map` → crop logos (step 3) →
   `pbcopy < plan.min.json` → print the fixed Figma-Agent build sentence. Never touch Figma.

3. **Logos: `build/crop-logos.py <plan.json> <ref.png> <out-dir>`** (new, ~30 lines, PIL — same
   lib as `build/measure-ref.py`). For every `kind:"logo"` row, crop `crop:[x,y,w,h]` (reference
   px) to `<out-dir>/<group>-<element>.png`. After the Figma Agent builds, Claude Code places them
   with `upload_assets` (nodeIds = the logo frames found by name in the build) — not `use_figma`,
   so the guard hook is not involved.

4. **Clean hand-off.** Add to `build/route.js` CLI: `--plan <f> --min` writes `plan.min.json`
   (minified, `_doc`/`describe` kept, whitespace dropped). CLAUDE.md step 4: "hand off with
   `pbcopy < plan.min.json` — never copy JSON from terminal output."

5. **Close the default-icon gap.** `build/audit-plan.js` already counts icons per plan row; add
   one check: any INSTANCE named `globe`/`world` or an `information` count above the plan's
   count → `WRONG ICON` line. Reuse `build/templates/dump-tree.use_figma.js` (read-only) for the
   tree. Add the same rule to SKILL.md PLAN MODE step 4 so the Figma Agent self-checks
   ("no icon may stay at the component default; count icons per plan row").

6. **Stop the drift.**
   - v3: move `.claude/skills/sap-screen/` and v2 files in `.claude/memory/` to `.archive-v2/`.
   - CLAUDE.md top line: "SAP Figma Build System v4. Branch must be v4. If
     `git branch --show-current` ≠ v4, stop." SKILL.md header → v8 (v4 system).
     Add a short v4 entry to `.claude/skills/sap-figma-agent/CHANGELOG.md`.
   - Global `~/.claude/skills/sap-bind` and `sap-vdi`: move to `~/.claude/skills-disabled/`
     (reversible — **user approved**).
   - `main` and `v3` stay as is (user decision); **v4 is the only build branch**.

7. **Memory.** Write to the auto-memory dir (+ MEMORY.md pointers):
   - `workflow-split-plan-paste` — the winner, the numbers, the 6-step loop below.
   - `pitfall-branch-main-is-v2` — main = old v2 system (18 min/59k), v3 = history; build only on v4.
   - `pitfall-figma-agent-no-files` — paste plan JSON, never a path; it invents otherwise.
   - `pitfall-terminal-json-copy` — use pbcopy from file.
   - `gold-nodes` — 174:4211 (DE ticket selection), 270:6722 (BG results, 99%); plans in
     `knowledge/gold/plans/`.

8. **Plan cache + gold start (from main's ideas).** In `/plan-screen`: sha1 the image; if
   `knowledge/plans-cache/<sha1>.plan.json` exists and validates → reuse it (skip steps).
   Else pick the closest gold plan (new `route.js --closest-gold ref.json` — scores gold plans by
   recipe + section words, reuses `patterns` matching already in route.js) and adapt it.
   After a build reaches ≥ 90%, save its plan to the cache (and to gold if the user says gold).

9. **Score + hygiene in the audit (main's best checks).** `audit-plan.js` prints
   `MATCH NN%` (rows ok ÷ rows) and a `HYGIENE` section: non-72 font, raw hex, "Frame"/"Group"
   names, painted native frames — ignoring nodes inside instances. Exit 0 only at ≥ 90% and
   0 hygiene. Port only these checks from `git show main:build/verify-invariants.js`; no allowlists.

10. **Approval view.** `route.js --plan --map` also prints a 10-line ASCII of the sections and
    up to 3 suggestions from main's `docs/SAP-SUGGESTION-CATALOG.md` (copied into v4 `knowledge/`).
    One stop for the user's "go".

11. Regenerate + keep SKILL.md < 62,000 chars (`node build/gen-router.js`), commit on v4.

## The standard workflow for the user (after this lands)
1. Terminal: `cd …/Claude-To-Figma-SAP-Application && git checkout v4 && claude`
2. Type `/plan-screen` and paste the image. Claude: measure → plan → validate → crop logos →
   plan is on your clipboard (≈3 min, ≈$2).
3. Figma Agent panel: paste (Cmd+V) + the build sentence Claude printed.
4. Terminal: paste the new node link. Claude: read-only dump → `audit-plan.js` → uploads logos →
   prints a short fix list (ACT-style prompts).
5. Figma Agent: paste the fix list. Repeat 4–5 until audit exits 0 (usually 1 round).
6. Small later edits: Figma Agent directly, ACT mode (≈11 s each).

## Critical files
- `build/route.js` (`validatePlan`, `sapMap`, CLI) · `build/router-table.json`
- `build/audit-plan.js` · `build/templates/dump-tree.use_figma.js`
- `build/measure-ref.py` (PIL, crop logic) · new `build/crop-logos.py`
- new `.claude/commands/plan-screen.md` · `CLAUDE.md` · `.claude/skills/sap-figma-agent/SKILL.md` (via `build/gen-router.js`)
- `test/route.test.js`

## Verification
- `node --test test/route.test.js` — all pass (24 + new: `--min` output, WRONG ICON on a tree
  with 4 globe instances, crop-logos writes one PNG per logo row with the crop size).
- `node build/gen-router.js --check` → in sync; SKILL.md < 62,000 chars.
- `node build/route.js --plan knowledge/gold/plans/flight-search-results.plan.json` and
  `…flight-ticket-selection.plan.json` → exit 0.
- Real check: dump 301:7074 (read-only) → `audit-plan.js` must report the known defects
  (logos missing, extra `information` icons); dump gold 270:6722 → fewer/no lines.
- `audit-plan.js` on gold 270:6722 dump → `MATCH ≥ 90%`; on 301:7074 → below 90% with the
  logo / icon lines; on 291:6032 → hygiene errors listed (placeholders, colour blocks).
- `route.js --closest-gold` on the Bulgarian ref → picks `flight-search-results.plan.json`.
- Live run: next screen with `/plan-screen` end to end. Pass = MATCH ≥ 90%, plan session
  ≤ 12k tokens / ≤ 5 min, ≤ 1 fix round. Record time, tokens, $ and score in memory.
