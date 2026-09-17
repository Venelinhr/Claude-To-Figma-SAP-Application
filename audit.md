# Pipeline Audit — SAP Fiori → Figma

**Date:** 2026-08-28
**Scope:** full pipeline — governing docs, enforcement hooks, build flow, learning loop.
**Method:** 3 parallel research agents + manual re-verification of the 8 highest-impact claims.
**Status of the project:** working and delivering. This audit finds what limits the *quality ceiling*, not what is broken.

---

## Framing (agreed with the project owner)

- The **SAP Web UI Kit design system is the canonical source of truth** — for components, tokens, variables, and booleans.
- **Reference/canonical screens are structure hints only.** They are best practice for understanding layout, not an authority.
- The goal is to **use the design system properly**: pick the correct floorplan, the correct component, and the correct state for each request.

Every finding below is judged against that framing.

**Evidence legend:**
`[V]` = re-verified by me directly against the file.
`[R]` = reported by a research agent, not independently re-verified.

---

# 1. Critical gaps and pain points

## Root cause: the pipeline caches the design system instead of querying it

The design system is live and queryable. The pipeline keeps **hardcoded copies of it in Markdown**. Copies drift. Every fork below is a symptom of this one disease.

Prior evidence on record: a curated component registry disagreed with live Figma on **25 of 43 components**.

---

## A. Design-system truth is cached and has drifted

### A1 — Token hex values fork between files `[V]`
Two files give different values for the same token.

| Token | Value | File |
|---|---|---|
| `sapTextColor` | `#1D2D3E` | `SAP_BUILD_MANIFEST.md:252` |
| `sapTextColor` | `#131E29` | `skill/SYSTEM_PROMPT.md:1130` |
| `sapCriticalTextColor` | `#DF7B01` | `SAP_BUILD_MANIFEST.md:257` |
| `sapCriticalTextColor` | `#A8650B` | `.claude/skills/sap-screen/SKILL.md:456` |

Verified output:
```
SAP_BUILD_MANIFEST.md:252  | sapTextColor | `#1D2D3E` | Body text (general) |
SYSTEM_PROMPT.md:1130      | Body / default text | `sapTextColor` | `#131E29` |
```

**Impact:** Bind uses exact hex match. A forked hex means the variable silently does not attach. The screen looks right and is not bound.

**Irony on record:** `SYSTEM_PROMPT.md:260` documents that a *previous* duplicate token table "drifted and caused bind failures" and was removed. Three copies remain. `[R]`

### A2 — Token tables exist in at least 4 places `[R]`
`SYSTEM_PROMPT.md:1126-1153`, `SAP_BUILD_MANIFEST.md:230-263`, `HANDOFF.md:174-209`, `sap-screen/SKILL.md:445-458`. A token change must be made in 4 places by hand.

### A3 — `HANDOFF.md` carries a wholly different palette `[R]`
`HANDOFF.md:174-209` sets `sapBackgroundColor = #ffffff`; every other doc says `#F5F6F7`. It also invents tokens that exist nowhere else (`sapNeutralBackground`, `sapShell_Background`). `HANDOFF.md:5-6` instructs the reader to paste the whole file as the first message — so a session bootstrapped from it starts with a wrong palette.

### A4 — Component/property counts disagree `[R]`
Registry size: **152** (`CLAUDE.md:110,560`, `HANDOFF.md:30`) vs **139** (`SAP_BUILD_MANIFEST.md:101`, `sap-screen/SKILL.md:18`).
Token whitelist: **81** (`CLAUDE.md:110,479`) vs **80** (`SYSTEM_PROMPT.md:919`).

---

## B. No live property verification before build

### B1 — Component variant axes are read from Markdown, not the kit `[V]`
The clearest case:

```
HANDOFF.md:492   □ Primary action = Button Emphasized
CLAUDE.md:140    Button `Type` = Primary/Secondary/Accept/Reject/Attention/Tertiary — NO Emphasized/Transparent
```

Following the `HANDOFF.md` checklist produces an invalid variant. Nothing checks this before the call is made.

### B2 — `ObjectStatus` "Form Factor" exists and does not exist `[R]`
`CLAUDE.md:141` and `SYSTEM_PROMPT.md:968` list `Form Factor` as a valid property.
`sap-screen/SKILL.md:192,207` and `sap-figma-agent/SKILL.md:291` say setting it **throws**.
`HANDOFF.md:590,600` ships copy-paste code that sets it.

