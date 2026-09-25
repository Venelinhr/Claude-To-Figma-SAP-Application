I'll synthesize these 10 focus-area reports into a unified architectural audit. The findings are rich and largely consistent — let me produce a candid decision document.

# SAP Fiori AI System — Unified Reuse-First Architecture Audit

**Date:** 2026-07-16
**Scope:** 10 focus-area deep-dives on the reuse-first / deterministic SAP Solution Architecture Engine
**Verdict style:** Decision document. Candid, file-cited, not cheerleading.

---

## 1. Executive Summary

**Is the system reuse-first today? No — it is reuse-*aware* and reuse-*capable*, but not reuse-*enforced*.** The machinery for a genuine reuse-first engine is unusually complete and correct on paper: a real deterministic scorer (`build/score-canonical.js`), a real canonical index (`skill/references/canonical-index.json`, 11 Tier-1 + 13 Tier-2), a real delta-spec schema + validator, a real mechanical write-back script (`build/record-canonical.js`), and a registered PreToolUse hook (`.claude/hooks/guard-reuse-gate.sh`). But the load-bearing enforcement is missing in exactly the same three places in every area: **(1) the gate is advisory (always `exit 0`) and cannot stop a from-scratch build; (2) the marker it trusts (`.claude/.reuse-declared`) is unverified free text with no lifecycle, so it is trivially faked and never reset; and (3) the deterministic scorer/validator are opt-in — no automation ever invokes them.** The result is a system that *documents* SEARCH→SCORE→CLONE→INJECT→VALIDATE as mandatory while *mechanically* allowing any step to be skipped. It is roughly 80% skeleton, 20% teeth — and the missing 20% is the whole point.

### Maturity score per area

