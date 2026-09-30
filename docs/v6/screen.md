---
description: v6 — image or text (+ Figma file link) → every offline gate → a DRAFT built in Figma in ~1-2 min → measured gates → the user reviews the REAL screen after. Verbs — tweak · flip · show · gold · fix.
model: sonnet
argument-hint: <image path | "text request"> <figma file link>   |   tweak | flip | show | gold | fix …
---

# /screen — v6: build first, review after (branch `v6` only)

The bar is unchanged: **≥ 95 % or it is a failure** — reference match (EYE) AND SAP execution (real kit components + states, text
styles, colour variables, layer names; MATCH ≥ 90 · HYGIENE 0 · STRUCTURE 0 · responsive). What changed: nothing waits for a human
between the request and the built DRAFT. The user judges the real screen at its node link, with the ASSUMED ledger next to it.
Reply in short plain sentences (ASD-STE100). Input: $ARGUMENTS

0. **Branch** — `git branch --show-current` must be `v6`, else `git switch v6` (another session may move HEAD: check before every write).
   Use a **fresh session per screen**. Give every `run.js` call a Bash timeout of 240000 ms.
1. **Verb?** `/screen tweak "<change>" <node link>` (ACT: one small edit, seconds) · `flip <id> <job>` · `show <job>` · `gold <job>` ·
   `fix <job>` → `node build/route.js <verb> …` and stop. Otherwise `node build/route.js "<text>"`: ACT = one `use_figma` with the router's `act`.
1b. **A NEW screen type (no gold tree matches its structure — a phone, a dark theme, a wizard, an object page …): plan first, then build (user rule 2026-09-30).** Read the image, send the five sections
   (step 4, all in full) and wait for "Approve". Only a repeat or a close variant of a gold screen is built first and reviewed after. On approve: write the tree from the plan with real kit components
   (`node build/kit.js c <name>` for props; inner text names `tx` — Header `Title`, Object Status `Text`, List Item `Title`; a kit switch that is ON by default and shows placeholder content must be set false — the door says which),
   run `node build/door.js <tree>`, then `node build/run.js --job bridge-out/<job> --resume --file <KEY>`. Horizon Light always (SAP rule), even when the reference is dark; say so in Analyze.
   A **phone screenshot at 3×** (width 1170 / 1179 / 1290) is read by see.py as 1×: first crop the status bar and scale the image to the 2× export (390 wide → 780 px) as `bridge-out/<job>/ref.png`; the frame is 390 × height. Keep the tree at `bridge-out/<job>/tree.json` — it is the recovery if a frame is deleted in Figma.
2. **RUN — one command:** `node build/run.js <ref.png | "text request"> --file <KEY> [--ask]` — KEY is in the link
   `figma.com/design/<KEY>/…`. At t=0, in parallel: bridge + plugin check ‖ `front.js` (see.py OCR, gold match, fit, door). Then, before any
   Figma call: door → layout-sim (position, overflow ×1 ×0.85 ×1.15) → STRUCT-SIM (advisory) → `send.js` builds a frame named
   `DRAFT — <job>` → `gates.js`. It prints ≤ 20 lines. **Read only those lines** — never `spec.json`, gold JSON, trees or PNGs.
   If it says `open SAP Bridge in the file now`, tell the user at once (the analysis keeps going, the job queues).
