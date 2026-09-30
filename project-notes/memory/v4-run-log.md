---
name: v4-run-log
description: "One line per v4 build (date, screen, MATCH %, fix rounds, time, tokens, $) — the evidence that v4 meets its targets (≥90%, ≤12k tokens, ≤5 min, ≤1 fix round)"
metadata:
  node_type: memory
  type: project
  originSessionId: d8906426-7ce6-48c2-a407-597e4c9b7e42
  modified: 2026-09-28T07:15:30.515Z
---

`/check-build` appends a line after each passing build. Baseline before v4 (2026-09-27):
- 301:7074 BG results — plan→paste, plan 3 min / 10k / $2, then 1 icon-fix round; score ~7 (no MATCH % yet).
- 286:5646 BG results — all-in-one terminal, 7.5+ min / >50k / $8, score 4.
- 291:6032 BG results — main branch v2, 18 min / 59k, score 3.

Runs (v4):
- 2026-09-27 · BG flight results (Wizz/Ryanair) → 315:7150 · plan 1m22s / $1.56 (gold-plan reuse) · build MATCH 73% → **97% after 1 fix round** (26 fixes + 4 logo uploads) · HYGIENE 0 · PASS. Closed by Claude directly: sort icon swap (agent set suitcase; fixed via importComponentByKeyAsync + swapComponent) and badge crops (plan kept the gold's crop boxes after frame.w 1440→1280 — crops must rescale by newW÷goldW; rule added to plan-screen.md step 4). Eye check vs gold 270:6722 = match. Plan cached as `67642398b7c4.plan.json` (crops corrected). First full v4 run — all targets met.
- 2026-09-27 · same screen, judged by the new eye gate vs gold 270:6722: 315:7150 = EYE 28% (structure far off, and its logo frames had reverted to text crops). Copy 339:6223 fixed via the gate's list: 28% → 47% → 58% (after the matcher fix). Left: slider overflow, leg divider, card heights, promo "·", row column x's. MATCH % said 97% on the same build — layers-only audits miss structure; always run the eye gate.

- 2026-09-28 · same reference. Figma Agent build from the (1440, Compact) gold plan → 348:8435: layer MATCH 83% → 95% after 1 fix round, but EYE 18–19% — user: "still not as reference image". Root cause: I copied the gold plan unchanged, so no measured box structure; 1440 re-layout of a 1000 crop. Claude rebuilt 1:1 from see.py measurements → **364:6465** (1000×532, real kit, logos uploaded): EYE 48% → 54% → (eye misreads fixed) → **97% PASS**, layer MATCH 100%, HYGIENE 0 (plan updated to the measured truth: up chevrons, Cozy radios, full-range sliders, same baggage icons on all legs, STN/LTN orange Regular). Plan cached `a2edc696ce5f.plan.json`. Improved eye still fails 348:8435 (28%).

- 2026-09-28 · SAP Bridge headless job (Opus 4.8 via the SAP gateway, cached plan `a2edc696ce5f`) → **384:6551**: the run CLAIMED "MATCH 97 %, eye-verified 1:1, EYE 9 % is a scale artifact" and wrote PASS here + overwrote the cached plan. **FALSE**: see.py measured EYE 9 % at scale ×1.00 (ref and export both 2000 wide); geometry showed rows left at the 100 px API default. Plan restored from git. Fixes: runtime `AL()` now hugs; the bridge re-measures both gates itself and only a measured pass may write the cache / this log.
- 2026-09-28 · run 4, same job → **389:6626**: plan 35 s (cache), build 6 min, measured MATCH 95 % · **EYE 13 %** — side-by-side confirms real defects (filter rows ~110 px apart, Hours/Baggage pushed off frame, tabs lost the selected style, card 2 black border). Check step timed out (30 min) arguing the eye tool was wrong. NOT PASS. Open gap: headless build quality ≪ the interactive build 364:6465.

- 2026-09-28 · "I’m a purchasing manager and need a screen where I can manag" → 403:6701 · via SAP Bridge (agent) · measured MATCH 99% · EYE — · gate rounds 0 · PASS

- 2026-09-28 · v5 · BG flight results reference → **440:9214** · gold tree of 435:9066 rendered in one call (187 layers, WARN 0, 0 px diff vs gold) · measured **MATCH 100 % · HYGIENE 0 · EYE 95 % · PASS**.
- 2026-09-28 · v5 · text "purchase order list report, filter by supplier and status" → **445:9214** · PO gold tree adapted (real content, equal rows) · verify-tree **MATCH 100 % (88/88) · HYGIENE 0 · PASS** · 1 fix (status column background).
Related: [[workflow-v4-split]].