**Both A and B disappear if the pipeline asks the live kit** for a component's real variant axes before building. That capability exists (`get_design_spec` returns live variant axes, allowed values, defaults, bound-token counts) and is not wired into the flow.

---

## C. Floorplan and component selection are prose, not decisions

### C1 — Floorplan decision tree duplicated in 4 places, wired to nothing `[R]`
`INSTRUCTIONS.md:292-302`, `HANDOFF.md:325-372`, `HANDOFF.md:740-747`, `sap-figma-agent/SKILL.md:118-129`.
A floorplan-ranking capability exists (`suggestFloorplan` — scores each floorplan against detected regions and reports missing required regions). It is never called.

### C2 — Component choice has no lookup step `[R]`
A task→component lookup exists (`find_component_for_task` — plain-language task in, ranked components with intent tags out). Not referenced by any skill or gate.

### C3 — States are never enumerated `[R]`
No step in the 10-step flow asks which **states** a screen requires — default, hover, focus, disabled, read-only, error, empty, loading.
Evidence this is a real omission: "add `IllustratedMessage` empty state" has been an open item since 2026-06-23 (`SESSION-RESUME.md:104-112`) and is still open.

---

## D. Enforcement gates can be satisfied without real approval

### D1 — The approval regex fires on ordinary words `[V]`
`.claude/hooks/capture-approvals.sh:34`:
```bash
grep -qE "(^|[^a-z])(approve|approved|go ahead|build it|looks good|lgtm|ship it|proceed|yes,? build|do it|make it)([^a-z]|$)"
```
Any prompt containing `do it`, `make it`, or `proceed` — about anything at all — writes `.wireframe-approved` and satisfies the wireframe gate for the next build. The comment above it claims it is "kept tight to avoid capturing incidental 'ok'." It is not.

### D2 — Two gate markers are unprotected `[V]`
The anti-forgery guard allowlist in `~/.claude/settings.json:73,112` covers exactly five markers:
```
wireframe-approved|scratch-approved|reuse-declared|workflow-loaded|last-build-node
```
It does **not** cover `.reference-selected` (Gate 0) or `.architect-approved` (Gate 0.5) — while `guard-reference-gate.sh:18-19` states "this cannot be self-forged" and `guard-architect-gate.sh:12` states "Claude cannot self-echo it." Both claims are false for those two markers.

### D3 — A stale approval marker sits in the repo `[V]`
```
-rw-r--r--  8 Jul 20 14:49  .wireframe-approved   (project root, not .claude/)
```
It has survived since 20 July. It is at the root, outside the directory the session-start cleaner sweeps.

### D4 — "Is this a build?" is decided by 7 different greps `[R]`
Detection token sets differ across `guard-wireframe-gate.sh:20`, `guard-architect-gate.sh:31`, `guard-figma-code.sh:22`, `guard-reuse-gate.sh:28`, `guard-reference-gate.sh:28`, `mark-build.sh:22`, and an inline command in global settings. Only two include `setProperties`. A build that only mutates properties is gated by two guards and invisible to four.

---

## E. Quality checks trust the agent's own report

### E1 — Token binding is never verified against real Figma `[R]`
`lint-mcp-frame.js:100-137` and `verify-invariants.js:145-176` both operate on a **JSON tree dump the agent produces**, not on live Figma bindings. `lint-on-stop.sh:8-11` concedes: "A Stop hook can't query Figma." The headline guarantee ("zero raw hex, every colour bound") rests on self-report.

### E2 — The one detector for the worst failure is not connected `[R]`
`build/lint-instance-ratio.js` — the only check that would catch native frames substituted for real Kit instances — is wired to no hook and no test. The project's own doc says so: `docs/SAP-INVARIANT-ARCHITECTURE.md:27` calls it "an orphan."

### E3 — L1–L5 naming is advertised but only a denylist runs `[R]`
`layer-naming.json:18-24` defines the level hierarchy. The only consumer (`verify-invariants.js:196-201`) reads the flat `deny` array. The `levels` object is never loaded.

### E4 — The reuse/reference score is self-reported `[R]`
`guard-reuse-gate.sh:78-88` checks internal consistency between level and score but never re-runs the scorer. `guard-reference-gate.sh:51` rounds with `printf '%.0f'`, so a score of `59.6` becomes `60` and passes the `>= 60` threshold.

---

## F. The learning loop has stopped draining