3. **Exit code → what you do**
   - `0` built, gates PASS → step 4.
   - `1` door / sim OUT → fix each OUT in `bridge-out/<job>/tree.json` in ONE pass: content, names, sizing `s` — **never geometry
     numbers (w h xy p g)**: `door.js --baseline` rejects them. A gates BOX/POSITION line that names a node → add `--allow "<node>"`.
     Then `node build/run.js --job <job> --file <KEY> --resume`.
   - `2` the model must decide: **icons** → `--resume --icons "WxH=name,…"` (real kit icons only, `node build/kit.js i <word>`);
     **text job** → write `ops.json` (content only: `set` texts/props, `remove`, `clone` rows — the schema has no geometry; real business
     content in every field, never kit placeholders) → `--resume --spec-json ops.json` (`--as-is` if the skeleton already is the screen);
     **analysis failed** → offer the text lane. From zero (gold covers < 95 % of the texts) is automatic: `spec2tree` from the measured spec.
   - `3` bridge down / plugin closed → ask the user to open SAP Bridge (Plugins → Development → SAP Bridge, "Connected to Claude"), or —
     only if they say so — **fallback**: the `screen-builder` subagent types the build (5-10 min, ~40-60k tokens, same gates). Say
     plainly that the 1-2 min promise does not hold for that run.
   - `4` an ask that would change the screen → ask the user that one question; after the answer `--resume --go`.
   - `5` `--ask` mode → paste the printed plan VERBATIM in ``` fences (WIREFRAME, L1-L5, SAP COMPONENTS), end with **"Approve / Reject / Modify?"**, STOP.
   - `6` built, NOT PASSED (a DRAFT) → read only the printed FIX / STRUCTURE lines, fix the tree, `--resume`. **≤ 2 fix rounds** — the driver
     refuses the 4th build. After that report the DRAFT with the lines quoted. `/screen fix <job>` lifts the cap only when the user asks.
4. **REPORT — once, at the end.** The user does not see tool output, so write it in the reply:
   - the node link · `MATCH · HYGIENE · STRUCTURE · EYE` and `STATUS PASS|DRAFT` exactly as printed · `Done in Xs` · provenance (gold name / from zero / text lane) · frame size;
   - the **ASSUMED ledger**, each line with its flip command: `/screen flip density <job>`, `/screen flip text <job> "<old>" "<new>"`; ledger lines with `flip: null` → `/screen tweak`;
   - **MANDATORY (user rule 2026-09-30, said with "!!!!!"; supersedes 2026-09-29) — ALL FIVE sections, in full, every time, in this exact style, in the reply (the terminal folds tool output):**
     **1. Analyze** (what the reference is · size and scale · floorplan · density · theme · what was assumed) · **2. Zones** (table `Zone | Content | SAP component (kit) | Key properties`, A B C … in Z order) ·
     **3. Wireframe** (boxed, zone letter + component on the right) · **4. Layers** (`├─` tree) · **5. Confidence** (table `Area | Conf. | Notes`, ● sure / ○ guess, every guess named).
     Sections 3 and 4 and the `SAP COMPONENTS` table are GENERATED, never hand-drawn: `node build/tree.js plan bridge-out/<job>/tree.json [--ref …/see-ref/spec.json]`, pasted VERBATIM inside ``` fences
     (a phone up to 600 px wide gets `┌──┐ │ ‹  Dream Hotel  ♡ ⇪ │ A  Header + Icon Button ×2 …` and `Hotel — Object Page 390×798 (V, FIXED) ├─ Header row (H) …`; a wide screen keeps the to-scale grid; `plan --grid` forces it).
     "See the tool output", a summary, or a sketch that was not generated from the built tree is a FAILED reply;
   - end with ONE line: **"Approve / Modify?"** — approve = `/screen gold <job>` (and a `tweak` to rename the frame from `DRAFT — …`).
5. **Gold** — `node build/route.js gold <job> [--name n]`: admitted only after a MEASURED gates pass + door ALL IN + `layout-sim --sizes` ≥ 90 %; never overwrites;
   `gold --demote <name>` retires a mistake. A screen edited later in Figma: `gold --from-node <link>` prints the 3 read-only dump steps (do them in the `screen-builder` subagent).

**Budget — cheap and fast, same quality** (every turn re-sends the whole chat: 451:9507 = 219 turns / 34 min / $9.5):
- Target ≤ 6 main-chat turns for a clean job. Never hand-write or edit build code. Never open `build@2x.png`, `ref.png`, `see-out/*.png`, `geometry.json`
  (`.claude/settings.json` denies the Read). To see one doubt, crop ≤ 400 px to `bridge-out/<job>/crop-1.png` and look at that.
- Never paste or Read a whole `tree.json`; use `run.js` output, `node build/route.js show <job>`, or `Grep` for one layer name.
- No probe calls (one `use_figma` per property). Do not chase `SAP LOOK`, `(brand→SAP)` or `EXTRA` lines — they are expected.
- **Only numbers a script prints count.** MATCH is blind to where things are: STRUCTURE ≠ 0 or EYE < 95 = not passed — never "a known limitation", never
  "MATCH is authoritative". A fix must not remove structure the reference has (a card inside a pink box stays inside it). Never claim "resizes" without the door passing.
- Headless Claude builds stay banned (EYE 9-13 % vs 97 % interactive; one run claimed EYE 97 for a measured 9).

**Fallback lane** (plugin unusable, user agreed): `Agent` with `subagent_type: screen-builder`, prompt `JOB=bridge-out/<job> FILE=<KEY>`. After any change to
`build/templates/*` run `node build/plugin-bundle.js`, then the user closes and reopens the plugin (the runtime is compiled in).

**Target timeline** (bridge open): image gold hit ≈ 1 min · image from zero + 1 fix ≈ 2.4 min · text ≈ 1 min. Always report the measured elapsed, never the target.
Design + evidence: `docs/V6-PLAN.md`. v5 (`docs/V5-PLAN.md`) stays the proven fallback: `git switch v5`.