| # | Area | Maturity | One-line reason |
|---|------|----------|-----------------|
| 1 | Reuse Before Generation (RULE 31) | **Partial** | Full pipeline built; gate advisory, marker unverified & never reset |
| 2 | Canonical Pattern Library | **Partial** | Real index + scorer; Tier-2 has no own fingerprint, node IDs drift across 3 docs |
| 3 | Similarity Engine | **Partial** | Deterministic scorer works; dead Level 4, no precision term, thresholds disagree across 4 files |
| 4 | Incremental Generation | **Prose-only** | Delta-spec is a *plan*, not a *program* — no applicator consumes it |
| 5 | Continuous Learning | **Partial** | `record-canonical.js` is real but invoked by zero hooks; confirmation ≠ growth |
| 6 | Failure Analysis / Silent Fallback | **Prose-only** | Silent native-frame fallback (root cause #3) has *zero* mechanical guard |
| 7 | MCP Optimization (3-layer split) | **Mechanical** (split) / **Partial** (reuse funnel) | Layer boundary is real & correct; reuse gate on it is advisory |
| 8 | Knowledge Caching | **Partial** | VDI semantic-model cache exists but no hook consults it (2/24 populated) |
| 9 | Quality Gates | **Mechanical** (validators) / **Prose-only** (RULE 19/20/21) | 4 a11y validators + linters real; wireframe/reasoning/QA gates unenforced |
| 10 | Continuous Optimization (flywheel) | **Partial** | Flywheel already failed once — "Schedule Activated" in ledger, absent from index |

**Only two things are truly mechanical and enforcing today:** the MCP three-layer capability split (a real sandbox-permission boundary, correctly drawn) and the two hard-blocking hooks `block-codejs-read.sh` and `block-generated-files.sh`. Everything reuse-related observes and reminds; it does not stop.

---

## 2. The Target Architecture

The user's vision maps to this pipeline. Marking each stage **EXISTS** (mechanical + correct), **PARTIAL** (built but not enforced), or **MISSING**.

```
REQUEST
   │
   ▼
UNDERSTAND (analyze before building)
   │   VDI / region-map analysis → request fingerprint {floorplan, regions[], components[], domain[]}
   │   PARTIAL — VDI runs, but fingerprint is hand-typed into the scorer, not auto-emitted
   ▼
SEARCH KNOWLEDGE (search before reasoning)
   │   Cache-first: hash reference image → semantic-models/<sha1>.md
   │   PARTIAL — cache EXISTS (semantic-models/) but NO hook consults it; 2/24 populated
   ▼
SEARCH APPROVED SCREENS (reuse before generating)
   │   canonical-index.json (11 Tier-1 + 13 Tier-2)
   │   EXISTS — real index; PARTIAL taxonomy (Tier-2 no own fingerprint, businessDomain unread)
   ▼
SEARCH SIMILAR PATTERNS / SCORE
   │   build/score-canonical.js — floorplan 50 / regions 30 / components 20
   │   EXISTS (deterministic, reproducible) — but OPT-IN; invoked by zero automation
   ▼
REUSE / CLONE (clone before recreating)
   │   ref.clone() inherits var(--sapXxx) fills (RULE 28), short-circuits Layer-3 bind
   │   PARTIAL — clone mechanics documented; hand-written LLM JS each time, no applicator
   ▼
INJECT DELTA (build only what changed)
   │   delta-spec-schema.json preserve/replace/add/remove/swapComponents
   │   MISSING as executor — schema + validator exist; NOTHING consumes a delta to build
   ▼
VALIDATE (validate before executing)
   │   validate-delta-spec.js + 4 a11y validators + lint-mcp-frame.js
   │   PARTIAL — validators real & good; NOT forced on the build path; RULE 19/20/21 prose-only
   │            visual comparison (clone vs reference) is prose-only
   ▼
DELIVER + LEARN (learn from every success)
   │   record-canonical.js → ledger + Tier-2 entry
   │   PARTIAL — script is real & idempotent; invoked by zero hooks → depends on Claude remembering
   ▼
GATE (guards the whole funnel)
       guard-reuse-gate.sh (PreToolUse on mcp__figma__use_figma)
       PARTIAL — registered & wired, but ADVISORY (exit 0), marker unverified, never reset
```

**Summary of the gap:** Both *ends* of the loop are mechanical (SCORE and RECORD are real scripts). The *middle* (CLONE → INJECT) is hand-authored LLM discipline, and the *gate* around all of it is a reminder, not a stop. The target architecture is reachable with a small, well-scoped set of hook/script changes on top of machinery that is already built — this is not a rewrite.

---

## 3. Per-Area Findings

### Area 1 — Reuse Before Generation (RULE 31)

**Current state:** The reuse-first pipeline exists end-to-end and is internally consistent. Doctrine (`skill/SYSTEM_PROMPT.md:1154-1200`), deterministic scorer (`build/score-canonical.js`), delta-spec (`skill/references/delta-spec-schema.json` + `build/validate-delta-spec.js`), write-back (`build/record-canonical.js` → `.claude/memory/reuse-outcomes-ledger.md`), and the enforcement hook (`.claude/hooks/guard-reuse-gate.sh`, wired in `.claude/settings.json`). Scoring weights and thresholds match across rule, scorer, schema, and rubric — no drift.

**Top gaps:**
- **[High]** Gate is advisory — `guard-reuse-gate.sh` always exits 0 (line 51) and self-documents "never blocks." The "BLOCKED" language in RULE 31 step 7 is prose-only.
- **[High]** Marker is trust-based & unverified — hook only checks `.claude/.reuse-declared` *exists*; `echo 'Level 1 — anything' > .claude/.reuse-declared` fully satisfies it. Scorer/validator never invoked by any hook.
- **[High]** Marker never cleared — no session-start or post-build reset; a decision for build A satisfies unrelated build B.
- **[Medium]** Build detection is a fragile grep (`importComponentSetByKeyAsync|createInstance|createFrame`) — clone/reposition builds slip through as "tweaks."
- **[Medium]** Fingerprint is hand-supplied; garbage-in routes real matches to Level 5 unnoticed.

**Top recommendations:**
- **[High]** Make the gate blocking: `exit 2` when a build is detected and no valid reuse decision is on record.
- **[High]** Make the marker a verifiable JSON artifact `{level, score, baseCanonical, deltaSpecPath}`; hook re-runs `validate-delta-spec.js` and confirms baseCanonical exists before allowing.
- **[High]** Clear the marker at lifecycle points (SessionStart + PostToolUse after a build).

---

### Area 2 — Canonical Pattern Library (storage, taxonomy, two-tier model)

**Current state:** A real index (`canonical-index.json`, 11 Tier-1 + 13 Tier-2), prose ground-truth (`docs/canonical-screens/CANONICAL-SCREENS.md`), doctrine (`.claude/memory/rule_reuse_approved_screens.md`), a working scorer, and a rubric (`skill/references/canonical-similarity-rubric.md`) with matching weights. Strongest area on paper.

**Top gaps:**
- **[High]** All 13 Tier-2 entries are inherit-only (verified 13/13) — they collapse onto their Tier-1 parent's fingerprint. Live test: a Purchase Orders request scored Outage List *and* the PO screen *both* at 100; the exact canonical could not out-rank its generic parent. Two-tier model adds node IDs but zero discriminating signal.
- **[High]** Uncontrolled free-text vocabularies drift between index and rubric; exact-string (lowercased) match means a synonym silently scores 0. No shared enum tied to the region-types MCP or the 152-component registry.
- **[High]** Three sources of truth for node IDs disagree — `CANONICAL-SCREENS.md` Screen 07 = `750:174556` = "yanatest / Object Page" but `rule_reuse_approved_screens.md` labels `750:174556` as "Activities View (List Report)"; the rubric points at yet a third set. Clone-the-wrong-node risk.
- **[Medium]** `businessDomain[]` is a taxonomy axis the scorer never reads — decorative.
- **[Medium]** Two-tier privacy story is false: `git check-ignore` shows `canonical-index.json` is *tracked* with all 13 personal entries committed.

**Top recommendations:**
- **[High]** Give every Tier-2 entry its OWN fingerprint captured at approval time; rank Tier-2 above its Tier-1 parent on ties. Fixes the 100-vs-100 tie.
- **[High]** Controlled vocabulary (region-types MCP tokens + registry names) validated in CI; fuzzy/synonym mapping in the scorer.
- **[High]** Make the JSON index the single source of truth and *generate* the prose node tables from it; CI check that every specFile/referenceImage path exists.

---

### Area 3 — Similarity Engine (scoring, level mapping, delta-spec)

**Current state:** Real, deterministic, reproducible (byte-identical output across runs). Four internally-consistent artifacts on the *core formula*. Exports functions for reuse.

**Top gaps:**
- **[High]** **Dead Level 4** — `reuseLevel()` maps ≥85→L1, 70–84→L2, 60–69→L3, <60→L5 and *never* emits Level 4, yet schema, validator, and RULE 31 all reference "Level 1-4" / "Component (Level 4)."
- **[High]** **Precision blindness** — both overlap scores are `matched/REQUEST_count` (recall only). A 1-component request ("ShellBar") scores 20/20 against the 8-component Governance Console; a tiny Dialog matches a huge FCL at high overlap. Oversized canonicals are over-recommended.
- **[High]** Gate advisory + blind to the clone path — build-detection greps for `createInstance`/`createFrame` but RULE 28's *preferred* method is `node.clone()`, which contains none of those tokens. The gate never fires for the builds it most needs to govern.
- **[High]** Scoring is a manual step Claude may skip; the number in a delta-spec is not provably machine-computed.
- **[Medium]** `businessDomain` stored but never read; ties broken arbitrarily by `Array.sort` file order; unknown floorplans silently score 0 with no diagnostic.

**Top recommendations:**
- **[High]** Reconcile level bands across all four sources; either make Level 4 reachable or delete it. Standardize on one table.
- **[High]** Add a precision term (F1/Jaccard: `matched / union`) so oversized canonicals are penalized.
- **[High]** Have `validate-delta-spec.js` recompute the score by shelling into `score-canonical.js` and reject mismatches — converts "prefer the scorer" from prose to gate.
- **[High]** Fix build detection to include `\.clone\(|cloneNode|figma.getNodeById`.

---

### Area 4 — Incremental Generation (clone + inject deltas)

**Current state:** DECLARATIVE, not MECHANICAL. Scorer and write-back are real; **nothing injects a delta** — the LLM does the whole clone+inject by hand inside one `use_figma` call. The delta-spec is a planning/approval artifact (it *is* the RULE 19 wireframe gate), not an executable instruction. No code reads a delta-spec and applies it.

**Top gaps:**
- **[High]** No delta APPLICATOR exists. Two builds from the same delta-spec can diverge. "Incremental generation" is a narrative discipline.
- **[High]** Gate advisory & trivially bypassed; no marker file currently exists on disk; nothing verifies the declared level matches scorer output.
- **[Medium]** Scorer/prose thresholds disagree (85/70/60 in code; 60-84 + Level 4 in prose; a third variant in the validator).
- **[Medium]** `swapComponents` is schema-only — no execution path performs a ResponsiveTable→AnalyticalTable swap.
- **[Medium]** No "edit existing node" path — every request produces a NEW frame; iterating re-clones rather than patches.

**Top recommendations:**
- **[High]** Either build a thin delta *executor* (validated delta-spec + base node → deterministic clone/inject code) OR stop calling it a "spec" and document it honestly as an approval wireframe.
- **[High]** Make the gate verify the scorer + validator actually ran (write results to the marker, don't trust a hand-echoed string).
- **[Medium]** Unify the three threshold maps into one imported constant; implement or remove `swapComponents`.

---

### Area 5 — Continuous Learning (auto-classifying approved builds)

**Current state:** Mechanical on the SELECTION side, prose-only on the CAPTURE side. `feedback-learn.sh` classifies signals into `.claude/pending-learnings.jsonl` and emits a reminder — but contains **zero** invocations of `record-canonical.js` (grep = 0). Confirmation does NOT auto-add a canonical.

**Top gaps:**
- **[High]** Confirmation does not auto-grow the library — depends on Claude remembering to run `record-canonical.js` on every "perfect/bravo."
- **[High]** Split-brain: RULE 27 (`ground-truth-updater` → `token-assignment-rules.md`) and RULE 31 (`record-canonical.js` → index + ledger) fire on the same signal, neither cross-references the other. `feedback-learn.sh`'s ground-truth branch only names the RULE 27 path.
- **[High]** `.reuse-declared` has no lifecycle — stale marker → false pass.
- **[Medium]** `record-canonical.js` needs 6 hand-typed args; recorded score can diverge from what the scorer computed.
- **[Medium]** No visual-correctness verification before promotion — a structurally-perfect wrong screen can be promoted and cloned forward.
- **[Medium]** Level-5 patterns (base=none) have no parent to inherit from → empty fingerprint → unscoreable for future matches.

**Top recommendations:**
- **[High]** Make confirmation auto-record — a Stop hook (chained off `feedback-learn.sh`) invokes `record-canonical.js`.
- **[High]** Unify both confirmation paths behind one `confirm-canonical` entrypoint (index + ledger + token-rule capture, atomic).
- **[High]** Give `.reuse-declared` a real lifecycle (PostToolUse/Stop deletes it; scorer writes it).

---

### Area 6 — Failure Analysis (rebuild-instead-of-reuse & silent fallback)

**Current state:** Partially mechanized as of 2026-07-17. Scorer, validator, index, ledger, auto-grow, and the gate hook all exist. Repair knowledge in `docs/REPAIR-PATTERNS.md` (28 patterns). Root-cause audit (`.claude/memory/project_sap_agent_root_cause_audit.md`) names the four systemic drivers.

**Top gaps:**
- **[High]** **SILENT FALLBACK (root cause #3) has ZERO mechanical guard.** If `importComponentSetByKeyAsync` fails, the agent silently falls back to native frames — non-SAP output. No hook inspects instance-vs-frame counts. This is the single most damaging failure and it is completely unguarded.
- **[High]** Gate advisory only (`exit 0`).
- **[High]** `lint-on-stop.sh` (Loop B) only lints LEGACY JSON specs; for the DEFAULT MCP-first path it just checks a marker — never serializes the built frame, never runs the capable `lint-mcp-frame.js` on it. The default path has no post-build correctness check.
- **[Medium]** Level-4 hole + threshold conflict with validator; marker stale-prone; coarse build detection; structural-only (never visual) verification.
- **[Low]** Empty request array silently loses up to 50 points → biases toward rebuild.

**Top recommendations:**
- **[High]** Convert silent fallback to a LOUD failure — ABORT on import failure instead of falling back to `createFrame`; add a post-build linter that fails if the SAP-instance ratio is too low or required regions rendered as plain FRAME/TEXT. **Highest-leverage fix; directly kills root cause #3.**
- **[High]** Wire `lint-mcp-frame.js` into the MCP-first path (serialize the frame at turn-end, lint it).
- **[High]** Decide the gate's teeth deliberately — either `exit 2` block, or stop describing it as "enforced/BLOCKED" (the doc/enforcement mismatch is itself a root cause).

---

### Area 7 — MCP Optimization (three-layer split)

**Current state:** The layer split is **real and correctly drawn** — `use_figma` runs in a sandbox *without* `teamlibrary` permission (verified: returns 0 collections), so only a real plugin (`plugin/figma-builder/code.js`, 2,391 lines, bind-only) can bind SAP tokens. Layer 1 Claude reasons/builds structure; Layer 2 MCP inserts real SAP instances with raw hex + name-tags; Layer 3 plugin binds. Bridge is layer *names* not JSON because `setPluginData` is plugin-sandbox-only. This capability boundary is genuine.

**Top gaps:**
- **[High]** Reuse gate advisory-only (`exit 0`, line 51).
- **[High]** `.reuse-declared` marker is unverified free text — a stale/hand-typed "Level 1" satisfies the gate for all subsequent builds.
- **[High]** `score-canonical.js` never invoked by any automation (grep: consumed only by prose).
- **[Medium]** `delta-spec` validation never forced; two documented pipelines disagree — `ARCHITECTURE.md` still presents the LEGACY JSON→plugin path as main while `CLAUDE.md` says it was deleted; per-build MCP call budget is prose-only.
- **[Low]** Bind pass re-walks the whole subtree even for cloned (already-bound) content; gate matcher only covers `mcp__figma__use_figma`.

**Top recommendations:**
- **[High]** Make the gate fail-closed (`exit 2`) for scratch builds, mirroring the existing FAIL-CLOSED discipline for 404 component keys.
- **[High]** Bind the marker to a real scorer run (scorer writes the marker with a request fingerprint hash; gate rejects stale/mismatched).
- **[High]** Invoke the scorer from automation (UserPromptSubmit or pre-build step).
- **[Medium]** Reconcile or archive the stale `ARCHITECTURE.md`.

---

### Area 8 — Knowledge Caching (what should never be rediscovered)

**Current state:** Caching machinery genuinely exists and is largely mechanical: canonical library, deterministic scorer, derived-cache (`SAP_BUILD_MANIFEST.md`) with a drift guard (`build/check-manifest-sync.js`, wired as PostToolUse), 152-entry registry, and a VDI semantic-model cache (`semantic-models/`, content-addressed).

**Top gaps:**
- **[High]** The VDI semantic-model cache is prose-only and effectively unused — NO hook consults it (grep: zero references). Only 2 models cached vs 24 canonicals / 12 documented screens, so the advertised ~96% token saving almost never fires. Re-running full ~14k VDI analysis on already-analyzed images is the single largest re-derivation cost.
- **[High]** The two caches never talk — cached semantic models already contain zones/components/floorplan, but nothing feeds a cached model INTO `score-canonical.js`; SEARCH is fed by fresh human classification.
- **[High]** Two independent caches encode the SAME canonical truth and drift (index says yanatest = `750:174556`; manifest §3b / CANONICAL-SCREENS cite `560:36552`/`615:36810`). Drift guard exists for manifest↔registry but NOT for canonical-index↔CANONICAL-SCREENS↔manifest node IDs.
- **[Medium]** Tier-1/Tier-2 fingerprints hand-authored, unverified against live `.fig` nodes; gate advisory; write-back manual.

**Top recommendations:**
- **[High]** Make the VDI cache mechanically consulted — hash any reference image, check `semantic-models/<sha1>.md` before any VDI pass; back-fill all 12 canonical screens (currently 2/24).
- **[High]** Wire the two caches together: cached model emits the floorplan/regions/components triple the scorer consumes. One command: image → cached-model → scorer → ranked canonical.
- **[High]** Add a canonical-node drift guard (analogous to `check-manifest-sync.js`) that hard-fails on node-ID mismatch across the three sources.

---

### Area 9 — Quality Gates (per-phase objective validation)

**Current state:** Two tiers. **Mechanical & real:** `validate-spec.js` (9 checks), `lint-mcp-frame.js` (RULE 25 tag contract), `validate-delta-spec.js`, `score-canonical.js`, `test-build.sh` (CI regression), `record-canonical.js`, and the **4 §7 a11y validators** in `code.js` running on BOTH build paths (contrast/WCAG, typography hierarchy, focus + 32/44px tap targets, status-not-by-color-only). Hooks wired in `.claude/settings.json`; two hard-block (`block-codejs-read.sh`, `block-generated-files.sh`). **Prose-only:** RULE 19 (ASCII wireframe gate), RULE 20 (7 reasoning artifacts), RULE 21 (QA certification / zero-defect / 3-pass repair) — **none have a script or hook**; nothing verifies a wireframe was shown, 7 artifacts produced, or QA ran.

*(This area's report supplied no gaps/recommendations arrays; the finding itself is the takeaway: the headless validators are the strongest mechanical asset in the system, and the three highest-ceremony rules (19/20/21) are entirely unenforced self-attestation.)*

**Implied priorities:** RULE 19's wireframe gate is the natural place to *host* the reuse decision (it is already the human approval checkpoint) — wiring reuse enforcement there kills two prose-only gates at once. RULE 21's QA certification is the natural place to host the mandatory visual comparison and the `lint-mcp-frame.js` post-build run.

---

### Area 10 — Continuous Optimization (the reuse flywheel)

**Current state:** SCORE (mechanical), VALIDATE (mechanical), GATE (advisory), GROW (manual). Library holds 11 Tier-1 + 13 Tier-2 confirmed nodes.

**Top gaps:**
- **[High]** "Every confirmed build grows the library" is NOT enforced — `record-canonical.js` invoked by zero hooks. **PROOF OF DRIFT:** the "Schedule Activated" Level-5 build in `reuse-outcomes-ledger.md` (2026-07-17) is absent from `canonical-index.json` Tier-2. **The flywheel already failed once.**
- **[High]** Ledger and index have diverged and are not join-able — 13 Tier-2 entries vs 2 ledger rows; ledger records base as a node ID (`750:174925`) while index records `inheritsFrom` as a Tier-1 slug (`shipped-outage-list`). Identifier spaces don't match.
- **[High]** Privacy leak — `.gitignore` (lines 46-50) ignores `canonical-index-tier2.json` which **does not exist**; actual Tier-2 personal nodes live in the tracked, committed `canonical-index.json`. Personal node IDs pushed to two GitHub remotes.
- **[Medium]** Gate advisory & trivially satisfiable; no payoff measurement (no token-cost/iteration/duration columns → can't prove reuse lowers future work); doc drift (CLAUDE.md "Ten hooks," 12 exist, omits the reuse gate); Tier-2 no independent fingerprint.

**Top recommendations:**
- **[High]** Make library growth mechanical — Stop/UserPromptSubmit hook detects confirmation + node and auto-runs `record-canonical.js`.
- **[High]** Fix the privacy leak immediately — split Tier-2 into the gitignored file `.gitignore` already names, or gitignore the whole index and ship a Tier-1-only file.
- **[High]** Unify the identifier space + add `build/check-reuse-integrity.js` (fail if any ledger row lacks a matching Tier-2 entry) wired into `test-build.sh`. Would have caught the missing "Schedule Activated" entry.
- **[Medium]** Add payoff instrumentation (tokens/iterations/duration + Level-5-share-over-time trend).

---

## 4. Prioritized Roadmap (High-impact items, ordered by leverage × low effort)

The same three root fixes appear across nearly every area. Ordered so the highest-leverage, lowest-effort teeth come first.

| # | Change | Areas it fixes | Effort | Why it's ranked here |
|---|--------|----------------|--------|----------------------|
| **1** | **Make `guard-reuse-gate.sh` blocking (`exit 2`) for detected builds with no valid, fresh reuse decision** | 1, 2, 3, 4, 6, 7, 10 | **S** (few lines) | Single highest-leverage change. Converts "BLOCKED" from prose to a mechanical stop across 7 areas. |
| **2** | **Make the marker a verified JSON artifact + give it a lifecycle** (scorer writes it; hook re-runs `validate-delta-spec.js` + confirms baseCanonical exists; SessionStart + PostToolUse clear it) | 1, 5, 7, 8, 10 | **S–M** | Closes the "`echo anything > marker`" bypass and the stale-marker false-pass. Prerequisite for #1 to mean anything. |
| **3** | **Kill the silent native-frame fallback — ABORT loud on `importComponentSetByKeyAsync` failure + post-build instance-ratio linter** | 6, 9 | **M** | Root cause #3, the most damaging failure, currently zero-guarded. Independent of the reuse gate. |
| **4** | **Fix build detection to include `\.clone\(` (RULE 28's preferred path)** | 3, 6, 7 | **S** | The gate is currently blind to exactly the builds it should govern. Trivial regex fix, big correctness win. |
| **5** | **Auto-invoke `record-canonical.js` on confirmation (Stop hook chained off `feedback-learn.sh`); unify with the RULE 27 path** | 5, 8, 10 | **M** | Makes the flywheel turn without a human cranking it. Fixes the proven "Schedule Activated" drift. |
| **6** | **Give every Tier-2 entry its OWN captured fingerprint + rank above Tier-1 parent on ties** | 2, 5, 10 | **M** | Fixes the 100-vs-100 tie that makes the two-tier model add zero signal today. |
| **7** | **Add a precision term to the overlap score (Jaccard/F1)** | 3 | **S** | Stops tiny requests matching huge canonicals at 100%. Small formula change in one file. |
| **8** | **Single source of truth for node IDs + fingerprints; generate prose from JSON; CI drift guard** | 2, 8 | **M** | Eliminates the 3-way node-ID disagreement → clone-the-wrong-node risk. |
| **9** | **Reconcile level bands / delete dead Level 4 across scorer, schema, validator, rubric** | 3, 4, 6 | **S** | Cheap consistency fix; prevents a spec warning against itself. |
| **10** | **Fix the Tier-2 privacy leak in `.gitignore`** | 10 | **S** | Not architectural, but personal node IDs are on two public-ish remotes now. Do it regardless. |
| **11** | **Wire `lint-mcp-frame.js` into the MCP-first path (Loop B)** | 6, 9 | **M** | The capable linter is orphaned for the default path today. |
| **12** | **Make the VDI cache mechanically consulted + wire it into the scorer; back-fill 12 screens** | 8 | **M–L** | Largest token-saving lever, but lower correctness urgency than the gate/fallback fixes. |

**Recommended first sprint:** #1 + #2 + #4 together (all Small, mutually reinforcing — a blocking gate is only safe once the marker is verified and detection sees clone builds), then #3 in parallel (independent). That is the minimum set that turns "reuse-first on paper" into "reuse-first enforced."

---

## 5. What NOT to build (YAGNI)

- **A general-purpose delta *executor/applicator* (Area 4).** Tempting, but the honest cheaper move is to *rename* the delta-spec to "approval wireframe" and accept that the LLM authors clone+inject code. A deterministic applicator is a large build whose main payoff (reproducibility) is better bought by the verified-marker + validator recompute (#2, #7). Build it only if you observe real divergence between two builds from the same spec. Don't build it speculatively.
- **`swapComponents` execution (Area 4).** No build path uses it and there's no evidence of demand. Remove it from the schema rather than implement it. Advertising an unimplemented capability is worse than not having it.
- **An "edit existing node / in-place patch" path (Area 4).** Genuinely nice, but re-cloning works and this is a comfort feature, not a correctness fix. Defer until users complain about re-clone cost.
- **A 4th scored axis for `businessDomain` with rebalanced weights (Area 3).** Don't re-engineer the weighting formula. Use domain as a *tie-breaker / secondary sort key* only — cheaper, and ties are the actual observed failure, not weighting.
- **Elaborate payoff dashboards / trend reporting (Area 10).** Add the three ledger columns (tokens/iterations/duration) so the data *exists*, but don't build reporting UI. A `grep`-able ledger is enough until someone asks for a chart.
- **Fuzzy floorplan variant normalization as a big NLP layer (Area 3).** A `strip-parentheticals + lowercase` normalizer is enough for `List Report (narrow)` vs `List Report`. Don't reach for embeddings/synonym engines.
- **More RULE text.** The root-cause audit is explicit: governance is already ~71k tokens across 1480 files, and *more rules do not help*. Every fix in this document should be a *script or hook*, not a new prose rule. Adding a "RULE 32" would actively regress the system.

---

## 6. Bottom Line — the 3–5 changes that most move the system toward true reuse-first

1. **Make the gate block, and make the marker it trusts real.** `guard-reuse-gate.sh` → `exit 2` on a detected build with no *verified, fresh* reuse decision; the marker becomes a scorer-written JSON artifact that the hook re-validates and that gets cleared each session/build. This one change (Roadmap #1 + #2) is what separates "reuse-aware" from "reuse-first." Nothing else matters until the gate can say no.

2. **Fix build detection to see `clone()`.** The preferred build path (RULE 28) evades the gate entirely today because detection greps for `createInstance/createFrame`. A blocking gate that can't see the most common build is theater. One-line fix, unblocks #1.

3. **Kill the silent native-frame fallback.** The most damaging failure in the system's history — "looks nothing like the reference" — is completely unguarded. ABORT loud on SAP-instance import failure and add a post-build instance-ratio linter. This is orthogonal to the reuse work and can ship in parallel.

4. **Close the learning loop mechanically.** Auto-invoke `record-canonical.js` on confirmation and give every new Tier-2 entry its own fingerprint. The flywheel *already failed once* (the missing "Schedule Activated" entry proves it); a hook, not human memory, must turn it — and Tier-2 entries must actually discriminate or the library grows in size but not in signal.

5. **One source of truth for canonical node IDs, with a CI drift guard.** Three documents disagree on what `750:174556` is. Generate the prose tables from the JSON index and add a `check-reuse-integrity.js` to `test-build.sh`. Cloning the wrong node is the failure mode that survives even a perfect gate.

**The through-line:** the SAP Fiori system has already *built* the reuse-first engine — the scorer, index, schema, validator, write-back, and gate all exist and are largely correct. What it has not done is *turn any of it on*. The gap between today and the user's vision is almost entirely **"advisory → blocking + verified marker + mechanical invocation,"** a small, well-scoped set of hook changes — not a rewrite. Resist the urge to add more doctrine; every remaining fix is a script.