### F1 — Ten corrections unprocessed for a month `[V]`
```
$ grep -c '"status":"pending"' .claude/pending-learnings.jsonl
10
```
Newest pending entry: 2026-07-26. Today: 2026-08-28.

### F2 — Two writer formats in the same log `[R]`
34 lines use spaced `"status": "dismissed"`, 18 use compact `"status":"captured"` — two hook versions writing one file, never reconciled.

### F3 — The in-repo memory mirror is out of sync in both directions `[R]`
`.claude/memory/session_state_current.md` is 6 days behind the runtime store; `rule_reuse_approved_screens.md` is 4 days *ahead* of it. A teammate cloning the repo receives a mid-July snapshot.

---

## G. Contradictions that caused real rework

### G1 — The Divider rule says both things `[R]`
- **Never:** `CLAUDE.md:412-414`, `SYSTEM_PROMPT.md:104`, and `sap-fix` actively *removes* Divider frames.
- **Keep:** `CLAUDE.md:350` — "1px native FRAME named 'Divider' … this IS correct. Do NOT replace."

`/sap-fix` will delete the dividers that `CLAUDE.md:350` insists are correct. This produced a two-step failure in 24 hours — see §2.

### G2 — Gate numbering has three schemes `[R]`
Canonical (`SYSTEM_PROMPT.md:151-197`): Gate 4 = verify keys.
`HANDOFF.md:87-128`: Gate 4 = build.
`sap-screen/SKILL.md:428-439`: adds Gates 6–9 that exist nowhere else.

### G3 — `HANDOFF.md` is dated today but its body is from July `[R]`
`HANDOFF.md:2` says "Last updated: 2026-08-27"; `HANDOFF.md:29` says "Current state (2026-07-17 snapshot)." Newest date, oldest content, and it instructs the reader to paste it first.

---

# 2. Actual output vs intended outcome

Compared in general terms, from the project's own records.

| # | Intended | Actual | Evidence |
|---|---|---|---|
| 1 | Every element is a real SAP Kit instance | Output contained no design-system components at all | `pending-learnings.jsonl:40` `[V]` — *"its not SAP - no SAP design system components, token, variable, only native frames"* |
| 2 | No native Divider frames | Dividers were native frames; the fix then removed the legitimate ones | `pending-learnings.jsonl:35` `[V]` — *"overall is 80% suscess! I see that you still use Divider as frame"*; then `:36` — *"NOw its a bit worst! missing divieders and added extra paddings"* |
| 3 | One-shot build, ≤1 screenshot | Repeated corrective turns on the same node | Wizard: *"terrable - not good! Fix it"* → *"ts still broken and not in good shape!"* `[R]` |
| 4 | Wireframe approved once, then build | ~15 wireframe re-proposals in one day (2026-07-20) | `pending-learnings.jsonl:2-26` `[R]` |
| 5 | Exact-hex token Bind, 100% bound | Two tokens have two values each — some binds cannot match | §A1 `[V]` |
| 6 | Hard gates block unapproved builds | Common words satisfy the wireframe gate; two markers are forgeable | §D1, §D2 `[V]` |
| 7 | Correct variant values only | Docs prescribe `Button Emphasized`, which the kit does not have | §B1 `[V]` |
| 8 | Lessons prevent repeats | The Divider rule was violated *after* becoming a hard rule | §G1 + row 2 |

**The pattern:** failures cluster where the pipeline **relies on a written copy of the design system** rather than the design system itself, and where a gate **reports** compliance rather than **measuring** it.

Mismatch in one line: *the pipeline can produce a screen that passes every gate and still contains no real SAP components.*

---

# 3. Fixes, with prioritization criteria

## Criteria used

| Criterion | Meaning |
|---|---|
| **Risk** | Can it corrupt output silently? Silent > visible. |
| **Frequency** | How often does it appear in the record? |
| **Effort** | S = hours · M = a day · L = multi-day |

**Priority rule:** P0 = silent corruption **and** observed more than once. P1 = observed once, or loud failure. P2 = correctness debt with no observed failure yet.

## P0 — do first

