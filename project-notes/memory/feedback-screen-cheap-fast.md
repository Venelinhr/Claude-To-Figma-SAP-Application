---
name: feedback-screen-cheap-fast
description: /screen must be cheap and fast with the same quality — budget rules learned from the 451:9507 run ($9.5, 34 min)
metadata:
  type: feedback
---
User (2026-09-28): "it should be really cheap and less time, but same quality."

**Why:** run 451:9507 took 219 turns, 34 min, $9.52 for one screen. The bill = turns × chat size (29.7M re-read
tokens). Causes: hand-written install/full builds instead of the generated `i.js`/`b.js` (guard blocked them, 11 min of
patching); big PNGs read into the chat (diff-sheet 517k chars) and re-sent every turn; ~12 probe calls chasing a false
EYE score; frame snapped to 1280 for a 1159 reference (EYE 49 %).

**How to apply:** fresh session per /screen; send generated files unchanged; no PNGs in the chat (crop ≤ 400 px if
needed); one use_figma per fix round, ≤ 2 rounds; image job at the reference size. Target ≤ 40 turns, ≤ 10 min.
The rules live in `.claude/commands/screen.md` (Budget). See [[workflow-v5-trees]].

2026-09-28 from-zero run 467:9740 (spec2tree, no gold): 12.4 min, ~$28, 75 turns — $21 of it cache reads because it ran
inside a very long session (~570k context re-sent per turn). The fresh-session rule is the biggest cost lever.
Result MATCH 100 % · HYGIENE 0 · EYE 76 % (not passed; remaining: aligned-text width + icon frame size, fixed in
spec2tree after the run, and "Багаж" read as an icon on the reference side).