| # | Gap | Fix | Risk | Freq | Effort |
|---|---|---|---|---|---|
| 1 | A1–A3 token forks | One token JSON as the only source. Every doc table becomes a generated block. Delete hand-typed copies. | Silent bind failure | 4 forks | M |
| 2 | E2 orphan detector | Wire `lint-instance-ratio.js` as a post-build hook. This catches the #1 recorded failure. | Silent — non-SAP output ships | ≥6 | S |
| 3 | B1–B2 variant guessing | Call `get_design_spec` (live kit) before setting any variant. Fail the build on an unknown axis or value. | Silent — throws or wrong variant | ≥3 | M |
| 4 | D1 approval regex | Require wireframe context: match approval words **only** when the prior turn presented a wireframe, or require an explicit phrase. | Gate bypass | Systemic | S |
| 5 | D2 unprotected markers | Add `reference-selected` and `architect-approved` to the guard allowlist. | Gate bypass | Systemic | S |
| 6 | G1 Divider contradiction | State one rule with an explicit scope condition, in one place. Make `sap-fix` honour that condition. | Rework loop | 4 events | S |

## P1 — do next

| # | Gap | Fix | Risk | Freq | Effort |
|---|---|---|---|---|---|
| 7 | C1 floorplan | Call `suggestFloorplan` at Gate 0; record the score and the missing-required list. | Wrong floorplan | Latent | S |
| 8 | C2 component pick | Call `find_component_for_task` when a component is not obvious. | Wrong component | Latent | S |
| 9 | C3 states | Add a **State Matrix** artifact to the wireframe gate: for each interactive component, list the required states. | Incomplete screens | Open since June | M |
| 10 | E1 self-reported binding | Post-build, read the real node tree from Figma and check `boundVariables`, not the agent's dump. | Silent | Systemic | M |
| 11 | D4 build detection | One shared `is_build()` helper, sourced by all guards. | Gate hole | Systemic | S |
| 12 | F1–F2 learning backlog | Auto-drain hook; block Stop when pending items are older than 7 days. Normalise the two JSON formats. | Lessons lost | 10 items | S |
| 13 | G3 `HANDOFF.md` | Regenerate from canonical docs; never hand-edit. It currently teaches wrong tokens, wrong buttons, wrong gates. | Poisons new sessions | 1 file, high blast radius | M |
| 14 | E4 self-reported score | Re-run the scorer inside the gate. Use `>=` on the true float, not a rounded int. | Threshold bypass | Latent | S |

## P2 — correctness debt

| # | Gap | Fix | Effort |
|---|---|---|---|
| 15 | D3 stale root marker | Delete it; extend the session cleaner to the project root. | S |
| 16 | A4 count forks | Generate all counts from the registry. | S |
| 17 | E3 L1–L5 | Either check the `levels` hierarchy or stop advertising it. | M |
| 18 | G2 gate numbering | One numbering scheme; regenerate the rest. | S |
| 19 | F3 memory mirror | Auto-sync it or delete it. A stale mirror is worse than none. | S |
| 20 | `sap-fetch` version | v1-148 → v1-151. | S |
| 21 | Dead markers | Remove `.inspect-done`, `.canonical-selected`; both are cleared but never written or read. | S |
| 22 | `ci-drift-gate.sh` | Written but never wired. Add to pre-commit. | S |

---

# 4. Making the lessons persist

The problem is not that lessons are missing. It is that **rules are stored as prose in many files, so they fork**. Persistence must be structural.

## 4.1 Change what `CLAUDE.md` is

**Today:** ~640 lines, holds rules *and* data (tokens, keys, node tables, counts). Every data table it holds is a fork waiting to happen.

**Should be:** rules of engagement plus pointers. No data tables.

Concretely:
- Remove the token table → replace with one line pointing at the generated source.
- Remove component/property tables → the live kit is the authority; the local copy is a dated cache.
- Remove the duplicated 10-step flow (it appears verbatim in `SYSTEM_PROMPT.md:111-131`) → keep one copy, link it.
- Keep exactly one authority statement. Today at least four documents each declare themselves "read this first."
- Add a standing rule near the top:

  > **The design system is the source of truth.** Before setting any component property, variant, or token, query the live kit. Markdown tables in this repo are a dated cache, not an authority. Reference screens are structure hints only — never a source for component or token values.

## 4.2 Change how data enters the docs

Adopt generate-don't-copy for every table:

```
source of truth → generator → GENERATED fence in each doc → drift gate in pre-commit
```

The project already has `GENERATED` fences and `build/ci-drift-gate.sh`. The gate was never wired (§P2-22). Extend the generator to cover tokens, component keys, counts, and the gate list, then wire the gate. After that, a fork cannot be committed.

## 4.3 Change the skills

| Skill | Change |
|---|---|
| `sap-screen` | Add live-kit lookups: `suggestFloorplan` at Gate 0, `find_component_for_task` when ambiguous, `get_design_spec` before any variant is set. Replace the hardcoded token table with a generated block. Add the State Matrix to the wireframe gate. |
| `sap-fix` | Honour the Divider scope condition instead of removing all Divider frames unconditionally. |
| `sap-fetch` | Bump v1-148 → v1-151. |
| `sap-figma-agent` | Fix the duplicate hard-rule number "11". Point token and property claims at the live kit. |
| `sap-spec-validate` | Validate variant values against the **live** kit response, not the static list. |

## 4.4 Change the learning loop

- Add a Stop-hook condition: block when `pending-learnings.jsonl` holds items older than 7 days. The backlog is currently 10 items and a month old — it stopped silently because nothing complains.
- One memory store. Delete the in-repo mirror or auto-sync it; today it is stale in both directions.
- When a lesson contradicts an existing hard rule, **fail** rather than warn. The Divider contradiction survived because both statements were allowed to coexist.

---

# 5. Process and architecture improvements

## 5.1 Invert the flow: ask the kit, do not read the cache

The single highest-value change.

| Step | Today | Proposed |
|---|---|---|
| Pick floorplan | read prose decision tree | `suggestFloorplan` → score + missing-required |
| Pick component | read prose | `find_component_for_task` → ranked, with intent |
| Pick variant/state | read Markdown table | `get_design_spec` → live axes, allowed values, defaults |
| Pick token | read hardcoded hex | bind the variable; hex is never typed |
| Verify | agent's own tree dump | read the real node tree back from Figma |

Markdown tables become a **dated cache with a freshness stamp**, never the authority. Drift becomes structurally impossible.

## 5.2 A real post-build reality check

Replace self-reported verification with measurement, checking four things against the live tree:

1. **Instance ratio** — real Kit instances ÷ total nodes. Below threshold → fail. This alone catches the most damaging recorded failure.
2. **Bound variables** — every colour-bearing node has `boundVariables`, not a literal fill.
3. **Variant validity** — every set property exists on that component in the live kit.
4. **State coverage** — the states declared in the State Matrix are present.

## 5.3 A State Matrix artifact

Add one required artifact at the wireframe gate:

| Component | Default | Hover | Disabled | Error | Empty | Loading |
|---|---|---|---|---|---|---|
| (per interactive component in the screen) | ✓ | … | … | … | … | … |

This makes state coverage an explicit decision instead of an omission. It directly addresses the empty-state item that has been open since June.

## 5.4 Registry freshness as a first-class signal

A registry can silently disagree with the live kit — prior evidence put this at 25 of 43 components. Every registry entry should carry `lastValidated`, and any entry older than the threshold should force a live lookup rather than being trusted.

## 5.5 A golden-path end-to-end test

There is one prompt/expected pair in `tests/` and no test exercises any hook, the scope guard, the marker lifecycle, or the bridge `[R]`. An end-to-end test has been an open item since June. Add one scripted build against a fixture that asserts: instance ratio, zero raw hex, valid variants, correct floorplan.

## 5.6 New capabilities worth adding

| Capability | Value |
|---|---|
| **`/sap-audit` skill** | Re-runs this audit mechanically — drift check, orphan check, backlog check, marker hygiene. Turns a one-off audit into a routine. |
| **Visual regression** | Compare a build against its canonical reference structurally. Catches "looks wrong" that no rule expresses. |
| **State-coverage report** | Post-build: which states were built, which were declared and missing. |
| **Variant explorer** | Given a component, show its live axes and values before the build — removes guesswork at authoring time. |
| **Freshness dashboard** | One view: registry age, token-table drift, backlog size, orphan detectors. |

---

# Summary

**One root cause:** the pipeline caches the design system in Markdown instead of querying it. Every token fork, count fork, and invalid-variant instruction descends from that.

**One structural weakness:** gates report compliance rather than measuring it — so a screen can pass every gate and still contain no real SAP components.

**Six P0 fixes** (§3): single token source, wire the instance-ratio detector, live variant lookup, tighten the approval regex, protect the two markers, resolve the Divider contradiction.

**The durable change** (§4): rules live in `CLAUDE.md`; data is generated; the live kit is the authority; reference screens stay what they are — structure hints.
